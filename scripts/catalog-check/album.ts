/**
 * Parsing of Yupoo album pages (minkang.x.yupoo.com/albums/<id>).
 *
 * Observed responses (2026-10-15):
 *   - existing album → 200, header `showalbumheader__main`, one
 *     `data-origin-src="https://photo.yupoo.com/<user>/<hash>/<file>.jpg"` per photo
 *   - deleted album  → 404 with 该相册已不存在, or "this album is not exist" when
 *     Yupoo localises the page to English (depends on Accept-Language)
 *   - anything else (other 404s, unknown layouts) is never treated as a deletion
 */

export const ALBUM_DELETED_MARKERS = ["该相册已不存在", "this album is not exist"];
const ALBUM_PAGE_MARKER = "showalbumheader__main";

export type AlbumPage =
  | { kind: "exists"; images: string[] }
  | { kind: "deleted" }
  | { kind: "anomaly"; detail: string };

export function albumIdFromUrl(url: string): string | null {
  const match = /\/albums\/(\d+)/.exec(url);
  return match ? match[1] : null;
}

/** Canonical album URL without the category query noise. */
export function albumPageUrl(productUrl: string, albumId: string): string {
  const origin = new URL(productUrl).origin;
  return `${origin}/albums/${albumId}?uid=1`;
}

/** Converts any photo.yupoo.com URL of a photo to the `small.jpg` size the catalog uses. */
export function toSmallImageUrl(url: string): string | null {
  const match = /^(?:https?:)?\/\/photo\.yupoo\.com\/([^/]+)\/([0-9a-f]+)\//i.exec(url);
  return match ? `https://photo.yupoo.com/${match[1]}/${match[2]}/small.jpg` : null;
}

export function parseAlbumPage(status: number, html: string): AlbumPage {
  if (status === 404) {
    return ALBUM_DELETED_MARKERS.some((m) => html.toLowerCase().includes(m))
      ? { kind: "deleted" }
      : { kind: "anomaly", detail: "404_without_deleted_marker" };
  }
  if (status !== 200) return { kind: "anomaly", detail: `http_${status}` };
  if (!html.includes(ALBUM_PAGE_MARKER)) return { kind: "anomaly", detail: "unknown_page_layout" };

  const images: string[] = [];
  for (const match of html.matchAll(/data-origin-src="([^"]+)"/g)) {
    const small = toSmallImageUrl(match[1]);
    if (small && !images.includes(small)) images.push(small);
  }
  return { kind: "exists", images };
}
