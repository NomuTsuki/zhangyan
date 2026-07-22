import type {
  ActionEvidence,
  ActionResult,
  ActionTone,
  EvidenceStrength,
  NPCPhase,
  NPCState,
  NPCStateKey,
  ResolveActionInput,
  RuleEvent,
  StateChange,
} from "./types";

export const PARTIAL_RESTORATION_ADMISSION = "partial-restoration-admission";

const stateLabels: Record<NPCStateKey, string> = {
  pressure: "压力",
  trust: "信任",
  dealIntent: "成交意愿",
  control: "控制感",
};

const toneMultiplier: Record<ActionTone, number> = {
  gentle: 0.75,
  professional: 1,
  firm: 1.25,
};

const evidenceMultiplier: Record<EvidenceStrength, number> = {
  none: 0.5,
  weak: 0.75,
  medium: 1,
  strong: 1.3,
  anchor: 1.6,
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function pressureDecay(pressure: number) {
  if (pressure <= 40) return 1;
  if (pressure <= 70) return 0.75;
  return 0.5;
}

function getPrimaryEvidence(
  evidence: ActionEvidence[],
  evidenceIds: string[],
) {
  const selected = evidence.find((item) => evidenceIds.includes(item.id));
  if (!selected) throw new Error("行动缺少可用证据");
  return selected;
}

function getPhase(state: NPCState): NPCPhase {
  if (state.phase === "exited") return "exited";
  if (state.pressure >= 75) return "pressured";
  if (state.pressure >= 50) return "cautious";
  return "relaxed";
}

function makeChange(
  key: NPCStateKey,
  state: NPCState,
  delta: number,
  reasons: string[],
): StateChange {
  const before = state[key];
  const after = clamp(before + delta);
  return {
    key,
    label: stateLabels[key],
    before,
    delta: after - before,
    after,
    reasons,
  };
}

export function resolveAction({
  initialState,
  action,
  evidence,
  seed,
}: ResolveActionInput): ActionResult {
  if (!Number.isInteger(seed)) throw new Error("seed 必须是整数");
  if (action.type !== "point-out-contradiction" || action.target !== "repair-history") {
    throw new Error("当前规则切片只支持针对修复历史指出矛盾");
  }

  const selectedEvidence = getPrimaryEvidence(evidence, action.evidenceIds);
  const tone = toneMultiplier[action.tone];
  const evidencePower = evidenceMultiplier[selectedEvidence.strength];
  const decay = pressureDecay(initialState.pressure);

  const pressureDelta = clamp(
    Math.round(20 * tone * evidencePower * decay + 2),
    0,
    35,
  );
  const trustDelta = { gentle: 8, professional: 3, firm: -10 }[action.tone];
  const dealIntentDelta = Math.round(
    { gentle: -2, professional: -5, firm: -9 }[action.tone] * evidencePower,
  );
  const controlDelta = Math.round(-20 * tone * evidencePower);

  const changes = [
    makeChange("pressure", initialState, pressureDelta, [
      `指出矛盾基础 20 × ${action.tone === "professional" ? "专业" : action.tone} ${tone}`,
      `${selectedEvidence.strength}证据 × ${evidencePower}`,
      `压力衰减 × ${decay}，矛盾上下文 +2`,
    ]),
    makeChange("trust", initialState, trustDelta, [
      action.tone === "professional" ? "专业表达维持公平感 +3" : "态度副作用",
    ]),
    makeChange("dealIntent", initialState, dealIntentDelta, [
      `修复风险被指出，基础变化按证据强度 × ${evidencePower}`,
    ]),
    makeChange("control", initialState, controlDelta, [
      `指出矛盾基础 -20 × 态度 ${tone} × 证据 ${evidencePower}`,
    ]),
  ];

  const nextState = changes.reduce<NPCState>(
    (state, change) => ({ ...state, [change.key]: change.after }),
    { ...initialState },
  );
  nextState.phase = getPhase(nextState);

  const eventLog: RuleEvent[] = changes.map((change) => ({
    type: "state-changed",
    ...change,
  }));

  if (initialState.phase !== nextState.phase) {
    eventLog.push({
      type: "phase-changed",
      before: initialState.phase,
      after: nextState.phase,
      reason: `压力达到 ${nextState.pressure}`,
    });
  }

  const triggersAdmission =
    selectedEvidence.contradicts === "claim-never-restored" &&
    nextState.pressure >= 50 &&
    nextState.control <= 45 &&
    nextState.dealIntent >= 60;
  const triggeredStoryletIds = triggersAdmission
    ? [PARTIAL_RESTORATION_ADMISSION]
    : [];

  if (triggersAdmission) {
    eventLog.push({
      type: "storylet-triggered",
      storyletId: PARTIAL_RESTORATION_ADMISSION,
      reasons: [
        `压力 ${nextState.pressure} ≥ 50`,
        `控制感 ${nextState.control} ≤ 45`,
        `成交意愿 ${nextState.dealIntent} ≥ 60`,
        "现代胶痕反驳从未修复",
      ],
    });
  }

  return {
    seed,
    initialState: { ...initialState },
    nextState,
    changes,
    triggeredStoryletIds,
    eventLog,
  };
}
