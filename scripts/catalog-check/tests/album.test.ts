import { test } from "node:test";
import assert from "node:assert/strict";
import { albumIdFromUrl, parseAlbumPage, toSmallImageUrl } from "../album.ts";
import { OK_SECOND, OK_THUMB, fixture } from "./helpers.ts";

test("existing album lists its photos as small.jpg URLs", () => {
  const page = parseAlbumPage(200, fixture.albumOk());
  assert.equal(page.kind, "exists");
  if (page.kind !== "exists") return;
  assert.equal(page.images.length, 7);
  assert.equal(page.images[0], OK_THUMB);
  assert.equal(page.images[1], OK_SECOND);
});

test("deleted album: 404 with 该相册已不存在", () => {
  assert.deepEqual(parseAlbumPage(404, fixture.albumDeleted()), { kind: "deleted" });
});

test("deleted album: English-localised 404 ('this album is not exist')", () => {
  assert.deepEqual(parseAlbumPage(404, fixture.albumDeletedEn()), { kind: "deleted" });
});

test("a 404 without the deletion text is never treated as deleted", () => {
  assert.equal(parseAlbumPage(404, "<html>Not Found</html>").kind, "anomaly");
});

test("blocked / server errors / unknown layouts are anomalies", () => {
  assert.deepEqual(parseAlbumPage(567, fixture.hotlink567()), { kind: "anomaly", detail: "http_567" });
  assert.deepEqual(parseAlbumPage(200, "<html>captcha</html>"), { kind: "anomaly", detail: "unknown_page_layout" });
});

test("url helpers", () => {
  assert.equal(albumIdFromUrl("https://minkang.x.yupoo.com/albums/229872934?uid=1&isSubCate=true"), "229872934");
  assert.equal(albumIdFromUrl("https://minkang.x.yupoo.com/categories/1"), null);
  assert.equal(toSmallImageUrl("//photo.yupoo.com/minkang/c176a220/264ef3a0.jpg"), OK_THUMB);
});
