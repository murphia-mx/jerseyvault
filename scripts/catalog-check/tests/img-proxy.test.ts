import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import proxy from "../../../netlify/edge-functions/img-proxy.ts";
import { fixture } from "./helpers.ts";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function upstream(status: number, body: BodyInit, type = "image/jpeg") {
  const seen: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    seen.push(String(input));
    return new Response(body, { status, headers: { "content-type": type } });
  }) as typeof fetch;
  return seen;
}

const call = (path: string) => proxy(new Request(`https://jerseyvault.example${path}`));

test("valid photo is served with long cache and the sniffed content type", async () => {
  const seen = upstream(200, fixture.validJpeg() as BodyInit);
  const res = await call("/img-proxy/minkang/c176a220/small.jpg?v=2");
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/jpeg");
  assert.match(res.headers.get("cache-control")!, /immutable/);
  assert.equal(seen[0], "https://photo.yupoo.com/minkang/c176a220/small.jpg");
  assert.equal((await res.arrayBuffer()).byteLength, fixture.validJpeg().length);
});

test("Yupoo placeholder with HTTP 200 becomes a short-cached 404", async () => {
  upstream(200, fixture.placeholder() as BodyInit, "image/png");
  const res = await call("/img-proxy/minkang/591ba30c/small.jpg");
  assert.equal(res.status, 404);
  assert.equal(res.headers.get("x-jv-image-status"), "yupoo_placeholder");
  assert.doesNotMatch(res.headers.get("cache-control")!, /immutable|31536000/);
});

test("Yupoo 567 hotlink block is a non-cached 502, not a 404", async () => {
  upstream(567, fixture.hotlink567(), "text/html");
  const res = await call("/img-proxy/minkang/c176a220/small.jpg");
  assert.equal(res.status, 502);
  assert.equal(res.headers.get("cache-control"), "no-store");
});

test("HTML served with HTTP 200 is rejected and not cached", async () => {
  upstream(200, "<html></html>", "text/html");
  const res = await call("/img-proxy/minkang/c176a220/small.jpg");
  assert.equal(res.status, 502);
  assert.equal(res.headers.get("cache-control"), "no-store");
});

test("legitimate PNG is served normally", async () => {
  const png = new Uint8Array([...fixture.placeholder(), 1]);
  upstream(200, png as BodyInit, "image/png");
  const res = await call("/img-proxy/someone/abcd1234/photo.png");
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "image/png");
});

test("SSRF attempts never leave photo.yupoo.com", async () => {
  const seen = upstream(200, fixture.validJpeg() as BodyInit);
  await call("/img-proxy//evil.com/x.jpg");
  assert.equal(new URL(seen[0]).hostname, "photo.yupoo.com");
});
