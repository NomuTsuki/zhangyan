import type { NPCState } from "./types";

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
