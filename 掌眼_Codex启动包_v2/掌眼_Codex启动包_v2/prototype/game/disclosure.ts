import { clamp, round1 } from "./numeric.ts";
import type {
  ActionTone,
  CaseDefinition,
  DialogueAction,
  DisclosureEvaluation,
  EvidenceDefinition,
  EvidenceStrength,
  WorldState,
} from "./types.ts";

const evidencePower: Record<EvidenceStrength, number> = {
  weak: 0.7,
  medium: 1,
  strong: 1.3,
  anchor: 1.6,
};

const tonePressure: Record<ActionTone, number> = {
  gentle: 0.72,
  professional: 1,
  firm: 1.25,
};

function pressureDecay(pressure: number) {
  if (pressure <= 40) return 1;
  if (pressure <= 70) return 0.75;
  return 0.5;
}

function getEvidence(
  caseDefinition: CaseDefinition,
  evidenceId: string | undefined,
) {
  if (!evidenceId) return undefined;
  const evidence = caseDefinition.evidence[evidenceId];
  if (!evidence) throw new Error(`未知证据：${evidenceId}`);
  return evidence;
}

function toPayload(evidence: EvidenceDefinition) {
  return {
    id: evidence.id,
    kind: evidence.kind,
    name: evidence.name,
    topic: evidence.topic,
    strength: evidence.strength,
    likelihoods: { ...evidence.likelihoods },
  };
}

export function evaluateDisclosure(
  caseDefinition: CaseDefinition,
  state: WorldState,
  action: DialogueAction,
): DisclosureEvaluation {
  const topic = caseDefinition.dialogueTopics.find(
    (item) => item.id === action.topicId,
  );
  if (!topic) throw new Error(`未知询问主题：${action.topicId}`);

  const evidence = getEvidence(caseDefinition, action.evidenceId);
  if (evidence && !state.discoveredEvidenceIds.includes(evidence.id)) {
    throw new Error("不能引用尚未发现的证据");
  }

  const relevant = Boolean(
    evidence
    && (
      topic.evidenceTopics.includes(evidence.topic)
      || evidence.contradicts
        === caseDefinition.claims.find((claim) => claim.topic === topic.label)?.id
    ),
  );
  const signature = `${action.topicId}:${action.evidenceId ?? "none"}:${action.tone}`;
  const repeatCount = state.actionHistory.filter(
    (turn) =>
      turn.action.kind === "dialogue"
      && `${turn.action.topicId}:${turn.action.evidenceId ?? "none"}:${turn.action.tone}` === signature,
  ).length;
  const power = evidence ? evidencePower[evidence.strength] : 0.5;
  const relevanceFactor = evidence ? (relevant ? 1 : 0.45) : 1;
  const decay = pressureDecay(state.npcState.pressure);
  const contextModifier = evidence ? (relevant ? 2 : -2) : 0;
  const pressureRaw =
    (evidence ? 10 : 3)
    * tonePressure[action.tone]
    * power
    * relevanceFactor
    * decay
    + contextModifier
    + repeatCount;
  const pressureDelta = clamp(Math.round(pressureRaw), 0, 28);
  const trustDelta = clamp(
    { gentle: 6, professional: 2, firm: -7 }[action.tone]
      + (evidence ? 0 : { gentle: 2, professional: 1, firm: -2 }[action.tone])
      + (evidence && !relevant ? -3 : 0)
      - repeatCount * 2,
    -15,
    10,
  );
  const dealIntentDelta = clamp(
    { gentle: 1, professional: -1, firm: -4 }[action.tone]
      - (evidence ? Math.round(power * 2) : 0)
      - repeatCount * 2,
    -15,
    5,
  );
  const controlDelta = evidence
    ? -clamp(
        Math.round(10 * tonePressure[action.tone] * power * relevanceFactor)
          + repeatCount,
        0,
        24,
      )
    : { gentle: 2, professional: -2, firm: -4 }[action.tone];

  return {
    payload: evidence ? toPayload(evidence) : null,
    selection: {
      evidenceId: evidence?.id ?? null,
      newlyShared: Boolean(
        evidence
        && evidence.kind !== "statement"
        && !state.sharedEvidenceIds.includes(evidence.id),
      ),
    },
    framing: {
      pressureDelta,
      trustDelta,
      dealIntentDelta,
      controlDelta,
      formulas: [
        `round(基础${evidence ? 10 : 3} × 态度${tonePressure[action.tone]} × 证据${power} × 相关${relevanceFactor} × 衰减${decay} + 情境${contextModifier} + 重复${repeatCount}) = ${pressureDelta}`,
        `态度基础 + 开放询问修正 + 相关性修正 - 重复${repeatCount}×2 = ${trustDelta}`,
        `态度基础 - 证据${evidence ? round1(power * 2) : 0} - 重复${repeatCount}×2 = ${dealIntentDelta}`,
        evidence
          ? `-round(10 × 态度${tonePressure[action.tone]} × 证据${power} × 相关${relevanceFactor}) - 重复${repeatCount} = ${controlDelta}`
          : `开放询问态度修正 = ${controlDelta}`,
      ],
    },
    relevant,
    repeatCount,
    power,
    relevanceFactor,
  };
}
