import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { lacquerBoxCase } from "../content/lacquer-box.ts";
import { createInitialWorldState } from "../game/resolve-action.ts";
import {
  calculateSettlement,
  settleWorldState,
} from "../game/settlement.ts";

const highFidelityAppUrl = new URL("../hifi/HighFidelityApp.tsx", import.meta.url);

function settled(truthVariantId, choice) {
  const state = createInitialWorldState(
    lacquerBoxCase,
    20260723,
    truthVariantId,
  );
  return calculateSettlement(lacquerBoxCase, state, choice, 75, 58);
}

test("objective net can change while judgment evidence remains identical", () => {
  const fake = settled("counterfeit", "buy");
  const treasure = settled("hidden-treasure", "buy");

  assert.notEqual(fake.actualNet, treasure.actualNet);
  assert.deepEqual(fake.posterior, treasure.posterior);
  assert.equal(fake.judgmentScore, treasure.judgmentScore);
  assert.equal(fake.judgmentGrade, treasure.judgmentGrade);
});

test("settleWorldState composes the calculated settlement without mutating active state", () => {
  const active = createInitialWorldState(lacquerBoxCase, 20260723, "counterfeit");
  const calculated = calculateSettlement(lacquerBoxCase, active, "buy", 75, 58);
  const settledState = settleWorldState(lacquerBoxCase, active, "buy", 75, 58);

  assert.equal(active.status, "active");
  assert.equal(settledState.status, "settled");
  assert.deepEqual(settledState.settlement, calculated);
});

test("high-fidelity UI imports the production grade order", async () => {
  const source = await readFile(highFidelityAppUrl, "utf8");

  assert.match(source, /import\s*\{[^}]*GRADE_ORDER[^}]*\}\s*from/);
  assert.doesNotMatch(source, /const\s+gradeOrder\s*=\s*\[/);
});
