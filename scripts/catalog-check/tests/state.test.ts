import { test } from "node:test";
import assert from "node:assert/strict";
import { applyObservation, hide, isDue, newAlbumState, problemOf, type AlbumState, type Transition } from "../state.ts";
import type { Observation } from "../observe.ts";

const H = 60 * 60 * 1000;
const t0 = new Date("2026-10-15T06:00:00Z");
const at = (hours: number) => new Date(t0.getTime() + hours * H);
const deleted: Observation = { kind: "deleted" };
const healthy: Observation = { kind: "exists", albumImages: ["a"], image: "valid" };
const transient: Observation = { kind: "transient", detail: "http_567" };
const noValidImages: Observation = {
  kind: "exists",
  albumImages: ["a", "b"],
  image: "broken",
  brokenDetail: "known_placeholder_hash",
  replacement: null,
};

function run(steps: Array<[number, Observation]>, start: AlbumState = newAlbumState()) {
  let state = start;
  let last: Transition | undefined;
  for (const [h, obs] of steps) {
    last = applyObservation(state, obs, at(h));
    state = last.next;
  }
  return { state, last: last! };
}

test("first deletion observation: product leaves the store, pending confirmation", () => {
  const { state, last } = run([[0, deleted]]);
  assert.equal(state.status, "suspect_deleted");
  assert.equal(last.newProblem, "album_deleted");
  assert.equal(problemOf(state), "album_deleted");
  assert.equal(isDue(state, at(23)), false);
  assert.equal(isDue(state, at(24)), true);
});

test("a second observation before 24h does not confirm", () => {
  const { state, last } = run([[0, deleted], [23.9, deleted]]);
  assert.equal(last.confirmed, undefined);
  assert.equal(state.status, "suspect_deleted");
});

test("a second independent observation 24h later confirms", () => {
  const { state, last } = run([[0, deleted], [24, deleted]]);
  assert.equal(last.confirmed, "album_deleted");
  assert.equal(state.status, "unavailable");
  assert.equal(problemOf(state), "album_deleted");
});

test("transient errors never take a product out of the store", () => {
  const many = Array.from({ length: 20 }, (_, i) => [i * 6, transient] as [number, Observation]);
  const { state } = run(many);
  assert.equal(problemOf(state), null);
  assert.equal(state.status, "error");
  assert.equal(state.consecutiveErrors, 20);
  // ...and they neither clear nor advance a pending confirmation
  assert.equal(run([[0, deleted], [12, transient], [30, deleted]]).last.confirmed, "album_deleted");
  assert.equal(problemOf(run([[0, healthy], [5, transient]]).state), null);
});

test("a healthy observation clears a pending problem and restarts the window", () => {
  const { state, last } = run([[0, deleted], [10, healthy], [30, deleted]]);
  assert.equal(last.confirmed, undefined);
  assert.equal(last.newProblem, "album_deleted");
  assert.equal(state.pendingSince, at(30).toISOString());
});

test("hidden products come back as soon as the album is healthy again", () => {
  const hidden = hide(run([[0, deleted], [24, deleted]]).state, at(24));
  assert.equal(hidden.hidden, true);
  assert.equal(hidden.hiddenReason, "album_deleted");
  const { state, last } = run([[200, healthy]], hidden);
  assert.equal(last.restored, true);
  assert.equal(state.hidden, false);
  assert.equal(state.status, "ok");
  assert.equal(problemOf(state), null);
  assert.deepEqual(
    state.history.map((e) => e.event),
    ["suspect_album_deleted", "confirmed_unavailable", "hidden", "problem_cleared", "restored"],
  );
});

test("broken thumbnail with another valid photo is repaired and the product stays", () => {
  const obs: Observation = {
    kind: "exists",
    albumImages: ["a", "b", "c"],
    image: "broken",
    brokenDetail: "known_placeholder_hash",
    replacement: "b",
  };
  const { state, last } = run([[0, obs]]);
  assert.equal(last.repaired, true);
  assert.equal(state.status, "repaired");
  assert.equal(problemOf(state), null);
  assert.equal(state.repair?.thumbnail, "b");
  assert.deepEqual(state.repair?.imagenes, ["b", "a", "c"]);
});

test("album without any valid photo leaves the store and is confirmed 24h later", () => {
  const first = run([[0, noValidImages]]);
  assert.equal(first.state.status, "suspect_no_images");
  assert.equal(problemOf(first.state), "no_valid_images");
  assert.equal(run([[0, noValidImages], [24, noValidImages]]).state.status, "unavailable");
  // a different problem restarts the confirmation window
  assert.equal(run([[0, noValidImages], [24, deleted]]).last.confirmed, undefined);
});

test("hide() refuses albums without a problem", () => {
  assert.throws(() => hide(run([[0, healthy]]).state, at(1)));
});
