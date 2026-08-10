import type { CaseDefinition, PlayerAction, WorldState } from "./types";
import { reduceTurn } from "./reducer.ts";
import {
  assertWorldStateCompatible,
  createRulesContext,
} from "./ruleset.ts";

export function resolveTurn(
  caseDefinition: CaseDefinition,
  state: WorldState,
  action: PlayerAction,
): WorldState {
  const context = createRulesContext(caseDefinition);
  assertWorldStateCompatible(context, state);
  return reduceTurn(context, state, action).state;
}

export { calculatePosterior, calculateNpcPosterior } from "./belief.ts";
export {
  assertReplayCompatible,
  createReplayEnvelope,
  replayActions,
  replayEnvelope,
} from "./replay.ts";
export {
  createInitialWorldState,
  getDiscoveredEvidence,
  getNpcPricing,
  getNpcStance,
  getPlayerReferenceOffer,
  getStateLabels,
  getTestConsent,
  getTruthForDebug,
} from "./reducer.ts";
