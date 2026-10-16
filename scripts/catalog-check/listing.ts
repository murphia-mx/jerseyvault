/**
 * Parsing of Yupoo category listings (minkang.x.yupoo.com/categories/<id>?page=N).
 * Each album is an `<a class="album__main" title=… href="/albums/<id>?…">` holding an
 * `img.autocover` (cover in `src` or `data-src`); the page also states "共N页" (N pages).
 */
import { toSmallImageUrl } from "./album.ts";
import { decodeHtml } from "./product-rules.ts";

export interface ListedAlbum {
  albumId: string;
  title: string;
  /** Cover photo as the catalog stores it (small.jpg), or null if the listing shows none. */
  cover: string | null;
  /** Album path as linked from the listing, e.g. "/albums/123?uid=1&isSubCate=false&referrercate=456". */
  href: string;
}

export interface CategoryPage {
  albums: ListedAlbum[];
  totalPages: number | null;
}

export function parseCategoryPage(html: string): CategoryPage {
  const albums: ListedAlbum[] = [];
  const anchor = /<a\b(?=[^>]*\bclass="album__main")([^>]*)>([\s\S]*?)<\/a>/g;
  for (const m of html.matchAll(anchor)) {
    const attrs = m[1];
    const href = /\bhref="([^"]+)"/.exec(attrs)?.[1];
    const title = /\btitle="([^"]*)"/.exec(attrs)?.[1];
    const albumId = href ? /\/albums\/(\d+)/.exec(href)?.[1] : undefined;
    if (!href || !albumId || title === undefined) continue;
    const img = /<img\b[^>]*\bautocover\b[^>]*>/.exec(m[2])?.[0] ?? "";
    const src = /\bdata-src="([^"]+)"/.exec(img)?.[1] ?? /\bsrc="([^"]+)"/.exec(img)?.[1];
    albums.push({
      albumId,
      title: decodeHtml(title),
      cover: src ? toSmallImageUrl(src) : null,
      href: decodeHtml(href),
    });
  }
  const pages = /共\s*(\d+)\s*页/.exec(html);
  return { albums, totalPages: pages ? Number(pages[1]) : null };
}
