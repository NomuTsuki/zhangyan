import assert from "node:assert/strict";
import test from "node:test";

import {
  assertFiniteNumber,
  ceilToTick,
  clamp,
  floorToTick,
  round1,
  roundToTick,
} from "../game/numeric.ts";
import { behaviorJitter, seededUnit } from "../game/random.ts";

test("finite numeric helpers preserve their established bounds and ticks", () => {
  assert.equal(clamp(-2), 0);
  assert.equal(clamp(12, 2, 8), 8);
  assert.equal(round1(1.26), 1.3);
  assert.equal(roundToTick(12, 5), 10);
  assert.equal(ceilToTick(12, 5), 15);
  assert.equal(floorToTick(12, 5), 10);
});

test("numeric authority returns finite input unchanged", () => {
  assert.equal(assertFiniteNumber(42, "price"), 42);
});

test("numeric authority rejects non-finite input", () => {
  assert.throws(() => assertFiniteNumber(Number.NaN, "price"), /price.*finite/i);
});

test("seeded values are stable", () => {
  assert.equal(seededUnit(20260723, 1, "behavior:cooperate"), 0.7433075965382159);
  assert.equal(behaviorJitter(20260723, 1, "cooperate"), 0.7);
  assert.equal(behaviorJitter(20260723, 2, "exit"), -1.5);
});
