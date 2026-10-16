/**
 * Catalog availability check.
 *
 *   node scripts/catalog-check/run.ts [--batch 250|all|0] [--status suspect_no_images,error]
 *                                     [--time-budget-min 30] [--allow-mass-changes] [--dry-run]
 *
 *   --batch 0      no requests: only apply pending visibility changes and regenerate the catalog
 *   --status ...   re-check only albums with these statuses (targeted re-check)
 *
 * Resumable: state is saved every few albums and the next run continues with
 * whatever was not checked yet. Products are only taken out of the store at
 * the end, behind the safety guard, so an interrupted run hides nothing.
 *
 * Exit codes: 0 ok · 2 provider degraded (stopped early) · 3 hides suspended by the guard.
 */
import {
  AVAILABILITY_PATH,
  MASTER_PATH,
  albumsOf,
  effectiveThumbnail,
  loadAvailability,
  readJson,
  selectBatch,
  selectByStatus,
  writeJsonAtomic,
  type MasterCatalog,
} from "./catalog.ts";
import { writePublicCatalog } from "./build-public.ts";
import { ErrorBreaker } from "./guard.ts";
import { HttpClient } from "./http.ts";
import { observeAlbum } from "./observe.ts";
import { writeReports, type RunSummary } from "./report.ts";
import { applyObservation, newAlbumState } from "./state.ts";
import { applyVisibility } from "./visibility.ts";

const SAVE_EVERY = 20;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<number> {
  const dryRun = process.argv.includes("--dry-run");
  const allowMassChanges = process.argv.includes("--allow-mass-changes");
  const batchArg = arg("batch") ?? "250";
  const statusFilter = arg("status")?.split(",").filter(Boolean);
  const budgetMs = Number(arg("time-budget-min") ?? 0) * 60_000;
  const started = new Date();

  const master = readJson<MasterCatalog>(MASTER_PATH);
  const availability = loadAvailability();
  const albums = albumsOf(master);
  const ids = [...albums.keys()];
  const size = batchArg === "all" ? ids.length : Number(batchArg);
  if (!Number.isInteger(size) || size < 0) throw new Error(`Invalid --batch ${batchArg}`);
  const batch = statusFilter
    ? selectByStatus(ids, availability.albums, statusFilter, size)
    : selectBatch(ids, availability.albums, started, size);

  const client = new HttpClient();
  const breaker = new ErrorBreaker();
  const observations: Record<string, number> = {};
  const observed = new Set<string>();
  let checked = 0, repaired = 0, restored = 0, newProblems = 0, confirmed = 0;
  let outcome: RunSummary["outcome"] = "ok";
  let note: string | undefined;

  const save = () => {
    if (dryRun) return;
    availability.updatedAt = new Date().toISOString();
    writeJsonAtomic(AVAILABILITY_PATH, availability);
  };

  console.log(`Checking ${batch.length} of ${ids.length} albums${dryRun ? " (dry run)" : ""}`);
  for (const id of batch) {
    if (budgetMs && Date.now() - started.getTime() > budgetMs) {
      outcome = "time_budget";
      note = "Time budget reached; the next run continues where this one stopped.";
      break;
    }
    const product = albums.get(id)!;
    const prev = availability.albums[id] ?? newAlbumState();
    const obs = await observeAlbum(client, id, product.url, effectiveThumbnail(prev, product.thumbnail));
    const key = obs.kind === "exists" ? `exists_${obs.image}` : obs.kind;
    observations[key] = (observations[key] ?? 0) + 1;

    const tr = applyObservation(prev, obs, new Date());
    availability.albums[id] = tr.next;
    observed.add(id);
    if (tr.newProblem && !prev.hidden) newProblems++;
    if (tr.confirmed) confirmed++;
    if (tr.repaired) repaired++;
    if (tr.restored) restored++;
    checked++;
    const extra = tr.newProblem ? ` -> ${tr.newProblem}` : tr.confirmed ? ` -> confirmed ${tr.confirmed}` : tr.restored ? " -> restored" : "";
    console.log(`[${checked}/${batch.length}] ${id} #${product.id} ${key}${extra}`);

    breaker.record(obs.kind === "transient" || obs.kind === "anomaly");
    if (breaker.tripped) {
      outcome = "degraded";
      note = "Stopped early: Yupoo is failing or blocking requests. Nothing was hidden this run.";
      break;
    }
    if (checked % SAVE_EVERY === 0) save();
  }

  const visibility = applyVisibility(availability.albums, ids, {
    now: new Date(),
    degraded: outcome === "degraded",
    allowMassChanges,
    newProblems,
    checked,
    observedThisRun: observed,
  });
  if (visibility.suspended.length) {
    if (outcome !== "degraded") outcome = "suspended";
    note =
      `${visibility.suspended.length} products were NOT taken out of the store (${visibility.reason}). ` +
      "Review reports/catalog-status.md and re-run with --allow-mass-changes if correct.";
  }

  save();
  const run: RunSummary = {
    startedAt: started.toISOString(),
    finishedAt: new Date().toISOString(),
    outcome,
    selected: batch.length,
    checked,
    requests: client.requestCount,
    observations,
    newProblems,
    confirmed,
    repaired,
    restored,
    hidden: visibility.hidden.length,
    suspendedHides: visibility.suspended.length,
    note,
  };
  if (!dryRun) {
    writeReports(master, availability, run);
    const { visible, total } = writePublicCatalog(allowMassChanges);
    console.log(`Public catalog: ${visible}/${total} products visible`);
  }
  console.log(JSON.stringify(run, null, 2));
  return outcome === "degraded" ? 2 : outcome === "suspended" ? 3 : 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
