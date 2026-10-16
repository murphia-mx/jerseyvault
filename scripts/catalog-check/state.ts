/**
 * Availability state per Yupoo album (data/availability.json) and the pure
 * transition rules. The master catalog is never edited: hiding and image
 * repairs live here and are applied when the public catalog is generated.
 *
 * Rules:
 *  - transient/anomaly observations (429, 567, 5xx, timeouts, unknown pages)
 *    never change visibility;
 *  - a definitive problem — the album page says it no longer exists, or every
 *    photo of the album is Yupoo's "unavailable" placeholder — takes the
 *    product out of the store right away (status suspect_*, "quarantine");
 *  - a second independent check ≥24h later confirms it (status unavailable);
 *  - any healthy observation puts the product back immediately;
 *  - a broken thumbnail with another valid photo in the album is repaired and
 *    the product stays.
 * Hides are applied by run.ts behind the safety guard (guard.ts).
 */
import type { Observation } from "./observe.ts";

export const CONFIRM_AFTER_MS = 24 * 60 * 60 * 1000;
const MAX_HISTORY = 30;

export type AlbumStatus =
  | "unchecked"
  | "ok"
  | "repaired"
  | "suspect_deleted"
  | "suspect_no_images"
  | "unavailable"
  | "error";

export type ProblemKind = "album_deleted" | "no_valid_images";

export interface HistoryEvent {
  at: string;
  event: string;
  detail?: string;
}

export interface AlbumState {
  status: AlbumStatus;
  /** Excluded from the public catalog. */
  hidden: boolean;
  hiddenReason?: ProblemKind;
  hiddenAt?: string;
  restoredAt?: string;
  lastCheckedAt?: string;
  lastOkAt?: string;
  /** Problem currently observed, and when it was first seen. */
  pendingKind?: ProblemKind;
  pendingSince?: string;
  consecutiveErrors: number;
  lastError?: { at: string; detail: string };
  repair?: { thumbnail: string; imagenes: string[]; at: string; reason: string };
  history: HistoryEvent[];
}

export interface AvailabilityFile {
  version: 1;
  updatedAt: string;
  albums: Record<string, AlbumState>;
}

export function newAlbumState(): AlbumState {
  return { status: "unchecked", hidden: false, consecutiveErrors: 0, history: [] };
}

export interface Transition {
  next: AlbumState;
  /** First observation of a problem (the product leaves the store, pending confirmation). */
  newProblem?: ProblemKind;
  /** Same problem seen again ≥24h later: unavailability confirmed. */
  confirmed?: ProblemKind;
  restored?: boolean;
  repaired?: boolean;
}

export function effectiveThumbnail(state: AlbumState | undefined, original: string): string {
  return state?.repair?.thumbnail ?? original;
}

export function isSuspect(state: AlbumState | undefined): boolean {
  return state?.status === "suspect_deleted" || state?.status === "suspect_no_images";
}

/** The problem that keeps this album out of the store, if any. */
export function problemOf(state: AlbumState | undefined): ProblemKind | null {
  if (!state || !(isSuspect(state) || state.status === "unavailable")) return null;
  return state.pendingKind ?? state.hiddenReason ?? null;
}

export function applyObservation(prev: AlbumState, obs: Observation, now: Date): Transition {
  const at = now.toISOString();
  const next: AlbumState = { ...prev, history: [...prev.history], lastCheckedAt: at };
  const log = (event: string, detail?: string) => {
    next.history.push(detail ? { at, event, detail } : { at, event });
    if (next.history.length > MAX_HISTORY) next.history.splice(0, next.history.length - MAX_HISTORY);
  };

  if (obs.kind === "transient" || obs.kind === "anomaly") {
    next.consecutiveErrors = prev.consecutiveErrors + 1;
    next.lastError = { at, detail: `${obs.kind}:${obs.detail}` };
    if (prev.consecutiveErrors === 0) log(obs.kind, obs.detail);
    if (next.status === "unchecked") next.status = "error";
    return { next };
  }

  next.consecutiveErrors = 0;
  delete next.lastError;

  if (obs.kind === "deleted") return problem(prev, next, "album_deleted", now, log);

  if (obs.image === "broken" && obs.replacement) {
    const imagenes = [obs.replacement, ...obs.albumImages.filter((u) => u !== obs.replacement)];
    next.repair = { thumbnail: obs.replacement, imagenes, at, reason: obs.brokenDetail };
    log("repaired", `${obs.brokenDetail} -> ${obs.replacement}`);
    return { ...healthy(prev, next, at, log), repaired: true };
  }
  if (obs.image === "broken") return problem(prev, next, "no_valid_images", now, log, obs.brokenDetail);

  return healthy(prev, next, at, log);
}

function healthy(prev: AlbumState, next: AlbumState, at: string, log: (e: string, d?: string) => void): Transition {
  next.lastOkAt = at;
  next.status = next.repair ? "repaired" : "ok";
  if (prev.pendingKind) log("problem_cleared", prev.pendingKind);
  delete next.pendingKind;
  delete next.pendingSince;
  if (!prev.hidden) return { next };
  next.hidden = false;
  next.restoredAt = at;
  delete next.hiddenReason;
  delete next.hiddenAt;
  log("restored");
  return { next, restored: true };
}

function problem(
  prev: AlbumState,
  next: AlbumState,
  kind: ProblemKind,
  now: Date,
  log: (e: string, d?: string) => void,
  detail?: string,
): Transition {
  if (prev.pendingKind !== kind || !prev.pendingSince) {
    next.pendingKind = kind;
    next.pendingSince = now.toISOString();
    next.status = kind === "album_deleted" ? "suspect_deleted" : "suspect_no_images";
    if (prev.hidden) next.hiddenReason = kind;
    log(`suspect_${kind}`, detail);
    return { next, newProblem: kind };
  }
  if (prev.status === "unavailable") return { next };
  if (now.getTime() - Date.parse(prev.pendingSince) < CONFIRM_AFTER_MS) return { next };
  next.status = "unavailable";
  log("confirmed_unavailable", kind);
  return { next, confirmed: kind };
}

/** Takes an album with a problem out of the store (called by run.ts after the safety guard). */
export function hide(state: AlbumState, now: Date): AlbumState {
  const kind = problemOf(state);
  if (!kind) throw new Error("hide() called on an album without a problem");
  const at = now.toISOString();
  const history = [...state.history, { at, event: "hidden", detail: kind }].slice(-MAX_HISTORY);
  return { ...state, hidden: true, hiddenReason: kind, hiddenAt: at, history };
}

/** A suspect whose 24h confirmation window has elapsed. */
export function isDue(state: AlbumState | undefined, now: Date): boolean {
  return isSuspect(state) && !!state?.pendingSince && now.getTime() - Date.parse(state.pendingSince) >= CONFIRM_AFTER_MS;
}
