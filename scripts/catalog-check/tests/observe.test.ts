import { test } from "node:test";
import assert from "node:assert/strict";
import { observeAlbum } from "../observe.ts";
import { OK_ALBUM_ID, OK_PRODUCT_URL, OK_SECOND, OK_THUMB, fakeClient, fixture } from "./helpers.ts";

const album = `/albums/${OK_ALBUM_ID}`;
const jpeg = () => ({ status: 200, body: fixture.validJpeg(), type: "image/jpeg" });
const placeholder = () => ({ status: 200, body: fixture.placeholder(), type: "image/png" });

test("valid product: album exists and thumbnail is a real photo", async () => {
  const { client, calls } = fakeClient({ [album]: { status: 200, body: fixture.albumOk() }, c176a220: jpeg() });
  const obs = await observeAlbum(client, OK_ALBUM_ID, OK_PRODUCT_URL, OK_THUMB);
  assert.ok(obs.kind === "exists" && obs.image === "valid");
  assert.equal(calls.length, 2);
  assert.match(calls[0], /\/albums\/223003265\?uid=1$/);
});

test("deleted product: real 404 page", async () => {
  const { client } = fakeClient({ [album]: { status: 404, body: fixture.albumDeleted() } });
  assert.deepEqual(await observeAlbum(client, OK_ALBUM_ID, OK_PRODUCT_URL, OK_THUMB), { kind: "deleted" });
});

test("broken image: placeholder thumbnail is replaced by the next valid photo", async () => {
  const { client } = fakeClient({
    [album]: { status: 200, body: fixture.albumOk() },
    c176a220: placeholder(),
    "5dea2edd": jpeg(),
  });
  const obs = await observeAlbum(client, OK_ALBUM_ID, OK_PRODUCT_URL, OK_THUMB);
  assert.ok(obs.kind === "exists" && obs.image === "broken");
  assert.equal(obs.replacement, OK_SECOND);
  assert.equal(obs.brokenDetail, "known_placeholder_hash");
});

test("no valid image: every other photo of the album is tried before giving up", async () => {
  const { client, calls } = fakeClient({
    [album]: { status: 200, body: fixture.albumOk() },
    "photo.yupoo.com": placeholder(),
  });
  const obs = await observeAlbum(client, OK_ALBUM_ID, OK_PRODUCT_URL, OK_THUMB);
  assert.ok(obs.kind === "exists" && obs.image === "broken");
  assert.equal(obs.replacement, null);
  assert.equal(calls.length, 1 + 1 + 6); // album page, thumbnail, the album's 6 other photos
});

test("temporary failure: Yupoo 567 on every retry is transient, never deleted", async () => {
  const { client, calls } = fakeClient({ [album]: { status: 567, body: fixture.hotlink567() } });
  assert.deepEqual(await observeAlbum(client, OK_ALBUM_ID, OK_PRODUCT_URL, OK_THUMB), {
    kind: "transient",
    detail: "http_567",
  });
  assert.equal(calls.length, 3); // 1 try + 2 retries
});

test("temporary failure recovers after retries", async () => {
  const { client } = fakeClient({
    [album]: [new TypeError("fetch failed"), { status: 503, body: "" }, { status: 200, body: fixture.albumOk() }],
    c176a220: jpeg(),
  });
  const obs = await observeAlbum(client, OK_ALBUM_ID, OK_PRODUCT_URL, OK_THUMB);
  assert.ok(obs.kind === "exists" && obs.image === "valid");
});

test("an image request failing transiently does not mark the image broken", async () => {
  const { client } = fakeClient({
    [album]: { status: 200, body: fixture.albumOk() },
    c176a220: { status: 502, body: "" },
  });
  assert.equal((await observeAlbum(client, OK_ALBUM_ID, OK_PRODUCT_URL, OK_THUMB)).kind, "transient");
});

test("an empty HTTP 200 image body is transient, not a broken image", async () => {
  const { client } = fakeClient({
    [album]: { status: 200, body: fixture.albumOk() },
    c176a220: { status: 200, body: new Uint8Array(), type: "image/jpeg" },
  });
  assert.equal((await observeAlbum(client, OK_ALBUM_ID, OK_PRODUCT_URL, OK_THUMB)).kind, "transient");
});
