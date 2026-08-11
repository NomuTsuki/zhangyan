import { clamp, round1 } from "./numeric.ts";
import type {
  AbilityBreakdown,
  AppraisalConfidence,
  CaseDefinition,
  OutcomeGrade,
  PlayerAppraisal,
  PlayerValuation,
  TruthVariantId,
  WorldState,
} from "./types.ts";

const GRADE_ORDER: OutcomeGrade[] = ["D", "C", "B", "A", "S", "SS", "SSS"];
const CONFIDENCE_PROBABILITY: Record<AppraisalConfidence, number> = {
  reserved: 0.55,
  confident: 0.75,
  certain: 0.9,
};

export function scoreToGrade(score: number): OutcomeGrade {
  if (score >= 95) return "SSS";
  if (score >= 88) return "SS";
  if (score >= 80) return "S";
  if (score >= 70) return "A";
  if (score >= 55) return "B";
  if (score >= 40) return "C";
  return "D";
}

function lowerGrade(left: OutcomeGrade, right: OutcomeGrade) {
  return GRADE_ORDER[Math.min(GRADE_ORDER.indexOf(left), GRADE_ORDER.indexOf(right))];
}

export function calculateEvidenceStructure(
  caseDefinition: CaseDefinition,
  state: WorldState,
  hypothesisId: TruthVariantId,
) {
  const supporting = [...new Set(state.discoveredEvidenceIds)]
    .map((id) => caseDefinition.evidence[id])
    .filter((item) => {
      if (!item || item.kind === "statement") return false;
      const selected = item.likelihoods[hypothesisId] ?? 0;
      return selected === Math.max(...Object.values(item.likelihoods));
    });
  const sourceGroups = new Set(
    supporting.flatMap((item) => item.kind === "statement" ? [] : [item.sourceGroup]),
  );
  const dimensions = new Set(
    supporting.flatMap((item) => item.kind === "statement" ? [] : item.dimensions),
  );
  const required = caseDefinition.judgmentModel.requiredDimensions[hypothesisId] ?? [];
  const coversRequired = required.every((dimension) => dimensions.has(dimension));
  const decisive = supporting.some(
    (item) => item.kind !== "statement" && item.caseDecisiveFor?.includes(hypothesisId),
  );

  let score = 0;
  let cap: OutcomeGrade = "B";
  if (sourceGroups.size === 1) {
    score = 50;
    cap = "A";
  } else if (sourceGroups.size >= 2) {
    score = coversRequired ? 90 : 75;
    cap = coversRequired ? "SS" : "S";
  }
  if (decisive && sourceGroups.size >= 2 && coversRequired) {
    score = 100;
    cap = "SSS";
  }
  return { score, cap, sourceCount: sourceGroups.size, coversRequired, decisive };
}

export function calculateAppraisalScore(input: {
  hypothesisIds: TruthVariantId[];
  selectedHypothesisId: TruthVariantId;
  truthVariantId: TruthVariantId;
  confidence: AppraisalConfidence;
  evidenceStructureScore: number;
}) {
  if (input.hypothesisIds.length !== 3) {
    throw new Error("V2 appraisal scoring requires exactly three hypotheses");
  }
  if (!input.hypothesisIds.includes(input.selectedHypothesisId)) {
    throw new Error(`Unknown appraisal hypothesis: ${input.selectedHypothesisId}`);
  }
  const selectedProbability = CONFIDENCE_PROBABILITY[input.confidence];
  const remainingProbability = (1 - selectedProbability) / 2;
  const brier = input.hypothesisIds.reduce((sum, hypothesisId) => {
    const probability = hypothesisId === input.selectedHypothesisId
      ? selectedProbability
      : remainingProbability;
    const outcome = hypothesisId === input.truthVariantId ? 1 : 0;
    return sum + (probability - outcome) ** 2;
  }, 0);
  const calibrationScore = round1(clamp(100 * (1 - brier / 2), 0, 100));
  const score = round1(
    calibrationScore * 0.75 + input.evidenceStructureScore * 0.25,
  );
  const overconfidentWrong =
    input.confidence === "certain"
    && input.selectedHypothesisId !== input.truthVariantId;
  return {
    score,
    calibrationScore,
    brier: round1(brier),
    overconfidentWrong,
    cap: overconfidentWrong ? "C" as const : null,
  };
}

export function calculateDecisionScore(input: {
  choice: "buy" | "reject";
  acquisitionPrice: number;
  feesPaid: number;
  valuation: PlayerValuation;
}) {
  const visibleExpectedNet = round1(
    input.valuation.expectedValue - input.acquisitionPrice - input.feesPaid,
  );
  const buyUtility = visibleExpectedNet;
  const rejectUtility = 0;
  const chosenUtility = input.choice === "buy" ? buyUtility : rejectUtility;
  const bestUtility = Math.max(buyUtility, rejectUtility);
  const regret = round1(Math.max(0, bestUtility - chosenUtility));
  const scale = Math.max(10, input.valuation.q90 - input.valuation.q10);
  const score = round1(100 * (1 - Math.min(1, regret / scale)));
  return { score, regret, scale, visibleExpectedNet };
}

export function visibleAcceptanceProbability(input: {
  offer: number;
  currentAsk: number;
  publicTraits: string[];
  hadPublicCounter: boolean;
}) {
  const urgent = input.publicTraits.some((trait) => trait.includes("急"));
  const guarded = input.publicTraits.some(
    (trait) => trait.includes("谨慎") || trait.includes("戒备") || trait.includes("坚持"),
  );
  const anchorMultiplier = input.hadPublicCounter
    ? 0.9
    : 0.7 - (urgent ? 0.1 : 0) + (guarded ? 0.1 : 0);
  const anchor = input.currentAsk * anchorMultiplier;
  const temperature = Math.max(5, input.currentAsk * 0.1);
  return 1 / (1 + Math.exp(-(input.offer - anchor) / temperature));
}

export function calculateNegotiationScore(input: {
  valuation: PlayerValuation;
  feesPaid: number;
  publicTraits: string[];
  offers: Array<{
    offer: number;
    currentAsk: number;
    hadPublicCounter: boolean;
  }>;
}) {
  if (input.offers.length === 0) {
    return { assessed: false as const, score: null, turns: [] };
  }
  const turns = input.offers.map((turn) => {
    const ceiling = input.valuation.expectedValue - input.feesPaid;
    const candidates = Array.from(
      { length: Math.max(0, turn.currentAsk - 1) },
      (_, index) => index + 1,
    );
    const utilityFor = (offer: number) => {
      const acceptance = visibleAcceptanceProbability({ ...turn, offer, publicTraits: input.publicTraits });
      return acceptance * Math.max(0, ceiling - offer);
    };
    const chosenUtility = utilityFor(turn.offer);
    const bestUtility = candidates.reduce(
      (best, offer) => Math.max(best, utilityFor(offer)),
      0,
    );
    const regret = Math.max(0, bestUtility - chosenUtility);
    const score = bestUtility <= 0
      ? 0
      : round1(100 * (1 - Math.min(1, regret / bestUtility)));
    return {
      ...turn,
      score,
      chosenUtility: round1(chosenUtility),
      bestUtility: round1(bestUtility),
      regret: round1(regret),
    };
  });
  return {
    assessed: true as const,
    score: round1(turns.reduce((sum, turn) => sum + turn.score, 0) / turns.length),
    turns,
  };
}

export function calculateAbilityBreakdown(input: {
  caseDefinition: CaseDefinition;
  state: WorldState;
  appraisal: PlayerAppraisal;
  truthVariantId: TruthVariantId;
  valuation: PlayerValuation;
  choice: "buy" | "reject";
  acquisitionPrice: number;
  terminalOffer?: { offer: number; currentAsk: number };
}): AbilityBreakdown {
  const evidence = calculateEvidenceStructure(
    input.caseDefinition,
    input.state,
    input.appraisal.hypothesisId,
  );
  const appraisal = calculateAppraisalScore({
    hypothesisIds: input.caseDefinition.judgmentModel.hypothesisOrder,
    selectedHypothesisId: input.appraisal.hypothesisId,
    truthVariantId: input.truthVariantId,
    confidence: input.appraisal.confidence,
    evidenceStructureScore: evidence.score,
  });
  const decision = calculateDecisionScore({
    choice: input.choice,
    acquisitionPrice: input.acquisitionPrice,
    feesPaid: input.state.feesPaid,
    valuation: input.valuation,
  });
  const discountTurns = input.state.actionHistory.filter(
    (turn) => turn.action.kind === "discount",
  );
  const visibleOffers = discountTurns.map((turn, index) => ({
    offer: (turn.action as { offer: number }).offer,
    currentAsk: turn.before.currentPrice,
    hadPublicCounter: index > 0 || turn.before.currentPrice !== input.caseDefinition.seller.openingPrice,
  }));
  if (input.terminalOffer) {
    visibleOffers.push({
      ...input.terminalOffer,
      hadPublicCounter: visibleOffers.length > 0
        || input.terminalOffer.currentAsk !== input.caseDefinition.seller.openingPrice,
    });
  }
  const negotiation = calculateNegotiationScore({
    valuation: input.valuation,
    feesPaid: input.state.feesPaid,
    publicTraits: input.caseDefinition.npcProfile.publicTraits,
    offers: visibleOffers,
  });
  const rawScore = round1(
    negotiation.assessed
      ? appraisal.score * 0.45 + decision.score * 0.3 + negotiation.score * 0.25
      : appraisal.score * 0.6 + decision.score * 0.4,
  );
  const capReasons: string[] = [];
  let cap: OutcomeGrade | null = evidence.cap;
  if (evidence.sourceCount === 0) capReasons.push("没有支持结论的独立器物证据，最高为 B");
  else if (evidence.sourceCount === 1) capReasons.push("只有一个独立证据来源，最高为 A");
  else if (!evidence.coversRequired) capReasons.push("关键判断维度尚未覆盖，最高为 S");
  if (appraisal.overconfidentWrong) {
    cap = cap ? lowerGrade(cap, "C") : "C";
    capReasons.push("90% 自信但结论错误，最高为 C");
  }
  if (decision.regret >= decision.scale) {
    cap = cap ? lowerGrade(cap, "B") : "B";
    capReasons.push("主观决策后悔达到当时价值跨度，最高为 B");
  }
  let finalGrade = scoreToGrade(rawScore);
  if (cap) finalGrade = lowerGrade(finalGrade, cap);
  const sssEligible =
    evidence.decisive
    && appraisal.score >= 95
    && decision.score >= 95
    && (!negotiation.assessed || negotiation.score >= 90);
  if (finalGrade === "SSS" && !sssEligible) {
    finalGrade = "SS";
    capReasons.push("SSS 的交叉证据与分项门槛尚未同时满足");
    cap = cap ? lowerGrade(cap, "SS") : "SS";
  }
  return {
    appraisalScore: appraisal.score,
    decisionScore: decision.score,
    negotiationScore: negotiation.assessed ? negotiation.score : null,
    rawScore,
    finalGrade,
    cap,
    capReasons,
    appraisalCalibrationScore: appraisal.calibrationScore,
    evidenceStructureScore: evidence.score,
    visibleDecisionRegret: decision.regret,
  };
}
