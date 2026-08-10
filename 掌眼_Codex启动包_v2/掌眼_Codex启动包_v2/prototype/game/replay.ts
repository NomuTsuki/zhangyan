import { createInitialWorldState, reduceTurn } from "./reducer.ts";
import { DEFAULT_RULESET_IDENTITY, createRulesContext } from "./ruleset.ts";
import type {
  CaseDefinition,
  PlayerAction,
  ReplayEnvelope,
  TruthVariantId,
  WorldState,
} from "./types";

function cloneActions(actions: PlayerAction[]): PlayerAction[] {
  return actions.map((action) => ({ ...action }));
}

export function createReplayEnvelope(
  caseDefinition: CaseDefinition,
  actions: PlayerAction[],
  seed = caseDefinition.seed,
  truthVariantId: TruthVariantId = "restored-genuine",
): ReplayEnvelope {
  return {
    caseId: caseDefinition.id,
    caseVersion: caseDefinition.caseVersion,
    rulesetId: DEFAULT_RULESET_IDENTITY.rulesetId,
    rulesetVersion: DEFAULT_RULESET_IDENTITY.rulesetVersion,
    seed,
    truthVariantId,
    actions: cloneActions(actions),
  };
}

export function assertReplayCompatible(
  caseDefinition: CaseDefinition,
  envelope: ReplayEnvelope,
): void {
  if (envelope.caseId !== caseDefinition.id) {
    throw new Error(`Replay caseId mismatch: ${envelope.caseId}`);
  }
  if (envelope.caseVersion !== caseDefinition.caseVersion) {
    throw new Error(`Replay caseVersion mismatch: ${envelope.caseVersion}`);
  }
  if (envelope.rulesetId !== DEFAULT_RULESET_IDENTITY.rulesetId) {
    throw new Error(`Replay rulesetId mismatch: ${envelope.rulesetId}`);
  }
  if (envelope.rulesetVersion !== DEFAULT_RULESET_IDENTITY.rulesetVersion) {
    throw new Error(
      `Replay rulesetVersion mismatch: ${envelope.rulesetVersion}`,
    );
  }
}

export function replayEnvelope(
  caseDefinition: CaseDefinition,
  envelope: ReplayEnvelope,
): WorldState {
  assertReplayCompatible(caseDefinition, envelope);

  const context = createRulesContext(caseDefinition);
  return cloneActions(envelope.actions).reduce(
    (state, action) => reduceTurn(context, state, action).state,
    createInitialWorldState(
      caseDefinition,
      envelope.seed,
      envelope.truthVariantId,
    ),
  );
}

export function replayActions(
  caseDefinition: CaseDefinition,
  actions: PlayerAction[],
  seed = caseDefinition.seed,
  truthVariantId: TruthVariantId = "restored-genuine",
): WorldState {
  return replayEnvelope(
    caseDefinition,
    createReplayEnvelope(caseDefinition, actions, seed, truthVariantId),
  );
}
