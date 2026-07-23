export const NPC_STATE_KEYS = [
  "pressure",
  "trust",
  "dealIntent",
  "control",
] as const;

export const TRUTH_VARIANT_IDS = [
  "counterfeit",
  "restored-genuine",
  "hidden-treasure",
] as const;

export type NPCStateKey = (typeof NPC_STATE_KEYS)[number];
export type TruthVariantId = (typeof TRUTH_VARIANT_IDS)[number];
export type NPCPhase =
  | "relaxed"
  | "cautious"
  | "pressured"
  | "negotiating"
  | "exited";
export type ActionTone = "gentle" | "professional" | "firm";
export type EvidenceStrength = "weak" | "medium" | "strong" | "anchor";
export type CaseStatus = "active" | "settled";

export type NPCState = Record<NPCStateKey, number> & {
  phase: NPCPhase;
};

export type InspectAction = {
  kind: "inspect";
  targetId: string;
};

export type DialogueAction = {
  kind: "dialogue";
  topicId: string;
  tone: ActionTone;
  evidenceId?: string;
};

export type TestAction = {
  kind: "test";
  testId: string;
};

export type DiscountAction = {
  kind: "discount";
  offer: number;
};

export type BuyAction = {
  kind: "buy";
};

export type RejectAction = {
  kind: "reject";
};

export type PlayerAction =
  | InspectAction
  | DialogueAction
  | TestAction
  | DiscountAction
  | BuyAction
  | RejectAction;

export type EvidenceLikelihoods = Record<TruthVariantId, number>;

export type EvidenceDefinition = {
  id: string;
  name: string;
  kind: "object" | "statement" | "test";
  topic: string;
  strength: EvidenceStrength;
  detail: string;
  inference: string;
  lead: string;
  contradicts?: string;
  likelihoods: EvidenceLikelihoods;
};

export type TruthVariant = {
  id: TruthVariantId;
  label: string;
  summary: string;
  trueValue: number;
  facts: string[];
};

export type ObservationTarget = {
  id: string;
  label: string;
  short: string;
  knowledgeHint: string;
  results: Record<
    TruthVariantId,
    {
      evidenceId: string;
      title: string;
      description: string;
      bonusEvidenceId?: string;
      bonusChance?: number;
    }
  >;
};

export type NPCBehaviorId =
  | "cooperate"
  | "deflect"
  | "partial-admit"
  | "counter"
  | "refuse"
  | "exit";

export type DialogueTopic = {
  id: string;
  label: string;
  evidenceTopics: string[];
  prompt: string;
  initialClaim: string;
  responseEvidenceId?: string;
  responses: Record<NPCBehaviorId, string>;
  signals: Record<
    NPCBehaviorId,
    {
      id: string;
      label: string;
      likelihoods: EvidenceLikelihoods;
    }
  >;
};

export type NPCProfile = {
  id: string;
  label: string;
  beliefSummary: string;
  reservationPrice: number;
};

export type KnowledgeCard = {
  id: string;
  title: string;
  body: string;
};

export type TestDefinition = {
  id: string;
  label: string;
  description: string;
  actionPointCost: number;
  valueCost: number;
  evidenceByVariant: Record<TruthVariantId, string>;
};

export type CaseDefinition = {
  id: string;
  title: string;
  seller: {
    name: string;
    summary: string;
    openingPrice: number;
  };
  actionBudget: number;
  seed: number;
  claims: Array<{
    id: string;
    text: string;
    topic: string;
  }>;
  initialNpcState: NPCState;
  npcProfile: NPCProfile;
  truthVariants: Record<TruthVariantId, TruthVariant>;
  evidence: Record<string, EvidenceDefinition>;
  observationTargets: ObservationTarget[];
  dialogueTopics: DialogueTopic[];
  knowledgeCards: KnowledgeCard[];
  test: TestDefinition;
  suggestedDiscount: number;
};

export type StateChange = {
  key: NPCStateKey;
  label: string;
  before: number;
  delta: number;
  after: number;
  reasons: string[];
  formula: string;
};

export type BehaviorCandidate = {
  id: string;
  label: string;
  eligible: boolean;
  components: Array<{
    label: string;
    value: number;
  }>;
  baseScore: number;
  jitter: number;
  finalScore: number;
  score: number;
  formula: string;
  filterReasons: string[];
  reasons: string[];
};

export type SpindleTrace = {
  expansion: string[];
  candidates: BehaviorCandidate[];
  selectedId: string;
  selectedLabel: string;
  convergence: string[];
};

export type StateSnapshot = {
  actionPoints: number;
  feesPaid: number;
  currentPrice: number;
  npcState: NPCState;
  evidenceCount: number;
};

export type StatementRecord = {
  turn: number;
  topicId: string;
  behaviorId: string;
  text: string;
  signalId: string;
  signalLabel: string;
  likelihoods: EvidenceLikelihoods;
};

export type TurnRecord = {
  turn: number;
  action: PlayerAction;
  actionLabel: string;
  actionPointCost: number;
  before: StateSnapshot;
  after: StateSnapshot;
  changes: StateChange[];
  evidenceAdded: string[];
  statement?: StatementRecord;
  title: string;
  description: string;
  formulaLog: string[];
  spindle?: SpindleTrace;
  redundant: boolean;
};

export type PosteriorEntry = {
  variantId: TruthVariantId;
  label: string;
  probability: number;
  trueValue: number;
};

export type SettlementChoice =
  | "buy"
  | "discount-buy"
  | "reject"
  | "seller-exited";

export type SettlementResult = {
  choice: SettlementChoice;
  choiceLabel: string;
  truthVariantId: TruthVariantId;
  truthLabel: string;
  trueValue: number;
  paidPrice: number;
  feesPaid: number;
  actualNet: number;
  oracleBestNet: number;
  regret: number;
  stakes: number;
  objectiveScore: number;
  objectiveSuccess: boolean;
  objectiveLabel: string;
  posterior: PosteriorEntry[];
  expectedValue: number;
  chosenExpectedNet: number;
  bestExpectedNet: number;
  utilityGap: number;
  judgmentScore: number;
  judgmentLabel: string;
  endingTitle: string;
  objectiveFormula: string[];
  judgmentFormula: string[];
};

export type WorldState = {
  caseId: string;
  seed: number;
  truthVariantId: TruthVariantId;
  npcProfileId: string;
  status: CaseStatus;
  turn: number;
  actionPoints: number;
  feesPaid: number;
  currentPrice: number;
  npcState: NPCState;
  discoveredEvidenceIds: string[];
  inspectedTargetIds: string[];
  completedTestIds: string[];
  statementHistory: StatementRecord[];
  triggeredStoryletIds: string[];
  actionHistory: TurnRecord[];
  settlement?: SettlementResult;
};
