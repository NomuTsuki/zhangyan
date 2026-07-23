import assert from "node:assert/strict";
import test from "node:test";

import { lacquerBoxCase } from "../content/lacquer-box.ts";
import {
  calculatePosterior,
  createInitialWorldState,
  getTestConsent,
  replayActions,
  resolveTurn,
} from "../game/resolve-action.ts";

const seed = 20260723;

function start(variant = "restored-genuine", selectedSeed = seed) {
  return createInitialWorldState(lacquerBoxCase, selectedSeed, variant);
}

function play(state, actions) {
  return actions.reduce(
    (current, action) => resolveTurn(lacquerBoxCase, current, action),
    state,
  );
}

test("truth is fixed by the case input while seed only changes allowed variation", () => {
  const first = start("restored-genuine", 1);
  const second = start("restored-genuine", 999);

  assert.equal(first.truthVariantId, "restored-genuine");
  assert.equal(second.truthVariantId, "restored-genuine");
  assert.notEqual(first.seed, second.seed);
  assert.equal(first.actionPoints, lacquerBoxCase.actionBudget);
  assert.deepEqual(first.npcState, lacquerBoxCase.initialNpcState);
});

test("inspection and dialogue share one budget and accumulate evidence and NPC state", () => {
  const initial = start();
  const afterInspect = resolveTurn(lacquerBoxCase, initial, {
    kind: "inspect",
    targetId: "joint",
  });
  const afterDialogue = resolveTurn(lacquerBoxCase, afterInspect, {
    kind: "dialogue",
    topicId: "repair-history",
    tone: "professional",
    evidenceId: "modern-adhesive-trace",
  });
  const final = resolveTurn(lacquerBoxCase, afterDialogue, {
    kind: "inspect",
    targetId: "interior",
  });

  assert.equal(initial.actionPoints, 6);
  assert.equal(afterInspect.actionPoints, 5);
  assert.equal(afterDialogue.actionPoints, 4);
  assert.equal(final.actionPoints, 3);
  assert.ok(final.discoveredEvidenceIds.includes("modern-adhesive-trace"));
  assert.ok(final.discoveredEvidenceIds.includes("repair-admission"));
  assert.ok(final.discoveredEvidenceIds.includes("restored-interior"));
  assert.notDeepEqual(afterDialogue.npcState, initial.npcState);
  assert.deepEqual(
    afterDialogue.actionHistory[0].after,
    afterDialogue.actionHistory[1].before,
  );
  assert.deepEqual(
    final.actionHistory[1].after,
    final.actionHistory[2].before,
  );
  assert.deepEqual(initial, start(), "pure resolution must not mutate the initial state");
});

test("open inquiry is legal and repeated gentle inquiry evolves response and state", () => {
  const action = {
    kind: "dialogue",
    topicId: "repair-history",
    tone: "gentle",
  };
  const final = play(start(), [action, action, action]);

  assert.equal(final.actionPoints, 3);
  assert.deepEqual(
    final.actionHistory.map((turn) => turn.spindle?.selectedId),
    ["cooperate", "deflect", "refuse"],
  );
  assert.equal(new Set(final.statementHistory.map((item) => item.text)).size, 3);
  assert.deepEqual(
    final.actionHistory.map((turn) => turn.changes[0].after),
    [27, 29, 32],
  );
  assert.equal(final.actionHistory[1].redundant, true);
  assert.equal(final.actionHistory[2].redundant, true);
});

test("evidence-backed challenge can trigger one admission but cannot farm it twice", () => {
  const inspected = resolveTurn(lacquerBoxCase, start(), {
    kind: "inspect",
    targetId: "joint",
  });
  const action = {
    kind: "dialogue",
    topicId: "repair-history",
    tone: "professional",
    evidenceId: "modern-adhesive-trace",
  };
  const first = resolveTurn(lacquerBoxCase, inspected, action);
  const second = resolveTurn(lacquerBoxCase, first, action);

  assert.equal(first.actionHistory.at(-1).spindle.selectedId, "partial-admit");
  assert.ok(first.discoveredEvidenceIds.includes("repair-admission"));
  assert.deepEqual(first.triggeredStoryletIds, ["repair-history:partial-admit"]);
  assert.notEqual(second.actionHistory.at(-1).spindle.selectedId, "partial-admit");
  assert.equal(
    second.discoveredEvidenceIds.filter((id) => id === "repair-admission").length,
    1,
  );
  assert.deepEqual(second.triggeredStoryletIds, ["repair-history:partial-admit"]);
});

test("a statement card and its structured signal are counted only once", () => {
  const inspected = resolveTurn(lacquerBoxCase, start(), {
    kind: "inspect",
    targetId: "joint",
  });
  const admitted = resolveTurn(lacquerBoxCase, inspected, {
    kind: "dialogue",
    topicId: "repair-history",
    tone: "professional",
    evidenceId: "modern-adhesive-trace",
  });
  const withDisplayCard = calculatePosterior(
    lacquerBoxCase,
    admitted.discoveredEvidenceIds,
    admitted.statementHistory,
  );
  const withoutDisplayCard = calculatePosterior(
    lacquerBoxCase,
    admitted.discoveredEvidenceIds.filter((id) => id !== "repair-admission"),
    admitted.statementHistory,
  );

  assert.ok(admitted.discoveredEvidenceIds.includes("repair-admission"));
  assert.deepEqual(withDisplayCard, withoutDisplayCard);
});

test("re-inspecting a target costs AP but does not duplicate evidence", () => {
  const first = resolveTurn(lacquerBoxCase, start(), {
    kind: "inspect",
    targetId: "bottom",
  });
  const second = resolveTurn(lacquerBoxCase, first, {
    kind: "inspect",
    targetId: "bottom",
  });

  assert.equal(second.actionPoints, 4);
  assert.equal(second.discoveredEvidenceIds.length, first.discoveredEvidenceIds.length);
  assert.equal(second.actionHistory.at(-1).redundant, true);
  assert.match(second.actionHistory.at(-1).description, /不会重复生成证据/);
});

test("seeded lucky evidence is reproducible and never auto-settles the case", () => {
  const action = { kind: "inspect", targetId: "joint" };
  const luckyA = resolveTurn(lacquerBoxCase, start("restored-genuine", 1), action);
  const luckyB = resolveTurn(lacquerBoxCase, start("restored-genuine", 1), action);
  const ordinary = resolveTurn(lacquerBoxCase, start("restored-genuine", 5), action);

  assert.deepEqual(luckyA, luckyB);
  assert.ok(luckyA.discoveredEvidenceIds.includes("restored-bonus"));
  assert.ok(!ordinary.discoveredEvidenceIds.includes("restored-bonus"));
  assert.equal(luckyA.status, "active");
  assert.equal(luckyA.settlement, undefined);
  assert.equal(luckyA.truthVariantId, ordinary.truthVariantId);
});

test("paid specialist testing costs 2 AP and 10 value points and remains non-terminal", () => {
  const initial = start("counterfeit");
  const consent = getTestConsent(lacquerBoxCase, initial);
  const tested = resolveTurn(lacquerBoxCase, initial, {
    kind: "test",
    testId: "adhesive-test",
  });

  assert.equal(consent.allowed, true);
  assert.equal(tested.actionPoints, 4);
  assert.equal(tested.feesPaid, 10);
  assert.equal(tested.status, "active");
  assert.ok(tested.discoveredEvidenceIds.includes("test-modern-adhesive"));
  assert.equal(tested.actionHistory[0].spindle.selectedId, "approve-test");
  assert.match(tested.actionHistory[0].formulaLog.join(" "), /累计检测费 = 0 \+ 10 = 10/);
  assert.throws(
    () => resolveTurn(lacquerBoxCase, tested, { kind: "test", testId: "adhesive-test" }),
    /本维度已经检测/,
  );
});

test("an invalid or unaffordable action fails atomically", () => {
  const lowAp = play(start(), [
    { kind: "inspect", targetId: "surface" },
    { kind: "inspect", targetId: "bottom" },
    { kind: "inspect", targetId: "joint" },
    { kind: "inspect", targetId: "latch" },
    { kind: "inspect", targetId: "interior" },
  ]);
  const before = structuredClone(lowAp);

  assert.equal(lowAp.actionPoints, 1);
  assert.throws(
    () => resolveTurn(lacquerBoxCase, lowAp, { kind: "test", testId: "adhesive-test" }),
    /行动点不足/,
  );
  assert.deepEqual(lowAp, before);
  assert.throws(
    () => resolveTurn(lacquerBoxCase, lowAp, {
      kind: "dialogue",
      topicId: "repair-history",
      tone: "professional",
      evidenceId: "unknown-evidence",
    }),
    /未知证据/,
  );
  assert.deepEqual(lowAp, before);
});

test("zero AP blocks investigation but buy and reject always remain legal", () => {
  const depleted = play(start(), [
    { kind: "inspect", targetId: "surface" },
    { kind: "inspect", targetId: "bottom" },
    { kind: "inspect", targetId: "joint" },
    { kind: "inspect", targetId: "latch" },
    { kind: "inspect", targetId: "interior" },
    { kind: "inspect", targetId: "surface" },
  ]);

  assert.equal(depleted.actionPoints, 0);
  assert.equal(depleted.status, "active");
  assert.throws(
    () => resolveTurn(lacquerBoxCase, depleted, {
      kind: "dialogue",
      topicId: "price",
      tone: "professional",
    }),
    /行动点不足/,
  );
  const rejected = resolveTurn(lacquerBoxCase, depleted, { kind: "reject" });
  const bought = resolveTurn(lacquerBoxCase, depleted, { kind: "buy" });
  assert.equal(rejected.status, "settled");
  assert.equal(bought.status, "settled");
  assert.equal(rejected.actionPoints, 0);
  assert.equal(bought.actionPoints, 0);
});

test("discount is a costed negotiation action and accepted result uses final price", () => {
  const final = replayActions(
    lacquerBoxCase,
    [
      { kind: "inspect", targetId: "joint" },
      {
        kind: "dialogue",
        topicId: "repair-history",
        tone: "professional",
        evidenceId: "modern-adhesive-trace",
      },
      { kind: "discount", offer: 60 },
    ],
    seed,
    "restored-genuine",
  );

  assert.equal(final.status, "settled");
  assert.equal(final.actionPoints, 3);
  assert.equal(final.settlement.choice, "discount-buy");
  assert.equal(final.settlement.paidPrice, 60);
  assert.equal(final.settlement.actualNet, 5);
  assert.equal(final.settlement.objectiveScore, 100);
  assert.equal(final.settlement.objectiveSuccess, true);
  assert.equal(final.settlement.oracleBestNet, 5);
  assert.match(
    final.settlement.objectiveFormula.join(" "),
    /界面可用的60点折价并成交/,
  );
  assert.ok(final.actionHistory.at(-1).spindle.candidates.length >= 3);
});

test("NPC knowledge and reservation are independent from hidden object truth", () => {
  const variants = ["counterfeit", "restored-genuine", "hidden-treasure"];
  const dialogueStates = variants.map((variant) =>
    resolveTurn(lacquerBoxCase, start(variant), {
      kind: "dialogue",
      topicId: "provenance",
      tone: "gentle",
    }),
  );

  assert.equal(new Set(
    dialogueStates.map((state) => state.statementHistory[0].text),
  ).size, 1);
  assert.equal(new Set(
    dialogueStates.map((state) => state.actionHistory[0].spindle.selectedId),
  ).size, 1);
  assert.equal(new Set(
    dialogueStates.map((state) => JSON.stringify(state.npcState)),
  ).size, 1);

  const discounted = variants.map((variant) =>
    resolveTurn(lacquerBoxCase, start(variant), {
      kind: "discount",
      offer: 60,
    }),
  );
  assert.ok(discounted.every(
    (state) => state.settlement.choice === "discount-buy",
  ));
  assert.equal(new Set(
    discounted.map((state) => state.actionHistory[0].spindle.selectedId),
  ).size, 1);
  assert.equal(new Set(
    discounted.map((state) => state.settlement.actualNet),
  ).size, 3);
});

test("NPC statements update judgment but never read the hidden truth", () => {
  const informedResults = ["counterfeit", "restored-genuine", "hidden-treasure"].map(
    (variant) => {
      const asked = resolveTurn(lacquerBoxCase, start(variant), {
        kind: "dialogue",
        topicId: "provenance",
        tone: "gentle",
      });
      return resolveTurn(lacquerBoxCase, asked, { kind: "buy" }).settlement;
    },
  );
  const blind = resolveTurn(
    lacquerBoxCase,
    start("restored-genuine"),
    { kind: "buy" },
  ).settlement;

  assert.ok(informedResults[0].judgmentScore > blind.judgmentScore);
  assert.equal(new Set(
    informedResults.map((result) => result.judgmentScore),
  ).size, 1);
  assert.equal(new Set(
    informedResults.map((result) => JSON.stringify(result.posterior)),
  ).size, 1);
  assert.equal(new Set(
    informedResults.map((result) => result.objectiveScore),
  ).size, 3);
});

test("objective outcome and judgment quality distinguish luck from skill", () => {
  const fakeBuy = resolveTurn(
    lacquerBoxCase,
    start("counterfeit"),
    { kind: "buy" },
  ).settlement;
  const treasureBuy = resolveTurn(
    lacquerBoxCase,
    start("hidden-treasure"),
    { kind: "buy" },
  ).settlement;
  const treasureReject = resolveTurn(
    lacquerBoxCase,
    start("hidden-treasure"),
    { kind: "reject" },
  ).settlement;

  assert.equal(fakeBuy.actualNet, -60);
  assert.equal(fakeBuy.endingTitle, "看走眼");
  assert.equal(treasureBuy.actualNet, 50);
  assert.equal(treasureBuy.endingTitle, "侥幸得手");
  assert.equal(treasureReject.actualNet, 0);
  assert.equal(treasureReject.endingTitle, "判断合理，但客观失手");
  assert.equal(fakeBuy.judgmentScore, treasureBuy.judgmentScore);
  assert.notEqual(fakeBuy.objectiveScore, treasureBuy.objectiveScore);
});

test("same truth and transaction preserve objective result while evidence changes judgment", () => {
  const blind = resolveTurn(
    lacquerBoxCase,
    start("hidden-treasure", 5),
    { kind: "buy" },
  ).settlement;
  const informedState = resolveTurn(
    lacquerBoxCase,
    start("hidden-treasure", 5),
    { kind: "inspect", targetId: "interior" },
  );
  const informed = resolveTurn(
    lacquerBoxCase,
    informedState,
    { kind: "buy" },
  ).settlement;

  assert.equal(blind.actualNet, informed.actualNet);
  assert.equal(blind.objectiveScore, informed.objectiveScore);
  assert.ok(informed.judgmentScore > blind.judgmentScore);
});

test("NPC spindle exposes candidates, formulas, selected behavior, and can reach exit", () => {
  const fragile = {
    ...start(),
    npcState: {
      pressure: 80,
      trust: 25,
      dealIntent: 18,
      control: 60,
      phase: "pressured",
    },
  };
  const result = resolveTurn(lacquerBoxCase, fragile, {
    kind: "dialogue",
    topicId: "price",
    tone: "firm",
  });
  const turn = result.actionHistory[0];
  const selected = turn.spindle.candidates.find(
    (candidate) => candidate.id === turn.spindle.selectedId,
  );

  assert.equal(result.status, "settled");
  assert.equal(result.settlement.choice, "seller-exited");
  assert.equal(turn.spindle.selectedId, "exit");
  assert.ok(turn.spindle.candidates.length >= 5);
  assert.equal(selected.score, Math.max(
    ...turn.spindle.candidates
      .filter((candidate) => candidate.eligible)
      .map((candidate) => candidate.score),
  ));
  assert.ok(turn.changes.every((change) => change.formula.length > 0));
  assert.match(turn.formulaLog.join(" "), /seed扰动范围/);
  for (const candidate of turn.spindle.candidates) {
    const componentSum = Math.round(
      candidate.components.reduce((sum, component) => sum + component.value, 0)
      * 10,
    ) / 10;
    assert.equal(candidate.baseScore, componentSum);
    if (candidate.eligible) {
      assert.equal(
        candidate.finalScore,
        Math.round((candidate.baseScore + candidate.jitter) * 10) / 10,
      );
      assert.equal(candidate.score, candidate.finalScore);
    }
  }
});

test("numeric thresholds cannot create an active exited deadlock", () => {
  const pressured = play(start(), [
    { kind: "inspect", targetId: "bottom" },
    {
      kind: "dialogue",
      topicId: "provenance",
      tone: "firm",
      evidenceId: "restored-bottom",
    },
    {
      kind: "dialogue",
      topicId: "provenance",
      tone: "firm",
      evidenceId: "restored-bottom",
    },
    {
      kind: "dialogue",
      topicId: "provenance",
      tone: "firm",
      evidenceId: "restored-bottom",
    },
    {
      kind: "dialogue",
      topicId: "provenance",
      tone: "firm",
      evidenceId: "restored-bottom",
    },
  ]);

  assert.equal(pressured.status, "active");
  assert.equal(pressured.npcState.phase, "pressured");
  assert.equal(pressured.actionPoints, 1);
  assert.equal(
    pressured.triggeredStoryletIds.filter(
      (id) => id === "provenance:partial-admit",
    ).length,
    1,
  );
  assert.equal(
    pressured.actionHistory.filter(
      (turn) => turn.spindle?.selectedId === "partial-admit",
    ).length,
    1,
  );
  assert.equal(
    resolveTurn(lacquerBoxCase, pressured, { kind: "reject" }).status,
    "settled",
  );
  assert.equal(
    resolveTurn(lacquerBoxCase, pressured, { kind: "buy" }).status,
    "settled",
  );
});

test("complete replay is deterministic and trace snapshots are internally consistent", () => {
  const actions = [
    { kind: "inspect", targetId: "surface" },
    { kind: "dialogue", topicId: "provenance", tone: "gentle" },
    { kind: "inspect", targetId: "bottom" },
    { kind: "dialogue", topicId: "price", tone: "professional" },
    { kind: "reject" },
  ];
  const first = replayActions(
    lacquerBoxCase,
    actions,
    42,
    "restored-genuine",
  );
  const second = replayActions(
    lacquerBoxCase,
    actions,
    42,
    "restored-genuine",
  );

  assert.deepEqual(first, second);
  for (let index = 0; index < first.actionHistory.length - 1; index += 1) {
    assert.deepEqual(
      first.actionHistory[index].after,
      first.actionHistory[index + 1].before,
    );
  }
  for (const turn of first.actionHistory) {
    assert.equal(
      turn.after.actionPoints,
      turn.before.actionPoints - turn.actionPointCost,
    );
  }
  assert.ok(first.settlement.objectiveFormula.length >= 4);
  assert.ok(first.settlement.judgmentFormula.length >= 4);
});
