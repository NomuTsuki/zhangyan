import assert from "node:assert/strict";
import test from "node:test";

import { lacquerBoxCase } from "../content/lacquer-box.ts";
import { evaluateDisclosure } from "../game/disclosure.ts";
import {
  createInitialWorldState,
  resolveTurn,
} from "../game/resolve-action.ts";

function inspectJoint() {
  return resolveTurn(
    lacquerBoxCase,
    createInitialWorldState(lacquerBoxCase),
    { kind: "inspect", targetId: "joint" },
  );
}

test("framing changes social effects but never evidence likelihoods", () => {
  const state = inspectJoint();
  const action = {
    kind: "dialogue",
    topicId: "repair-history",
    evidenceId: "modern-adhesive-trace",
  };
  const gentle = evaluateDisclosure(lacquerBoxCase, state, {
    ...action,
    tone: "gentle",
  });
  const firm = evaluateDisclosure(lacquerBoxCase, state, {
    ...action,
    tone: "firm",
  });

  assert.deepEqual(gentle.payload?.likelihoods, firm.payload?.likelihoods);
  assert.notDeepEqual(gentle.framing, firm.framing);
  assert.deepEqual(gentle.selection, {
    evidenceId: "modern-adhesive-trace",
    newlyShared: true,
  });
  assert.equal(gentle.relevant, true);
  assert.equal(gentle.repeatCount, 0);
  assert.equal(gentle.power, 1.3);
  assert.equal(gentle.relevanceFactor, 1);
});

test("disclosure evaluates only held evidence and leaves private state untouched", () => {
  const state = inspectJoint();
  const before = structuredClone(state);

  assert.throws(
    () => evaluateDisclosure(lacquerBoxCase, state, {
      kind: "dialogue",
      topicId: "repair-history",
      tone: "professional",
      evidenceId: "restored-interior",
    }),
    /不能引用尚未发现的证据/,
  );
  assert.deepEqual(state, before);
});
