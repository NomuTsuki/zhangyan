import assert from "node:assert/strict";
import test from "node:test";

import { lacquerBoxCase } from "../content/lacquer-box.ts";
import {
  createReplayEnvelope,
  replayActions,
  replayEnvelope,
} from "../game/resolve-action.ts";

const actions = [
  { kind: "inspect", targetId: "surface" },
  { kind: "dialogue", topicId: "provenance", tone: "gentle" },
  { kind: "reject" },
];

const validEnvelope = createReplayEnvelope(
  lacquerBoxCase,
  actions,
  42,
  "restored-genuine",
);

test("replay rejects mismatched identity before executing any action", () => {
  const invalidAction = [{ kind: "inspect", targetId: "unknown-target" }];
  const mismatches = [
    ["caseId", "unknown-case"],
    ["caseVersion", "9.9.9"],
    ["rulesetId", "unknown-ruleset"],
    ["rulesetVersion", "9.9.9"],
  ];

  for (const [field, value] of mismatches) {
    assert.throws(
      () => replayEnvelope(lacquerBoxCase, {
        ...validEnvelope,
        [field]: value,
        actions: invalidAction,
      }),
      new RegExp(field, "i"),
    );
  }
});

test("the same envelope replays deeply equal without sharing action or state mutation", () => {
  const first = replayEnvelope(lacquerBoxCase, validEnvelope);
  const second = replayEnvelope(lacquerBoxCase, validEnvelope);

  assert.deepEqual(first, second);
  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.actionHistory[0].action, validEnvelope.actions[0]);
  assert.deepEqual(validEnvelope.actions, actions);
});

test("legacy replayActions wraps the current-version envelope without changing behavior", () => {
  assert.deepEqual(
    replayActions(lacquerBoxCase, actions, 42, "restored-genuine"),
    replayEnvelope(lacquerBoxCase, validEnvelope),
  );
});
