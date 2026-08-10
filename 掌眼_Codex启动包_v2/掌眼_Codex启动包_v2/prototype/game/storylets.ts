import type {
  CaseDefinition,
  DialogueTopic,
  NPCBehaviorId,
  StatementRecord,
  WorldState,
} from "./types";

export type StoryletResolution = Readonly<{
  storyletId: string;
  newlyTriggered: boolean;
  evidenceAdded: string[];
  statement: StatementRecord;
}>;

export function resolveDialogueStorylet(
  _caseDefinition: CaseDefinition,
  state: WorldState,
  topic: DialogueTopic,
  selectedBehavior: NPCBehaviorId,
): StoryletResolution {
  const storyletId = `${topic.id}:partial-admit`;
  const newlyTriggered =
    selectedBehavior === "partial-admit"
    && !state.triggeredStoryletIds.includes(storyletId);
  const statementSignal = topic.signals[selectedBehavior];
  const sourceKind: StatementRecord["sourceKind"] =
    selectedBehavior === "refuse" || selectedBehavior === "exit"
      ? "refusal"
      : selectedBehavior === "counter" || topic.id === "price"
        ? "judgment"
        : "memory";
  const confidence = {
    cooperate: 0.65,
    deflect: 0.45,
    "partial-admit": 0.72,
    counter: 0.55,
    refuse: 0.2,
    exit: 0.2,
  }[selectedBehavior];

  return {
    storyletId,
    newlyTriggered,
    evidenceAdded:
      newlyTriggered
      && topic.responseEvidenceId
      && !state.discoveredEvidenceIds.includes(topic.responseEvidenceId)
        ? [topic.responseEvidenceId]
        : [],
    statement: {
      turn: state.turn + 1,
      topicId: topic.id,
      behaviorId: selectedBehavior,
      sourceKind,
      confidence,
      text: topic.responses[selectedBehavior],
      signalId: statementSignal.id,
      signalLabel: statementSignal.label,
      likelihoods: { ...statementSignal.likelihoods },
    },
  };
}
