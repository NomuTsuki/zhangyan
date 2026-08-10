import type { JudgmentQualityBreakdown } from "./judgment-quality";

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
export type OutcomeGrade = "D" | "C" | "B" | "A" | "S" | "SS" | "SSS";
export type OutcomeTag =
  | "profitable"
  | "break-even"
  | "loss"
  | "correct-avoidance"
  | "missed-opportunity";
export type OutcomeGrades = {
  overallGrade: OutcomeGrade;
  qualityGrade: OutcomeGrade;
  qualityCap: OutcomeGrade;
  netGrade: OutcomeGrade;
  bargainingGrade: OutcomeGrade;
  judgmentGrade: OutcomeGrade;
  outcomeTag: OutcomeTag;
  rawOverallIndex: number;
  cappedOverallIndex: number;
  formula: string[];
};
export type NPCPhase =
  | "relaxed"
  | "cautious"
  | "pressured"
  | "negotiating"
  | "exited";
export type ActionTone = "gentle" | "professional" | "firm";
export type EvidenceStrength = "weak" | "medium" | "strong" | "anchor";
export type EvidenceSourceGroup =
  | "surface"
  | "bottom"
  | "joint"
  | "latch"
  | "interior"
  | "hidden-mark"
  | "specialist-test"
  | "npc-statement";
export type ReasoningDimension =
  | "material-era"
  | "modern-restoration"
  | "component-era-consistency"
  | "provenance-craft-identity"
  | "price-context";
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

export type BuyoutAction = {
  kind: "buyout";
  offer: number;
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
  | BuyoutAction
  | RejectAction;

export type EvidenceLikelihoods = Record<TruthVariantId, number>;

type EvidenceDefinitionBase = {
  id: string;
  name: string;
  topic: string;
  strength: EvidenceStrength;
  detail: string;
  inference: string;
  lead: string;
  contradicts?: string;
  likelihoods: EvidenceLikelihoods;
};

export type EvidenceDefinition =
  | (EvidenceDefinitionBase & {
      kind: "object" | "test";
      sourceGroup: EvidenceSourceGroup;
      dimensions: ReasoningDimension[];
      caseDecisiveFor?: TruthVariantId[];
    })
  | (EvidenceDefinitionBase & {
      kind: "statement";
    });

export type EvidencePayload = Readonly<
  Pick<
    EvidenceDefinition,
    "id" | "kind" | "name" | "topic" | "strength" | "likelihoods"
  >
>;

export type DisclosureSelection = Readonly<{
  evidenceId: string | null;
  newlyShared: boolean;
}>;

export type FramingEffect = Readonly<{
  pressureDelta: number;
  trustDelta: number;
  dealIntentDelta: number;
  controlDelta: number;
  formulas: string[];
}>;

export type DisclosureEvaluation = Readonly<{
  payload: EvidencePayload | null;
  selection: DisclosureSelection;
  framing: FramingEffect;
  relevant: boolean;
  repeatCount: number;
  power: number;
  relevanceFactor: number;
}>;

export type TruthVariant = {
  id: TruthVariantId;
  label: string;
  summary: string;
  trueValue: number;
  qualityGrade: OutcomeGrade;
  overallGradeCap: OutcomeGrade;
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
  signalSourceGroup: "npc-statement";
  signalDimensions: ReasoningDimension[];
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
  personalitySummary: string;
  publicTraits: string[];
  expertise: number;
  honestySensitivity: number;
  openness: number;
  riskAversion: number;
  urgency: number;
  markup: number;
  outsideOption: number;
  privateSignals: Array<{
    id: string;
    label: string;
    kind: "memory" | "judgment";
    confidence: number;
    likelihoods: EvidenceLikelihoods;
  }>;
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
  caseVersion: string;
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
  judgmentModel: {
    hypothesisOrder: TruthVariantId[];
    requiredDimensions: Record<TruthVariantId, ReasoningDimension[]>;
  };
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

export type NegotiationState = {
  started: true;
  initialCapacity: number;
  remainingCapacity: number;
  entryAsk: number;
  entryFloor: number;
  offersMade: number;
};

export type StateSnapshot = {
  actionPoints: number;
  feesPaid: number;
  currentPrice: number;
  npcState: NPCState;
  negotiation: NegotiationState | null;
  evidenceCount: number;
  sharedEvidenceCount: number;
  npcPosterior: PosteriorEntry[];
};

export type StatementRecord = {
  turn: number;
  topicId: string;
  behaviorId: string;
  sourceKind: "memory" | "judgment" | "refusal";
  confidence: number;
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
  negotiationCapacityCost: number;
  before: StateSnapshot;
  after: StateSnapshot;
  changes: StateChange[];
  evidenceAdded: string[];
  sharedEvidenceAdded?: string[];
  priceChange?: PriceChange;
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
  | "buyout-buy"
  | "buyout-rejected"
  | "reject"
  | "seller-exited";

export type PriceChange = {
  turn: number;
  before: number;
  after: number;
  publicReason: string;
  reasons: string[];
};

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
  overallGrade: OutcomeGrade;
  qualityGrade: OutcomeGrade;
  qualityCap: OutcomeGrade;
  netGrade: OutcomeGrade;
  bargainingGrade: OutcomeGrade;
  judgmentGrade: OutcomeGrade;
  outcomeTag: OutcomeTag;
  outcomeLabel: string;
  rawOverallIndex: number;
  cappedOverallIndex: number;
  posterior: PosteriorEntry[];
  expectedValue: number;
  chosenExpectedNet: number;
  bestExpectedNet: number;
  utilityGap: number;
  judgmentScore: number;
  judgmentLabel: string;
  judgmentBreakdown: JudgmentQualityBreakdown;
  endingTitle: string;
  objectiveFormula: string[];
  judgmentFormula: string[];
  gradeFormula: string[];
};

export type WorldState = {
  caseId: string;
  rulesetId: "zhangyan-core";
  rulesetVersion: string;
  caseVersion: string;
  seed: number;
  truthVariantId: TruthVariantId;
  npcProfileId: string;
  status: CaseStatus;
  turn: number;
  actionPoints: number;
  negotiation: NegotiationState | null;
  feesPaid: number;
  currentPrice: number;
  npcState: NPCState;
  discoveredEvidenceIds: string[];
  sharedEvidenceIds: string[];
  npcPosterior: PosteriorEntry[];
  priceHistory: PriceChange[];
  inspectedTargetIds: string[];
  completedTestIds: string[];
  statementHistory: StatementRecord[];
  triggeredStoryletIds: string[];
  actionHistory: TurnRecord[];
  settlement?: SettlementResult;
};

export type DomainEvent =
  | { kind: "evidence-discovered"; evidenceId: string }
  | { kind: "evidence-shared"; evidenceId: string }
  | { kind: "price-changed"; priceChange: PriceChange }
  | { kind: "case-settled"; settlement: SettlementResult };

export type CalculationTrace = Readonly<{
  turn: number;
  formulaLog: string[];
  spindle?: SpindleTrace;
}>;

export type TransitionResult = Readonly<{
  state: WorldState;
  events: DomainEvent[];
  trace: CalculationTrace;
}>;
