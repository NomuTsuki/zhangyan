import type {
  CaseDefinition,
  NegotiationState,
  NPCState,
  PosteriorEntry,
  PriceChange,
  WorldState,
} from "./types";
import {
  calculatePosterior,
  posteriorEntropy,
  posteriorExpectedValue,
  posteriorQuantile,
} from "./belief.ts";
import {
  ceilToTick,
  floorToTick,
  round1,
  roundToTick,
} from "./numeric.ts";

export type NegotiationCapacityResult = {
  capacity: number;
  adjustments: Array<{
    label: string;
    value: number;
    reason: string;
  }>;
  formula: string[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function calculateNegotiationCapacity(
  npcState: NPCState,
): NegotiationCapacityResult {
  const adjustments = [
    {
      label: "信任修正",
      value: npcState.trust >= 55 ? 1 : 0,
      reason:
        npcState.trust >= 55
          ? `信任${npcState.trust}达到55`
          : `信任${npcState.trust}未达到55`,
    },
    {
      label: "成交意愿修正",
      value: npcState.dealIntent >= 65 ? 1 : 0,
      reason:
        npcState.dealIntent >= 65
          ? `成交意愿${npcState.dealIntent}达到65`
          : `成交意愿${npcState.dealIntent}未达到65`,
    },
    {
      label: "高压力修正",
      value: npcState.pressure >= 75 ? -1 : 0,
      reason:
        npcState.pressure >= 75
          ? `压力${npcState.pressure}达到75`
          : `压力${npcState.pressure}低于75`,
    },
    {
      label: "低控制感修正",
      value: npcState.control <= 35 ? -1 : 0,
      reason:
        npcState.control <= 35
          ? `控制感${npcState.control}不高于35`
          : `控制感${npcState.control}高于35`,
    },
  ];
  const raw = 3 + adjustments.reduce((sum, item) => sum + item.value, 0);
  const capacity = clamp(raw, 2, 5);

  return {
    capacity,
    adjustments,
    formula: [
      "议价基础容量 = 3",
      ...adjustments.map(
        (item) =>
          `${item.label}：${item.reason} → ${item.value >= 0 ? "+" : ""}${item.value}`,
      ),
      `议价容量 = clamp(${raw}, 2, 5) = ${capacity}`,
    ],
  };
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
  const offer = Math.max(1, Math.min(suggestedOffer, state.currentPrice - 1));
  return {
    posterior,
    q20,
    q50,
    expectedValue,
    entropy: posteriorEntropy(posterior),
    safetyMargin,
    suggestedOffer,
    offer,
    formula: `谨慎参考 = 向下取整5(max(5, 后验Q20(${q20}) - 已付检测费${state.feesPaid} - 安全垫${round1(safetyMargin)})) = ${suggestedOffer}`,
  };
}

function dominantVariant(posterior: PosteriorEntry[]) {
  return [...posterior].sort(
    (left, right) => right.probability - left.probability,
  )[0]?.variantId;
}

export function refreshNpcPricing(
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

export function beginOrAdvanceNegotiation(
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
