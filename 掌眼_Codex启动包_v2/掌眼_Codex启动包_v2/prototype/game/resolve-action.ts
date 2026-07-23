import type {
  ActionTone,
  BehaviorCandidate,
  CaseDefinition,
  DialogueAction,
  EvidenceDefinition,
  EvidenceStrength,
  NPCBehaviorId,
  NPCPhase,
  NPCState,
  NPCStateKey,
  PlayerAction,
  PosteriorEntry,
  SettlementChoice,
  SettlementResult,
  SpindleTrace,
  StateChange,
  StateSnapshot,
  TruthVariantId,
  TurnRecord,
  WorldState,
} from "./types";

const truthVariantIds: TruthVariantId[] = [
  "counterfeit",
  "restored-genuine",
  "hidden-treasure",
];

const stateLabels: Record<NPCStateKey, string> = {
  pressure: "压力",
  trust: "信任",
  dealIntent: "成交意愿",
  control: "控制感",
};

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

const toneLabels: Record<ActionTone, string> = {
  gentle: "温和",
  professional: "专业",
  firm: "强硬",
};

const behaviorLabels: Record<NPCBehaviorId, string> = {
  cooperate: "补充说明",
  deflect: "模糊回应",
  "partial-admit": "部分承认",
  counter: "反向质疑",
  refuse: "拒绝回答",
  exit: "结束交易",
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed: number, turn: number, key: string) {
  let value = (seed ^ hashString(key) ^ Math.imul(turn + 1, 2654435761)) >>> 0;
  value = (value ^ (value >>> 16)) >>> 0;
  value = Math.imul(value, 2246822507) >>> 0;
  value = (value ^ (value >>> 13)) >>> 0;
  value = Math.imul(value, 3266489909) >>> 0;
  value = (value ^ (value >>> 16)) >>> 0;
  return value / 4294967296;
}

function jitter(seed: number, turn: number, key: string) {
  return round1((seededUnit(seed, turn, `behavior:${key}`) - 0.5) * 3);
}

function cloneNpcState(state: NPCState): NPCState {
  return { ...state };
}

function cloneState(state: WorldState): WorldState {
  return {
    ...state,
    npcState: cloneNpcState(state.npcState),
    discoveredEvidenceIds: [...state.discoveredEvidenceIds],
    inspectedTargetIds: [...state.inspectedTargetIds],
    completedTestIds: [...state.completedTestIds],
    statementHistory: state.statementHistory.map((item) => ({
      ...item,
      likelihoods: { ...item.likelihoods },
    })),
    triggeredStoryletIds: [...state.triggeredStoryletIds],
    actionHistory: [...state.actionHistory],
    settlement: state.settlement
      ? {
          ...state.settlement,
          posterior: state.settlement.posterior.map((item) => ({ ...item })),
          objectiveFormula: [...state.settlement.objectiveFormula],
          judgmentFormula: [...state.settlement.judgmentFormula],
        }
      : undefined,
  };
}

function snapshot(state: WorldState): StateSnapshot {
  return {
    actionPoints: state.actionPoints,
    feesPaid: state.feesPaid,
    currentPrice: state.currentPrice,
    npcState: cloneNpcState(state.npcState),
    evidenceCount: state.discoveredEvidenceIds.length,
  };
}

function phaseFor(state: NPCState): NPCPhase {
  if (state.phase === "exited") return "exited";
  if (state.pressure >= 65) return "pressured";
  if (state.pressure >= 42 || state.trust < 46) return "cautious";
  return "relaxed";
}

function pressureDecay(pressure: number) {
  if (pressure <= 40) return 1;
  if (pressure <= 70) return 0.75;
  return 0.5;
}

function makeChange(
  key: NPCStateKey,
  state: NPCState,
  requestedDelta: number,
  reasons: string[],
  formula: string,
): StateChange {
  const before = state[key];
  const after = clamp(before + requestedDelta);
  return {
    key,
    label: stateLabels[key],
    before,
    delta: after - before,
    after,
    reasons,
    formula,
  };
}

function applyChanges(
  initial: NPCState,
  definitions: Array<{
    key: NPCStateKey;
    delta: number;
    reasons: string[];
    formula: string;
  }>,
) {
  const changes: StateChange[] = [];
  const next = cloneNpcState(initial);

  for (const definition of definitions) {
    const change = makeChange(
      definition.key,
      next,
      definition.delta,
      definition.reasons,
      definition.formula,
    );
    next[definition.key] = change.after;
    changes.push(change);
  }

  next.phase = phaseFor(next);
  return { next, changes };
}

function appendTurn(
  before: WorldState,
  next: WorldState,
  input: Omit<TurnRecord, "turn" | "before" | "after">,
) {
  const turn = before.turn + 1;
  const record: TurnRecord = {
    turn,
    before: snapshot(before),
    after: snapshot(next),
    ...input,
  };
  next.turn = turn;
  next.actionHistory = [...before.actionHistory, record];
  return next;
}

function actionPointCost(action: PlayerAction, caseDefinition: CaseDefinition) {
  if (action.kind === "buy" || action.kind === "reject") return 0;
  if (action.kind === "test") return caseDefinition.test.actionPointCost;
  return 1;
}

function ensureActionAllowed(
  state: WorldState,
  action: PlayerAction,
  caseDefinition: CaseDefinition,
) {
  if (state.status !== "active") throw new Error("本局已经结束");
  if (state.npcState.phase === "exited") throw new Error("卖家已经离场");
  const cost = actionPointCost(action, caseDefinition);
  if (state.actionPoints < cost) {
    throw new Error(`行动点不足：需要 ${cost}，当前 ${state.actionPoints}`);
  }
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

function calculatePosterior(
  caseDefinition: CaseDefinition,
  evidenceIds: string[],
  statementHistory: WorldState["statementHistory"] = [],
): PosteriorEntry[] {
  // NPC 回应可以同时生成一张便于阅读的“陈述卡”和一个结构化陈述信号。
  // 两者来自同一次事件，因此陈述卡只负责展示，后验只计算结构化信号一次。
  const independentEvidenceIds = evidenceIds.filter(
    (evidenceId) => caseDefinition.evidence[evidenceId]?.kind !== "statement",
  );
  const uniqueStatementSignals = [
    ...new Map(
      statementHistory.map((statement) => [statement.signalId, statement]),
    ).values(),
  ];
  const weights = truthVariantIds.map((variantId) => {
    const evidenceLikelihood = independentEvidenceIds.reduce((product, evidenceId) => {
      const evidence = caseDefinition.evidence[evidenceId];
      return product * (evidence?.likelihoods[variantId] ?? 1);
    }, 1 / truthVariantIds.length);
    const statementLikelihood = uniqueStatementSignals.reduce(
      (product, statement) =>
        product * (statement.likelihoods[variantId] ?? 1),
      1,
    );
    return {
      variantId,
      weight: evidenceLikelihood * statementLikelihood,
    };
  });
  const total = weights.reduce((sum, entry) => sum + entry.weight, 0) || 1;

  return weights.map(({ variantId, weight }) => {
    const variant = caseDefinition.truthVariants[variantId];
    return {
      variantId,
      label: variant.label,
      probability: weight / total,
      trueValue: variant.trueValue,
    };
  });
}

function discountThreshold(
  caseDefinition: CaseDefinition,
  npcState: NPCState,
) {
  const trustPremium =
    npcState.trust < 45
      ? Math.ceil((45 - npcState.trust) * 0.15)
      : 0;
  const pressurePremium =
    npcState.pressure > 75
      ? Math.ceil((npcState.pressure - 75) * 0.2)
      : 0;
  const intentDiscount =
    npcState.dealIntent > 75
      ? Math.min(5, Math.round((npcState.dealIntent - 75) * 0.15))
      : 0;
  const threshold =
    caseDefinition.npcProfile.reservationPrice
    + trustPremium
    + pressurePremium
    - intentDiscount;
  return { threshold, trustPremium, pressurePremium, intentDiscount };
}

function settlementResult(
  caseDefinition: CaseDefinition,
  state: WorldState,
  choice: SettlementChoice,
  paidPrice: number,
): SettlementResult {
  const truth = caseDefinition.truthVariants[state.truthVariantId];
  const acquired = choice === "buy" || choice === "discount-buy";
  const actualNet = (acquired ? truth.trueValue - paidPrice : 0) - state.feesPaid;
  const initialDiscount = discountThreshold(
    caseDefinition,
    caseDefinition.initialNpcState,
  );
  const oracleOptions = [
    {
      label: "开局直接拒绝",
      net: 0,
    },
    {
      label: `按开价${caseDefinition.seller.openingPrice}买下`,
      net: truth.trueValue - caseDefinition.seller.openingPrice,
    },
  ];
  if (
    caseDefinition.suggestedDiscount < caseDefinition.seller.openingPrice
    && caseDefinition.suggestedDiscount >= initialDiscount.threshold
  ) {
    oracleOptions.push({
      label: `提出界面可用的${caseDefinition.suggestedDiscount}点折价并成交`,
      net: truth.trueValue - caseDefinition.suggestedDiscount,
    });
  }
  const oracleBestNet = Math.max(...oracleOptions.map((option) => option.net));
  const regret = Math.max(0, oracleBestNet - actualNet);
  const stakes = Math.max(caseDefinition.seller.openingPrice, truth.trueValue);
  const objectiveScore = clamp(Math.round(100 - (regret / stakes) * 100));
  const objectiveSuccess = objectiveScore >= 70;
  const objectiveLabel =
    objectiveScore >= 85
      ? "客观成功"
      : objectiveScore >= 70
        ? "基本成功"
        : objectiveScore >= 40
          ? "客观失手"
          : "重大损失";

  const posterior = calculatePosterior(
    caseDefinition,
    state.discoveredEvidenceIds,
    state.statementHistory,
  );
  const expectedValue = posterior.reduce(
    (sum, entry) => sum + entry.probability * entry.trueValue,
    0,
  );
  const buyExpectedNet = expectedValue - (paidPrice || state.currentPrice);
  const chosenExpectedNet = acquired ? buyExpectedNet : 0;
  const bestExpectedNet = Math.max(0, buyExpectedNet);
  const utilityGap = Math.max(0, bestExpectedNet - chosenExpectedNet);
  const strongestPosterior = Math.max(
    ...posterior.map((entry) => entry.probability),
  );
  const uniqueStatementSignalCount = new Set(
    state.statementHistory.map((statement) => statement.signalId),
  ).size;
  const independentEvidenceCount = state.discoveredEvidenceIds.filter(
    (evidenceId) => caseDefinition.evidence[evidenceId]?.kind !== "statement",
  ).length;
  const visibleSignalCount =
    independentEvidenceCount + uniqueStatementSignalCount;
  const uncertaintyPenalty =
    visibleSignalCount === 0
      ? 15
      : strongestPosterior < 0.55
        ? 8
        : 0;
  const unsupportedRiskPenalty =
    acquired && visibleSignalCount === 0 ? 15 : 0;
  const redundantPenalty =
    state.actionHistory.filter((turn) => turn.redundant).length * 4;
  const exitPenalty = choice === "seller-exited" ? 15 : 0;
  const judgmentScore = clamp(
    Math.round(
      100
        - utilityGap * 3
        - uncertaintyPenalty
        - unsupportedRiskPenalty
        - redundantPenalty
        - exitPenalty,
    ),
  );
  const judgmentLabel =
    judgmentScore >= 85
      ? "证据充分"
      : judgmentScore >= 70
        ? "判断合理"
        : judgmentScore >= 50
          ? "依据偏弱"
          : "判断失准";
  const judgmentHigh = judgmentScore >= 70;
  const endingTitle = objectiveSuccess
    ? judgmentHigh
      ? "真正掌眼"
      : "侥幸得手"
    : judgmentHigh
      ? "判断合理，但客观失手"
      : "看走眼";

  const choiceLabel = {
    buy: "按当前价格买下",
    "discount-buy": "折价成交",
    reject: "拒绝交易",
    "seller-exited": "卖家离场",
  }[choice];

  return {
    choice,
    choiceLabel,
    truthVariantId: truth.id,
    truthLabel: truth.label,
    trueValue: truth.trueValue,
    paidPrice,
    feesPaid: state.feesPaid,
    actualNet,
    oracleBestNet,
    regret,
    stakes,
    objectiveScore,
    objectiveSuccess,
    objectiveLabel,
    posterior,
    expectedValue,
    chosenExpectedNet,
    bestExpectedNet,
    utilityGap,
    judgmentScore,
    judgmentLabel,
    endingTitle,
    objectiveFormula: [
      `实际净结果 = ${acquired ? `${truth.trueValue}（真实价值）- ${paidPrice}（成交价）` : "0（未持有器物）"} - ${state.feesPaid}（检测费） = ${actualNet}`,
      `完全知情可达方案 = ${oracleOptions.map((option) => `${option.label}:${option.net}`).join("；")}`,
      `完全知情最佳净结果 = max(${oracleOptions.map((option) => option.net).join(", ")}) = ${oracleBestNet}`,
      `机会损失 = max(0, ${oracleBestNet} - ${actualNet}) = ${regret}`,
      `客观分 = clamp(round(100 - ${regret} ÷ ${stakes} × 100), 0, 100) = ${objectiveScore}`,
      `客观胜利阈值：${objectiveScore} ${objectiveSuccess ? "≥" : "<"} 70`,
    ],
    judgmentFormula: [
      `玩家可见信号 = ${independentEvidenceCount}条物证/检测 + ${uniqueStatementSignalCount}类NPC陈述（同源陈述卡不重复计权）`,
      `玩家可见期望价值 = Σ(后验概率 × 各真相价值) = ${round1(expectedValue)}`,
      `所选方案期望净值 = ${round1(chosenExpectedNet)}；当前最佳期望净值 = ${round1(bestExpectedNet)}`,
      `效用差 = max(0, ${round1(bestExpectedNet)} - ${round1(chosenExpectedNet)}) = ${round1(utilityGap)}`,
      `判断分 = 100 - 效用差×3 - 不确定性${uncertaintyPenalty} - 无依据风险${unsupportedRiskPenalty} - 重复行动${redundantPenalty} - 离场${exitPenalty} = ${judgmentScore}`,
      "判断质量只读取玩家已发现的物证、检测与NPC陈述信号，不读取本局隐藏真相。",
    ],
  };
}

function settle(
  caseDefinition: CaseDefinition,
  state: WorldState,
  choice: SettlementChoice,
  paidPrice: number,
) {
  const next = cloneState(state);
  next.status = "settled";
  next.settlement = settlementResult(caseDefinition, next, choice, paidPrice);
  return next;
}

export function createInitialWorldState(
  caseDefinition: CaseDefinition,
  seed = caseDefinition.seed,
  truthVariantId: TruthVariantId = "restored-genuine",
): WorldState {
  if (!Number.isInteger(seed)) throw new Error("seed 必须是整数");
  if (!caseDefinition.truthVariants[truthVariantId]) {
    throw new Error(`未知真相变体：${truthVariantId}`);
  }

  return {
    caseId: caseDefinition.id,
    seed,
    truthVariantId,
    npcProfileId: caseDefinition.npcProfile.id,
    status: "active",
    turn: 0,
    actionPoints: caseDefinition.actionBudget,
    feesPaid: 0,
    currentPrice: caseDefinition.seller.openingPrice,
    npcState: cloneNpcState(caseDefinition.initialNpcState),
    discoveredEvidenceIds: [],
    inspectedTargetIds: [],
    completedTestIds: [],
    statementHistory: [],
    triggeredStoryletIds: [],
    actionHistory: [],
  };
}

function resolveInspect(
  caseDefinition: CaseDefinition,
  state: WorldState,
  action: Extract<PlayerAction, { kind: "inspect" }>,
) {
  const target = caseDefinition.observationTargets.find(
    (item) => item.id === action.targetId,
  );
  if (!target) throw new Error(`未知观察位置：${action.targetId}`);

  const next = cloneState(state);
  next.actionPoints -= 1;
  const redundant = state.inspectedTargetIds.includes(target.id);
  const evidenceAdded: string[] = [];
  const formulaLog = [
    `行动点 = ${state.actionPoints} - 1 = ${next.actionPoints}`,
  ];

  let title = `复查${target.label}，没有出现新的信息`;
  let description = "复查确认了原有观察，但不会重复生成证据。";

  if (!redundant) {
    next.inspectedTargetIds.push(target.id);
    const result = target.results[state.truthVariantId];
    if (!next.discoveredEvidenceIds.includes(result.evidenceId)) {
      next.discoveredEvidenceIds.push(result.evidenceId);
      evidenceAdded.push(result.evidenceId);
    }
    title = result.title;
    description = result.description;

    const roll = seededUnit(state.seed, state.turn + 1, `inspect:${target.id}`);
    const chance = result.bonusChance ?? 0;
    formulaLog.push(
      `幸运线索判定 = seededRoll(${state.seed}, 第${state.turn + 1}轮, ${target.id}) = ${round1(roll * 100)}%；阈值 ${round1(chance * 100)}%`,
    );
    if (
      result.bonusEvidenceId
      && roll < chance
      && !next.discoveredEvidenceIds.includes(result.bonusEvidenceId)
    ) {
      next.discoveredEvidenceIds.push(result.bonusEvidenceId);
      evidenceAdded.push(result.bonusEvidenceId);
      const bonus = caseDefinition.evidence[result.bonusEvidenceId];
      description += ` 小概率发现：${bonus.name}。`;
      formulaLog.push(`幸运线索命中：新增锚点证据「${bonus.name}」`);
    } else {
      formulaLog.push("幸运线索未命中；基础观察事实仍然保留。");
    }
  } else {
    formulaLog.push("重复位置：不重复发放证据，标记为低效行动。");
  }

  return appendTurn(state, next, {
    action: { ...action },
    actionLabel: `检查${target.label}`,
    actionPointCost: 1,
    changes: [],
    evidenceAdded,
    title,
    description,
    formulaLog,
    redundant,
  });
}

function behaviorCandidate(
  state: WorldState,
  id: NPCBehaviorId,
  eligible: boolean,
  rawComponents: BehaviorCandidate["components"],
  filterReasons: string[],
) {
  const components = rawComponents.map((component) => ({
    ...component,
    value: round1(component.value),
  }));
  const baseScore = round1(
    components.reduce((sum, component) => sum + component.value, 0),
  );
  const randomJitter = eligible ? jitter(state.seed, state.turn + 1, id) : 0;
  const finalScore = eligible ? round1(baseScore + randomJitter) : -999;
  return {
    id,
    label: behaviorLabels[id],
    eligible,
    components,
    baseScore,
    jitter: randomJitter,
    finalScore,
    score: finalScore,
    formula: eligible
      ? `${components.map((component) => `${component.label}${component.value >= 0 ? "+" : ""}${component.value}`).join(" ")} = 基础${baseScore} + seed扰动${randomJitter} = ${finalScore}`
      : `${components.map((component) => `${component.label}${component.value >= 0 ? "+" : ""}${component.value}`).join(" ")} = 基础${baseScore}；硬条件过滤`,
    filterReasons,
    reasons: filterReasons,
  } satisfies BehaviorCandidate;
}

function fixedCandidate(
  id: string,
  label: string,
  eligible: boolean,
  rawComponents: BehaviorCandidate["components"],
  filterReasons: string[],
) {
  const components = rawComponents.map((component) => ({
    ...component,
    value: round1(component.value),
  }));
  const baseScore = round1(
    components.reduce((sum, component) => sum + component.value, 0),
  );
  const finalScore = eligible ? baseScore : -999;
  return {
    id,
    label,
    eligible,
    components,
    baseScore,
    jitter: 0,
    finalScore,
    score: finalScore,
    formula: eligible
      ? `${components.map((component) => `${component.label}${component.value >= 0 ? "+" : ""}${component.value}`).join(" ")} = ${finalScore}`
      : `${components.map((component) => `${component.label}${component.value >= 0 ? "+" : ""}${component.value}`).join(" ")} = 基础${baseScore}；硬条件过滤`,
    filterReasons,
    reasons: filterReasons,
  } satisfies BehaviorCandidate;
}

function chooseBehavior(candidates: BehaviorCandidate[]) {
  const eligible = candidates.filter((candidate) => candidate.eligible);
  if (eligible.length === 0) throw new Error("NPC没有合法候选行为");
  return [...eligible].sort((left, right) => right.score - left.score)[0];
}

function dialogueCandidates(
  state: WorldState,
  nextNpc: NPCState,
  action: DialogueAction,
  evidence: EvidenceDefinition | undefined,
  relevant: boolean,
  repeatCount: number,
  storyletAlreadyTriggered: boolean,
) {
  const power = evidence ? evidencePower[evidence.strength] : 0.5;

  return [
    behaviorCandidate(
      state,
      "cooperate",
      nextNpc.trust >= 40 && nextNpc.dealIntent >= 25,
      [
        { label: "固定", value: 10 },
        { label: "信任×0.35", value: nextNpc.trust * 0.35 },
        { label: "成交×0.25", value: nextNpc.dealIntent * 0.25 },
        { label: "压力×-0.15", value: -nextNpc.pressure * 0.15 },
        { label: "开放询问", value: evidence ? 0 : 8 },
        { label: "重复×-12", value: -repeatCount * 12 },
      ],
      ["信任至少40", "成交意愿至少25"],
    ),
    behaviorCandidate(
      state,
      "deflect",
      nextNpc.control >= 22,
      [
        { label: "固定", value: 8 },
        { label: "控制×0.35", value: nextNpc.control * 0.35 },
        { label: "低压力×0.12", value: (100 - nextNpc.pressure) * 0.12 },
        { label: "弱证据", value: power < 1 ? 6 : 0 },
        { label: "重复×4", value: repeatCount * 4 },
      ],
      ["仍保有叙事控制空间"],
    ),
    behaviorCandidate(
      state,
      "partial-admit",
      Boolean(evidence && relevant && power >= 1 && !storyletAlreadyTriggered),
      [
        { label: "固定", value: 5 },
        { label: "压力×0.28", value: nextNpc.pressure * 0.28 },
        { label: "失控×0.25", value: (100 - nextNpc.control) * 0.25 },
        { label: "成交×0.15", value: nextNpc.dealIntent * 0.15 },
        { label: "证据效力×12", value: power * 12 },
      ],
      [
        evidence ? `引用${evidence.name}` : "没有引用证据",
        relevant ? "证据与问题相关" : "证据与问题不相关",
        storyletAlreadyTriggered ? "一次性承认已触发" : "一次性承认尚未触发",
      ],
    ),
    behaviorCandidate(
      state,
      "counter",
      nextNpc.pressure >= 45 || action.tone === "firm",
      [
        { label: "固定", value: 6 },
        { label: "压力×0.25", value: nextNpc.pressure * 0.25 },
        { label: "不信任×0.22", value: (100 - nextNpc.trust) * 0.22 },
        { label: "控制×0.18", value: nextNpc.control * 0.18 },
        { label: "强硬触发", value: action.tone === "firm" ? 8 : 0 },
      ],
      ["压力达到45或玩家采用强硬表达"],
    ),
    behaviorCandidate(
      state,
      "refuse",
      nextNpc.pressure >= 65 || repeatCount >= 1,
      [
        { label: "固定", value: 4 },
        { label: "压力×0.28", value: nextNpc.pressure * 0.28 },
        { label: "不信任×0.25", value: (100 - nextNpc.trust) * 0.25 },
        { label: "重复×20", value: repeatCount * 20 },
      ],
      ["高压力或完全重复问题"],
    ),
    behaviorCandidate(
      state,
      "exit",
      nextNpc.dealIntent <= 20
        || (nextNpc.pressure >= 82 && nextNpc.trust <= 32),
      [
        { label: "压力×0.3", value: nextNpc.pressure * 0.3 },
        { label: "不信任×0.3", value: (100 - nextNpc.trust) * 0.3 },
        { label: "低成交×0.4", value: (100 - nextNpc.dealIntent) * 0.4 },
      ],
      ["成交意愿≤20，或压力≥82且信任≤32"],
    ),
  ];
}

function dialogueTitle(behaviorId: NPCBehaviorId) {
  return {
    cooperate: "对方补充了可以继续核验的说法",
    deflect: "对方仍试图保持叙事空间",
    "partial-admit": "证据迫使对方收窄原说法",
    counter: "对方开始反向质疑你的判断",
    refuse: "重复或高压让对方拒绝继续回答",
    exit: "关系与成交意愿跌破安全线",
  }[behaviorId];
}

function resolveDialogue(
  caseDefinition: CaseDefinition,
  state: WorldState,
  action: DialogueAction,
) {
  const topic = caseDefinition.dialogueTopics.find(
    (item) => item.id === action.topicId,
  );
  if (!topic) throw new Error(`未知询问主题：${action.topicId}`);

  const evidence = getEvidence(caseDefinition, action.evidenceId);
  if (
    evidence
    && !state.discoveredEvidenceIds.includes(evidence.id)
  ) {
    throw new Error("不能引用尚未发现的证据");
  }
  const relevant = Boolean(
    evidence
    && (
      topic.evidenceTopics.includes(evidence.topic)
      || evidence.contradicts ===
        caseDefinition.claims.find((claim) => claim.topic === topic.label)?.id
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

  const resolved = applyChanges(state.npcState, [
    {
      key: "pressure",
      delta: pressureDelta,
      reasons: [
        evidence ? `引用${evidence.name}` : "开放询问不要求证据",
        `态度：${toneLabels[action.tone]}`,
        `完全重复 ${repeatCount} 次`,
      ],
      formula: `round(基础${evidence ? 10 : 3} × 态度${tonePressure[action.tone]} × 证据${power} × 相关${relevanceFactor} × 衰减${decay} + 情境${contextModifier} + 重复${repeatCount}) = ${pressureDelta}`,
    },
    {
      key: "trust",
      delta: trustDelta,
      reasons: [
        `${toneLabels[action.tone]}表达`,
        evidence ? (relevant ? "证据与问题相关" : "引用无关证据") : "先固定原始说法",
        repeatCount ? "重复追问损害合作感" : "首次采用该行动组合",
      ],
      formula: `态度基础 + 开放询问修正 + 相关性修正 - 重复${repeatCount}×2 = ${trustDelta}`,
    },
    {
      key: "dealIntent",
      delta: dealIntentDelta,
      reasons: [
        evidence ? "证据提高卖家承担的交易风险" : "普通询问保持交易空间",
        repeatCount ? "重复行动降低耐心" : "无重复惩罚",
      ],
      formula: `态度基础 - 证据${evidence ? round1(power * 2) : 0} - 重复${repeatCount}×2 = ${dealIntentDelta}`,
    },
    {
      key: "control",
      delta: controlDelta,
      reasons: [
        evidence ? "相关证据压缩叙事空间" : "开放询问让卖家保留主动叙述空间",
      ],
      formula: evidence
        ? `-round(10 × 态度${tonePressure[action.tone]} × 证据${power} × 相关${relevanceFactor}) - 重复${repeatCount} = ${controlDelta}`
        : `开放询问态度修正 = ${controlDelta}`,
    },
  ]);

  const storyletId = `${topic.id}:partial-admit`;
  const storyletAlreadyTriggered =
    state.triggeredStoryletIds.includes(storyletId);
  const candidates = dialogueCandidates(
    state,
    resolved.next,
    action,
    evidence,
    relevant,
    repeatCount,
    storyletAlreadyTriggered,
  );
  const selected = chooseBehavior(candidates);
  const selectedId = selected.id as NPCBehaviorId;
  const next = cloneState(state);
  next.actionPoints -= 1;
  next.npcState = resolved.next;
  const changes = [...resolved.changes];

  if (selectedId === "exit") {
    const exitChange = makeChange(
      "dealIntent",
      next.npcState,
      -next.npcState.dealIntent,
      ["NPC行为收敛为离场"],
      `成交意愿 ${next.npcState.dealIntent} → 0`,
    );
    next.npcState.dealIntent = 0;
    next.npcState.phase = "exited";
    changes.push(exitChange);
  }

  const statementSignal = topic.signals[selectedId];
  const statement = {
    turn: state.turn + 1,
    topicId: topic.id,
    behaviorId: selectedId,
    text: topic.responses[selectedId],
    signalId: statementSignal.id,
    signalLabel: statementSignal.label,
    likelihoods: { ...statementSignal.likelihoods },
  };
  next.statementHistory.push(statement);
  const evidenceAdded: string[] = [];
  if (selectedId === "partial-admit") {
    if (!next.triggeredStoryletIds.includes(storyletId)) {
      next.triggeredStoryletIds.push(storyletId);
    }
    if (
      topic.responseEvidenceId
      && !next.discoveredEvidenceIds.includes(topic.responseEvidenceId)
    ) {
      next.discoveredEvidenceIds.push(topic.responseEvidenceId);
      evidenceAdded.push(topic.responseEvidenceId);
    }
  }

  const spindle: SpindleTrace = {
    expansion: [
      `问题：${topic.label}`,
      `态度：${toneLabels[action.tone]}`,
      `证据：${evidence?.name ?? "无（开放询问）"}`,
      `证据效力：${power}；相关性：${relevanceFactor}`,
      `当前历史：同签名重复 ${repeatCount} 次`,
      `数值入口：压力${state.npcState.pressure} / 信任${state.npcState.trust} / 成交${state.npcState.dealIntent} / 控制${state.npcState.control}`,
    ],
    candidates,
    selectedId,
    selectedLabel: behaviorLabels[selectedId],
    convergence: [
      `选择最高合法效用：${selected.label} ${selected.score}`,
      selectedId === "partial-admit"
        ? `命中一次性Storylet：${storyletId}`
        : "未命中事实承认Storylet",
      `收敛为有限模板：${statement.text}`,
      `写入可见陈述信号：${statement.signalLabel}`,
    ],
  };

  let completed = next;
  if (selectedId === "exit") {
    completed = settle(caseDefinition, next, "seller-exited", 0);
  }

  return appendTurn(state, completed, {
    action: { ...action },
    actionLabel: `${evidence ? "引用证据追问" : "开放询问"} · ${topic.label} · ${toneLabels[action.tone]}`,
    actionPointCost: 1,
    changes,
    evidenceAdded,
    statement,
    title: dialogueTitle(selectedId),
    description: statement.text,
    formulaLog: [
      `行动点 = ${state.actionPoints} - 1 = ${next.actionPoints}`,
      ...changes.map((change) => `${change.label}：${change.formula}`),
      `陈述信号：${statement.signalLabel}；似然 ${truthVariantIds.map((variantId) => `${variantId}=${statement.likelihoods[variantId]}`).join(" / ")}`,
      `候选行为 = 过滤合法性后取最高分；seed扰动范围 [-1.5, +1.5]`,
    ],
    spindle,
    redundant: repeatCount > 0,
  });
}

export function getTestConsent(
  caseDefinition: CaseDefinition,
  state: WorldState,
) {
  const test = caseDefinition.test;
  const consentScore = round1(
    state.npcState.trust * 0.35
      + state.npcState.dealIntent * 0.45
      + (100 - state.npcState.pressure) * 0.15
      + (100 - state.npcState.control) * 0.05,
  );
  const reasons: string[] = [];
  if (state.completedTestIds.includes(test.id)) reasons.push("本维度已经检测");
  if (state.actionPoints < test.actionPointCost) reasons.push("行动点不足");
  if (state.npcState.phase === "exited") reasons.push("卖家已经离场");
  if (consentScore < 50) reasons.push(`NPC同意分 ${consentScore} < 50`);
  return {
    allowed:
      state.status === "active"
      && reasons.length === 0,
    consentScore,
    reasons,
    formula: `信任${state.npcState.trust}×0.35 + 成交${state.npcState.dealIntent}×0.45 + (100-压力${state.npcState.pressure})×0.15 + (100-控制${state.npcState.control})×0.05 = ${consentScore}`,
  };
}

function resolveTest(
  caseDefinition: CaseDefinition,
  state: WorldState,
  action: Extract<PlayerAction, { kind: "test" }>,
) {
  if (action.testId !== caseDefinition.test.id) {
    throw new Error(`未知检测：${action.testId}`);
  }
  const consent = getTestConsent(caseDefinition, state);
  if (!consent.allowed) {
    throw new Error(`当前不能送检：${consent.reasons.join("；")}`);
  }

  const test = caseDefinition.test;
  const evidenceId = test.evidenceByVariant[state.truthVariantId];
  const evidence = caseDefinition.evidence[evidenceId];
  const resolved = applyChanges(state.npcState, [
    {
      key: "pressure",
      delta: 2,
      reasons: ["送检把口头判断变为外部核验"],
      formula: "送检固定压力修正 +2",
    },
    {
      key: "trust",
      delta: 1,
      reasons: ["检测条件透明且双方共同确认"],
      formula: "透明检测协议固定信任修正 +1",
    },
    {
      key: "dealIntent",
      delta: -6,
      reasons: ["等待检测增加时间和机会成本"],
      formula: "送检延迟固定成交意愿修正 -6",
    },
    {
      key: "control",
      delta: -4,
      reasons: ["第三方结果压缩双方叙事空间"],
      formula: "外部核验固定控制感修正 -4",
    },
  ]);

  const next = cloneState(state);
  next.actionPoints -= test.actionPointCost;
  next.feesPaid += test.valueCost;
  next.npcState = resolved.next;
  next.completedTestIds.push(test.id);
  if (!next.discoveredEvidenceIds.includes(evidenceId)) {
    next.discoveredEvidenceIds.push(evidenceId);
  }

  const spindle: SpindleTrace = {
    expansion: [
      `检测项目：${test.label}`,
      `行动点成本：${test.actionPointCost}`,
      `价值成本：${test.valueCost}`,
      `当前NPC状态：压力${state.npcState.pressure} / 信任${state.npcState.trust} / 成交${state.npcState.dealIntent} / 控制${state.npcState.control}`,
    ],
    candidates: [
      fixedCandidate(
        "approve-test",
        "同意专项检测",
        true,
        [
          { label: "信任×0.35", value: state.npcState.trust * 0.35 },
          { label: "成交×0.45", value: state.npcState.dealIntent * 0.45 },
          { label: "低压力×0.15", value: (100 - state.npcState.pressure) * 0.15 },
          { label: "失控×0.05", value: (100 - state.npcState.control) * 0.05 },
        ],
        ["同意分达到50"],
      ),
      fixedCandidate(
        "reject-test",
        "拒绝专项检测",
        false,
        [
          { label: "固定", value: 100 },
          { label: "同意分", value: -consent.consentScore },
        ],
        ["同意分未低于50，因此本候选被过滤"],
      ),
    ],
    selectedId: "approve-test",
    selectedLabel: "同意专项检测",
    convergence: [
      "NPC同意把一个维度交给第三方核验",
      `检测只新增「${evidence.name}」，不直接给出整件器物价值`,
      "检测后案件继续，玩家仍需购买、折价或拒绝",
    ],
  };

  return appendTurn(state, next, {
    action: { ...action },
    actionLabel: `付费专项检测 · ${test.label}`,
    actionPointCost: test.actionPointCost,
    changes: resolved.changes,
    evidenceAdded: [evidenceId],
    title: `检测完成：${evidence.name}`,
    description: `${evidence.detail} ${evidence.inference}`,
    formulaLog: [
      `行动点 = ${state.actionPoints} - ${test.actionPointCost} = ${next.actionPoints}`,
      `累计检测费 = ${state.feesPaid} + ${test.valueCost} = ${next.feesPaid}`,
      `NPC同意判定：${consent.formula}，达到阈值50`,
      ...resolved.changes.map((change) => `${change.label}：${change.formula}`),
    ],
    spindle,
    redundant: false,
  });
}

function resolveDiscount(
  caseDefinition: CaseDefinition,
  state: WorldState,
  action: Extract<PlayerAction, { kind: "discount" }>,
) {
  if (!Number.isInteger(action.offer) || action.offer <= 0) {
    throw new Error("折价报价必须是正整数");
  }
  if (action.offer >= state.currentPrice) {
    throw new Error("折价报价必须低于当前价格");
  }

  const {
    threshold: acceptanceThreshold,
    trustPremium,
    pressurePremium,
    intentDiscount,
  } = discountThreshold(caseDefinition, state.npcState);
  const gap = acceptanceThreshold - action.offer;
  const lowOffer = Math.max(0, state.currentPrice - action.offer);
  const resolved = applyChanges(state.npcState, [
    {
      key: "pressure",
      delta: clamp(Math.round(lowOffer / 8), 2, 8),
      reasons: ["报价低于当前价格"],
      formula: `clamp(round(差价${lowOffer}÷8), 2, 8)`,
    },
    {
      key: "trust",
      delta: gap > 8 ? -5 : gap > 0 ? -2 : 1,
      reasons: [gap > 8 ? "报价明显低于可接受线" : "报价仍在可协商范围"],
      formula: `报价差额 ${gap} 对应信任修正 ${gap > 8 ? -5 : gap > 0 ? -2 : 1}`,
    },
    {
      key: "dealIntent",
      delta: gap > 8 ? -8 : gap > 0 ? -3 : 1,
      reasons: [gap > 8 ? "过低报价降低继续交易意愿" : "报价接近可接受条件"],
      formula: `报价差额 ${gap} 对应成交修正 ${gap > 8 ? -8 : gap > 0 ? -3 : 1}`,
    },
    {
      key: "control",
      delta: gap <= 0 ? -4 : -1,
      reasons: ["正式报价迫使卖家表明底线"],
      formula: `报价是否达线 ${gap <= 0 ? "是" : "否"} → ${gap <= 0 ? -4 : -1}`,
    },
  ]);

  const next = cloneState(state);
  next.actionPoints -= 1;
  next.npcState = { ...resolved.next, phase: "negotiating" };

  const exitEligible =
    gap > 15
    && (
      next.npcState.trust < 40
      || next.npcState.dealIntent < 40
      || next.npcState.pressure > 75
    );
  const candidates: BehaviorCandidate[] = [
    fixedCandidate(
      "accept-offer",
      "接受报价",
      gap <= 0,
      [
        { label: "固定", value: 90 },
        { label: "报价余量", value: -Math.abs(gap) },
      ],
      [gap <= 0 ? "报价达到可接受线" : "报价未达到可接受线"],
    ),
    fixedCandidate(
      "counter-offer",
      "提出还价",
      gap > 0 && gap <= 8,
      [
        { label: "固定", value: 82 },
        { label: "报价差额", value: -gap },
      ],
      ["差额在1—8之间"],
    ),
    fixedCandidate(
      "reject-offer",
      "拒绝报价",
      gap > 8,
      [
        { label: "固定", value: 72 },
        { label: "差额推动", value: Math.min(gap, 20) },
      ],
      ["报价明显低于接受线"],
    ),
    fixedCandidate(
      "exit",
      "结束交易",
      exitEligible,
      [{ label: "离场固定效用", value: 95 }],
      ["差额>15，且信任<40、成交<40或压力>75"],
    ),
  ];
  const selected = chooseBehavior(candidates);
  let title = "卖家拒绝了本次报价";
  let description = "报价没有达到卖家的当前接受线，仍可按现价购买或拒绝。";
  let completed = next;

  if (selected.id === "accept-offer") {
    title = `卖家接受 ${action.offer} 点报价`;
    description = "折价成交，进入客观结果与判断质量结算。";
    completed.currentPrice = action.offer;
    completed = settle(caseDefinition, completed, "discount-buy", action.offer);
  } else if (selected.id === "counter-offer") {
    const counterPrice = Math.max(
      acceptanceThreshold,
      Math.round((state.currentPrice + action.offer) / 2),
    );
    completed.currentPrice = counterPrice;
    title = `卖家还价至 ${counterPrice} 点`;
    description = "新的当前价格已经记录，可以继续调查、接受现价或拒绝。";
  } else if (selected.id === "exit") {
    completed.npcState = {
      ...completed.npcState,
      dealIntent: 0,
      phase: "exited",
    };
    title = "过低报价触发卖家离场";
    description = "案件进入复盘，不会停在无法操作的页面。";
    completed = settle(caseDefinition, completed, "seller-exited", 0);
  }

  const spindle: SpindleTrace = {
    expansion: [
      `玩家报价：${action.offer}`,
      `NPC认知档案：${caseDefinition.npcProfile.label}`,
      `卖家底价：${caseDefinition.npcProfile.reservationPrice}（局末调试解锁）`,
      `信任溢价：${trustPremium}；压力溢价：${pressurePremium}；高成交减让：${intentDiscount}`,
      `当前NPC状态：压力${state.npcState.pressure} / 信任${state.npcState.trust} / 成交${state.npcState.dealIntent} / 控制${state.npcState.control}`,
    ],
    candidates,
    selectedId: selected.id,
    selectedLabel: selected.label,
    convergence: [
      `接受线 = ${caseDefinition.npcProfile.reservationPrice} + ${trustPremium} + ${pressurePremium} - ${intentDiscount} = ${acceptanceThreshold}`,
      `报价差额 = ${acceptanceThreshold} - ${action.offer} = ${gap}`,
      `收敛结果：${selected.label}`,
    ],
  };

  return appendTurn(state, completed, {
    action: { ...action },
    actionLabel: `提出折价 · ${action.offer} 点`,
    actionPointCost: 1,
    changes: resolved.changes,
    evidenceAdded: [],
    title,
    description,
    formulaLog: [
      `行动点 = ${state.actionPoints} - 1 = ${next.actionPoints}`,
      `接受线 = 底价${caseDefinition.npcProfile.reservationPrice} + 信任溢价${trustPremium} + 压力溢价${pressurePremium} - 高成交减让${intentDiscount} = ${acceptanceThreshold}`,
      ...resolved.changes.map((change) => `${change.label}：${change.formula}`),
    ],
    spindle,
    redundant: state.actionHistory.some(
      (turn) => turn.action.kind === "discount" && turn.action.offer === action.offer,
    ),
  });
}

function resolveTerminal(
  caseDefinition: CaseDefinition,
  state: WorldState,
  action: Extract<PlayerAction, { kind: "buy" | "reject" }>,
) {
  const choice: SettlementChoice = action.kind;
  const paidPrice = action.kind === "buy" ? state.currentPrice : 0;
  const next = settle(caseDefinition, cloneState(state), choice, paidPrice);
  const settlement = next.settlement!;
  return appendTurn(state, next, {
    action: { ...action },
    actionLabel: action.kind === "buy" ? `按 ${state.currentPrice} 点买下` : "拒绝交易",
    actionPointCost: 0,
    changes: [],
    evidenceAdded: [],
    title: settlement.endingTitle,
    description: `${settlement.objectiveLabel}；${settlement.judgmentLabel}。`,
    formulaLog: [
      "购买与拒绝是零行动点终局动作，因此行动点耗尽也不会死锁。",
      ...settlement.objectiveFormula,
      ...settlement.judgmentFormula,
    ],
    redundant: false,
  });
}

export function resolveTurn(
  caseDefinition: CaseDefinition,
  state: WorldState,
  action: PlayerAction,
): WorldState {
  ensureActionAllowed(state, action, caseDefinition);
  if (action.kind === "inspect") {
    return resolveInspect(caseDefinition, state, action);
  }
  if (action.kind === "dialogue") {
    return resolveDialogue(caseDefinition, state, action);
  }
  if (action.kind === "test") {
    return resolveTest(caseDefinition, state, action);
  }
  if (action.kind === "discount") {
    return resolveDiscount(caseDefinition, state, action);
  }
  return resolveTerminal(caseDefinition, state, action);
}

export function replayActions(
  caseDefinition: CaseDefinition,
  actions: PlayerAction[],
  seed = caseDefinition.seed,
  truthVariantId: TruthVariantId = "restored-genuine",
) {
  return actions.reduce(
    (state, action) => resolveTurn(caseDefinition, state, action),
    createInitialWorldState(caseDefinition, seed, truthVariantId),
  );
}

export function getDiscoveredEvidence(
  caseDefinition: CaseDefinition,
  state: WorldState,
) {
  return state.discoveredEvidenceIds
    .map((id) => caseDefinition.evidence[id])
    .filter((item): item is EvidenceDefinition => Boolean(item));
}

export function getStateLabels() {
  return { ...stateLabels };
}

export function getTruthForDebug(
  caseDefinition: CaseDefinition,
  state: WorldState,
) {
  return caseDefinition.truthVariants[state.truthVariantId];
}

export { calculatePosterior };
