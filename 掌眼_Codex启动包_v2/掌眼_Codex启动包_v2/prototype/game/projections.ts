import type {
  CalculationTrace,
  CaseDefinition,
  NPCState,
  PosteriorEntry,
  SettlementResult,
  TruthVariant,
  TurnRecord,
  WorldState,
} from "./types.ts";

export type DeveloperProjection = Readonly<{
  caseId: string;
  caseVersion: string;
  rulesetId: string;
  rulesetVersion: string;
  npcState: NPCState;
  npcPosterior: PosteriorEntry[];
  actionHistory: TurnRecord[];
  settlement: SettlementResult | null;
  truth: TruthVariant | null;
  lastTrace: CalculationTrace | null;
}>;

function copyLastTrace(actionHistory: TurnRecord[]): CalculationTrace | null {
  const lastTurn = actionHistory.at(-1);
  if (!lastTurn) return null;

  return {
    turn: lastTurn.turn,
    formulaLog: [...lastTurn.formulaLog],
    ...(lastTurn.spindle ? { spindle: structuredClone(lastTurn.spindle) } : {}),
  };
}

export function buildDeveloperProjection(
  caseDefinition: CaseDefinition,
  state: WorldState,
): DeveloperProjection {
  const snapshot = structuredClone({
    caseId: state.caseId,
    caseVersion: state.caseVersion,
    rulesetId: state.rulesetId,
    rulesetVersion: state.rulesetVersion,
    npcState: state.npcState,
    npcPosterior: state.npcPosterior,
    actionHistory: state.actionHistory,
    settlement: state.status === "settled" ? state.settlement ?? null : null,
    truth:
      state.status === "settled"
        ? caseDefinition.truthVariants[state.truthVariantId]
        : null,
    lastTrace: copyLastTrace(state.actionHistory),
  });

  return snapshot;
}
