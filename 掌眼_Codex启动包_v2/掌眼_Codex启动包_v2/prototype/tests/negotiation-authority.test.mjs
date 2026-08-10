import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { lacquerBoxCase } from "../content/lacquer-box.ts";
import { createInitialWorldState, resolveTurn } from "../game/resolve-action.ts";
import { getNpcPricing } from "../game/negotiation.ts";
import { TRUTH_VARIANT_IDS } from "../game/types.ts";

function npcPricingInput(state) {
  return {
    npcProfile: {
      outsideOption: lacquerBoxCase.npcProfile.outsideOption,
      riskAversion: lacquerBoxCase.npcProfile.riskAversion,
      urgency: lacquerBoxCase.npcProfile.urgency,
      markup: lacquerBoxCase.npcProfile.markup,
    },
    npcState: {
      pressure: state.npcState.pressure,
      trust: state.npcState.trust,
      dealIntent: state.npcState.dealIntent,
      control: state.npcState.control,
    },
    npcPosterior: state.npcPosterior,
    currentPrice: state.currentPrice,
  };
}

test("negotiation public module cannot name full world, case, or truth types", async () => {
  const source = await readFile(
    new URL("../game/negotiation.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(
    source,
    /\b(?:CaseDefinition|WorldState|NPCState|TruthVariantId|truthVariantId|truthVariants|trueValue)\b/,
  );
});

test("same NPC information gives identical pricing across hidden truths", () => {
  const states = TRUTH_VARIANT_IDS.map((truthVariantId) =>
    createInitialWorldState(lacquerBoxCase, 20260723, truthVariantId),
  );

  assert.deepEqual(
    states.map((state) => getNpcPricing(npcPricingInput(state))),
    states.map(() => getNpcPricing(npcPricingInput(states[0]))),
  );
});

test("a formal offer consumes negotiation capacity but not investigation AP", () => {
  const before = createInitialWorldState(lacquerBoxCase);
  const after = resolveTurn(lacquerBoxCase, before, {
    kind: "discount",
    offer: 50,
  });

  assert.equal(after.actionPoints, before.actionPoints);
  assert.equal(
    after.negotiation.remainingCapacity,
    after.negotiation.initialCapacity - 1,
  );
});
