import assert from "node:assert/strict";
import test from "node:test";

import { lacquerBoxCase } from "../content/lacquer-box.ts";
import {
  PARTIAL_RESTORATION_ADMISSION,
  resolveAction,
} from "../game/resolve-action.ts";

const seed = 20260722;

function makeInput(overrides = {}) {
  return {
    initialState: lacquerBoxCase.initialNpcState,
    action: {
      target: "repair-history",
      type: "point-out-contradiction",
      tone: "professional",
      evidenceIds: [lacquerBoxCase.evidence.id],
    },
    evidence: [{
      id: lacquerBoxCase.evidence.id,
      strength: lacquerBoxCase.evidence.ruleStrength,
      contradicts: lacquerBoxCase.evidence.contradicts,
    }],
    seed,
    ...overrides,
  };
}

test("professional contradiction action is deterministic and reaches the agreed prototype state", () => {
  const first = resolveAction(makeInput());
  const second = resolveAction(makeInput());

  assert.deepEqual(first, second);
  assert.deepEqual(first.nextState, {
    pressure: 54,
    trust: 61,
    dealIntent: 66,
    control: 42,
    phase: "cautious",
  });
  assert.deepEqual(first.changes.map((change) => change.delta), [28, 3, -6, -26]);
  assert.deepEqual(first.triggeredStoryletIds, [PARTIAL_RESTORATION_ADMISSION]);
  assert.equal(first.seed, seed);
  assert.notStrictEqual(first.initialState, lacquerBoxCase.initialNpcState);
  assert.deepEqual(lacquerBoxCase.initialNpcState, {
    pressure: 26,
    trust: 58,
    dealIntent: 72,
    control: 68,
    phase: "relaxed",
  });
});

test("state values clamp to the 0-100 range", () => {
  const result = resolveAction(makeInput({
    initialState: {
      pressure: 95,
      trust: 99,
      dealIntent: 3,
      control: 10,
      phase: "pressured",
    },
  }));

  assert.deepEqual(result.nextState, {
    pressure: 100,
    trust: 100,
    dealIntent: 0,
    control: 0,
    phase: "pressured",
  });
  assert.deepEqual(result.changes.map((change) => change.delta), [5, 1, -3, -10]);
});

test("invalid rule input fails explicitly", () => {
  assert.throws(
    () => resolveAction(makeInput({ evidence: [] })),
    /行动缺少可用证据/,
  );
  assert.throws(
    () => resolveAction(makeInput({ seed: 20.5 })),
    /seed 必须是整数/,
  );
});
