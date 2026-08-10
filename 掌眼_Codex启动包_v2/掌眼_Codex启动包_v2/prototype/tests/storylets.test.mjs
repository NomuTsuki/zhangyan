import assert from "node:assert/strict";
import test from "node:test";

import { lacquerBoxCase } from "../content/lacquer-box.ts";
import { createInitialWorldState } from "../game/resolve-action.ts";
import { resolveDialogueStorylet } from "../game/storylets.ts";

test("partial admission is one-shot and statement signals remain one source", () => {
  const state = createInitialWorldState(lacquerBoxCase);
  const stateBefore = structuredClone(state);
  const topic = lacquerBoxCase.dialogueTopics.find(
    (item) => item.id === "repair-history",
  );
  assert.ok(topic);

  const first = resolveDialogueStorylet(
    lacquerBoxCase,
    state,
    topic,
    "partial-admit",
  );
  const repeatedState = {
    ...state,
    triggeredStoryletIds: [first.storyletId],
  };
  const second = resolveDialogueStorylet(
    lacquerBoxCase,
    repeatedState,
    topic,
    "partial-admit",
  );

  assert.equal(first.newlyTriggered, true);
  assert.equal(second.newlyTriggered, false);
  assert.deepEqual(first.evidenceAdded, ["repair-admission"]);
  assert.deepEqual(second.evidenceAdded, []);
  assert.equal(first.statement.signalId, second.statement.signalId);
  assert.equal(first.statement.sourceKind, "memory");
  assert.equal(first.statement.confidence, 0.72);
  assert.deepEqual(state.triggeredStoryletIds, []);
  assert.deepEqual(state.discoveredEvidenceIds, []);
  assert.equal(state.currentPrice, stateBefore.currentPrice);
  assert.deepEqual(state.npcPosterior, stateBefore.npcPosterior);
  assert.deepEqual(state.npcState, stateBefore.npcState);
});

test("recovered partial admission does not report evidence that already exists", () => {
  const initial = createInitialWorldState(lacquerBoxCase);
  const topic = lacquerBoxCase.dialogueTopics.find(
    (item) => item.id === "repair-history",
  );
  assert.ok(topic);
  const recoveredState = {
    ...initial,
    discoveredEvidenceIds: ["repair-admission"],
    triggeredStoryletIds: [],
  };
  const baseline = resolveDialogueStorylet(
    lacquerBoxCase,
    initial,
    topic,
    "partial-admit",
  );

  const resolution = resolveDialogueStorylet(
    lacquerBoxCase,
    recoveredState,
    topic,
    "partial-admit",
  );

  assert.equal(resolution.newlyTriggered, true);
  assert.deepEqual(resolution.evidenceAdded, []);
  assert.equal(resolution.statement.signalId, baseline.statement.signalId);
});
