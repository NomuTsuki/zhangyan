import assert from "node:assert/strict";
import test from "node:test";

import { lacquerBoxCase } from "../content/lacquer-box.ts";
import {
  createInitialWorldState,
  resolveTurn,
} from "../game/resolve-action.ts";
import { buildDeveloperProjection } from "../game/projections.ts";
import { buildPlayerPresentation } from "../hifi/presentation.ts";

function start(variant = "restored-genuine") {
  return createInitialWorldState(lacquerBoxCase, 20260723, variant);
}

test("player projection has no truth, exact NPC state, posterior or formulas before settlement", () => {
  const projection = buildPlayerPresentation(lacquerBoxCase, start("hidden-treasure"));
  const serialized = JSON.stringify(projection);

  for (const forbidden of [
    "truthVariantId",
    "npcState",
    "npcPosterior",
    "formulaLog",
    "trueValue",
  ]) {
    assert.doesNotMatch(serialized, new RegExp(forbidden));
  }
  assert.equal(projection.status, "active");
});

test("developer projection carries identity and audit data without mutating state", () => {
  const state = start();
  const before = structuredClone(state);
  const projection = buildDeveloperProjection(lacquerBoxCase, state);

  assert.equal(projection.caseId, lacquerBoxCase.id);
  assert.equal(projection.rulesetVersion, "2.0.0-alpha.1");
  assert.equal(projection.truth, null);
  assert.deepEqual(state, before);
});

test("developer projection is a deep copy and reveals truth only after settlement", () => {
  const active = start("hidden-treasure");
  const activeProjection = buildDeveloperProjection(lacquerBoxCase, active);
  activeProjection.npcState.pressure = 0;
  activeProjection.npcPosterior[0].probability = 0;

  assert.notEqual(active.npcState.pressure, 0);
  assert.notEqual(active.npcPosterior[0].probability, 0);
  assert.equal(activeProjection.truth, null);

  const settled = resolveTurn(lacquerBoxCase, start("hidden-treasure"), {
    kind: "reject",
  });
  const settledProjection = buildDeveloperProjection(lacquerBoxCase, settled);

  assert.equal(settledProjection.truth?.id, "hidden-treasure");
  assert.notEqual(settledProjection.lastTrace, null);
  assert.notEqual(settledProjection.lastTrace, settled.actionHistory.at(-1));
});
