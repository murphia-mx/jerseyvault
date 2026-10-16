/**
 * End-of-run step: takes out of the store every album that has a problem and
 * is still visible, unless the safety guard says no. Pure apart from mutating
 * the given state map, so it is unit-tested.
 */
import { decideHides, unusualProblemRate } from "./guard.ts";
import { hide, problemOf, type AlbumState } from "./state.ts";

export interface VisibilityOptions {
  now: Date;
  degraded: boolean;
  allowMassChanges: boolean;
  /** Problems first observed in this run, and albums checked in this run (for the unusual-rate guard). */
  newProblems: number;
  checked: number;
  /** Albums observed in this run: only these get a "hide_suspended" history entry. */
  observedThisRun: ReadonlySet<string>;
}

export interface VisibilityResult {
  hidden: string[];
  suspended: string[];
  reason?: string;
}

export function applyVisibility(
  albums: Record<string, AlbumState>,
  albumIds: string[],
  opts: VisibilityOptions,
): VisibilityResult {
  const toHide = albumIds.filter((id) => albums[id] && !albums[id].hidden && problemOf(albums[id]));
  const visible = albumIds.filter((id) => !albums[id]?.hidden).length;
  const decision = decideHides(toHide.length, visible, {
    degraded: opts.degraded,
    allowMassChanges: opts.allowMassChanges,
    unusualProblems: unusualProblemRate(opts.newProblems, opts.checked),
  });

  if (decision.apply) {
    for (const id of toHide) albums[id] = hide(albums[id], opts.now);
    return { hidden: toHide, suspended: [] };
  }

  const at = opts.now.toISOString();
  for (const id of toHide) {
    if (!opts.observedThisRun.has(id)) continue;
    const s = albums[id];
    albums[id] = { ...s, history: [...s.history, { at, event: "hide_suspended", detail: decision.reason }].slice(-30) };
  }
  return { hidden: [], suspended: toHide, reason: decision.reason };
}
