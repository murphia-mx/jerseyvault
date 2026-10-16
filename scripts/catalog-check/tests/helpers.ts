import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { HttpClient, type FetchFn } from "../http.ts";

const FIXTURES = resolve(import.meta.dirname, "../fixtures");

/** Real responses captured from Yupoo on 2026-10-15. */
export const fixture = {
  albumOk: () => readFileSync(resolve(FIXTURES, "album-ok.html"), "utf8"),
  albumDeleted: () => readFileSync(resolve(FIXTURES, "album-deleted.html"), "utf8"),
  albumDeletedEn: () => readFileSync(resolve(FIXTURES, "album-deleted-en.html"), "utf8"),
  hotlink567:() => readFileSync(resolve(FIXTURES, "hotlink-567.html"), "utf8"),
  placeholder: () => new Uint8Array(readFileSync(resolve(FIXTURES, "placeholder-small.png"))),
  validJpeg: () => new Uint8Array(readFileSync(resolve(FIXTURES, "valid-small.jpg"))),
};

/** Album 223003265 (fixture album-ok.html) and its first photo. */
export const OK_ALBUM_ID = "223003265";
export const OK_PRODUCT_URL = "https://minkang.x.yupoo.com/albums/223003265?uid=1&isSubCate=true&referrercate=724828";
export const OK_THUMB = "https://photo.yupoo.com/minkang/c176a220/small.jpg";
export const OK_SECOND = "https://photo.yupoo.com/minkang/5dea2edd/small.jpg";

type Reply = { status: number; body: string | Uint8Array; type?: string } | Error;

/** Fake fetch: routes by URL substring; arrays are consumed one reply per call. */
export function fakeClient(routes: Record<string, Reply | Reply[]>) {
  const calls: string[] = [];
  const fetchFn: FetchFn = async (url) => {
    calls.push(url);
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) throw new Error(`unexpected request ${url}`);
    const route = routes[key];
    const reply = Array.isArray(route) ? (route.length > 1 ? route.shift()! : route[0]) : route;
    if (reply instanceof Error) throw reply;
    return new Response(reply.body as BodyInit, {
      status: reply.status,
      headers: { "content-type": reply.type ?? "text/html" },
    });
  };
  const client = new HttpClient({ fetchFn, sleep: async () => {}, minIntervalMs: 0, jitterMs: 0, retries: 2 });
  return { client, calls };
}
