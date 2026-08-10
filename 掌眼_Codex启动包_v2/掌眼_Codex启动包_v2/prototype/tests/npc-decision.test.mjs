import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDialogueCandidates,
  chooseBehavior,
  createBehaviorCandidate,
  createFixedCandidate,
  dialogueTitle,
  NPC_BEHAVIOR_LABELS,
} from "../game/npc-decision.ts";

function candidate(id, eligible, score) {
  return {
    id,
    label: id,
    eligible,
    components: [],
    baseScore: score,
    jitter: 0,
    finalScore: eligible ? score : -999,
    score: eligible ? score : -999,
    formula: String(score),
    filterReasons: [],
    reasons: [],
  };
}

test("ineligible candidates never win", () => {
  assert.equal(chooseBehavior([
    candidate("blocked", false, 999),
    candidate("legal", true, 1),
  ]).id, "legal");
});

test("equal scores converge by declaration order", () => {
  assert.equal(chooseBehavior([
    candidate("first", true, 10),
    candidate("second", true, 10),
  ]).id, "first");
});

test("candidate factories preserve the scored components and filter trace", () => {
  const seeded = createBehaviorCandidate(
    { seed: 42, turn: 0 },
    "cooperate",
    true,
    [
      { label: "fixed", value: 1.04 },
      { label: "state", value: 2.06 },
    ],
    ["eligible because the gate passed"],
  );
  const blocked = createFixedCandidate(
    "blocked",
    "Blocked",
    false,
    [{ label: "fixed", value: 100 }],
    ["hard condition failed"],
  );

  assert.deepEqual(seeded.components, [
    { label: "fixed", value: 1 },
    { label: "state", value: 2.1 },
  ]);
  assert.equal(seeded.baseScore, 3.1);
  assert.equal(seeded.score, seeded.finalScore);
  assert.notEqual(seeded.jitter, 0);
  assert.deepEqual(seeded.filterReasons, ["eligible because the gate passed"]);
  assert.equal(blocked.score, -999);
  assert.match(blocked.formula, /硬条件过滤/);
  assert.deepEqual(blocked.reasons, ["hard condition failed"]);
});

test("dialogue expansion keeps labels and emits an ineligible trace without affecting selection", () => {
  const candidates = buildDialogueCandidates(
    { seed: 1, turn: 0 },
    { pressure: 20, trust: 90, dealIntent: 90, control: 20, phase: "relaxed" },
    { kind: "dialogue", topicId: "provenance", tone: "gentle" },
    {
      payload: null,
      selection: { evidenceId: null, newlyShared: false },
      framing: {
        pressureDelta: 0,
        trustDelta: 0,
        dealIntentDelta: 0,
        controlDelta: 0,
        formulas: [],
      },
      relevant: false,
      repeatCount: 0,
      power: 0,
      relevanceFactor: 0,
    },
    false,
  );

  assert.equal(candidates.length, 6);
  assert.equal(candidates.find((item) => item.id === "partial-admit").eligible, false);
  assert.equal(candidates.find((item) => item.id === "exit").score, -999);
  assert.equal(chooseBehavior(candidates).id, "cooperate");
  assert.equal(NPC_BEHAVIOR_LABELS.cooperate, "补充说明");
  assert.equal(dialogueTitle("cooperate"), "对方补充了可以继续核验的说法");
});
