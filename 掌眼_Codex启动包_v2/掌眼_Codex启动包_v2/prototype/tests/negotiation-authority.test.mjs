import assert from "node:assert/strict";
import test from "node:test";

import { lacquerBoxCase } from "../content/lacquer-box.ts";
import { createInitialWorldState, resolveTurn } from "../game/resolve-action.ts";
import { getNpcPricing } from "../game/negotiation.ts";
import { TRUTH_VARIANT_IDS } from "../game/types.ts";

test("same NPC information gives identical pricing across hidden truths", () => {
  const states = TRUTH_VARIANT_IDS.map((truthVariantId) =>
    createInitialWorldState(lacquerBoxCase, 20260723, truthVariantId),
  );

  assert.deepEqual(
    states.map((state) => getNpcPricing(lacquerBoxCase, state)),
    states.map(() => getNpcPricing(lacquerBoxCase, states[0])),
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
