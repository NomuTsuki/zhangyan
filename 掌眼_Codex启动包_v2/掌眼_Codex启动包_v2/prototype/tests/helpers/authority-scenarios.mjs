import { lacquerBoxCase } from "../../content/lacquer-box.ts";
import { replayActions } from "../../game/resolve-action.ts";

export const AUTHORITY_SCENARIOS = [
  ...["counterfeit", "restored-genuine", "hidden-treasure"].flatMap((truthVariantId) => [
    { id: `blind-buy:${truthVariantId}`, truthVariantId, seed: 20260723, actions: [{ kind: "buy" }] },
    { id: `blind-reject:${truthVariantId}`, truthVariantId, seed: 20260723, actions: [{ kind: "reject" }] },
  ]),
  {
    id: "restored-disclosure-trade",
    truthVariantId: "restored-genuine",
    seed: 20260723,
    actions: [
      { kind: "inspect", targetId: "joint" },
      { kind: "dialogue", topicId: "repair-history", tone: "professional", evidenceId: "modern-adhesive-trace" },
      { kind: "discount", offer: 50 },
      { kind: "buy" },
    ],
  },
  { id: "restored-open-inquiry", truthVariantId: "restored-genuine", seed: 20260723, actions: [{ kind: "dialogue", topicId: "provenance", tone: "gentle" }, { kind: "reject" }] },
  { id: "restored-lucky-seed-1", truthVariantId: "restored-genuine", seed: 1, actions: [{ kind: "inspect", targetId: "joint" }, { kind: "reject" }] },
  { id: "restored-ordinary-seed-5", truthVariantId: "restored-genuine", seed: 5, actions: [{ kind: "inspect", targetId: "joint" }, { kind: "reject" }] },
];

export function semanticState(state) {
  // This fixture deliberately preserves the approved pre-refactor contract.
  // V2's additive player-only settlement fields have their own rule tests and
  // must not force us to rewrite or erase the historical authority baseline.
  const legacySettlement = state.settlement
    ? (({ valuation, ability, objectiveOutcome, ...legacy }) => legacy)(state.settlement)
    : null;

  return JSON.parse(JSON.stringify({
    status: state.status,
    turn: state.turn,
    actionPoints: state.actionPoints,
    negotiation: state.negotiation,
    feesPaid: state.feesPaid,
    currentPrice: state.currentPrice,
    npcState: state.npcState,
    discoveredEvidenceIds: state.discoveredEvidenceIds,
    sharedEvidenceIds: state.sharedEvidenceIds,
    npcPosterior: state.npcPosterior,
    priceHistory: state.priceHistory,
    statementHistory: state.statementHistory,
    triggeredStoryletIds: state.triggeredStoryletIds,
    actionHistory: state.actionHistory.map((turn) => ({
      turn: turn.turn,
      action: turn.action,
      actionPointCost: turn.actionPointCost,
      negotiationCapacityCost: turn.negotiationCapacityCost,
      after: turn.after,
      changes: turn.changes,
      evidenceAdded: turn.evidenceAdded,
      sharedEvidenceAdded: turn.sharedEvidenceAdded,
      priceChange: turn.priceChange,
      statement: turn.statement,
      formulaLog: turn.formulaLog,
      spindle: turn.spindle,
      redundant: turn.redundant,
    })),
    settlement: legacySettlement,
  }));
}

export function captureAuthorityBaseline() {
  return {
    schemaVersion: 1,
    snapshots: Object.fromEntries(
      AUTHORITY_SCENARIOS.map((scenario) => [
        scenario.id,
        semanticState(replayActions(
          lacquerBoxCase,
          scenario.actions,
          scenario.seed,
          scenario.truthVariantId,
        )),
      ]),
    ),
  };
}
