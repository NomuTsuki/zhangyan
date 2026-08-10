import type {
  ActionTone,
  BehaviorCandidate,
  CaseDefinition,
  DialogueAction,
  EvidenceDefinition,
  EvidenceStrength,
  NegotiationState,
  NPCBehaviorId,
  NPCPhase,
  NPCState,
  NPCStateKey,
  PlayerAction,
  PosteriorEntry,
  PriceChange,
  SettlementChoice,
  SettlementResult,
  SpindleTrace,
  StatementRecord,
  StateChange,
  StateSnapshot,
  TruthVariantId,
  TurnRecord,
  WorldState,
} from "./types";
import { TRUTH_VARIANT_IDS } from "./types.ts";
import {
  calculateNpcPosterior,
  calculatePosterior,
  posteriorEntropy,
  posteriorExpectedValue,
  posteriorQuantile,
} from "./belief.ts";
export { calculateNpcPosterior, calculatePosterior };
import { calculateNegotiationCapacity } from "./negotiation.ts";
import { calculateOutcomeGrades, gradeIndex } from "./outcome-grades.ts";
import { calculateJudgmentQuality } from "./judgment-quality.ts";
import { DEFAULT_RULESET_IDENTITY } from "./ruleset.ts";
import {
  ceilToTick,
  clamp,
  floorToTick,
  round1,
  roundToTick,
} from "./numeric.ts";
import { behaviorJitter, seededUnit } from "./random.ts";

const truthVariantIds = TRUTH_VARIANT_IDS;

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

function cloneNpcState(state: NPCState): NPCState {
  return { ...state };
}

function cloneState(state: WorldState): WorldState {
  return {
    ...state,
    npcState: cloneNpcState(state.npcState),
    negotiation: state.negotiation ? { ...state.negotiation } : null,
    discoveredEvidenceIds: [...state.discoveredEvidenceIds],
    sharedEvidenceIds: [...state.sharedEvidenceIds],
    npcPosterior: state.npcPosterior.map((item) => ({ ...item })),
    priceHistory: state.priceHistory.map((item) => ({
      ...item,
      reasons: [...item.reasons],
    })),
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
          gradeFormula: [...state.settlement.gradeFormula],
          judgmentBreakdown: {
            ...state.settlement.judgmentBreakdown,
            supportingSignalIds: [
              ...state.settlement.judgmentBreakdown.supportingSignalIds,
            ],
            independentSourceGroups: [
              ...state.settlement.judgmentBreakdown.independentSourceGroups,
            ],
            coveredDimensions: [
              ...state.settlement.judgmentBreakdown.coveredDimensions,
            ],
            missingDimensions: [
              ...state.settlement.judgmentBreakdown.missingDimensions,
            ],
            formula: [...state.settlement.judgmentBreakdown.formula],
          },
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
    negotiation: state.negotiation ? { ...state.negotiation } : null,
    evidenceCount: state.discoveredEvidenceIds.length,
    sharedEvidenceCount: state.sharedEvidenceIds.length,
    npcPosterior: state.npcPosterior.map((item) => ({ ...item })),
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
  input: Omit<
    TurnRecord,
    "turn" | "before" | "after" | "negotiationCapacityCost"
  > & {
    negotiationCapacityCost?: number;
  },
) {
  const turn = before.turn + 1;
  const record: TurnRecord = {
    turn,
    before: snapshot(before),
    after: snapshot(next),
    ...input,
    negotiationCapacityCost: input.negotiationCapacityCost ?? 0,
  };
  next.turn = turn;
  next.actionHistory = [...before.actionHistory, record];
  return next;
}

function investigationPointCost(
  action: PlayerAction,
  caseDefinition: CaseDefinition,
) {
  if (action.kind === "buy" || action.kind === "reject") return 0;
  if (action.kind === "discount" || action.kind === "buyout") return 0;
  if (action.kind === "test") return caseDefinition.test.actionPointCost;
  return 1;
}

function negotiationCapacityCost(action: PlayerAction) {
  return action.kind === "discount" || action.kind === "buyout" ? 1 : 0;
}

function ensureActionAllowed(
  state: WorldState,
  action: PlayerAction,
  caseDefinition: CaseDefinition,
) {
  if (state.status !== "active") throw new Error("本局已经结束");
  if (state.npcState.phase === "exited") throw new Error("卖家已经离场");
  if (
    state.negotiation
    && (
      action.kind === "inspect"
      || action.kind === "dialogue"
      || action.kind === "test"
    )
  ) {
    throw new Error("正式议价已经开始，不能返回调查");
  }
  const investigationCost = investigationPointCost(action, caseDefinition);
  if (state.actionPoints < investigationCost) {
    throw new Error(
      `行动点不足：需要 ${investigationCost}，当前 ${state.actionPoints}`,
    );
  }
  const bargainingCost = negotiationCapacityCost(action);
  const bargainingRemaining =
    state.negotiation?.remainingCapacity
    ?? calculateNegotiationCapacity(state.npcState).capacity;
  if (bargainingRemaining < bargainingCost) {
    throw new Error(
      `议价容量不足：需要 ${bargainingCost}，当前 ${bargainingRemaining}`,
    );
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

export type NpcStance =
  | "cooperative"
  | "neutral"
  | "guarded"
  | "resistant";

export function getNpcStance(npcState: NPCState) {
  const controlFit = 100 - Math.abs(npcState.control - 50);
  const score = round1(
    npcState.trust * 0.4
      + npcState.dealIntent * 0.35
      + (100 - npcState.pressure) * 0.15
      + controlFit * 0.1,
  );
  const stance: NpcStance =
    score >= 68
      ? "cooperative"
      : score >= 52
        ? "neutral"
        : score >= 38
          ? "guarded"
          : "resistant";
  return { stance, score };
}

export function getNpcPricing(
  caseDefinition: CaseDefinition,
  state: WorldState,
) {
  const posterior = state.npcPosterior;
  const q10 = posteriorQuantile(posterior, 0.1);
  const q25 = posteriorQuantile(posterior, 0.25);
  const q50 = posteriorQuantile(posterior, 0.5);
  const q75 = posteriorQuantile(posterior, 0.75);
  const expectedValue = posteriorExpectedValue(posterior);
  const subjectiveCenter = q50 * 0.6 + expectedValue * 0.4;
  const spread = Math.max(0, (q75 - q25) / 2);
  const profile = caseDefinition.npcProfile;
  const outsideOption = Math.max(profile.outsideOption, q10 * 0.8);
  const certaintyEquivalent = Math.max(
    outsideOption,
    subjectiveCenter
      - profile.riskAversion * 0.25 * spread
      - profile.urgency * 0.06 * subjectiveCenter,
  );
  const { stance, score: stanceScore } = getNpcStance(state.npcState);
  const stanceMultiplier: Record<NpcStance, number> = {
    cooperative: 0.94,
    neutral: 1,
    guarded: 1.08,
    resistant: 1.2,
  };
  const uncappedAcceptLine = ceilToTick(
    Math.max(outsideOption, certaintyEquivalent * stanceMultiplier[stance]),
  );
  const acceptLine = Math.min(state.currentPrice, uncappedAcceptLine);
  const certaintyDiscount =
    profile.riskAversion
    * profile.urgency
    * Math.max(0, q75 - q25)
    * 0.08;
  const buyoutLine = Math.min(
    acceptLine,
    floorToTick(Math.max(outsideOption, acceptLine - certaintyDiscount)),
  );
  const targetAsk = Math.max(
    acceptLine,
    roundToTick(
      Math.max(
        outsideOption,
        subjectiveCenter * (1 + profile.markup) * stanceMultiplier[stance],
      ),
    ),
  );
  return {
    posterior,
    q10,
    q25,
    q50,
    q75,
    expectedValue,
    subjectiveCenter,
    spread,
    entropy: posteriorEntropy(posterior),
    outsideOption,
    certaintyEquivalent,
    stance,
    stanceScore,
    stanceMultiplier: stanceMultiplier[stance],
    acceptLine,
    buyoutLine,
    targetAsk,
    formula: [
      `主观中枢 = 0.6×Q50(${q50}) + 0.4×期望值(${round1(expectedValue)}) = ${round1(subjectiveCenter)}`,
      `确定性等价 = max(外部选项${round1(outsideOption)}, 主观中枢${round1(subjectiveCenter)} - 风险折减${round1(profile.riskAversion * 0.25 * spread)} - 急售折减${round1(profile.urgency * 0.06 * subjectiveCenter)}) = ${round1(certaintyEquivalent)}`,
      `普通接受线 = min(当前报价${state.currentPrice}, 向上取整5(max(外部选项, 确定性等价×立场${stanceMultiplier[stance]}))) = ${acceptLine}`,
      `无条件买断线 = 向下取整5(max(外部选项, 普通线 - 风险转移折价${round1(certaintyDiscount)})) = ${buyoutLine}`,
    ],
  };
}

export function getPlayerReferenceOffer(
  caseDefinition: CaseDefinition,
  state: WorldState,
) {
  const posterior = calculatePosterior(
    caseDefinition,
    state.discoveredEvidenceIds,
    state.statementHistory,
  );
  const q20 = posteriorQuantile(posterior, 0.2);
  const q50 = posteriorQuantile(posterior, 0.5);
  const expectedValue = posteriorExpectedValue(posterior);
  const safetyMargin = Math.max(5, q50 * 0.08);
  const suggestedOffer = floorToTick(
    Math.max(5, q20 - state.feesPaid - safetyMargin),
  );
  return {
    posterior,
    q20,
    q50,
    expectedValue,
    entropy: posteriorEntropy(posterior),
    safetyMargin,
    suggestedOffer,
    formula: `谨慎参考 = 向下取整5(max(5, 后验Q20(${q20}) - 已付检测费${state.feesPaid} - 安全垫${round1(safetyMargin)})) = ${suggestedOffer}`,
  };
}

function dominantVariant(posterior: PosteriorEntry[]) {
  return [...posterior].sort(
    (left, right) => right.probability - left.probability,
  )[0]?.variantId;
}

function refreshNpcPricing(
  caseDefinition: CaseDefinition,
  before: WorldState,
  next: WorldState,
  force = false,
): PriceChange | undefined {
  if (next.priceHistory.length >= 2) return undefined;
  const beforeExpected = posteriorExpectedValue(before.npcPosterior);
  const afterExpected = posteriorExpectedValue(next.npcPosterior);
  const relativeShift =
    beforeExpected > 0
      ? Math.abs(afterExpected / beforeExpected - 1)
      : 0;
  const beforeMedian = posteriorQuantile(before.npcPosterior, 0.5);
  const afterMedian = posteriorQuantile(next.npcPosterior, 0.5);
  const dominantChanged =
    dominantVariant(before.npcPosterior) !== dominantVariant(next.npcPosterior);
  const beforeStance = getNpcStance(before.npcState).stance;
  const afterStance = getNpcStance(next.npcState).stance;
  const stanceChanged = beforeStance !== afterStance;
  if (
    !force
    && relativeShift < 0.08
    && beforeMedian === afterMedian
    && !dominantChanged
    && !stanceChanged
  ) {
    return undefined;
  }

  const pricing = getNpcPricing(caseDefinition, next);
  const repriced = roundToTick(
    next.currentPrice * 0.1 + pricing.targetAsk * 0.9,
  );
  if (repriced === next.currentPrice) return undefined;
  const reasons: string[] = [];
  if (force) reasons.push("共同检测产生了双方都能核验的新事实");
  if (relativeShift >= 0.08) {
    reasons.push(
      `共享信息使卖家主观估值移动${round1(relativeShift * 100)}%`,
    );
  }
  if (dominantChanged || beforeMedian !== afterMedian) {
    reasons.push("卖家对器物最可能类型的判断发生跨档变化");
  }
  if (stanceChanged) {
    reasons.push(`谈判立场由${beforeStance}转为${afterStance}`);
  }
  const event: PriceChange = {
    turn: before.turn + 1,
    before: next.currentPrice,
    after: repriced,
    publicReason: force
      ? "共同检测出现了双方都能核验的新事实，卖家据此重新估价。"
      : afterExpected < beforeExpected
        ? "你公开的新事实让卖家重新考虑修复与价值风险。"
        : afterExpected > beforeExpected
          ? "你公开的新事实让卖家重新评估器物的年代与价值。"
          : "谈判立场发生变化，卖家重新表明当前报价。",
    reasons,
  };
  next.currentPrice = repriced;
  next.priceHistory.push(event);
  return event;
}

function settlementResult(
  caseDefinition: CaseDefinition,
  state: WorldState,
  choice: SettlementChoice,
  paidPrice: number,
  oracleDealFloor: number,
): SettlementResult {
  const truth = caseDefinition.truthVariants[state.truthVariantId];
  const acquired =
    choice === "buy"
    || choice === "discount-buy"
    || choice === "buyout-buy";
  const actualNet = acquired
    ? truth.trueValue - paidPrice - state.feesPaid
    : 0;
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
  if (oracleDealFloor < caseDefinition.seller.openingPrice) {
    oracleOptions.push({
      label: `完全知情时按${oracleDealFloor}点最低可达买断线成交`,
      net: truth.trueValue - oracleDealFloor,
    });
  }
  const oracleBestNet = Math.max(...oracleOptions.map((option) => option.net));
  const regret = Math.max(0, oracleBestNet - actualNet);
  const stakes = Math.max(caseDefinition.seller.openingPrice, truth.trueValue);

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
  const judgmentBreakdown = calculateJudgmentQuality({
    caseDefinition,
    posterior,
    discoveredEvidenceIds: state.discoveredEvidenceIds,
    statementHistory: state.statementHistory,
    utilityGap,
    redundantActionCount: state.actionHistory.filter((turn) => turn.redundant)
      .length,
    sellerExited: choice === "seller-exited",
  });
  const entryAsk = state.negotiation?.entryAsk ?? state.currentPrice;
  const entryFloor =
    state.negotiation?.entryFloor
    ?? getNpcPricing(caseDefinition, state).acceptLine;
  const grades = calculateOutcomeGrades({
    qualityGrade: truth.qualityGrade,
    qualityCap: truth.overallGradeCap,
    acquired,
    trueValue: truth.trueValue,
    actualNet,
    paidPrice,
    entryAsk,
    entryFloor,
    judgmentScore: judgmentBreakdown.rawScore,
    judgmentGrade: judgmentBreakdown.finalGrade,
  });
  const outcomeLabel = {
    profitable: "盈利成交",
    "break-even": "持平成交",
    loss: "客观亏损",
    "correct-avoidance": "正确避损",
    "missed-opportunity": "错失机会",
  }[grades.outcomeTag];
  const judgmentHigh =
    gradeIndex(grades.judgmentGrade) >= gradeIndex("A");
  const endingTitle =
    grades.outcomeTag === "profitable"
      ? judgmentHigh
        ? "真正掌眼"
        : "险中得手"
      : grades.outcomeTag === "correct-avoidance"
        ? "识险止损"
        : grades.outcomeTag === "break-even"
          ? "保本收场"
          : grades.outcomeTag === "missed-opportunity"
            ? judgmentHigh
              ? "判断有据，仍错过机会"
              : "线索尚未收束"
            : judgmentHigh
              ? "判断有据，交易失手"
              : "看走眼";

  const choiceLabel = {
    buy: "按当前价格买下",
    "discount-buy": "折价成交",
    "buyout-buy": "无条件买断成交",
    "buyout-rejected": "无条件买断被拒",
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
    overallGrade: grades.overallGrade,
    qualityGrade: grades.qualityGrade,
    qualityCap: grades.qualityCap,
    netGrade: grades.netGrade,
    bargainingGrade: grades.bargainingGrade,
    judgmentGrade: judgmentBreakdown.finalGrade,
    outcomeTag: grades.outcomeTag,
    outcomeLabel,
    rawOverallIndex: grades.rawOverallIndex,
    cappedOverallIndex: grades.cappedOverallIndex,
    posterior,
    expectedValue,
    chosenExpectedNet,
    bestExpectedNet,
    utilityGap,
    judgmentScore: judgmentBreakdown.rawScore,
    judgmentLabel: judgmentBreakdown.playerLabel,
    judgmentBreakdown,
    endingTitle,
    objectiveFormula: [
      acquired
        ? `实际净结果 = ${truth.trueValue}（真实价值）- ${paidPrice}（成交价）- ${state.feesPaid}（检测费） = ${actualNet}`
        : `未成交净结果 = 0；已发生检测费 ${state.feesPaid} 在调试成本中单列`,
      `完全知情可达方案 = ${oracleOptions.map((option) => `${option.label}:${option.net}`).join("；")}`,
      `完全知情最佳净结果 = max(${oracleOptions.map((option) => option.net).join(", ")}) = ${oracleBestNet}`,
      `机会损失 = max(0, ${oracleBestNet} - ${actualNet}) = ${regret}`,
      "机会损失只作为开发调试参考，不再生成0—100总分或胜利线。",
    ],
    judgmentFormula: judgmentBreakdown.formula,
    gradeFormula: grades.formula,
  };
}

function settle(
  caseDefinition: CaseDefinition,
  state: WorldState,
  choice: SettlementChoice,
  paidPrice: number,
  oracleDealFloor: number,
) {
  const next = cloneState(state);
  next.status = "settled";
  next.settlement = settlementResult(
    caseDefinition,
    next,
    choice,
    paidPrice,
    oracleDealFloor,
  );
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

  const npcPosterior = calculateNpcPosterior(caseDefinition, []);
  return {
    caseId: caseDefinition.id,
    rulesetId: DEFAULT_RULESET_IDENTITY.rulesetId,
    rulesetVersion: DEFAULT_RULESET_IDENTITY.rulesetVersion,
    caseVersion: caseDefinition.caseVersion,
    seed,
    truthVariantId,
    npcProfileId: caseDefinition.npcProfile.id,
    status: "active",
    turn: 0,
    actionPoints: caseDefinition.actionBudget,
    negotiation: null,
    feesPaid: 0,
    currentPrice: caseDefinition.seller.openingPrice,
    npcState: cloneNpcState(caseDefinition.initialNpcState),
    discoveredEvidenceIds: [],
    sharedEvidenceIds: [],
    npcPosterior,
    priceHistory: [],
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
  const randomJitter = eligible
    ? behaviorJitter(state.seed, state.turn + 1, id)
    : 0;
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
  const sharedEvidenceAdded: string[] = [];
  if (
    evidence
    && evidence.kind !== "statement"
    && !next.sharedEvidenceIds.includes(evidence.id)
  ) {
    next.sharedEvidenceIds.push(evidence.id);
    sharedEvidenceAdded.push(evidence.id);
    next.npcPosterior = calculateNpcPosterior(
      caseDefinition,
      next.sharedEvidenceIds,
    );
  }
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
  const sourceKind: StatementRecord["sourceKind"] =
    selectedId === "refuse" || selectedId === "exit"
      ? "refusal"
      : selectedId === "counter" || topic.id === "price"
        ? "judgment"
        : "memory";
  const statementConfidence = {
    cooperate: 0.65,
    deflect: 0.45,
    "partial-admit": 0.72,
    counter: 0.55,
    refuse: 0.2,
    exit: 0.2,
  }[selectedId];
  const statement: StatementRecord = {
    turn: state.turn + 1,
    topicId: topic.id,
    behaviorId: selectedId,
    sourceKind,
    confidence: statementConfidence,
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

  const priceChange =
    selectedId === "exit"
      ? undefined
      : refreshNpcPricing(caseDefinition, state, next);

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
      priceChange
        ? `共享信息触发正式重估：${priceChange.before} → ${priceChange.after}`
        : "本轮没有达到正式重估阈值",
    ],
  };

  let completed = next;
  if (selectedId === "exit") {
    completed = settle(
      caseDefinition,
      next,
      "seller-exited",
      0,
      getNpcPricing(caseDefinition, state).buyoutLine,
    );
  }

  return appendTurn(state, completed, {
    action: { ...action },
    actionLabel: `${evidence ? `引用「${evidence.name}」追问` : "开放询问"} · ${topic.label} · ${toneLabels[action.tone]}`,
    actionPointCost: 1,
    changes,
    evidenceAdded,
    sharedEvidenceAdded,
    priceChange,
    statement,
    title: dialogueTitle(selectedId),
    description: statement.text,
    formulaLog: [
      `行动点 = ${state.actionPoints} - 1 = ${next.actionPoints}`,
      ...changes.map((change) => `${change.label}：${change.formula}`),
      `陈述信号：${statement.signalLabel}；似然 ${truthVariantIds.map((variantId) => `${variantId}=${statement.likelihoods[variantId]}`).join(" / ")}`,
      evidence
        ? `信息可见性：${evidence.kind === "statement" ? `「${evidence.name}」来自卖家既有陈述，不重复写入NPC账本` : sharedEvidenceAdded.length ? `首次公开「${evidence.name}」，写入双方共享账本` : `「${evidence.name}」此前已经公开，本轮不重复计权`}`
        : "信息可见性：未出示物证，NPC后验不读取玩家私有证据",
      priceChange
        ? `正式重估：${priceChange.before} → ${priceChange.after}；${priceChange.reasons.join("；")}`
        : "正式重估：未触发或目标价未跨越5点档位",
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
  if (state.negotiation) reasons.push("正式议价已经开始");
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
  const sharedEvidenceAdded: string[] = [];
  if (!next.sharedEvidenceIds.includes(evidenceId)) {
    next.sharedEvidenceIds.push(evidenceId);
    sharedEvidenceAdded.push(evidenceId);
    next.npcPosterior = calculateNpcPosterior(
      caseDefinition,
      next.sharedEvidenceIds,
    );
  }
  const priceChange = refreshNpcPricing(caseDefinition, state, next, true);

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
      "共同检测结果自动进入双方账本，可能触发卖家重估",
      priceChange
        ? `卖家正式重估：${priceChange.before} → ${priceChange.after}`
        : "结果未令报价跨越5点档位",
    ],
  };

  return appendTurn(state, next, {
    action: { ...action },
    actionLabel: `付费专项检测 · ${test.label}`,
    actionPointCost: test.actionPointCost,
    changes: resolved.changes,
    evidenceAdded: [evidenceId],
    sharedEvidenceAdded,
    priceChange,
    title: `检测完成：${evidence.name}`,
    description: `${evidence.detail} ${evidence.inference}`,
    formulaLog: [
      `行动点 = ${state.actionPoints} - ${test.actionPointCost} = ${next.actionPoints}`,
      `累计检测费 = ${state.feesPaid} + ${test.valueCost} = ${next.feesPaid}`,
      `NPC同意判定：${consent.formula}，达到阈值50`,
      `共同检测：${evidence.name}同时进入玩家证据簿与双方共享账本`,
      priceChange
        ? `正式重估：${priceChange.before} → ${priceChange.after}；${priceChange.reasons.join("；")}`
        : "正式重估：目标价未跨越5点档位",
      ...resolved.changes.map((change) => `${change.label}：${change.formula}`),
    ],
    spindle,
    redundant: false,
  });
}

function beginOrAdvanceNegotiation(
  state: WorldState,
  entryFloor: number,
): NegotiationState {
  const preview = calculateNegotiationCapacity(state.npcState);
  const session = state.negotiation ?? {
    started: true,
    initialCapacity: preview.capacity,
    remainingCapacity: preview.capacity,
    entryAsk: state.currentPrice,
    entryFloor,
    offersMade: 0,
  };
  return {
    ...session,
    remainingCapacity: session.remainingCapacity - 1,
    offersMade: session.offersMade + 1,
  };
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

  const pricing = getNpcPricing(caseDefinition, state);
  const acceptanceThreshold = pricing.acceptLine;
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
  next.negotiation = beginOrAdvanceNegotiation(
    state,
    pricing.acceptLine,
  );
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
    completed = settle(
      caseDefinition,
      completed,
      "discount-buy",
      action.offer,
      pricing.buyoutLine,
    );
  } else if (selected.id === "counter-offer") {
    const counterPrice = Math.max(
      acceptanceThreshold,
      Math.round((state.currentPrice + action.offer) / 2),
    );
    completed.currentPrice = counterPrice;
    title = `卖家还价至 ${counterPrice} 点`;
    description = "新的当前价格已经记录，可以继续报价、接受现价或拒绝。";
  } else if (selected.id === "exit") {
    completed.npcState = {
      ...completed.npcState,
      dealIntent: 0,
      phase: "exited",
    };
    title = "过低报价触发卖家离场";
    description = "案件进入复盘，不会停在无法操作的页面。";
    completed = settle(
      caseDefinition,
      completed,
      "seller-exited",
      0,
      pricing.buyoutLine,
    );
  }

  const spindle: SpindleTrace = {
    expansion: [
      `玩家报价：${action.offer}`,
      `NPC认知档案：${caseDefinition.npcProfile.label}`,
      `NPC后验：${pricing.posterior.map((entry) => `${entry.label}${round1(entry.probability * 100)}%`).join(" / ")}`,
      `后验Q25/Q50/Q75：${pricing.q25} / ${pricing.q50} / ${pricing.q75}`,
      `风险厌恶：${caseDefinition.npcProfile.riskAversion}；急迫度：${caseDefinition.npcProfile.urgency}；外部选项：${round1(pricing.outsideOption)}`,
      `当前NPC状态：压力${state.npcState.pressure} / 信任${state.npcState.trust} / 成交${state.npcState.dealIntent} / 控制${state.npcState.control}`,
    ],
    candidates,
    selectedId: selected.id,
    selectedLabel: selected.label,
    convergence: [
      ...pricing.formula,
      `报价差额 = ${acceptanceThreshold} - ${action.offer} = ${gap}`,
      `收敛结果：${selected.label}`,
    ],
  };

  return appendTurn(state, completed, {
    action: { ...action },
    actionLabel: `提出折价 · ${action.offer} 点`,
    actionPointCost: 0,
    negotiationCapacityCost: 1,
    changes: resolved.changes,
    evidenceAdded: [],
    title,
    description,
    formulaLog: [
      `调查行动点保持 ${state.actionPoints}`,
      `议价容量 = ${next.negotiation.initialCapacity} - ${next.negotiation.offersMade} = ${next.negotiation.remainingCapacity}`,
      ...pricing.formula,
      ...resolved.changes.map((change) => `${change.label}：${change.formula}`),
    ],
    spindle,
    redundant: state.actionHistory.some(
      (turn) => turn.action.kind === "discount" && turn.action.offer === action.offer,
    ),
  });
}

function resolveBuyout(
  caseDefinition: CaseDefinition,
  state: WorldState,
  action: Extract<PlayerAction, { kind: "buyout" }>,
) {
  if (!Number.isInteger(action.offer) || action.offer <= 0) {
    throw new Error("无条件买断报价必须是正整数");
  }
  if (action.offer >= state.currentPrice) {
    throw new Error("无条件买断价必须低于当前报价；按当前价成交请直接购买");
  }
  const pricing = getNpcPricing(caseDefinition, state);
  const accepted = action.offer >= pricing.buyoutLine;
  const candidates = [
    fixedCandidate(
      "accept-buyout",
      "接受无条件买断",
      accepted,
      [
        { label: "报价", value: action.offer },
        { label: "风险转移价值", value: pricing.acceptLine - pricing.buyoutLine },
      ],
      [
        accepted
          ? `报价达到无条件买断线${pricing.buyoutLine}`
          : `报价未达到无条件买断线${pricing.buyoutLine}`,
      ],
    ),
    fixedCandidate(
      "reject-buyout",
      "拒绝并结束交易",
      !accepted,
      [
        { label: "买断线", value: pricing.buyoutLine },
        { label: "报价差额", value: action.offer - pricing.buyoutLine },
      ],
      [
        accepted
          ? "买断报价已经达到接受条件"
          : "一次性最终报价不足，卖家不再继续协商",
      ],
    ),
  ];
  const next = cloneState(state);
  next.negotiation = beginOrAdvanceNegotiation(
    state,
    pricing.acceptLine,
  );
  if (accepted) next.currentPrice = action.offer;
  const choice: SettlementChoice = accepted
    ? "buyout-buy"
    : "buyout-rejected";
  const completed = settle(
    caseDefinition,
    next,
    choice,
    accepted ? action.offer : 0,
    pricing.buyoutLine,
  );
  const settlement = completed.settlement!;
  const selected = candidates.find((candidate) => candidate.eligible)!;
  const spindle: SpindleTrace = {
    expansion: [
      `玩家最终报价：${action.offer}`,
      "承诺：不再检测、不追加条件，成交后由玩家承担器物风险",
      `卖家风险厌恶${caseDefinition.npcProfile.riskAversion} / 急迫度${caseDefinition.npcProfile.urgency}`,
      `普通接受线${pricing.acceptLine} / 无条件买断线${pricing.buyoutLine}`,
    ],
    candidates,
    selectedId: selected.id,
    selectedLabel: selected.label,
    convergence: [
      ...pricing.formula,
      `最终报价${action.offer} ${accepted ? "≥" : "<"} 买断线${pricing.buyoutLine}`,
      "无条件买断无还价、无追加检测；无论接受或拒绝，本局立即结算",
    ],
  };
  return appendTurn(state, completed, {
    action: { ...action },
    actionLabel: `提出无条件买断 · ${action.offer}点`,
    actionPointCost: 0,
    negotiationCapacityCost: 1,
    changes: [],
    evidenceAdded: [],
    title: accepted
      ? `卖家接受 ${action.offer} 点无条件买断`
      : "卖家拒绝最终报价并结束交易",
    description: accepted
      ? "你以放弃追加检测和条件换取确定成交，器物的剩余风险由你承担。"
      : "一次性最终报价没有达到卖家当前买断线，本局不再继续议价。",
    formulaLog: [
      `调查行动点保持 ${state.actionPoints}`,
      `议价容量 = ${next.negotiation.initialCapacity} - ${next.negotiation.offersMade} = ${next.negotiation.remainingCapacity}`,
      ...pricing.formula,
      `买断判定：${action.offer} ${accepted ? "≥" : "<"} ${pricing.buyoutLine}`,
      ...settlement.objectiveFormula,
      ...settlement.judgmentFormula,
    ],
    spindle,
    redundant: false,
  });
}

function resolveTerminal(
  caseDefinition: CaseDefinition,
  state: WorldState,
  action: Extract<PlayerAction, { kind: "buy" | "reject" }>,
) {
  const choice: SettlementChoice = action.kind;
  const paidPrice = action.kind === "buy" ? state.currentPrice : 0;
  const next = settle(
    caseDefinition,
    cloneState(state),
    choice,
    paidPrice,
    getNpcPricing(caseDefinition, state).buyoutLine,
  );
  const settlement = next.settlement!;
  return appendTurn(state, next, {
    action: { ...action },
    actionLabel: action.kind === "buy" ? `按 ${state.currentPrice} 点买下` : "拒绝交易",
    actionPointCost: 0,
    changes: [],
    evidenceAdded: [],
    title: settlement.endingTitle,
    description: `${settlement.outcomeLabel}；判断质量 ${settlement.judgmentGrade}。`,
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
  if (action.kind === "buyout") {
    return resolveBuyout(caseDefinition, state, action);
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
