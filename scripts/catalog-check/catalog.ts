/**
 * Files and pure helpers shared by the checker and the public catalog build.
 *
 *   data/catalog.master.json  every product ever scraped (never trimmed by the checker)
 *   data/availability.json    per-album state, repairs and history (see state.ts)
 *   <public catalog>          generated: visible products with repairs applied. Its path
 *                             comes from package.json "catalogCheck.publicCatalog"
 *                             (default public/catalog.json).
 */
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { effectiveThumbnail, isDue, isSuspect, type AlbumState, type AvailabilityFile } from "./state.ts";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const MASTER_PATH = resolve(ROOT, "data/catalog.master.json");
export const AVAILABILITY_PATH = resolve(ROOT, "data/availability.json");
export const REPORT_DIR = resolve(ROOT, "reports");

const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8")) as {
  catalogCheck?: { publicCatalog?: string };
};
export const PUBLIC_PATH = resolve(ROOT, pkg.catalogCheck?.publicCatalog ?? "public/catalog.json");

export interface MasterProduct {
  id: number;
  albumId: string;
  slug: string;
  liga: string;
  equipo: string;
  tipo: string;
  nombre: string;
  thumbnail: string;
  url: string;
  imagenes: string[];
  /** Season and size range as written in the Yupoo title (imported products only). */
  temporada?: string;
  tallas?: string;
}

export interface MasterCatalog {
  generatedAt: string;
  totalProducts: number;
  products: MasterProduct[];
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

/** Write to a temp file then rename, so a crash never leaves a half-written file. */
export function writeJsonAtomic(path: string, data: unknown, indent = 2): void {
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, indent) + "\n", "utf8");
  renameSync(tmp, path);
}

export function loadAvailability(): AvailabilityFile {
  try {
    return readJson<AvailabilityFile>(AVAILABILITY_PATH);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { version: 1, updatedAt: new Date(0).toISOString(), albums: {} };
    }
    throw error;
  }
}

/** First product of each album (two albums are listed in two categories). */
export function albumsOf(master: MasterCatalog): Map<string, MasterProduct> {
  const map = new Map<string, MasterProduct>();
  for (const p of master.products) if (!map.has(p.albumId)) map.set(p.albumId, p);
  return map;
}

export function buildPublicCatalog(master: MasterCatalog, availability: AvailabilityFile) {
  const products = master.products
    .filter((p) => !availability.albums[p.albumId]?.hidden)
    .map((p) => {
      const repair = availability.albums[p.albumId]?.repair;
      return repair ? { ...p, thumbnail: repair.thumbnail, imagenes: repair.imagenes } : p;
    });
  return { generatedAt: master.generatedAt, totalProducts: products.length, products };
}

const HIDDEN_RECHECK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Picks which albums to check this run, most useful first:
 *   0. suspects whose 24h confirmation window has elapsed (at most half the batch)
 *   1. never checked
 *   2. last check failed (network / unknown response)
 *   3. confirmed unavailable, not seen for a week (to restore them if they come back)
 *   4. everything else, least recently checked first
 * Suspects still inside their 24h window are skipped: re-checking early proves nothing.
 */
export function selectBatch(
  albumIds: string[],
  albums: Record<string, AlbumState>,
  now: Date,
  size: number,
  maxDue = Math.ceil(size / 2),
): string[] {
  const t = now.getTime();
  const last = (id: string) => Date.parse(albums[id]?.lastCheckedAt ?? "1970-01-01T00:00:00Z");
  const rank = (id: string): number => {
    const s = albums[id];
    if (!s || s.status === "unchecked") return 1;
    if (isDue(s, now)) return 0;
    if (isSuspect(s)) return 9;
    if (s.status === "unavailable") return t - last(id) >= HIDDEN_RECHECK_MS ? 3 : 9;
    if (s.consecutiveErrors > 0) return 2;
    return 4;
  };
  let due = 0;
  return albumIds
    .map((id) => ({ id, r: rank(id), last: last(id) }))
    .filter((x) => x.r < 9)
    .sort((a, b) => a.r - b.r || a.last - b.last || a.id.localeCompare(b.id))
    .filter((x) => x.r !== 0 || due++ < maxDue)
    .slice(0, size)
    .map((x) => x.id);
}

/** Albums with one of the given statuses, least recently checked first (targeted re-checks). */
export function selectByStatus(
  albumIds: string[],
  albums: Record<string, AlbumState>,
  statuses: string[],
  size: number,
): string[] {
  const last = (id: string) => Date.parse(albums[id]?.lastCheckedAt ?? "1970-01-01T00:00:00Z");
  return albumIds
    .filter((id) => statuses.includes(albums[id]?.status ?? "unchecked"))
    .sort((a, b) => last(a) - last(b) || a.localeCompare(b))
    .slice(0, size);
}

export { effectiveThumbnail };
