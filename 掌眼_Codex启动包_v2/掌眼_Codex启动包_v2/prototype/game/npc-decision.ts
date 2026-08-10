import type {
  BehaviorCandidate,
  DialogueAction,
  DisclosureEvaluation,
  NPCBehaviorId,
  NPCState,
  WorldState,
} from "./types";
import { round1 } from "./numeric.ts";
import { behaviorJitter } from "./random.ts";

export const NPC_BEHAVIOR_LABELS: Record<NPCBehaviorId, string> = {
  cooperate: "补充说明",
  deflect: "模糊回应",
  "partial-admit": "部分承认",
  counter: "反向质疑",
  refuse: "拒绝回答",
  exit: "结束交易",
};

type SeededTurn = Pick<WorldState, "seed" | "turn">;

export function createBehaviorCandidate(
  state: SeededTurn,
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
  const jitter = eligible ? behaviorJitter(state.seed, state.turn + 1, id) : 0;
  const finalScore = eligible ? round1(baseScore + jitter) : -999;
  return {
    id,
    label: NPC_BEHAVIOR_LABELS[id],
    eligible,
    components,
    baseScore,
    jitter,
    finalScore,
    score: finalScore,
    formula: eligible
      ? `${components.map((component) => `${component.label}${component.value >= 0 ? "+" : ""}${component.value}`).join(" ")} = 基础${baseScore} + seed扰动${jitter} = ${finalScore}`
      : `${components.map((component) => `${component.label}${component.value >= 0 ? "+" : ""}${component.value}`).join(" ")} = 基础${baseScore}；硬条件过滤`,
    filterReasons,
    reasons: filterReasons,
  } satisfies BehaviorCandidate;
}

export function createFixedCandidate(
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

export function chooseBehavior(candidates: BehaviorCandidate[]) {
  const eligible = candidates
    .map((candidate, order) => ({ candidate, order }))
    .filter(({ candidate }) => candidate.eligible)
    .sort((left, right) =>
      right.candidate.score - left.candidate.score || left.order - right.order,
    );
  if (eligible.length === 0) throw new Error("NPC没有合法候选行为");
  return eligible[0].candidate;
}

export function buildDialogueCandidates(
  state: SeededTurn,
  nextNpc: NPCState,
  action: DialogueAction,
  disclosure: DisclosureEvaluation,
  storyletAlreadyTriggered: boolean,
) {
  const { payload: evidence, relevant, repeatCount, power } = disclosure;
  return [
    createBehaviorCandidate(
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
    createBehaviorCandidate(
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
    createBehaviorCandidate(
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
    createBehaviorCandidate(
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
    createBehaviorCandidate(
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
    createBehaviorCandidate(
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

export function dialogueTitle(behaviorId: NPCBehaviorId) {
  return {
    cooperate: "对方补充了可以继续核验的说法",
    deflect: "对方仍试图保持叙事空间",
    "partial-admit": "证据迫使对方收窄原说法",
    counter: "对方开始反向质疑你的判断",
    refuse: "重复或高压让对方拒绝继续回答",
    exit: "关系与成交意愿跌破安全线",
  }[behaviorId];
}
