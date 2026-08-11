import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAppraisalScore,
  calculateDecisionScore,
  calculateNegotiationScore,
  visibleAcceptanceProbability,
} from "../game/ability-scoring.ts";

const hypotheses = ["low", "mid", "high"];
const valuation = {
  expectedValue: 71.7,
  q10: 20,
  q90: 130,
  normalizedEntropy: 1,
  uncertaintyLabel: "高",
};

function appraisal(selectedHypothesisId, truthVariantId, confidence, evidenceStructureScore) {
  return calculateAppraisalScore({
    hypothesisIds: hypotheses,
    selectedHypothesisId,
    truthVariantId,
    confidence,
    evidenceStructureScore,
  });
}

test("hand score 01: correct 55% appraisal without evidence", () => {
  const result = appraisal("low", "low", "reserved", 0);
  assert.equal(result.brier, 0.3);
  assert.equal(result.calibrationScore, 84.8);
  assert.equal(result.score, 63.6);
});

test("hand score 02: correct 75% appraisal with one-source structure", () => {
  const result = appraisal("mid", "mid", "confident", 50);
  assert.equal(result.brier, 0.1);
  assert.equal(result.calibrationScore, 95.3);
  assert.equal(result.score, 84);
});

test("hand score 03: correct 90% appraisal with decisive structure", () => {
  const result = appraisal("high", "high", "certain", 100);
  assert.equal(result.brier, 0);
  assert.equal(result.calibrationScore, 99.3);
  assert.equal(result.score, 99.5);
});

test("hand score 04: wrong 55% appraisal remains partially calibrated", () => {
  const result = appraisal("low", "mid", "reserved", 100);
  assert.equal(result.brier, 1);
  assert.equal(result.calibrationScore, 52.3);
  assert.equal(result.score, 64.2);
  assert.equal(result.cap, null);
});

test("hand score 05: wrong 90% appraisal triggers the C cap", () => {
  const result = appraisal("low", "mid", "certain", 100);
  assert.equal(result.brier, 1.7);
  assert.equal(result.calibrationScore, 14.3);
  assert.equal(result.score, 35.7);
  assert.equal(result.cap, "C");
});

test("hand score 06: buying when visible expected utility is positive has no regret", () => {
  const result = calculateDecisionScore({
    choice: "buy",
    acquisitionPrice: 60,
    feesPaid: 5,
    valuation,
  });
  assert.deepEqual(result, {
    score: 100,
    regret: 0,
    scale: 110,
    visibleExpectedNet: 6.7,
  });
});

test("hand score 07: rejecting a visibly profitable deal pays proportional regret", () => {
  const result = calculateDecisionScore({
    choice: "reject",
    acquisitionPrice: 60,
    feesPaid: 5,
    valuation,
  });
  assert.equal(result.regret, 6.7);
  assert.equal(result.score, 93.9);
});

test("hand score 08: rejecting a visibly unprofitable deal has no regret", () => {
  const result = calculateDecisionScore({
    choice: "reject",
    acquisitionPrice: 100,
    feesPaid: 5,
    valuation,
  });
  assert.equal(result.visibleExpectedNet, -33.3);
  assert.equal(result.score, 100);
});

test("hand score 09: buying a visibly unprofitable deal loses decision points", () => {
  const result = calculateDecisionScore({
    choice: "buy",
    acquisitionPrice: 100,
    feesPaid: 5,
    valuation,
  });
  assert.equal(result.regret, 33.3);
  assert.equal(result.score, 69.7);
});

test("hand score 10: narrow ranges use the minimum ten-point regret scale", () => {
  const result = calculateDecisionScore({
    choice: "buy",
    acquisitionPrice: 60,
    feesPaid: 0,
    valuation: { ...valuation, expectedValue: 50, q10: 48, q90: 52 },
  });
  assert.equal(result.scale, 10);
  assert.equal(result.regret, 10);
  assert.equal(result.score, 0);
});

test("hand score 11: no formal offer makes negotiation unassessed", () => {
  const result = calculateNegotiationScore({
    valuation,
    feesPaid: 0,
    publicTraits: ["急于出手"],
    offers: [],
  });
  assert.deepEqual(result, { assessed: false, score: null, turns: [] });
});

test("hand score 12: visible acceptance uses the public opening-price anchor", () => {
  const probability = visibleAcceptanceProbability({
    offer: 60,
    currentAsk: 80,
    publicTraits: ["急于出手"],
    hadPublicCounter: false,
  });
  const expected = 1 / (1 + Math.exp(-(60 - 48) / 8));
  assert.ok(Math.abs(probability - expected) < 1e-12);
});

test("hand score 13: a public counteroffer replaces the opening-price anchor", () => {
  const probability = visibleAcceptanceProbability({
    offer: 72,
    currentAsk: 80,
    publicTraits: ["急于出手"],
    hadPublicCounter: true,
  });
  assert.equal(probability, 0.5);
});

test("hand score 14: test fees lower both decision utility and bargaining ceiling", () => {
  const withoutFee = calculateDecisionScore({
    choice: "buy",
    acquisitionPrice: 70,
    feesPaid: 0,
    valuation,
  });
  const withFee = calculateDecisionScore({
    choice: "buy",
    acquisitionPrice: 70,
    feesPaid: 8,
    valuation,
  });
  assert.equal(withoutFee.visibleExpectedNet, 1.7);
  assert.equal(withFee.visibleExpectedNet, -6.3);
  assert.ok(withFee.score < withoutFee.score);
});
