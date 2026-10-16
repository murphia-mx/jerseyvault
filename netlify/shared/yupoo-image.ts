/**
 * Shared Yupoo image validation, used by the Netlify edge proxy (Deno) and the
 * catalog checker (Node). Only Web APIs are used so it runs in both runtimes.
 *
 * Yupoo answers a deleted/unavailable photo with HTTP 200 and a generic PNG
 * ("图片暂时无法展示", 470×380) instead of an error, so status codes alone
 * cannot tell a broken image from a real one. We validate the bytes:
 *   1. The format is sniffed from magic bytes (the Content-Type is not trusted).
 *   2. Known placeholder fingerprints (SHA-256) are rejected.
 *   3. A PNG served for a .jpg/.jpeg URL with the placeholder's exact
 *      dimensions is rejected, which catches re-encoded placeholder variants.
 * Legitimate PNG/WebP/JPEG/GIF/AVIF images pass untouched.
 */

/** SHA-256 of placeholders observed on 2026-10-15 (small/medium/big, any account). */
export const PLACEHOLDER_SHA256: ReadonlySet<string> = new Set([
  "c40fff23302bf779252e28d3177eb9482f27770aee176011bf73de0390457ddf",
]);

export const PLACEHOLDER_DIMENSIONS: ReadonlyArray<{ width: number; height: number }> = [
  { width: 470, height: 380 },
];

export type ImageFormat = "jpeg" | "png" | "webp" | "gif" | "avif";

export type ImageVerdict =
  | { verdict: "valid"; format: ImageFormat }
  | { verdict: "placeholder"; reason: string }
  | { verdict: "invalid"; reason: string };

export function sniffFormat(bytes: Uint8Array): ImageFormat | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) return "png";
  if (b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return "webp";
  if (b.length >= 6 && (ascii(b, 0, 6) === "GIF87a" || ascii(b, 0, 6) === "GIF89a")) return "gif";
  if (b.length >= 12 && ascii(b, 4, 4) === "ftyp" && ["avif", "avis"].includes(ascii(b, 8, 4))) return "avif";
  return null;
}

/** Width/height from the PNG IHDR chunk, or null if not a well-formed PNG header. */
export function pngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24 || ascii(bytes, 12, 4) !== "IHDR") return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as Uint8Array<ArrayBuffer>);
  return Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, "0")).join("");
}

export async function classifyImageBytes(bytes: Uint8Array, url: string): Promise<ImageVerdict> {
  if (bytes.length === 0) return { verdict: "invalid", reason: "empty_body" };

  const format = sniffFormat(bytes);
  if (!format) return { verdict: "invalid", reason: "not_an_image" };

  if (PLACEHOLDER_SHA256.has(await sha256Hex(bytes))) {
    return { verdict: "placeholder", reason: "known_placeholder_hash" };
  }

  if (format === "png" && /\.jpe?g$/i.test(pathnameOf(url))) {
    const dims = pngDimensions(bytes);
    if (dims && PLACEHOLDER_DIMENSIONS.some((d) => d.width === dims.width && d.height === dims.height)) {
      return { verdict: "placeholder", reason: "png_for_jpg_with_placeholder_dimensions" };
    }
  }

  return { verdict: "valid", format };
}

export const MIME_BY_FORMAT: Record<ImageFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

function ascii(b: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...b.subarray(start, start + length));
}

function pathnameOf(url: string): string {
  try {
    return new URL(url, "https://photo.yupoo.com").pathname;
  } catch {
    return url;
  }
}
