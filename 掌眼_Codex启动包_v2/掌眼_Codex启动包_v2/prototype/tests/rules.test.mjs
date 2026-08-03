import assert from "node:assert/strict";
import test from "node:test";

import { lacquerBoxCase } from "../content/lacquer-box.ts";
import { calculateOutcomeGrades } from "../game/outcome-grades.ts";
import {
  calculateNpcPosterior,
  calculatePosterior,
  createInitialWorldState,
  getNpcPricing,
  getTestConsent,
  replayActions,
  resolveTurn,
} from "../game/resolve-action.ts";

const seed = 20260723;

function start(variant = "restored-genuine", selectedSeed = seed) {
  return createInitialWorldState(lacquerBoxCase, selectedSeed, variant);
}

function settleWithCase(
  caseDefinition,
  variant,
  evidenceIds,
  action,
) {
  const initial = createInitialWorldState(caseDefinition, 5, variant);
  const visibleState = {
    ...initial,
    discoveredEvidenceIds: [...evidenceIds],
  };
  return resolveTurn(caseDefinition, visibleState, action).settlement;
}

function settleWithEvidence(variant, evidenceIds, action) {
  return settleWithCase(
    lacquerBoxCase,
    variant,
    evidenceIds,
    action,
  );
}

function play(state, actions) {
  return actions.reduce(
    (current, action) => resolveTurn(lacquerBoxCase, current, action),
    state,
  );
}

function assertPosteriorNormalized(posterior, message) {
  assert.equal(posterior.length, 3, `${message}: expected all truth variants`);
  for (const entry of posterior) {
    assert.ok(
      Number.isFinite(entry.probability) && entry.probability >= 0,
      `${message}: ${entry.variantId} must have a finite non-negative probability`,
    );
  }
  const total = posterior.reduce((sum, entry) => sum + entry.probability, 0);
  assert.ok(
    Math.abs(total - 1) < 1e-10,
    `${message}: probabilities must sum to one, received ${total}`,
  );
}

test("settlement uses capped judgment grades and preserves objective fields", () => {
  const visible = ["restored-bottom"];
  const results = ["counterfeit", "restored-genuine", "hidden-treasure"].map(
    (variant) => settleWithEvidence(variant, visible, { kind: "reject" }),
  );

  assert.deepEqual(
    results.map((result) => result.judgmentGrade),
    ["A", "A", "A"],
  );
  assert.equal(new Set(results.map((result) =>
    JSON.stringify(result.judgmentBreakdown))).size, 1);
  assert.equal(new Set(results.map((result) => result.trueValue)).size, 3);
});

test("settlement consumes the capped final judgment grade", () => {
  const cappedCase = {
    ...lacquerBoxCase,
    evidence: {
      ...lacquerBoxCase.evidence,
      "cap-signal": {
        ...lacquerBoxCase.evidence["counterfeit-bonus"],
        id: "cap-signal",
        name: "高确定性非决定性强证据",
        strength: "strong",
        caseDecisiveFor: undefined,
      },
    },
  };
  const result = settleWithCase(
    cappedCase,
    "counterfeit",
    ["cap-signal"],
    { kind: "reject" },
  );

  assert.equal(result.judgmentBreakdown.baseGrade, "SS");
  assert.equal(result.judgmentBreakdown.evidenceCap, "S");
  assert.equal(result.judgmentBreakdown.finalGrade, "S");
  assert.equal(
    result.judgmentGrade,
    result.judgmentBreakdown.finalGrade,
  );
  assert.notEqual(
    result.judgmentGrade,
    result.judgmentBreakdown.baseGrade,
  );
});

test("raw SSS cannot bypass the final evidence cap in overall grading", () => {
  const result = calculateOutcomeGrades({
    qualityGrade: "S",
    qualityCap: "SSS",
    acquired: true,
    trueValue: 100,
    actualNet: 40,
    paidPrice: 60,
    entryAsk: 80,
    entryFloor: 60,
    judgmentScore: 99,
    judgmentGrade: "S",
  });
  assert.equal(result.judgmentGrade, "S");
  assert.equal(result.rawOverallIndex, 4);
  assert.equal(result.overallGrade, "S");
});

test("truth is fixed by the case input while seed only changes allowed variation", () => {
  const first = start("restored-genuine", 1);
  const second = start("restored-genuine", 999);

  assert.equal(first.truthVariantId, "restored-genuine");
  assert.equal(second.truthVariantId, "restored-genuine");
  assert.notEqual(first.seed, second.seed);
  assert.equal(first.actionPoints, lacquerBoxCase.actionBudget);
  assert.deepEqual(first.npcState, lacquerBoxCase.initialNpcState);
});

test("private inspection updates the player evidence only and leaves NPC belief and price unchanged", () => {
  const initial = start();
  const playerPrior = calculatePosterior(lacquerBoxCase, []);
  const inspected = resolveTurn(lacquerBoxCase, initial, {
    kind: "inspect",
    targetId: "joint",
  });
  const playerPosterior = calculatePosterior(
    lacquerBoxCase,
    inspected.discoveredEvidenceIds,
    inspected.statementHistory,
  );

  assert.ok(inspected.discoveredEvidenceIds.includes("modern-adhesive-trace"));
  assert.deepEqual(inspected.sharedEvidenceIds, []);
  assert.notDeepEqual(playerPosterior, playerPrior);
  assert.deepEqual(inspected.npcPosterior, initial.npcPosterior);
  assert.equal(inspected.currentPrice, initial.currentPrice);
  assert.deepEqual(inspected.priceHistory, []);
  assert.deepEqual(inspected.actionHistory[0].sharedEvidenceAdded ?? [], []);
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
  assert.deepEqual(afterInspect.sharedEvidenceIds, []);
  assert.ok(afterDialogue.sharedEvidenceIds.includes("modern-adhesive-trace"));
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

test("first evidence-backed challenge shares and reprices while reuse never double-counts the source", () => {
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
  const firstTurn = first.actionHistory.at(-1);
  const second = resolveTurn(lacquerBoxCase, first, action);
  const secondTurn = second.actionHistory.at(-1);

  assert.deepEqual(first.sharedEvidenceIds, ["modern-adhesive-trace"]);
  assert.deepEqual(firstTurn.sharedEvidenceAdded, ["modern-adhesive-trace"]);
  assert.notDeepEqual(first.npcPosterior, inspected.npcPosterior);
  assert.ok(firstTurn.priceChange, "material shared evidence should trigger repricing");
  assert.notEqual(first.currentPrice, inspected.currentPrice);
  assert.equal(first.priceHistory.length, 1);

  assert.deepEqual(second.sharedEvidenceIds, first.sharedEvidenceIds);
  assert.deepEqual(secondTurn.sharedEvidenceAdded, []);
  assert.deepEqual(second.npcPosterior, first.npcPosterior);
  assert.equal(second.currentPrice, first.currentPrice);
  assert.deepEqual(second.priceHistory, first.priceHistory);
  assert.equal(secondTurn.priceChange, undefined);
  assert.match(secondTurn.formulaLog.join(" "), /此前已经公开.*不重复计权/);
});

test("specific evidence selection is the disclosure choice and adds no framing state", () => {
  const inspected = resolveTurn(lacquerBoxCase, start(), {
    kind: "inspect",
    targetId: "interior",
  });
  const baseAction = {
    kind: "dialogue",
    topicId: "repair-history",
    tone: "professional",
    evidenceId: "restored-interior",
  };
  const challenged = resolveTurn(lacquerBoxCase, inspected, baseAction);

  assert.deepEqual(challenged.sharedEvidenceIds, ["restored-interior"]);
  assert.ok(!("disclosureFrame" in challenged.actionHistory.at(-1).action));
  assert.doesNotMatch(
    challenged.actionHistory.at(-1).formulaLog.join(" "),
    /完整陈述|只强调|框架惩罚/,
  );
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
  assert.deepEqual(tested.sharedEvidenceIds, ["test-modern-adhesive"]);
  assert.deepEqual(
    tested.actionHistory[0].sharedEvidenceAdded,
    ["test-modern-adhesive"],
  );
  assert.notDeepEqual(tested.npcPosterior, initial.npcPosterior);
  assert.equal(tested.priceHistory.length, 1);
  assert.deepEqual(tested.actionHistory[0].priceChange, tested.priceHistory[0]);
  assert.equal(tested.actionHistory[0].spindle.selectedId, "approve-test");
  assert.match(tested.actionHistory[0].formulaLog.join(" "), /累计检测费 = 0 \+ 10 = 10/);
  assert.match(tested.actionHistory[0].formulaLog.join(" "), /共同检测/);
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

test("zero investigation AP blocks investigation while bargaining and terminal choices remain legal", () => {
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
  const pricing = getNpcPricing(lacquerBoxCase, depleted);
  const negotiated = resolveTurn(lacquerBoxCase, depleted, {
    kind: "discount",
    offer: pricing.acceptLine - 4,
  });
  const buyout = resolveTurn(lacquerBoxCase, depleted, {
    kind: "buyout",
    offer: pricing.buyoutLine,
  });
  const rejected = resolveTurn(lacquerBoxCase, depleted, { kind: "reject" });
  const bought = resolveTurn(lacquerBoxCase, depleted, { kind: "buy" });
  assert.equal(negotiated.actionPoints, 0);
  assert.equal(negotiated.negotiation.remainingCapacity, 4);
  assert.equal(buyout.actionPoints, 0);
  assert.equal(rejected.status, "settled");
  assert.equal(bought.status, "settled");
  assert.equal(rejected.actionPoints, 0);
  assert.equal(bought.actionPoints, 0);
});

test("player-chosen discount uses the current NPC posterior acceptance line", () => {
  const initial = start();
  const initialPricing = getNpcPricing(lacquerBoxCase, initial);
  const inspected = resolveTurn(lacquerBoxCase, initial, {
    kind: "inspect",
    targetId: "joint",
  });
  const challenged = resolveTurn(lacquerBoxCase, inspected, {
    kind: "dialogue",
    topicId: "repair-history",
    tone: "professional",
    evidenceId: "modern-adhesive-trace",
  });
  const currentPricing = getNpcPricing(lacquerBoxCase, challenged);
  const offer = currentPricing.acceptLine;
  const final = resolveTurn(lacquerBoxCase, challenged, {
    kind: "discount",
    offer,
  });

  assert.notEqual(
    currentPricing.acceptLine,
    initialPricing.acceptLine,
    "shared evidence should be able to move the dynamic acceptance line",
  );
  assert.ok(offer > 0 && offer < challenged.currentPrice);
  assert.equal(final.status, "settled");
  assert.equal(final.actionPoints, challenged.actionPoints);
  assert.equal(final.negotiation.initialCapacity, 5);
  assert.equal(final.negotiation.remainingCapacity, 4);
  assert.equal(final.actionHistory.at(-1).actionPointCost, 0);
  assert.equal(final.actionHistory.at(-1).negotiationCapacityCost, 1);
  assert.equal(final.settlement.choice, "discount-buy");
  assert.equal(final.settlement.paidPrice, offer);
  assert.equal(
    final.settlement.actualNet,
    lacquerBoxCase.truthVariants["restored-genuine"].trueValue - offer,
  );
  assert.equal(final.settlement.qualityGrade, "A");
  assert.ok(["C", "B", "A", "S", "SS", "SSS"].includes(
    final.settlement.netGrade,
  ));
  assert.ok(!("objectiveScore" in final.settlement));
  assert.equal(
    final.settlement.oracleBestNet,
    lacquerBoxCase.truthVariants["restored-genuine"].trueValue
      - currentPricing.buyoutLine,
  );
  assert.equal(
    final.settlement.regret,
    offer - currentPricing.buyoutLine,
  );
  assert.match(
    final.settlement.objectiveFormula.join(" "),
    new RegExp(`按${currentPricing.buyoutLine}点最低可达买断线成交`),
  );
  assert.ok(final.settlement.gradeFormula.length >= 5);
  assert.ok(final.actionHistory.at(-1).spindle.candidates.length >= 3);
  assert.match(
    final.actionHistory.at(-1).formulaLog.join(" "),
    new RegExp(`普通接受线.*= ${currentPricing.acceptLine}`),
  );
});

test("buyout at the dynamic line succeeds and a lower final offer is rejected, both use one bargaining capacity", () => {
  const initial = start();
  const pricing = getNpcPricing(lacquerBoxCase, initial);
  const accepted = resolveTurn(lacquerBoxCase, initial, {
    kind: "buyout",
    offer: pricing.buyoutLine,
  });
  const rejected = resolveTurn(lacquerBoxCase, initial, {
    kind: "buyout",
    offer: pricing.buyoutLine - 1,
  });

  assert.ok(pricing.buyoutLine < initial.currentPrice);
  assert.ok(pricing.buyoutLine <= pricing.acceptLine);
  assert.equal(accepted.status, "settled");
  assert.equal(rejected.status, "settled");
  assert.equal(accepted.actionPoints, initial.actionPoints);
  assert.equal(rejected.actionPoints, initial.actionPoints);
  assert.equal(accepted.actionHistory[0].actionPointCost, 0);
  assert.equal(rejected.actionHistory[0].actionPointCost, 0);
  assert.equal(accepted.actionHistory[0].negotiationCapacityCost, 1);
  assert.equal(rejected.actionHistory[0].negotiationCapacityCost, 1);
  assert.equal(accepted.negotiation.remainingCapacity, 4);
  assert.equal(rejected.negotiation.remainingCapacity, 4);
  assert.equal(accepted.settlement.choice, "buyout-buy");
  assert.equal(accepted.settlement.paidPrice, pricing.buyoutLine);
  assert.equal(rejected.settlement.choice, "buyout-rejected");
  assert.equal(rejected.settlement.paidPrice, 0);
  assert.equal(accepted.actionHistory[0].spindle.selectedId, "accept-buyout");
  assert.equal(rejected.actionHistory[0].spindle.selectedId, "reject-buyout");
  assert.match(accepted.actionHistory[0].formulaLog.join(" "), /买断判定/);
  assert.match(rejected.actionHistory[0].description, /不再继续议价/);
});

test("NPC initial belief and dynamic negotiation are independent from hidden object truth", () => {
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

  const offer = getNpcPricing(lacquerBoxCase, start()).acceptLine;
  const discounted = variants.map((variant) =>
    resolveTurn(lacquerBoxCase, start(variant), {
      kind: "discount",
      offer,
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

test("same visible shared evidence produces the same NPC posterior, repricing, and response across truths", () => {
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
  const variants = ["counterfeit", "restored-genuine", "hidden-treasure"];
  const results = variants.map((truthVariantId) =>
    resolveTurn(
      lacquerBoxCase,
      { ...structuredClone(inspected), truthVariantId },
      action,
    ),
  );

  assert.equal(
    new Set(results.map((state) => JSON.stringify(state.npcPosterior))).size,
    1,
  );
  assert.equal(new Set(results.map((state) => state.currentPrice)).size, 1);
  assert.equal(
    new Set(results.map((state) => JSON.stringify(state.priceHistory))).size,
    1,
  );
  assert.equal(
    new Set(results.map(
      (state) => state.actionHistory.at(-1).spindle.selectedId,
    )).size,
    1,
  );
  assert.equal(
    new Set(results.map((state) => state.statementHistory.at(-1).text)).size,
    1,
  );
});

test("player and NPC posteriors stay normalized and duplicate source ids are idempotent", () => {
  const inspected = resolveTurn(lacquerBoxCase, start(), {
    kind: "inspect",
    targetId: "joint",
  });
  const challenged = resolveTurn(lacquerBoxCase, inspected, {
    kind: "dialogue",
    topicId: "repair-history",
    tone: "professional",
    evidenceId: "modern-adhesive-trace",
  });
  const playerPosterior = calculatePosterior(
    lacquerBoxCase,
    challenged.discoveredEvidenceIds,
    challenged.statementHistory,
  );
  const npcSingle = calculateNpcPosterior(
    lacquerBoxCase,
    ["modern-adhesive-trace"],
  );
  const npcDuplicate = calculateNpcPosterior(
    lacquerBoxCase,
    ["modern-adhesive-trace", "modern-adhesive-trace"],
  );

  assertPosteriorNormalized(playerPosterior, "player posterior");
  assertPosteriorNormalized(challenged.npcPosterior, "NPC posterior");
  assert.deepEqual(challenged.npcPosterior, npcSingle);
  assert.deepEqual(npcDuplicate, npcSingle);
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
    informedResults.map((result) => result.qualityGrade),
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
  assert.equal(treasureBuy.endingTitle, "险中得手");
  assert.equal(treasureReject.actualNet, 0);
  assert.equal(treasureReject.judgmentGrade, "B");
  assert.equal(treasureReject.endingTitle, "线索尚未收束");
  assert.equal(fakeBuy.judgmentScore, treasureBuy.judgmentScore);
  assert.notEqual(fakeBuy.qualityGrade, treasureBuy.qualityGrade);
  assert.notEqual(fakeBuy.netGrade, treasureBuy.netGrade);
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
  assert.equal(blind.qualityGrade, informed.qualityGrade);
  assert.equal(blind.netGrade, informed.netGrade);
  assert.equal(blind.bargainingGrade, informed.bargainingGrade);
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
  assert.ok(first.settlement.gradeFormula.length >= 5);
});
