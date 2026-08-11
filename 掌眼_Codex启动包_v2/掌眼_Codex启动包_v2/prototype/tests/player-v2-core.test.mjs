import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAppraisalScore,
  calculateDecisionScore,
  calculateNegotiationScore,
  scoreToGrade,
} from "../game/ability-scoring.ts";
import { calculatePlayerValuation } from "../game/player-valuation.ts";
import {
  PLAYER_CASE_CATALOG,
  createSeededSession,
} from "../content/case-catalog.ts";
import {
  calculatePosterior,
  createInitialWorldState,
  replayActions,
  resolveTurn,
} from "../game/resolve-action.ts";
import { settleWorldState } from "../game/settlement.ts";

const initialPosterior = [
  { variantId: "low", label: "低", probability: 1 / 3, trueValue: 20 },
  { variantId: "mid", label: "中", probability: 1 / 3, trueValue: 65 },
  { variantId: "high", label: "高", probability: 1 / 3, trueValue: 130 },
];

test("player valuation presents expectation, Q10-Q90 range, and uncertainty", () => {
  const valuation = calculatePlayerValuation(initialPosterior);
  assert.equal(valuation.expectedValue, 71.7);
  assert.equal(valuation.q10, 20);
  assert.equal(valuation.q90, 130);
  assert.equal(valuation.uncertaintyLabel, "高");
  assert.ok(valuation.q10 <= valuation.expectedValue);
  assert.ok(valuation.expectedValue <= valuation.q90);
});

test("appraisal calibration distinguishes cautious and overconfident mistakes", () => {
  const cautiousWrong = calculateAppraisalScore({
    hypothesisIds: ["low", "mid", "high"],
    selectedHypothesisId: "low",
    truthVariantId: "mid",
    confidence: "reserved",
    evidenceStructureScore: 100,
  });
  const certainWrong = calculateAppraisalScore({
    hypothesisIds: ["low", "mid", "high"],
    selectedHypothesisId: "low",
    truthVariantId: "mid",
    confidence: "certain",
    evidenceStructureScore: 100,
  });
  assert.ok(cautiousWrong.calibrationScore > certainWrong.calibrationScore);
  assert.equal(certainWrong.overconfidentWrong, true);
  assert.equal(certainWrong.cap, "C");
});

test("decision score uses visible expected regret rather than hidden truth", () => {
  const valuation = calculatePlayerValuation(initialPosterior);
  const buy = calculateDecisionScore({
    choice: "buy",
    acquisitionPrice: 60,
    feesPaid: 5,
    valuation,
  });
  const reject = calculateDecisionScore({
    choice: "reject",
    acquisitionPrice: 60,
    feesPaid: 5,
    valuation,
  });
  assert.equal(buy.score, 100);
  assert.ok(reject.score < buy.score);
  assert.equal(buy.visibleExpectedNet, 6.7);
});

test("negotiation utility does not reward the lowest offer automatically", () => {
  const valuation = calculatePlayerValuation(initialPosterior);
  const score = calculateNegotiationScore({
    valuation,
    feesPaid: 0,
    publicTraits: ["急于出手", "经验一般"],
    offers: [
      { offer: 20, currentAsk: 80, hadPublicCounter: false },
      { offer: 55, currentAsk: 80, hadPublicCounter: false },
    ],
  });
  assert.equal(score.assessed, true);
  assert.equal(score.turns.length, 2);
  assert.ok(score.turns[1].score > score.turns[0].score);
});

test("grade thresholds remain stable", () => {
  assert.equal(scoreToGrade(39.9), "D");
  assert.equal(scoreToGrade(40), "C");
  assert.equal(scoreToGrade(55), "B");
  assert.equal(scoreToGrade(70), "A");
  assert.equal(scoreToGrade(80), "S");
  assert.equal(scoreToGrade(88), "SS");
  assert.equal(scoreToGrade(95), "SSS");
});

test("three player cases and truths are deterministic and approximately uniform", () => {
  assert.equal(PLAYER_CASE_CATALOG.length, 3);
  const repeatedA = createSeededSession(PLAYER_CASE_CATALOG, 20260810);
  const repeatedB = createSeededSession(PLAYER_CASE_CATALOG, 20260810);
  assert.deepEqual(
    { caseId: repeatedA.caseDefinition.id, truth: repeatedA.truthVariantId },
    { caseId: repeatedB.caseDefinition.id, truth: repeatedB.truthVariantId },
  );

  const caseCounts = new Map(PLAYER_CASE_CATALOG.map((item) => [item.id, 0]));
  const truthCounts = new Map();
  for (let seed = 1; seed <= 10_000; seed += 1) {
    const session = createSeededSession(PLAYER_CASE_CATALOG, seed);
    caseCounts.set(
      session.caseDefinition.id,
      caseCounts.get(session.caseDefinition.id) + 1,
    );
    const key = `${session.caseDefinition.id}:${session.truthVariantId}`;
    truthCounts.set(key, (truthCounts.get(key) ?? 0) + 1);
  }
  for (const count of caseCounts.values()) {
    assert.ok(count / 10_000 >= 0.313 && count / 10_000 <= 0.353);
  }
  for (const caseDefinition of PLAYER_CASE_CATALOG) {
    const selectedCount = caseCounts.get(caseDefinition.id);
    for (const truthVariantId of caseDefinition.judgmentModel.hypothesisOrder) {
      const conditional = truthCounts.get(`${caseDefinition.id}:${truthVariantId}`) / selectedCount;
      assert.ok(conditional >= 0.313 && conditional <= 0.353);
    }
  }
});

test("player cases require a committed appraisal before a terminal choice", () => {
  const { caseDefinition, truthVariantId, seed } = createSeededSession(
    PLAYER_CASE_CATALOG,
    42,
  );
  const initial = createInitialWorldState(caseDefinition, seed, truthVariantId);
  assert.throws(
    () => resolveTurn(caseDefinition, initial, { kind: "buy" }),
    /必须先提交鉴定判断/,
  );
  const appraised = resolveTurn(caseDefinition, initial, {
    kind: "appraise",
    hypothesisId: caseDefinition.judgmentModel.hypothesisOrder[0],
    confidence: "reserved",
  });
  assert.equal(appraised.appraisal?.confidence, "reserved");
  assert.throws(
    () => resolveTurn(caseDefinition, appraised, {
      kind: "inspect",
      targetId: caseDefinition.observationTargets[0].id,
    }),
    /不能返回调查/,
  );
});

test("rejection keeps paid test fees in objective result", () => {
  const caseDefinition = PLAYER_CASE_CATALOG[1];
  const truthVariantId = caseDefinition.judgmentModel.hypothesisOrder[1];
  const initial = createInitialWorldState(caseDefinition, 9, truthVariantId);
  const stateWithFee = { ...initial, feesPaid: 8 };
  const settled = settleWorldState(
    caseDefinition,
    stateWithFee,
    "reject",
    0,
    50,
  );
  assert.equal(settled.settlement?.actualNet, -8);
  assert.equal(settled.settlement?.objectiveOutcome.actualNet, -8);
  assert.equal(settled.settlement?.objectiveOutcome.acquired, false);
});

test("fixed replays cover every case, truth, and terminal path deterministically", () => {
  const paths = {
    buy: (caseDefinition, hypothesisId) => [
      { kind: "appraise", hypothesisId, confidence: "reserved" },
      { kind: "buy" },
    ],
    reject: (caseDefinition, hypothesisId) => [
      { kind: "appraise", hypothesisId, confidence: "confident" },
      { kind: "reject" },
    ],
    negotiate: (caseDefinition, hypothesisId) => [
      { kind: "appraise", hypothesisId, confidence: "certain" },
      { kind: "discount", offer: Math.max(1, caseDefinition.seller.openingPrice - 10) },
    ],
  };

  let covered = 0;
  for (const caseDefinition of PLAYER_CASE_CATALOG) {
    for (const truthVariantId of caseDefinition.judgmentModel.hypothesisOrder) {
      for (const [pathName, buildActions] of Object.entries(paths)) {
        const actions = buildActions(caseDefinition, truthVariantId);
        const seed = 810_000 + covered;
        const first = replayActions(caseDefinition, actions, seed, truthVariantId);
        const second = replayActions(caseDefinition, actions, seed, truthVariantId);
        assert.deepEqual(second, first, `${caseDefinition.id}/${truthVariantId}/${pathName}`);
        covered += 1;
      }
    }
  }
  assert.equal(covered, 27);
});

test("posterior, valuation, and score invariants hold across all player cases", () => {
  for (const caseDefinition of PLAYER_CASE_CATALOG) {
    const evidenceIds = Object.keys(caseDefinition.evidence);
    for (const count of [0, 1, 2, evidenceIds.length]) {
      const posterior = calculatePosterior(caseDefinition, evidenceIds.slice(0, count));
      const total = posterior.reduce((sum, entry) => sum + entry.probability, 0);
      assert.ok(Math.abs(total - 1) <= 1e-9, `${caseDefinition.id}/${count}/sum`);
      const valuation = calculatePlayerValuation(posterior);
      assert.ok(valuation.q10 <= valuation.expectedValue, `${caseDefinition.id}/${count}/q10`);
      assert.ok(valuation.expectedValue <= valuation.q90, `${caseDefinition.id}/${count}/q90`);

      const decision = calculateDecisionScore({
        choice: "buy",
        acquisitionPrice: caseDefinition.seller.openingPrice,
        feesPaid: 0,
        valuation,
      });
      assert.ok(decision.score >= 0 && decision.score <= 100);
    }
  }
});

test("decision and negotiation scores ignore hidden truth and hidden floor", () => {
  const valuation = calculatePlayerValuation(initialPosterior);
  const visibleDecision = {
    choice: "buy",
    acquisitionPrice: 60,
    feesPaid: 5,
    valuation,
  };
  const decisionA = calculateDecisionScore({
    ...visibleDecision,
    hiddenTruth: "low",
    hiddenFloor: 10,
  });
  const decisionB = calculateDecisionScore({
    ...visibleDecision,
    hiddenTruth: "high",
    hiddenFloor: 90,
  });
  assert.deepEqual(decisionA, decisionB);

  const visibleNegotiation = {
    valuation,
    feesPaid: 5,
    publicTraits: ["急于出手"],
    offers: [{ offer: 55, currentAsk: 80, hadPublicCounter: false }],
  };
  const negotiationA = calculateNegotiationScore({
    ...visibleNegotiation,
    hiddenTruth: "low",
    hiddenFloor: 10,
  });
  const negotiationB = calculateNegotiationScore({
    ...visibleNegotiation,
    hiddenTruth: "high",
    hiddenFloor: 90,
  });
  assert.deepEqual(negotiationA, negotiationB);
});
