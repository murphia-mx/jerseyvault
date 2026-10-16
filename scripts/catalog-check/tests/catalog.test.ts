import { test } from "node:test";
import assert from "node:assert/strict";
import { albumIdFromUrl } from "../album.ts";
import {
  MASTER_PATH,
  PUBLIC_PATH,
  buildPublicCatalog,
  loadAvailability,
  readJson,
  selectBatch,
  selectByStatus,
  type MasterCatalog,
  type MasterProduct,
} from "../catalog.ts";
import { newAlbumState, type AlbumState, type AvailabilityFile } from "../state.ts";

const product = (id: number, albumId: string): MasterProduct => ({
  id,
  albumId,
  slug: `p${id}`,
  liga: "La Liga",
  equipo: "X",
  tipo: "Manga corta",
  nombre: `P${id}`,
  thumbnail: `https://photo.yupoo.com/u/${albumId}/small.jpg`,
  url: `https://u.x.yupoo.com/albums/${albumId}?uid=1`,
  imagenes: [],
});
const state = (over: Partial<AlbumState>): AlbumState => ({ ...newAlbumState(), status: "ok", ...over });

test("public catalog hides confirmed albums, applies repairs and keeps ids", () => {
  const master: MasterCatalog = {
    generatedAt: "g",
    totalProducts: 3,
    products: [product(1, "a"), product(2, "b"), product(3, "c")],
  };
  const availability: AvailabilityFile = {
    version: 1,
    updatedAt: "u",
    albums: {
      a: state({ hidden: true, status: "unavailable" }),
      b: state({ status: "repaired", repair: { thumbnail: "new", imagenes: ["new"], at: "t", reason: "r" } }),
      c: state({ status: "suspect_deleted", pendingSince: "2026-10-15T00:00:00Z" }),
    },
  };
  const pub = buildPublicCatalog(master, availability);
  assert.deepEqual(pub.products.map((p) => p.id), [2, 3]);
  assert.equal(pub.totalProducts, 2);
  assert.equal(pub.products[0].thumbnail, "new");
  assert.equal(master.products[1].thumbnail, "https://photo.yupoo.com/u/b/small.jpg", "master untouched");
});

test("batch selection: due confirmations first, then unchecked, errors, stale confirmed, oldest", () => {
  const now = new Date("2026-10-20T00:00:00Z");
  const albums: Record<string, AlbumState> = {
    fresh: state({ lastCheckedAt: "2026-10-19T00:00:00Z" }),
    old: state({ lastCheckedAt: "2026-10-10T00:00:00Z" }),
    due: state({ status: "suspect_deleted", pendingKind: "album_deleted", pendingSince: "2026-10-18T00:00:00Z", lastCheckedAt: "2026-10-18T00:00:00Z" }),
    dueHidden: state({ status: "suspect_no_images", hidden: true, pendingKind: "no_valid_images", pendingSince: "2026-10-17T00:00:00Z", lastCheckedAt: "2026-10-17T00:00:00Z" }),
    notDue: state({ status: "suspect_deleted", hidden: true, pendingKind: "album_deleted", pendingSince: "2026-10-19T12:00:00Z", lastCheckedAt: "2026-10-19T12:00:00Z" }),
    err: state({ consecutiveErrors: 1, lastCheckedAt: "2026-10-19T00:00:00Z" }),
    hiddenRecent: state({ hidden: true, status: "unavailable", lastCheckedAt: "2026-10-18T00:00:00Z" }),
    hiddenStale: state({ hidden: true, status: "unavailable", lastCheckedAt: "2026-10-01T00:00:00Z" }),
  };
  const ids = [...Object.keys(albums), "never"];
  assert.deepEqual(selectBatch(ids, albums, now, 100), ["dueHidden", "due", "never", "err", "hiddenStale", "old", "fresh"]);
  assert.deepEqual(selectBatch(ids, albums, now, 2), ["dueHidden", "never"], "at most half the batch are confirmations");
  assert.deepEqual(selectBatch(ids, albums, now, 2, 0), ["never", "err"]);
  assert.deepEqual(selectByStatus(ids, albums, ["suspect_deleted"], 10), ["due", "notDue"]);
});

test("repository data: master catalog is complete and public catalog is in sync", () => {
  const master = readJson<MasterCatalog>(MASTER_PATH);
  assert.equal(master.products.length, master.totalProducts);
  assert.equal(new Set(master.products.map((p) => p.id)).size, master.products.length, "ids unique");
  for (const p of master.products) assert.equal(p.albumId, albumIdFromUrl(p.url), `album id of #${p.id}`);
  assert.deepEqual(readJson(PUBLIC_PATH), buildPublicCatalog(master, loadAvailability()));
});
