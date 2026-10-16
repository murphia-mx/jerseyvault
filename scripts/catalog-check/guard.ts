/**
 * Safety limits. When a limit trips, the run still records what it observed
 * but takes no new product out of the store, and exits non-zero so GitHub
 * notifies the owner. Restoring products is never limited.
 */

/** Max products taken out of the store in one run: 3% of the visible albums, at least 40. */
export function maxNewHides(visibleAlbums: number): number {
  return Math.max(40, Math.ceil(visibleAlbums * 0.03));
}

/** Publishing refuses to drop more than this share of the published catalog at once. */
export const MAX_PUBLISH_DROP_RATIO = 0.1;

/**
 * Albums disappear from Yupoo gradually. If far more albums than usual look
 * broken in a single run (provider outage, account change, layout change),
 * nothing is hidden until someone looks at it.
 */
export function unusualProblemRate(newProblems: number, checked: number): boolean {
  return checked >= 50 && newProblems / checked > 0.25;
}

export interface HideDecision {
  apply: boolean;
  reason?: string;
}

export function decideHides(
  proposed: number,
  visibleAlbums: number,
  opts: { degraded: boolean; allowMassChanges: boolean; unusualProblems?: boolean },
): HideDecision {
  if (proposed === 0) return { apply: true };
  if (opts.degraded) return { apply: false, reason: "provider_degraded: too many failed requests this run" };
  if (opts.allowMassChanges) return { apply: true };
  if (opts.unusualProblems) {
    return { apply: false, reason: "unusual_problem_rate: more than 25% of checked albums newly look unavailable" };
  }
  const limit = maxNewHides(visibleAlbums);
  if (proposed > limit) return { apply: false, reason: `too_many_new_hides: ${proposed} > ${limit}` };
  return { apply: true };
}

/** Circuit breaker for the provider: stop early when it is clearly failing. */
export class ErrorBreaker {
  private checked = 0;
  private failed = 0;
  private consecutive = 0;

  record(failed: boolean): void {
    this.checked++;
    if (failed) {
      this.failed++;
      this.consecutive++;
    } else {
      this.consecutive = 0;
    }
  }

  get tripped(): boolean {
    return this.consecutive >= 8 || (this.checked >= 20 && this.failed / this.checked > 0.3);
  }
}
