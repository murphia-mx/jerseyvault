/**
 * End-to-end over the pure pieces (observe → transition → guard → public catalog),
 * with a fake Yupoo built from real captured responses.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { albumsOf, buildPublicCatalog, type MasterCatalog, type MasterProduct } from "../catalog.ts";
import { observeAlbum } from "../observe.ts";
import { applyObservation, effectiveThumbnail, newAlbumState, type AvailabilityFile } from "../state.ts";
import { applyVisibility } from "../visibility.ts";
import { fakeClient, fixture, OK_SECOND, OK_THUMB } from "./helpers.ts";
import type { HttpClient } from "../http.ts";

const photo = (hash: string) => `https://photo.yupoo.com/minkang/${hash}/small.jpg`;
const albumPage = (...hashes: string[]) =>
  `<div class="showalbumheader__main"></div>` +
  hashes.map((h) => `<div data-origin-src="https://photo.yupoo.com/minkang/${h}/x.jpg"></div>`).join("");

function product(id: number, albumId: string, thumbnail: string): MasterProduct {
  return {
    id,
    albumId,
    slug: `p-${id}`,
    liga: "Bundesliga",
    equipo: "Augsburg",
    tipo: "Manga corta",
    nombre: `Producto ${id}`,
    thumbnail,
    url: `https://minkang.x.yupoo.com/albums/${albumId}?uid=1&isSubCate=true`,
    imagenes: [thumbnail],
  };
}

const master: MasterCatalog = {
  generatedAt: "test",
  totalProducts: 6,
  products: [
    product(1, "111", OK_THUMB), // healthy
    product(2, "222", OK_THUMB), // thumbnail is the placeholder, another photo is fine
    product(3, "333", photo("cccc0001")), // album deleted
    product(4, "444", photo("dddd0001")), // every photo is the placeholder
    product(5, "555", photo("eeee0001")), // Yupoo keeps failing (567)
    product(6, "666", photo("ffff0001")), // deleted, then comes back
  ],
};

const jpeg = () => ({ status: 200, body: fixture.validJpeg(), type: "image/jpeg" });
const placeholder = () => ({ status: 200, body: fixture.placeholder(), type: "image/png" });
const deleted = () => ({ status: 404, body: fixture.albumDeleted() });

function day1() {
  return fakeClient({
    "/albums/111?": { status: 200, body: fixture.albumOk() },
    "/albums/222?": { status: 200, body: fixture.albumOk() },
    "/albums/333?": deleted(),
    "/albums/444?": { status: 200, body: albumPage("dddd0001", "dddd0002", "dddd0003") },
    "/albums/555?": { status: 567, body: fixture.hotlink567() },
    "/albums/666?": deleted(),
    // album 111 and 222 share the fixture page: thumbnail broken only for product 2's check order
    c176a220: [jpeg(), placeholder()],
    "5dea2edd": jpeg(),
    dddd: placeholder(),
  }).client;
}

function day2() {
  return fakeClient({
    "/albums/111?": { status: 200, body: fixture.albumOk() },
    "/albums/222?": { status: 200, body: fixture.albumOk() },
    "/albums/333?": deleted(),
    "/albums/444?": { status: 200, body: albumPage("dddd0001", "dddd0002", "dddd0003") },
    "/albums/555?": { status: 567, body: fixture.hotlink567() },
    "/albums/666?": { status: 200, body: albumPage("ffff0001") },
    c176a220: jpeg(),
    "5dea2edd": jpeg(),
    dddd: placeholder(),
    ffff: jpeg(),
  }).client;
}

async function runOnce(availability: AvailabilityFile, client: HttpClient, now: Date, allowMassChanges = false) {
  const albums = albumsOf(master);
  const ids = [...albums.keys()];
  const observed = new Set<string>();
  let newProblems = 0;
  for (const id of ids) {
    const p = albums.get(id)!;
    const prev = availability.albums[id] ?? newAlbumState();
    const obs = await observeAlbum(client, id, p.url, effectiveThumbnail(prev, p.thumbnail));
    const tr = applyObservation(prev, obs, now);
    availability.albums[id] = tr.next;
    observed.add(id);
    if (tr.newProblem && !prev.hidden) newProblems++;
  }
  const result = applyVisibility(availability.albums, ids, {
    now,
    degraded: false,
    allowMassChanges,
    newProblems,
    checked: ids.length,
    observedThisRun: observed,
  });
  return { result, catalog: buildPublicCatalog(master, availability) };
}

test("cleanup: broken products leave the store, repairable ones stay, transient errors change nothing", async () => {
  const availability: AvailabilityFile = { version: 1, updatedAt: "", albums: {} };
  const t1 = new Date("2026-10-16T05:00:00Z");

  const first = await runOnce(availability, day1(), t1);
  assert.deepEqual(first.result.hidden.sort(), ["333", "444", "666"]);
  assert.deepEqual(first.catalog.products.map((p) => p.id), [1, 2, 5]);
  assert.equal(first.catalog.products[1].thumbnail, OK_SECOND, "product 2 repaired with the album's next valid photo");
  assert.equal(availability.albums["555"].status, "error");
  assert.equal(availability.albums["333"].status, "suspect_deleted");
  assert.equal(availability.albums["444"].status, "suspect_no_images");
  assert.equal(master.products[1].thumbnail, OK_THUMB, "master catalog untouched");

  // Second independent check, 24h later
  const second = await runOnce(availability, day2(), new Date(t1.getTime() + 24 * 3600_000));
  assert.equal(availability.albums["333"].status, "unavailable");
  assert.equal(availability.albums["444"].status, "unavailable");
  assert.equal(availability.albums["666"].status, "ok", "album came back");
  assert.deepEqual(second.catalog.products.map((p) => p.id), [1, 2, 5, 6]);
});

test("a provider failure (567 everywhere) hides nothing", async () => {
  const availability: AvailabilityFile = { version: 1, updatedAt: "", albums: {} };
  const { client } = fakeClient({ "/albums/": { status: 567, body: fixture.hotlink567() } });
  const { result, catalog } = await runOnce(availability, client, new Date());
  assert.deepEqual(result.hidden, []);
  assert.equal(catalog.products.length, master.products.length);
});

test("suspended hides are retried by later runs once allowed", async () => {
  const availability: AvailabilityFile = { version: 1, updatedAt: "", albums: {} };
  for (const p of master.products) {
    availability.albums[p.albumId] = {
      ...newAlbumState(),
      status: "suspect_deleted",
      pendingKind: "album_deleted",
      pendingSince: "2026-10-16T00:00:00Z",
    };
  }
  const ids = master.products.map((p) => p.albumId);
  const opts = { now: new Date(), allowMassChanges: false, newProblems: 0, checked: 0, observedThisRun: new Set<string>() };
  assert.deepEqual(applyVisibility(availability.albums, ids, { ...opts, degraded: true }).hidden, []);
  assert.equal(buildPublicCatalog(master, availability).products.length, 6);
  assert.equal(applyVisibility(availability.albums, ids, { ...opts, degraded: false }).hidden.length, 6);
  assert.equal(buildPublicCatalog(master, availability).products.length, 0);
});
