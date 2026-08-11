import { DEFAULT_RULESET_CONFIG } from "./ruleset.ts";
import type { RulesContext } from "./ruleset.ts";
import type {
  CaseDefinition,
  PosteriorEntry,
  TruthVariantId,
  WorldState,
} from "./types";

type BeliefRules = Pick<
  RulesContext["rules"],
  "minimumLikelihood" | "normalizationTolerance"
>;

type RawPosteriorWeight = Readonly<{
  variantId: TruthVariantId;
  weight: number;
}>;

function assertFiniteNonNegativeWeight(weight: number, variantId: TruthVariantId) {
  if (!Number.isFinite(weight)) {
    throw new Error(`Posterior weight for ${variantId} must be finite`);
  }
  if (weight < 0) {
    throw new Error(`Posterior weight for ${variantId} must be non-negative`);
  }
}

export function normalizePosterior(
  caseDefinition: CaseDefinition,
  rawWeights: readonly RawPosteriorWeight[],
  rules: BeliefRules = DEFAULT_RULESET_CONFIG,
): PosteriorEntry[] {
  for (const entry of rawWeights) {
    assertFiniteNonNegativeWeight(entry.weight, entry.variantId);
  }

  const total = rawWeights.reduce((sum, entry) => sum + entry.weight, 0);
  if (!Number.isFinite(total)) {
    throw new Error("Posterior total must be finite");
  }
  if (total <= 0) {
    throw new Error("Posterior total must be positive");
  }

  const posterior = rawWeights.map(({ variantId, weight }) => ({
    variantId,
    label: caseDefinition.truthVariants[variantId].label,
    probability: weight / total,
    trueValue: caseDefinition.truthVariants[variantId].trueValue,
  }));
  const normalizedTotal = posterior.reduce(
    (sum, entry) => sum + entry.probability,
    0,
  );
  if (Math.abs(normalizedTotal - 1) > rules.normalizationTolerance) {
    throw new Error("Posterior probabilities must sum to one");
  }
  return posterior;
}

export function calculatePosterior(
  caseDefinition: CaseDefinition,
  evidenceIds: string[],
  statementHistory: WorldState["statementHistory"] = [],
  rules: BeliefRules = DEFAULT_RULESET_CONFIG,
): PosteriorEntry[] {
  const independentEvidenceIds = [...new Set(evidenceIds)].filter(
    (evidenceId) => caseDefinition.evidence[evidenceId]?.kind !== "statement",
  );
  const uniqueStatementSignals = [
    ...new Map(
      statementHistory.map((statement) => [statement.signalId, statement]),
    ).values(),
  ];
  const hypothesisIds = caseDefinition.judgmentModel.hypothesisOrder;
  const weights = hypothesisIds.map((variantId) => {
    const evidenceLikelihood = independentEvidenceIds.reduce((product, evidenceId) => {
      const evidence = caseDefinition.evidence[evidenceId];
      return product * (evidence?.likelihoods[variantId] ?? 1);
    }, 1 / hypothesisIds.length);
    const statementLikelihood = uniqueStatementSignals.reduce(
      (product, statement) =>
        product
        * Math.pow(
          Math.max(
            rules.minimumLikelihood,
            statement.likelihoods[variantId] ?? 1,
          ),
          statement.confidence,
        ),
      1,
    );
    return {
      variantId,
      weight: evidenceLikelihood * statementLikelihood,
    };
  });

  return normalizePosterior(caseDefinition, weights, rules);
}

export function calculateNpcPosterior(
  caseDefinition: CaseDefinition,
  sharedEvidenceIds: string[],
  rules: BeliefRules = DEFAULT_RULESET_CONFIG,
): PosteriorEntry[] {
  const uniqueSharedEvidenceIds = [...new Set(sharedEvidenceIds)].filter(
    (evidenceId) => caseDefinition.evidence[evidenceId]?.kind !== "statement",
  );
  const hypothesisIds = caseDefinition.judgmentModel.hypothesisOrder;
  const rawWeights = hypothesisIds.map((variantId) => {
    const privateWeight = caseDefinition.npcProfile.privateSignals.reduce(
      (product, signal) =>
        product
        * Math.pow(
          Math.max(rules.minimumLikelihood, signal.likelihoods[variantId]),
          signal.confidence,
        ),
      1 / hypothesisIds.length,
    );
    const sharedWeight = uniqueSharedEvidenceIds.reduce((product, evidenceId) => {
      const likelihood =
        caseDefinition.evidence[evidenceId]?.likelihoods[variantId] ?? 1;
      return product
        * Math.pow(
          Math.max(rules.minimumLikelihood, likelihood),
          caseDefinition.npcProfile.expertise,
        );
    }, 1);
    return {
      variantId,
      weight: privateWeight * sharedWeight,
    };
  });
  return normalizePosterior(caseDefinition, rawWeights, rules);
}

export function posteriorExpectedValue(posterior: PosteriorEntry[]) {
  return posterior.reduce(
    (sum, entry) => sum + entry.probability * entry.trueValue,
    0,
  );
}

export function posteriorQuantile(posterior: PosteriorEntry[], quantile: number) {
  const ordered = [...posterior].sort(
    (left, right) => left.trueValue - right.trueValue,
  );
  let cumulative = 0;
  for (const entry of ordered) {
    cumulative += entry.probability;
    if (cumulative >= quantile) return entry.trueValue;
  }
  return ordered.at(-1)?.trueValue ?? 0;
}

export function posteriorEntropy(posterior: PosteriorEntry[]) {
  return posterior.reduce(
    (sum, entry) =>
      entry.probability > 0
        ? sum - entry.probability * Math.log2(entry.probability)
        : sum,
    0,
  );
}
