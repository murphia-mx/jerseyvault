/**
 * Imports national-team jerseys from the supplier into the master catalog,
 * next to the existing club leagues (liga "Selecciones", equipo = country).
 *
 *   node scripts/catalog-check/import-national-teams.ts [--dry-run] [--limit N]
 *        [--categories 3118456,5062328,3856104] [--time-budget-min 40]
 *
 * Safe to re-run: albums already in the master catalog are skipped (stable Yupoo
 * album id), existing products are never modified, and progress is saved every
 * few products. A product is only added when its album exists and has a valid
 * photo (same checks as the availability monitor); its state is recorded in
 * data/availability.json so the scheduled checks cover it from day one.
 */
import { pathToFileURL } from "node:url";
import { appendFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  AVAILABILITY_PATH,
  MASTER_PATH,
  REPORT_DIR,
  loadAvailability,
  readJson,
  writeJsonAtomic,
  type MasterCatalog,
  type MasterProduct,
} from "./catalog.ts";
import { writePublicCatalog } from "./build-public.ts";
import { detectCountry } from "./countries.ts";
import { ErrorBreaker } from "./guard.ts";
import { HttpClient, TransientError } from "./http.ts";
import { parseCategoryPage, type ListedAlbum } from "./listing.ts";
import { observeAlbum, type Observation } from "./observe.ts";
import { isValidJersey, parseSeason, parseSizes, sleeveType, slugify } from "./product-rules.ts";
import { applyObservation, newAlbumState } from "./state.ts";

export const SUPPLIER_ORIGIN = "https://minkang.x.yupoo.com";
export const LIGA = "Selecciones";
/** ⚽🌍 National Teams, 2026 FIFA World Cup, Brazil team column. */
export const DEFAULT_CATEGORIES = ["3118456", "5062328", "3856104"];
/** Listed first in the section (the store sells mainly in Mexico); the rest alphabetically. */
const FEATURED_COUNTRIES = ["México"];
const SAVE_EVERY = 20;

function compareTeams(countryA: string, titleA: string, countryB: string, titleB: string): number {
  const rank = (c: string) => (FEATURED_COUNTRIES.includes(c) ? FEATURED_COUNTRIES.indexOf(c) : FEATURED_COUNTRIES.length);
  return rank(countryA) - rank(countryB) || countryA.localeCompare(countryB, "es") || titleA.localeCompare(titleB, "es");
}

/**
 * Orders the national-team products (featured countries first, then by country
 * and name) inside the slots they already occupy; every other product keeps its
 * exact position. Idempotent.
 */
export function orderNationalTeams(products: MasterProduct[]): MasterProduct[] {
  const slots = products.flatMap((p, i) => (p.liga === LIGA ? [i] : []));
  const sorted = slots.map((i) => products[i]).sort((a, b) => compareTeams(a.equipo, a.nombre, b.equipo, b.nombre));
  const result = [...products];
  slots.forEach((slot, k) => { result[slot] = sorted[k]; });
  return result;
}

export interface Candidate {
  listed: ListedAlbum;
  country: string;
}

export interface Classification {
  candidates: Candidate[];
  alreadyInCatalog: number;
  notJersey: string[];
  noCountry: string[];
}

/** Splits listed albums into importable candidates and the reasons the rest are left out. */
export function classify(listed: ListedAlbum[], knownAlbumIds: ReadonlySet<string>): Classification {
  const result: Classification = { candidates: [], alreadyInCatalog: 0, notJersey: [], noCountry: [] };
  for (const album of listed) {
    if (knownAlbumIds.has(album.albumId)) result.alreadyInCatalog++;
    else if (!isValidJersey(album.title)) result.notJersey.push(album.title);
    else {
      const country = detectCountry(album.title);
      if (country) result.candidates.push({ listed: album, country });
      else result.noCountry.push(album.title);
    }
  }
  result.candidates.sort((a, b) => compareTeams(a.country, a.listed.title, b.country, b.listed.title));
  return result;
}

/** A new master product; never reuses an id or a slug already in the catalog. */
export function buildProduct(
  candidate: Candidate,
  albumImages: string[],
  catalog: MasterCatalog,
  takenSlugs: Set<string>,
): MasterProduct {
  const { listed, country } = candidate;
  const id = catalog.products.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  let slug = slugify(listed.title);
  if (!slug || takenSlugs.has(slug)) slug = `${slug}-${listed.albumId}`.replace(/^-/, "");
  takenSlugs.add(slug);
  const thumbnail = listed.cover ?? albumImages[0];
  const product: MasterProduct = {
    id,
    albumId: listed.albumId,
    slug,
    liga: LIGA,
    equipo: country,
    tipo: sleeveType(listed.title),
    nombre: listed.title,
    thumbnail,
    url: `${SUPPLIER_ORIGIN}${listed.href}`,
    imagenes: albumImages.length ? albumImages : [thumbnail],
  };
  const temporada = parseSeason(listed.title);
  const tallas = parseSizes(listed.title);
  if (temporada) product.temporada = temporada;
  if (tallas) product.tallas = tallas;
  return product;
}

/** Whether an observation proves the album exists with at least one valid photo. */
export function isImportable(obs: Observation): boolean {
  return obs.kind === "exists" && (obs.image === "valid" || obs.replacement !== null);
}

async function listCategory(client: HttpClient, categoryId: string): Promise<ListedAlbum[]> {
  const albums: ListedAlbum[] = [];
  for (let page = 1; page <= 50; page++) {
    const url = `${SUPPLIER_ORIGIN}/categories/${categoryId}${page > 1 ? `?page=${page}` : ""}`;
    const res = await client.get(url, { "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.5" });
    if (res.status !== 200) throw new TransientError(`category ${categoryId} page ${page}: http_${res.status}`);
    const parsed = parseCategoryPage(new TextDecoder().decode(res.body));
    albums.push(...parsed.albums);
    console.log(`category ${categoryId} page ${page}/${parsed.totalPages ?? "?"}: ${parsed.albums.length} albums`);
    if (parsed.albums.length === 0 || (parsed.totalPages !== null && page >= parsed.totalPages)) break;
  }
  return albums;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<number> {
  const dryRun = process.argv.includes("--dry-run");
  const limit = Number(arg("limit") ?? Infinity);
  const budgetMs = Number(arg("time-budget-min") ?? 0) * 60_000;
  const categories = arg("categories")?.split(",") ?? DEFAULT_CATEGORIES;
  const started = new Date();
  const client = new HttpClient();

  // 1. Every album listed in the categories (an album can be in several).
  const listed = new Map<string, ListedAlbum>();
  for (const category of categories) {
    for (const album of await listCategory(client, category)) if (!listed.has(album.albumId)) listed.set(album.albumId, album);
  }

  const master = readJson<MasterCatalog>(MASTER_PATH);
  const availability = loadAvailability();
  const before = master.products.length;
  const known = new Set(master.products.map((p) => p.albumId));
  const plan = classify([...listed.values()], known);
  console.log(
    `listed ${listed.size} unique albums · already in catalog ${plan.alreadyInCatalog} · not a jersey ${plan.notJersey.length} · ` +
      `no identifiable national team ${plan.noCountry.length} · candidates ${plan.candidates.length}`,
  );
  if (dryRun) return 0;

  // 2. Check each candidate on the supplier, like the availability monitor does.
  const takenSlugs = new Set(master.products.map((p) => p.slug));
  const breaker = new ErrorBreaker();
  const skipped = { deleted: [] as string[], noValidImages: [] as string[], anomaly: [] as string[], pending: [] as string[] };
  const imported: MasterProduct[] = [];
  let outcome: "ok" | "degraded" | "time_budget" | "limit" = "ok";
  const save = () => {
    master.products = orderNationalTeams(master.products);
    master.totalProducts = master.products.length;
    availability.updatedAt = new Date().toISOString();
    writeJsonAtomic(MASTER_PATH, master, 4);
    writeJsonAtomic(AVAILABILITY_PATH, availability);
  };

  let checked = 0;
  for (const candidate of plan.candidates) {
    if (imported.length >= limit) { outcome = "limit"; break; }
    if (budgetMs && Date.now() - started.getTime() > budgetMs) { outcome = "time_budget"; break; }
    const { listed: album } = candidate;
    if (!album.cover) { skipped.anomaly.push(`${album.title} (no cover)`); continue; }
    const obs = await observeAlbum(client, album.albumId, `${SUPPLIER_ORIGIN}${album.href}`, album.cover);
    checked++;
    breaker.record(obs.kind === "transient" || obs.kind === "anomaly");

    if (isImportable(obs) && obs.kind === "exists") {
      const product = buildProduct(candidate, obs.albumImages, master, takenSlugs);
      master.products.push(product);
      availability.albums[album.albumId] = applyObservation(newAlbumState(), obs, new Date()).next;
      imported.push(product);
      console.log(`[${checked}/${plan.candidates.length}] + #${product.id} ${product.equipo} · ${product.nombre}`);
      if (imported.length % SAVE_EVERY === 0) save();
    } else {
      const reason = obs.kind === "exists" ? "noValidImages" : obs.kind === "deleted" ? "deleted" : obs.kind === "anomaly" ? "anomaly" : "pending";
      skipped[reason].push(album.title);
      console.log(`[${checked}/${plan.candidates.length}] - ${reason} · ${album.title}`);
    }
    if (breaker.tripped) { outcome = "degraded"; break; }
  }
  save();
  const { visible, total } = writePublicCatalog();

  // 3. Report.
  const perCountry = new Map<string, number>();
  for (const p of imported) perCountry.set(p.equipo, (perCountry.get(p.equipo) ?? 0) + 1);
  const summary = {
    startedAt: started.toISOString(),
    finishedAt: new Date().toISOString(),
    outcome,
    categories,
    listedUniqueAlbums: listed.size,
    alreadyInCatalog: plan.alreadyInCatalog,
    notJersey: plan.notJersey.length,
    noIdentifiableTeam: plan.noCountry,
    candidates: plan.candidates.length,
    checked,
    imported: imported.length,
    skipped,
    requests: client.requestCount,
    productsBefore: before,
    productsAfter: master.products.length,
    publicVisible: visible,
    publicTotal: total,
    perCountry: Object.fromEntries([...perCountry].sort((a, b) => b[1] - a[1])),
  };
  mkdirSync(REPORT_DIR, { recursive: true });
  const compact = { ...summary, skipped: Object.fromEntries(Object.entries(skipped).map(([k, v]) => [k, v.length])), noIdentifiableTeam: plan.noCountry.length, perCountry: undefined };
  appendFileSync(resolve(REPORT_DIR, "imports.jsonl"), JSON.stringify(compact) + "\n", "utf8");
  // The detailed report describes the last run that found something to import.
  if (plan.candidates.length > 0) {
    writeFileSync(resolve(REPORT_DIR, "import-selecciones.json"), JSON.stringify(summary, null, 2) + "\n", "utf8");
    writeFileSync(resolve(REPORT_DIR, "import-selecciones.md"), renderReport(summary), "utf8");
  }
  console.log(JSON.stringify(compact, null, 2));
  return outcome === "degraded" ? 2 : 0;
}

function renderReport(s: {
  finishedAt: string; outcome: string; listedUniqueAlbums: number; alreadyInCatalog: number; notJersey: number;
  noIdentifiableTeam: string[]; candidates: number; imported: number; skipped: Record<string, string[]>;
  productsBefore: number; productsAfter: number; publicVisible: number; perCountry: Record<string, number>;
}): string {
  return [
    "# Importación de selecciones nacionales",
    "",
    `Fecha: ${s.finishedAt} · Resultado: **${s.outcome}**`,
    "",
    "| Concepto | Cantidad |",
    "|---|---:|",
    `| Álbumes únicos en las categorías de selecciones | ${s.listedUniqueAlbums} |`,
    `| Ya estaban en el catálogo | ${s.alreadyInCatalog} |`,
    `| Descartados: no son camisetas de adulto (chaquetas, polos, entrenamiento, niños, mujer, portero…) | ${s.notJersey} |`,
    `| Descartados: sin selección identificable en el título | ${s.noIdentifiableTeam.length} |`,
    `| Candidatos comprobados | ${s.candidates} |`,
    `| **Importados** | **${s.imported}** |`,
    `| No importados: álbum eliminado en Yupoo | ${s.skipped.deleted.length} |`,
    `| No importados: sin ninguna foto válida | ${s.skipped.noValidImages.length} |`,
    `| No importados: respuesta desconocida | ${s.skipped.anomaly.length} |`,
    `| Pendientes por error temporal (se reintentan al volver a ejecutar) | ${s.skipped.pending.length} |`,
    "",
    `Catálogo maestro: ${s.productsBefore} → ${s.productsAfter} productos · En tienda: ${s.publicVisible}`,
    "",
    "## Importados por selección",
    "",
    ...Object.entries(s.perCountry).map(([country, n]) => `- ${country}: ${n}`),
    "",
    "## Sin selección identificable (no importados)",
    "",
    ...s.noIdentifiableTeam.map((t) => `- ${t}`),
    "",
  ].join("\n");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(
    (code) => process.exit(code),
    (error) => {
      console.error(error);
      process.exit(1);
    },
  );
}
