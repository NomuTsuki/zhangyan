import type {
  ActionTone,
  BehaviorCandidate,
  CaseDefinition,
  CalculationTrace,
  DialogueAction,
  DomainEvent,
  EvidenceDefinition,
  NPCBehaviorId,
  NPCPhase,
  NPCState,
  NPCStateKey,
  PlayerAction,
  SettlementChoice,
  SpindleTrace,
  StateChange,
  StateSnapshot,
  TruthVariantId,
  TransitionResult,
  TurnRecord,
  WorldState,
} from "./types";
import { TRUTH_VARIANT_IDS } from "./types.ts";
import { evaluateDisclosure } from "./disclosure.ts";
import {
  calculateNpcPosterior,
  calculatePosterior,
} from "./belief.ts";
export { calculateNpcPosterior, calculatePosterior };
import {
  beginOrAdvanceNegotiation as advanceNegotiationSession,
  calculateNegotiationCapacity,
  getNpcPricing as calculateNpcPricing,
  getNpcStance as calculateNpcStance,
  getPlayerReferenceOffer as calculatePlayerReferenceOffer,
  refreshNpcPricing as calculateNpcRepricing,
} from "./negotiation.ts";
import { settleWorldState } from "./settlement.ts";
import {
  assertWorldStateCompatible,
  createRulesContext,
  DEFAULT_RULESET_IDENTITY,
  type RulesContext,
} from "./ruleset.ts";
import {
  clamp,
  round1,
} from "./numeric.ts";
import { seededUnit } from "./random.ts";
import {
  buildDialogueCandidates,
  chooseBehavior,
  createFixedCandidate,
  dialogueTitle,
  NPC_BEHAVIOR_LABELS,
} from "./npc-decision.ts";
import { resolveDialogueStorylet } from "./storylets.ts";

const truthVariantIds = TRUTH_VARIANT_IDS;

const stateLabels: Record<NPCStateKey, string> = {
  pressure: "压力",
  trust: "信任",
  dealIntent: "成交意愿",
  control: "控制感",
};

function visibleNpcState(npcState: NPCState) {
  return {
    pressure: npcState.pressure,
    trust: npcState.trust,
    dealIntent: npcState.dealIntent,
    control: npcState.control,
  };
}

function npcPricingInput(
  caseDefinition: CaseDefinition,
  state: WorldState,
) {
  return {
    npcProfile: {
      outsideOption: caseDefinition.npcProfile.outsideOption,
      riskAversion: caseDefinition.npcProfile.riskAversion,
      urgency: caseDefinition.npcProfile.urgency,
      markup: caseDefinition.npcProfile.markup,
    },
    npcState: visibleNpcState(state.npcState),
    npcPosterior: state.npcPosterior,
    currentPrice: state.currentPrice,
  };
}

export function getNpcStance(npcState: NPCState) {
  return calculateNpcStance(visibleNpcState(npcState));
}

export function getNpcPricing(
  caseDefinition: CaseDefinition,
  state: WorldState,
) {
  return calculateNpcPricing(npcPricingInput(caseDefinition, state));
}

export function getPlayerReferenceOffer(
  caseDefinition: CaseDefinition,
  state: WorldState,
) {
  return calculatePlayerReferenceOffer({
    posterior: calculatePosterior(
      caseDefinition,
      state.discoveredEvidenceIds,
      state.statementHistory,
    ),
    feesPaid: state.feesPaid,
    currentPrice: state.currentPrice,
  });
}

function refreshNpcPricing(
  caseDefinition: CaseDefinition,
  before: WorldState,
  next: WorldState,
  force = false,
) {
  const priceChange = calculateNpcRepricing({
    before: npcPricingInput(caseDefinition, before),
    next: npcPricingInput(caseDefinition, next),
    priceHistoryCount: next.priceHistory.length,
    turn: before.turn + 1,
    force,
  });
  if (priceChange) {
    next.currentPrice = priceChange.after;
    next.priceHistory.push(priceChange);
  }
  return priceChange;
}

function beginOrAdvanceNegotiation(
  state: WorldState,
  entryFloor: number,
) {
  return advanceNegotiationSession({
    npcState: visibleNpcState(state.npcState),
    session: state.negotiation,
    currentPrice: state.currentPrice,
    entryFloor,
  });
}

const toneLabels: Record<ActionTone, string> = {
  gentle: "温和",
  professional: "专业",
  firm: "强硬",
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
    ?? calculateNegotiationCapacity(visibleNpcState(state.npcState)).capacity;
  if (bargainingRemaining < bargainingCost) {
    throw new Error(
      `议价容量不足：需要 ${bargainingCost}，当前 ${bargainingRemaining}`,
    );
  }
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

function resolveDialogue(
  caseDefinition: CaseDefinition,
  state: WorldState,
  action: DialogueAction,
) {
  const topic = caseDefinition.dialogueTopics.find(
    (item) => item.id === action.topicId,
  );
  if (!topic) throw new Error(`未知询问主题：${action.topicId}`);

  const disclosure = evaluateDisclosure(caseDefinition, state, action);
  const { payload: evidence, relevant, repeatCount, power, relevanceFactor } = disclosure;
  const { framing } = disclosure;

  const resolved = applyChanges(state.npcState, [
    {
      key: "pressure",
      delta: framing.pressureDelta,
      reasons: [
        evidence ? `引用${evidence.name}` : "开放询问不要求证据",
        `态度：${toneLabels[action.tone]}`,
        `完全重复 ${repeatCount} 次`,
      ],
      formula: framing.formulas[0],
    },
    {
      key: "trust",
      delta: framing.trustDelta,
      reasons: [
        `${toneLabels[action.tone]}表达`,
        evidence ? (relevant ? "证据与问题相关" : "引用无关证据") : "先固定原始说法",
        repeatCount ? "重复追问损害合作感" : "首次采用该行动组合",
      ],
      formula: framing.formulas[1],
    },
    {
      key: "dealIntent",
      delta: framing.dealIntentDelta,
      reasons: [
        evidence ? "证据提高卖家承担的交易风险" : "普通询问保持交易空间",
        repeatCount ? "重复行动降低耐心" : "无重复惩罚",
      ],
      formula: framing.formulas[2],
    },
    {
      key: "control",
      delta: framing.controlDelta,
      reasons: [
        evidence ? "相关证据压缩叙事空间" : "开放询问让卖家保留主动叙述空间",
      ],
      formula: framing.formulas[3],
    },
  ]);

  const storyletId = `${topic.id}:partial-admit`;
  const storyletAlreadyTriggered =
    state.triggeredStoryletIds.includes(storyletId);
  const candidates = buildDialogueCandidates(
    state,
    resolved.next,
    action,
    disclosure,
    storyletAlreadyTriggered,
  );
  const selected = chooseBehavior(candidates);
  const selectedId = selected.id as NPCBehaviorId;
  const next = cloneState(state);
  next.actionPoints -= 1;
  next.npcState = resolved.next;
  const sharedEvidenceAdded: string[] = [];
  if (
    disclosure.selection.newlyShared
    && evidence
    && evidence.kind !== "statement"
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

  const storylet = resolveDialogueStorylet(
    caseDefinition,
    state,
    topic,
    selectedId,
  );
  const { statement } = storylet;
  next.statementHistory.push(statement);
  if (storylet.newlyTriggered) next.triggeredStoryletIds.push(storylet.storyletId);
  for (const evidenceId of storylet.evidenceAdded) {
    if (!next.discoveredEvidenceIds.includes(evidenceId)) {
      next.discoveredEvidenceIds.push(evidenceId);
    }
  }
  const evidenceAdded = storylet.evidenceAdded;

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
    selectedLabel: NPC_BEHAVIOR_LABELS[selectedId],
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
    completed = settleWorldState(
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
      createFixedCandidate(
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
      createFixedCandidate(
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
    createFixedCandidate(
      "accept-offer",
      "接受报价",
      gap <= 0,
      [
        { label: "固定", value: 90 },
        { label: "报价余量", value: -Math.abs(gap) },
      ],
      [gap <= 0 ? "报价达到可接受线" : "报价未达到可接受线"],
    ),
    createFixedCandidate(
      "counter-offer",
      "提出还价",
      gap > 0 && gap <= 8,
      [
        { label: "固定", value: 82 },
        { label: "报价差额", value: -gap },
      ],
      ["差额在1—8之间"],
    ),
    createFixedCandidate(
      "reject-offer",
      "拒绝报价",
      gap > 8,
      [
        { label: "固定", value: 72 },
        { label: "差额推动", value: Math.min(gap, 20) },
      ],
      ["报价明显低于接受线"],
    ),
    createFixedCandidate(
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
    completed = settleWorldState(
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
    completed = settleWorldState(
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
    createFixedCandidate(
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
    createFixedCandidate(
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
  const completed = settleWorldState(
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
  const next = settleWorldState(
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

function copyEventPayload<T>(payload: T): T {
  return structuredClone(payload);
}

function eventsFromTurn(
  state: WorldState,
  record: TurnRecord,
): DomainEvent[] {
  const events: DomainEvent[] = record.evidenceAdded.map((evidenceId) => ({
    kind: "evidence-discovered",
    evidenceId,
  }));
  for (const evidenceId of record.sharedEvidenceAdded ?? []) {
    events.push({ kind: "evidence-shared", evidenceId });
  }
  if (record.priceChange) {
    events.push({
      kind: "price-changed",
      priceChange: copyEventPayload(record.priceChange),
    });
  }
  if (state.settlement) {
    events.push({
      kind: "case-settled",
      settlement: copyEventPayload(state.settlement),
    });
  }
  return events;
}

function copySpindleTrace(spindle: SpindleTrace): SpindleTrace {
  return {
    ...spindle,
    expansion: [...spindle.expansion],
    candidates: spindle.candidates.map((candidate) => ({
      ...candidate,
      components: candidate.components.map((component) => ({ ...component })),
      filterReasons: [...candidate.filterReasons],
      reasons: [...candidate.reasons],
    })),
    convergence: [...spindle.convergence],
  };
}

function traceFromTurn(record: TurnRecord): CalculationTrace {
  return {
    turn: record.turn,
    formulaLog: [...record.formulaLog],
    ...(record.spindle ? { spindle: copySpindleTrace(record.spindle) } : {}),
  };
}

export function reduceTurn(
  context: RulesContext,
  state: WorldState,
  action: PlayerAction,
): TransitionResult {
  assertWorldStateCompatible(context, state);
  const { caseDefinition } = context;
  ensureActionAllowed(state, action, caseDefinition);
  let next: WorldState;
  if (action.kind === "inspect") {
    next = resolveInspect(caseDefinition, state, action);
  } else if (action.kind === "dialogue") {
    next = resolveDialogue(caseDefinition, state, action);
  } else if (action.kind === "test") {
    next = resolveTest(caseDefinition, state, action);
  } else if (action.kind === "discount") {
    next = resolveDiscount(caseDefinition, state, action);
  } else if (action.kind === "buyout") {
    next = resolveBuyout(caseDefinition, state, action);
  } else {
    next = resolveTerminal(caseDefinition, state, action);
  }
  const record = next.actionHistory.at(-1);
  if (!record) throw new Error("Reducer did not append a turn record");
  return {
    state: next,
    events: eventsFromTurn(next, record),
    trace: traceFromTurn(record),
  };
}

export function replayActions(
  caseDefinition: CaseDefinition,
  actions: PlayerAction[],
  seed = caseDefinition.seed,
  truthVariantId: TruthVariantId = "restored-genuine",
) {
  return actions.reduce(
    (state, action) => reduceTurn(createRulesContext(caseDefinition), state, action).state,
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
