/**
 * One-time creation of data/catalog.master.json from a scraper export, adding
 * the stable Yupoo album id to every product. Existing ids are kept as-is.
 * Refuses to overwrite an existing master catalog.
 *
 *   node scripts/catalog-check/init-master.ts [source=public/catalog.json]
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { albumIdFromUrl } from "./album.ts";
import { MASTER_PATH, PUBLIC_PATH, ROOT, readJson, writeJsonAtomic, type MasterCatalog } from "./catalog.ts";

if (existsSync(MASTER_PATH)) {
  console.error(`${MASTER_PATH} already exists; refusing to overwrite it.`);
  process.exit(1);
}

const source = process.argv[2] ? resolve(ROOT, process.argv[2]) : PUBLIC_PATH;
const catalog = readJson<{ generatedAt: string; products: Array<Omit<MasterCatalog["products"][number], "albumId">> }>(source);

const products = catalog.products.map((p) => {
  const albumId = albumIdFromUrl(p.url);
  if (!albumId) throw new Error(`Product ${p.id} has no Yupoo album id in ${p.url}`);
  const { id, ...rest } = p;
  return { id, albumId, ...rest };
});
const ids = new Set(products.map((p) => p.id));
if (ids.size !== products.length) throw new Error("Duplicate product ids in source catalog");

writeJsonAtomic(MASTER_PATH, { generatedAt: catalog.generatedAt, totalProducts: products.length, products }, 4);
console.log(`Master catalog created with ${products.length} products from ${source}`);
