/**
 * One independent observation of an album: is it still on Yupoo, and is the
 * image we show for it real? Network problems become "transient" and never
 * count towards hiding a product.
 */
import { classifyImageBytes } from "../../netlify/shared/yupoo-image.ts";
import { albumPageUrl, parseAlbumPage } from "./album.ts";
import { HttpClient, TransientError } from "./http.ts";

/** Same Referer the production image proxy sends (netlify/edge-functions/img-proxy.ts). */
const IMAGE_HEADERS = { Referer: "https://x.yupoo.com/" };
/** Pin the page language so the deletion message is predictable. */
const ALBUM_HEADERS = { "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.5" };
/** Every photo of the album is tried before concluding it has no valid image (bounded). */
const MAX_REPAIR_CANDIDATES = 40;

export type ImageCheck = "valid" | "broken";

export type Observation =
  | { kind: "transient"; detail: string }
  | { kind: "anomaly"; detail: string }
  | { kind: "deleted" }
  | { kind: "exists"; albumImages: string[]; image: "valid" }
  | { kind: "exists"; albumImages: string[]; image: "broken"; brokenDetail: string; replacement: string | null };

export async function checkImage(client: HttpClient, url: string): Promise<{ result: ImageCheck; detail: string }> {
  const res = await client.get(url, IMAGE_HEADERS);
  if (res.status === 404 || res.status === 403 || res.status === 410) {
    return { result: "broken", detail: `http_${res.status}` };
  }
  if (res.status !== 200) throw new TransientError(`image_http_${res.status}`);
  // Far bigger than Yupoo's ~17 KB placeholder: a real photo we chose not to download.
  if (res.oversized) return { result: "valid", detail: "oversized" };
  // An empty 200 is a truncated response, not proof that the photo is gone.
  if (res.body.length === 0) throw new TransientError("image_empty_body");
  const verdict = await classifyImageBytes(res.body, url);
  return verdict.verdict === "valid"
    ? { result: "valid", detail: verdict.format }
    : { result: "broken", detail: verdict.reason };
}

export async function observeAlbum(
  client: HttpClient,
  albumId: string,
  productUrl: string,
  currentThumbnail: string,
): Promise<Observation> {
  try {
    const page = await client.get(albumPageUrl(productUrl, albumId), ALBUM_HEADERS);
    const parsed = parseAlbumPage(page.status, new TextDecoder().decode(page.body));
    if (parsed.kind !== "exists") return parsed;

    const thumb = await checkImage(client, currentThumbnail);
    if (thumb.result === "valid") return { kind: "exists", albumImages: parsed.images, image: "valid" };

    let replacement: string | null = null;
    const candidates = parsed.images.filter((u) => u !== currentThumbnail).slice(0, MAX_REPAIR_CANDIDATES);
    for (const candidate of candidates) {
      if ((await checkImage(client, candidate)).result === "valid") {
        replacement = candidate;
        break;
      }
    }
    return { kind: "exists", albumImages: parsed.images, image: "broken", brokenDetail: thumb.detail, replacement };
  } catch (error) {
    if (error instanceof TransientError) return { kind: "transient", detail: error.message };
    throw error;
  }
}
