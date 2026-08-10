import assert from "node:assert/strict";
import test from "node:test";

import { lacquerBoxCase } from "../content/lacquer-box.ts";
import { reduceTurn } from "../game/reducer.ts";
import { createRulesContext } from "../game/ruleset.ts";
import {
  createInitialWorldState,
  resolveTurn,
} from "../game/resolve-action.ts";

const IDENTITY_MISMATCHES = [
  ["caseId", "other-case"],
  ["caseVersion", "9.9.9"],
  ["rulesetId", "other-ruleset"],
  ["rulesetVersion", "9.9.9"],
];

test("resolveTurn rejects every persisted identity mismatch without mutating input", async (t) => {
  for (const [field, mismatchedValue] of IDENTITY_MISMATCHES) {
    await t.test(field, () => {
      const input = {
        ...createInitialWorldState(lacquerBoxCase),
        [field]: mismatchedValue,
      };
      const before = structuredClone(input);

      assert.throws(
        () => resolveTurn(lacquerBoxCase, input, {
          kind: "inspect",
          targetId: "joint",
        }),
        new RegExp(field, "i"),
      );
      assert.deepEqual(input, before);
    });
  }
});

test("reduceTurn rejects every persisted identity mismatch without mutating input", async (t) => {
  const context = createRulesContext(lacquerBoxCase);
  for (const [field, mismatchedValue] of IDENTITY_MISMATCHES) {
    await t.test(field, () => {
      const input = {
        ...createInitialWorldState(lacquerBoxCase),
        [field]: mismatchedValue,
      };
      const before = structuredClone(input);

      assert.throws(
        () => reduceTurn(context, input, {
          kind: "inspect",
          targetId: "joint",
        }),
        new RegExp(field, "i"),
      );
      assert.deepEqual(input, before);
    });
  }
});

test("reduceTurn does not mutate inputs and derives audit outputs from its new turn", () => {
  const context = createRulesContext(lacquerBoxCase);
  const input = createInitialWorldState(lacquerBoxCase);
  const before = structuredClone(input);

  const result = reduceTurn(context, input, { kind: "inspect", targetId: "joint" });
  const record = result.state.actionHistory.at(-1);

  assert.deepEqual(input, before);
  assert.equal(result.state.turn, 1);
  assert.deepEqual(result.trace.formulaLog, record.formulaLog);
  assert.deepEqual(result.events, [
    { kind: "evidence-discovered", evidenceId: record.evidenceAdded[0] },
  ]);
});

test("reduceTurn leaves input unchanged when an illegal action throws", () => {
  const context = createRulesContext(lacquerBoxCase);
  const input = createInitialWorldState(lacquerBoxCase);
  const before = structuredClone(input);

  assert.throws(
    () => reduceTurn(context, input, {
      kind: "dialogue",
      topicId: "repair-history",
      tone: "firm",
      evidenceId: "modern-adhesive-trace",
    }),
    /尚未发现/,
  );
  assert.deepEqual(input, before);
});

test("events map every auditable field from the newly appended turn exactly once", () => {
  const context = createRulesContext(lacquerBoxCase);
  let state = createInitialWorldState(lacquerBoxCase);

  state = reduceTurn(context, state, { kind: "inspect", targetId: "joint" }).state;
  const dialogue = reduceTurn(context, state, {
    kind: "dialogue",
    topicId: "repair-history",
    tone: "professional",
    evidenceId: "modern-adhesive-trace",
  });
  const record = dialogue.state.actionHistory.at(-1);

  const expected = [
    ...record.evidenceAdded.map((evidenceId) => ({ kind: "evidence-discovered", evidenceId })),
    ...(record.sharedEvidenceAdded ?? []).map((evidenceId) => ({ kind: "evidence-shared", evidenceId })),
    ...(record.priceChange ? [{ kind: "price-changed", priceChange: record.priceChange }] : []),
    ...(dialogue.state.settlement ? [{ kind: "case-settled", settlement: dialogue.state.settlement }] : []),
  ];
  assert.deepEqual(dialogue.events, expected);
});

test("trace is output-only and cannot mutate the state carried into the next turn", () => {
  const context = createRulesContext(lacquerBoxCase);
  let state = createInitialWorldState(lacquerBoxCase);
  state = reduceTurn(context, state, { kind: "inspect", targetId: "joint" }).state;
  const result = reduceTurn(context, state, {
    kind: "dialogue",
    topicId: "repair-history",
    tone: "professional",
    evidenceId: "modern-adhesive-trace",
  });
  const before = structuredClone(result.state);

  result.trace.spindle.expansion.push("test-only trace annotation");

  assert.deepEqual(result.state, before);
  assert.equal(reduceTurn(context, result.state, { kind: "reject" }).state.turn, 3);
});

test("event payloads cannot mutate state or receive later state mutations", () => {
  const context = createRulesContext(lacquerBoxCase);
  let state = createInitialWorldState(lacquerBoxCase);
  state = reduceTurn(context, state, { kind: "inspect", targetId: "joint" }).state;
  const repriced = reduceTurn(context, state, {
    kind: "dialogue",
    topicId: "repair-history",
    tone: "professional",
    evidenceId: "modern-adhesive-trace",
  });
  const priceEvent = repriced.events.find((event) => event.kind === "price-changed");
  const repricedBefore = structuredClone(repriced.state);

  priceEvent.priceChange.reasons.push("event-only reason");

  assert.deepEqual(repriced.state, repricedBefore);
  const eventReasons = [...priceEvent.priceChange.reasons];
  repriced.state.priceHistory.at(-1).reasons.push("state-only reason");
  assert.deepEqual(priceEvent.priceChange.reasons, eventReasons);

  const settled = reduceTurn(
    context,
    createInitialWorldState(lacquerBoxCase),
    { kind: "reject" },
  );
  const settlementEvent = settled.events.find((event) => event.kind === "case-settled");
  const settledBefore = structuredClone(settled.state);

  settlementEvent.settlement.objectiveFormula.push("event-only formula");
  settlementEvent.settlement.judgmentBreakdown.supportingSignalIds.push("event-only signal");

  assert.deepEqual(settled.state, settledBefore);
  const eventFormula = [...settlementEvent.settlement.gradeFormula];
  settled.state.settlement.gradeFormula.push("state-only formula");
  assert.deepEqual(settlementEvent.settlement.gradeFormula, eventFormula);
});
