/**
 * Generates the public catalog from the master catalog + availability state.
 * Usage: node scripts/catalog-check/build-public.ts [--allow-mass-changes]
 */
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  MASTER_PATH,
  PUBLIC_PATH,
  buildPublicCatalog,
  loadAvailability,
  readJson,
  writeJsonAtomic,
  type MasterCatalog,
} from "./catalog.ts";
import { MAX_PUBLISH_DROP_RATIO } from "./guard.ts";

export function writePublicCatalog(allowMassChanges = false): { visible: number; total: number } {
  const master = readJson<MasterCatalog>(MASTER_PATH);
  const catalog = buildPublicCatalog(master, loadAvailability());
  const published = existsSync(PUBLIC_PATH) ? readJson<{ products: unknown[] }>(PUBLIC_PATH).products.length : 0;
  const minimum = Math.floor(published * (1 - MAX_PUBLISH_DROP_RATIO));
  if (!allowMassChanges && catalog.products.length < minimum) {
    throw new Error(
      `Refusing to publish: ${catalog.products.length} products would replace ${published} ` +
        `(more than ${MAX_PUBLISH_DROP_RATIO * 100}% dropped at once). ` +
        "Re-run with --allow-mass-changes after reviewing reports/.",
    );
  }
  // Same 4-space layout as the scraper output, so diffs stay readable.
  writeJsonAtomic(PUBLIC_PATH, catalog, 4);
  return { visible: catalog.products.length, total: master.products.length };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { visible, total } = writePublicCatalog(process.argv.includes("--allow-mass-changes"));
  console.log(`Public catalog: ${visible}/${total} products visible`);
}
