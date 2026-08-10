import type { CaseDefinition, PlayerAction, WorldState } from "./types";
import { reduceTurn } from "./reducer.ts";
import { createRulesContext } from "./ruleset.ts";

export function resolveTurn(
  caseDefinition: CaseDefinition,
  state: WorldState,
  action: PlayerAction,
): WorldState {
  return reduceTurn(createRulesContext(caseDefinition), state, action).state;
}

export { calculatePosterior, calculateNpcPosterior } from "./belief.ts";
export {
  createInitialWorldState,
  getDiscoveredEvidence,
  getNpcPricing,
  getNpcStance,
  getPlayerReferenceOffer,
  getStateLabels,
  getTestConsent,
  getTruthForDebug,
  replayActions,
} from "./reducer.ts";
