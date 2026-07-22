export const NPC_STATE_KEYS = [
  "pressure",
  "trust",
  "dealIntent",
  "control",
] as const;

export type NPCStateKey = (typeof NPC_STATE_KEYS)[number];
export type NPCPhase = "relaxed" | "cautious" | "pressured" | "negotiating" | "exited";
export type ActionTone = "gentle" | "professional" | "firm";
export type EvidenceStrength = "none" | "weak" | "medium" | "strong" | "anchor";

export type NPCState = Record<NPCStateKey, number> & {
  phase: NPCPhase;
};

export type PlayerAction = {
  target: "repair-history";
  type: "point-out-contradiction";
  tone: ActionTone;
  evidenceIds: string[];
};

export type ActionEvidence = {
  id: string;
  strength: EvidenceStrength;
  contradicts: string;
};

export type StateChange = {
  key: NPCStateKey;
  label: string;
  before: number;
  delta: number;
  after: number;
  reasons: string[];
};

export type RuleEvent =
  | ({ type: "state-changed" } & StateChange)
  | {
      type: "phase-changed";
      before: NPCPhase;
      after: NPCPhase;
      reason: string;
    }
  | {
      type: "storylet-triggered";
      storyletId: string;
      reasons: string[];
    };

export type ActionResult = {
  seed: number;
  initialState: NPCState;
  nextState: NPCState;
  changes: StateChange[];
  triggeredStoryletIds: string[];
  eventLog: RuleEvent[];
};

export type ResolveActionInput = {
  initialState: NPCState;
  action: PlayerAction;
  evidence: ActionEvidence[];
  seed: number;
};
