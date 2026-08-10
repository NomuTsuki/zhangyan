import type {
  DialogueTopic,
  EvidenceDefinition,
  EvidenceSourceGroup,
  EvidenceStrength,
  OutcomeGrade,
  PosteriorEntry,
  ReasoningDimension,
  StatementRecord,
  TruthVariantId,
} from "./types";
import { GRADE_ORDER } from "./outcome-grades.ts";

export type JudgmentQualityBreakdown = {
  decisionScore: number;
  certaintyScore: number;
  robustnessScore: number;
  rawScore: number;
  baseGrade: OutcomeGrade;
  evidenceCap: OutcomeGrade;
  finalGrade: OutcomeGrade;
  dominantVariantId: TruthVariantId;
  supportingSignalIds: string[];
  independentSourceGroups: EvidenceSourceGroup[];
  coveredDimensions: ReasoningDimension[];
  missingDimensions: ReasoningDimension[];
  crossValidated: boolean;
  decisiveEvidenceId?: string;
  sssEligible: boolean;
  capApplied: boolean;
  capReason: string;
  playerLabel: string;
  formula: string[];
};

type SupportingSignal = {
  id: string;
  sourceGroup: EvidenceSourceGroup;
  dimensions: ReasoningDimension[];
  strength: EvidenceStrength;
  order: number;
  decisiveFor?: TruthVariantId[];
};

export type JudgmentQualityInput = Readonly<{
  judgmentModel: Readonly<{
    hypothesisOrder: readonly TruthVariantId[];
    requiredDimensions: Readonly<
      Record<TruthVariantId, readonly ReasoningDimension[]>
    >;
  }>;
  evidenceById: Readonly<Record<string, EvidenceDefinition>>;
  statementTopicsById: Readonly<Record<string, DialogueTopic>>;
  posterior: readonly PosteriorEntry[];
  discoveredEvidenceIds: readonly string[];
  statementHistory: readonly StatementRecord[];
  utilityGap: number;
  redundantActionCount: number;
  sellerExited: boolean;
}>;

const strengthRank: Record<EvidenceStrength, number> = {
  weak: 1,
  medium: 2,
  strong: 3,
  anchor: 4,
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function gradeForScore(score: number): OutcomeGrade {
  if (score >= 95) return "SSS";
  if (score >= 88) return "SS";
  if (score >= 80) return "S";
  if (score >= 70) return "A";
  if (score >= 55) return "B";
  if (score >= 40) return "C";
  return "D";
}

function lowerGrade(left: OutcomeGrade, right: OutcomeGrade) {
  return GRADE_ORDER[
    Math.min(GRADE_ORDER.indexOf(left), GRADE_ORDER.indexOf(right))
  ]!;
}

function selectDominantVariant(
  posterior: readonly PosteriorEntry[],
  hypothesisOrder: readonly TruthVariantId[],
) {
  const probabilities = new Map(
    posterior.map((entry) => [entry.variantId, entry.probability]),
  );
  return hypothesisOrder.reduce((best, variantId) =>
    (probabilities.get(variantId) ?? 0) > (probabilities.get(best) ?? 0)
      ? variantId
      : best,
  );
}

function supportsVariant(
  likelihoods: Record<TruthVariantId, number>,
  variantId: TruthVariantId,
) {
  return likelihoods[variantId] > Math.max(
    ...Object.entries(likelihoods)
      .filter(([id]) => id !== variantId)
      .map(([, likelihood]) => likelihood),
  );
}

function selectBestByGroup(
  signals: SupportingSignal[],
  requiredDimensions: readonly ReasoningDimension[],
) {
  const selected = new Map<EvidenceSourceGroup, SupportingSignal>();
  for (const signal of signals) {
    const current = selected.get(signal.sourceGroup);
    const coverage = signal.dimensions.filter((dimension) =>
      requiredDimensions.includes(dimension),
    ).length;
    const currentCoverage = current
      ? current.dimensions.filter((dimension) =>
          requiredDimensions.includes(dimension),
        ).length
      : -1;
    if (
      !current
      || strengthRank[signal.strength] > strengthRank[current.strength]
      || (
        strengthRank[signal.strength] === strengthRank[current.strength]
        && coverage > currentCoverage
      )
    ) {
      selected.set(signal.sourceGroup, signal);
    }
  }
  return [...selected.values()];
}

export function calculateJudgmentQuality(
  input: JudgmentQualityInput,
): JudgmentQualityBreakdown {
  const dominantVariantId = selectDominantVariant(
    input.posterior,
    input.judgmentModel.hypothesisOrder,
  );
  const requiredDimensions =
    input.judgmentModel.requiredDimensions[dominantVariantId];
  const decisionScore = clamp(
    Math.round(
      100
        - input.utilityGap * 3
        - input.redundantActionCount * 4
        - (input.sellerExited ? 15 : 0),
    ),
  );
  const entropy = input.posterior.reduce(
    (sum, entry) =>
      entry.probability > 0
        ? sum - entry.probability * Math.log2(entry.probability)
        : sum,
    0,
  );
  const certaintyScore = Math.round(
    100 * (1 - entropy / Math.log2(input.posterior.length)),
  );
  const signals: SupportingSignal[] = [];
  const seenEvidenceIds = new Set<string>();

  input.discoveredEvidenceIds.forEach((evidenceId, order) => {
    if (seenEvidenceIds.has(evidenceId)) return;
    seenEvidenceIds.add(evidenceId);
    const evidence = input.evidenceById[evidenceId];
    if (
      !evidence
      || evidence.kind === "statement"
      || !supportsVariant(evidence.likelihoods, dominantVariantId)
    ) return;
    signals.push({
      id: evidence.id,
      sourceGroup: evidence.sourceGroup,
      dimensions: evidence.dimensions,
      strength: evidence.strength,
      order,
      decisiveFor: evidence.caseDecisiveFor,
    });
  });

  const seenStatementIds = new Set<string>();
  input.statementHistory.forEach((statement, order) => {
    if (seenStatementIds.has(statement.signalId)) return;
    seenStatementIds.add(statement.signalId);
    const topic = input.statementTopicsById[statement.topicId];
    if (!topic || !supportsVariant(statement.likelihoods, dominantVariantId)) return;
    signals.push({
      id: statement.signalId,
      sourceGroup: topic.signalSourceGroup,
      dimensions: topic.signalDimensions,
      strength: "medium",
      order: input.discoveredEvidenceIds.length + order,
    });
  });

  const selectedSignals = selectBestByGroup(signals, requiredDimensions);
  const independentSourceGroups = selectedSignals.map(
    (signal) => signal.sourceGroup,
  );
  const coveredDimensions = [
    ...new Set(selectedSignals.flatMap((signal) => signal.dimensions)),
  ];
  const missingDimensions = requiredDimensions.filter(
    (dimension) => !coveredDimensions.includes(dimension),
  );
  const coveredRequiredDimensionCount = requiredDimensions.length - missingDimensions.length;
  const decisiveSignal = selectedSignals.find((signal) =>
    signal.decisiveFor?.includes(dominantVariantId),
  );
  const allSourcesQualified = selectedSignals.every(
    (signal) => strengthRank[signal.strength] >= strengthRank.medium,
  );
  const hasStrongSource = selectedSignals.some(
    (signal) => strengthRank[signal.strength] >= strengthRank.strong,
  );
  const crossValidated =
    selectedSignals.length >= 2
    && allSourcesQualified
    && hasStrongSource
    && missingDimensions.length === 0;

  let robustnessScore = 0;
  if (decisiveSignal) {
    robustnessScore = 100;
  } else if (selectedSignals.length === 1) {
    const strength = selectedSignals[0]!.strength;
    robustnessScore = strength === "anchor" ? 70 : strength === "strong" ? 50 : 30;
  } else if (selectedSignals.length >= 2) {
    if (!allSourcesQualified || !hasStrongSource) robustnessScore = 60;
    else if (coveredRequiredDimensionCount === 1) robustnessScore = 75;
    else if (missingDimensions.length > 0) robustnessScore = 90;
    else robustnessScore = 100;
  }
  const rawScore = Math.round(
    decisionScore * 0.55 + certaintyScore * 0.25 + robustnessScore * 0.2,
  );
  const baseGrade = gradeForScore(rawScore);

  let evidenceCap: OutcomeGrade = "B";
  if (decisiveSignal || crossValidated) evidenceCap = "SSS";
  else if (selectedSignals.length === 1) {
    const strength = selectedSignals[0]!.strength;
    evidenceCap = strength === "anchor" ? "SS" : strength === "strong" ? "S" : "A";
  } else if (selectedSignals.length >= 2) {
    evidenceCap = "SS";
  }

  const sssEligible =
    rawScore >= 95
    && decisionScore >= 95
    && certaintyScore >= 85
    && robustnessScore >= 90
    && (crossValidated || Boolean(decisiveSignal));
  if (!sssEligible && evidenceCap === "SSS") evidenceCap = "SS";
  const finalGrade = lowerGrade(baseGrade, evidenceCap);
  const capApplied = finalGrade !== baseGrade;
  const capReason = capApplied
    ? `证据结构上限为 ${evidenceCap}`
    : "基础判断档位未触及证据结构上限";
  const playerLabel =
    decisionScore < 70
      ? "最终选择与当前证据下的较优决策偏差较大"
      : selectedSignals.length === 0
        ? "方向可能合理，但目前没有证据支撑"
        : selectedSignals.length === 1 && !decisiveSignal
          ? "方向合理，但目前只由单点证据支撑，仍缺独立佐证"
          : missingDimensions.length > 0
            ? "关键事实已有依据，主要替代解释仍待排除"
            : finalGrade === "SSS" && (decisiveSignal || crossValidated)
              ? "关键结论已锁定"
              : "判断方向合理，证据链仍可继续补强";

  return {
    decisionScore,
    certaintyScore,
    robustnessScore,
    rawScore,
    baseGrade,
    evidenceCap,
    finalGrade,
    dominantVariantId,
    supportingSignalIds: selectedSignals.map((signal) => signal.id),
    independentSourceGroups,
    coveredDimensions,
    missingDimensions,
    crossValidated,
    decisiveEvidenceId: decisiveSignal?.id,
    sssEligible,
    capApplied,
    capReason,
    playerLabel,
    formula: [
      `D = ${decisionScore}`,
      `C = ${certaintyScore}`,
      `R = ${robustnessScore}`,
      `J = ${rawScore}`,
      `基础档位 = ${baseGrade}`,
      `证据上限 = ${evidenceCap}`,
      `最终档位 = ${finalGrade}`,
    ],
  };
}
