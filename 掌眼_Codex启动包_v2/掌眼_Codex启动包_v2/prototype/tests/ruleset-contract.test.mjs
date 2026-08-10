import assert from "node:assert/strict";
import test from "node:test";
import { lacquerBoxCase } from "../content/lacquer-box.ts";
import { createInitialWorldState } from "../game/resolve-action.ts";
import { createRulesContext } from "../game/ruleset.ts";

test("initial state binds the case and ruleset identities", () => {
  const state = createInitialWorldState(lacquerBoxCase);
  assert.deepEqual(
    {
      rulesetId: state.rulesetId,
      rulesetVersion: state.rulesetVersion,
      caseVersion: state.caseVersion,
    },
    {
      rulesetId: "zhangyan-core",
      rulesetVersion: "2.0.0-alpha.1",
      caseVersion: "1.0.0",
    },
  );
});

test("rules context binds the default identity and configuration to its case", () => {
  const context = createRulesContext(lacquerBoxCase);

  assert.deepEqual(context, {
    identity: {
      rulesetId: "zhangyan-core",
      rulesetVersion: "2.0.0-alpha.1",
      caseSchemaVersion: 1,
    },
    rules: {
      normalizationTolerance: 1e-10,
      minimumLikelihood: 0.0001,
      behaviorJitterSpan: 3,
      priceTick: 5,
    },
    caseDefinition: lacquerBoxCase,
  });
});
