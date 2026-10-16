import { test } from "node:test";
import assert from "node:assert/strict";
import { ErrorBreaker, decideHides, maxNewHides, unusualProblemRate } from "../guard.ts";

test("new-hide limit is 3% of the visible albums, at least 40", () => {
  assert.equal(maxNewHides(2182), 66);
  assert.equal(maxNewHides(100), 40);
});

test("guard suspends mass hides and degraded runs; manual approval overrides the limit", () => {
  const base = { degraded: false, allowMassChanges: false };
  assert.equal(decideHides(30, 2182, base).apply, true);
  assert.equal(decideHides(67, 2182, base).apply, false);
  assert.equal(decideHides(1, 2182, { ...base, degraded: true }).apply, false);
  assert.equal(decideHides(500, 2182, { ...base, allowMassChanges: true }).apply, true);
  assert.equal(decideHides(500, 2182, { degraded: true, allowMassChanges: true }).apply, false);
  assert.equal(decideHides(0, 2182, { ...base, degraded: true }).apply, true);
});

test("an unusual share of newly broken albums suspends hides", () => {
  assert.equal(unusualProblemRate(8, 250), false);
  assert.equal(unusualProblemRate(70, 250), true);
  assert.equal(unusualProblemRate(20, 40), false, "too few checks to judge");
  const opts = { degraded: false, allowMassChanges: false, unusualProblems: true };
  assert.equal(decideHides(5, 2182, opts).apply, false);
  assert.equal(decideHides(5, 2182, { ...opts, allowMassChanges: true }).apply, true);
});

test("breaker trips on 8 consecutive failures or more than 30% failures", () => {
  const a = new ErrorBreaker();
  for (let i = 0; i < 7; i++) a.record(true);
  assert.equal(a.tripped, false);
  a.record(true);
  assert.equal(a.tripped, true);

  const b = new ErrorBreaker();
  for (let i = 0; i < 20; i++) b.record(i % 3 === 0); // 7/20 = 35%
  assert.equal(b.tripped, true);
});
