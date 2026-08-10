import type { CaseDefinition, WorldState } from "./types";

export type RulesetIdentity = Readonly<{
  rulesetId: "zhangyan-core";
  rulesetVersion: string;
  caseSchemaVersion: number;
}>;

export type RulesetConfig = Readonly<{
  normalizationTolerance: number;
  minimumLikelihood: number;
  behaviorJitterSpan: number;
  priceTick: number;
}>;

export const DEFAULT_RULESET_IDENTITY: RulesetIdentity = Object.freeze({
  rulesetId: "zhangyan-core",
  rulesetVersion: "2.0.0-alpha.1",
  caseSchemaVersion: 1,
});

export const DEFAULT_RULESET_CONFIG: RulesetConfig = Object.freeze({
  normalizationTolerance: 1e-10,
  minimumLikelihood: 0.0001,
  behaviorJitterSpan: 3,
  priceTick: 5,
});

export type RulesContext = Readonly<{
  identity: RulesetIdentity;
  rules: RulesetConfig;
  caseDefinition: CaseDefinition;
}>;

export function createRulesContext(caseDefinition: CaseDefinition): RulesContext {
  return {
    identity: DEFAULT_RULESET_IDENTITY,
    rules: DEFAULT_RULESET_CONFIG,
    caseDefinition,
  };
}

export function assertWorldStateCompatible(
  context: RulesContext,
  state: WorldState,
): void {
  const expected = {
    caseId: context.caseDefinition.id,
    caseVersion: context.caseDefinition.caseVersion,
    rulesetId: context.identity.rulesetId,
    rulesetVersion: context.identity.rulesetVersion,
  } as const;

  for (const field of Object.keys(expected) as Array<keyof typeof expected>) {
    if (state[field] !== expected[field]) {
      throw new Error(
        `WorldState ${field} mismatch: ${state[field]} (expected ${expected[field]})`,
      );
    }
  }
}
