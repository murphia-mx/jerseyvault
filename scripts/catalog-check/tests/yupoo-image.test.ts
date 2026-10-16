import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyImageBytes, pngDimensions, sniffFormat } from "../../../netlify/shared/yupoo-image.ts";
import { fixture } from "./helpers.ts";

const JPG_URL = "https://photo.yupoo.com/minkang/591ba30c/small.jpg";

test("real Yupoo placeholder (HTTP 200 PNG) is detected by fingerprint", async () => {
  assert.deepEqual(await classifyImageBytes(fixture.placeholder(), JPG_URL), {
    verdict: "placeholder",
    reason: "known_placeholder_hash",
  });
});

test("re-encoded placeholder variant is detected by format + dimensions, not size", async () => {
  const variant = new Uint8Array([...fixture.placeholder(), 0, 0, 0, 0]); // different hash and size
  assert.equal(pngDimensions(variant)?.width, 470);
  const v = await classifyImageBytes(variant, JPG_URL);
  assert.equal(v.verdict, "placeholder");
});

test("real product JPEG is valid", async () => {
  assert.deepEqual(await classifyImageBytes(fixture.validJpeg(), JPG_URL), { verdict: "valid", format: "jpeg" });
});

test("legitimate PNG is not blocked, even with the placeholder's dimensions at a .png URL", async () => {
  const png = new Uint8Array([...fixture.placeholder(), 1]);
  const v = await classifyImageBytes(png, "https://photo.yupoo.com/x/abcd/photo.png");
  assert.deepEqual(v, { verdict: "valid", format: "png" });
});

test("legitimate PNG with other dimensions at a .jpg URL is valid", async () => {
  const png = fixture.placeholder().slice();
  new DataView(png.buffer).setUint32(16, 800);
  assert.equal((await classifyImageBytes(png, JPG_URL)).verdict, "valid");
});

test("WebP, GIF and AVIF are recognised", () => {
  const enc = (s: string) => new TextEncoder().encode(s);
  assert.equal(sniffFormat(enc("RIFF\0\0\0\0WEBPVP8 ")), "webp");
  assert.equal(sniffFormat(enc("GIF89a......")), "gif");
  assert.equal(sniffFormat(enc("\0\0\0\x1cftypavif")), "avif");
});

test("HTML error pages and empty bodies are invalid", async () => {
  const html = new TextEncoder().encode(fixture.hotlink567());
  assert.deepEqual(await classifyImageBytes(html, JPG_URL), { verdict: "invalid", reason: "not_an_image" });
  assert.deepEqual(await classifyImageBytes(new Uint8Array(), JPG_URL), { verdict: "invalid", reason: "empty_body" });
});
