import { calculateNegotiationCapacity } from "../game/negotiation.ts";
import type {
  CaseDefinition,
  EvidenceDefinition,
  NPCState,
  OutcomeGrade,
  SettlementResult,
  TurnRecord,
  WorldState,
} from "../game/types.ts";

export type NpcAtmospherePresentation = {
  level: "open" | "watchful" | "strained" | "closed";
  label: string;
  detail: string;
};

export type PlayerTurnSummary = {
  title: string;
  sellerWords: string;
  observations: string[];
  newEvidenceCount: number;
  priceUpdate: {
    before: number;
    after: number;
    reason: string;
  } | null;
};

export type PlayerResourceCard = {
  id: "investigation" | "bargaining";
  label: string;
  remaining: number;
  total: number;
  usage: string;
  status: "preview" | "available" | "active" | "exhausted" | "closed";
};

export type PlayerResourcePresentation = {
  investigation: PlayerResourceCard;
  bargaining: PlayerResourceCard;
};

export type EvidenceVisibility = "private" | "shared" | "seller-statement";

export type EvidenceDisclosureItem = {
  id: string;
  name: string;
  kind: EvidenceDefinition["kind"];
  visibility: EvidenceVisibility;
  visibilityLabel: string;
  canDisclose: boolean;
};

export type EvidenceDisclosurePresentation = {
  unit: "specific-evidence";
  canAskWithoutEvidence: true;
  items: EvidenceDisclosureItem[];
};

export type SettlementCardSection =
  | {
      id: "quality" | "bargaining" | "judgment";
      label: string;
      grade: OutcomeGrade;
    }
  | {
      id: "net";
      label: string;
      grade: OutcomeGrade;
      value: string;
    };

export type PlayerSettlementCard = {
  title: string;
  choiceLabel: string;
  overallLabel: "综合成果";
  overallGrade: OutcomeGrade;
  outcomeLabel: string;
  summary: string;
  sections: SettlementCardSection[];
};

export type PlayerPresentation = {
  atmosphere: NpcAtmospherePresentation;
  latestResponse: PlayerTurnSummary | null;
  resources: PlayerResourcePresentation;
  evidence: EvidenceDisclosurePresentation;
  settlement: PlayerSettlementCard | null;
};

export function describeNpcAtmosphere(
  npcState: NPCState,
): NpcAtmospherePresentation {
  if (npcState.phase === "exited") {
    return {
      level: "closed",
      label: "交流中断",
      detail: "卖家已经结束交流，本局只能进入复盘。",
    };
  }

  if (
    npcState.phase === "pressured"
    || npcState.pressure >= 70
    || npcState.trust <= 35
    || npcState.dealIntent <= 30
  ) {
    return {
      level: "strained",
      label: "气氛紧绷",
      detail: "卖家明显提高戒备，继续施压可能让交易中断。",
    };
  }

  if (
    npcState.phase === "cautious"
    || npcState.phase === "negotiating"
    || npcState.pressure >= 45
    || npcState.trust < 50
  ) {
    return {
      level: "watchful",
      label: "卖家有所戒备",
      detail: "交流仍能继续，但问题和表达方式需要更有依据。",
    };
  }

  return {
    level: "open",
    label: "气氛尚可",
    detail: "卖家愿意继续说明，交流仍有余地。",
  };
}

function observableChanges(turn: TurnRecord) {
  if (turn.after.npcState.phase === "exited") {
    return ["卖家已经终止交流。"];
  }

  const observations: string[] = [];
  for (const change of turn.changes) {
    if (change.key === "trust") {
      if (change.delta > 0) observations.push("卖家更愿意继续说明。");
      if (change.delta < 0) observations.push("卖家对你的表达更加戒备。");
    }
    if (change.key === "pressure" && change.delta >= 4) {
      observations.push("卖家的语气明显更紧绷。");
    }
    if (change.key === "dealIntent" && change.delta <= -3) {
      observations.push("卖家继续成交的意愿有所减弱。");
    }
    if (change.key === "control" && change.delta <= -4) {
      observations.push("对话正在压缩卖家回避问题的空间。");
    }
  }

  return [...new Set(observations)].slice(0, 3);
}

export function summarizeTurnForPlayer(
  turn: TurnRecord | undefined,
): PlayerTurnSummary | null {
  if (!turn) return null;

  const observations = observableChanges(turn);
  return {
    title: turn.title,
    sellerWords: turn.statement?.text ?? "",
    observations:
      observations.length > 0
        ? observations
        : ["本轮没有出现明显的可观察变化。"],
    newEvidenceCount: turn.evidenceAdded.length,
    priceUpdate: turn.priceChange
      ? {
          before: turn.priceChange.before,
          after: turn.priceChange.after,
          reason: turn.priceChange.publicReason,
        }
      : null,
  };
}

export function buildPlayerResources(
  caseDefinition: CaseDefinition,
  state: WorldState,
): PlayerResourcePresentation {
  const previewCapacity = calculateNegotiationCapacity(state.npcState).capacity;
  const capacity = state.negotiation
    ? {
        total: state.negotiation.initialCapacity,
        remaining: state.negotiation.remainingCapacity,
      }
    : {
        total: previewCapacity,
        remaining: previewCapacity,
      };

  const investigationStatus: PlayerResourceCard["status"] =
    state.status === "settled"
      ? "closed"
      : state.actionPoints === 0
        ? "exhausted"
        : "available";
  const bargainingStatus: PlayerResourceCard["status"] =
    state.status === "settled"
      ? "closed"
      : capacity.remaining === 0
        ? "exhausted"
        : state.negotiation
          ? "active"
          : "preview";

  return {
    investigation: {
      id: "investigation",
      label: "调查行动点",
      remaining: state.actionPoints,
      total: caseDefinition.actionBudget,
      usage: "检查、询问与专项检测使用",
      status: investigationStatus,
    },
    bargaining: {
      id: "bargaining",
      label: "议价容量",
      remaining: capacity.remaining,
      total: capacity.total,
      usage: "每次正式报价消耗 1 点",
      status: bargainingStatus,
    },
  };
}

function visibilityForEvidence(
  evidence: EvidenceDefinition,
  shared: boolean,
): Pick<EvidenceDisclosureItem, "visibility" | "visibilityLabel" | "canDisclose"> {
  if (evidence.kind === "statement") {
    return {
      visibility: "seller-statement",
      visibilityLabel: "卖家已知的陈述",
      canDisclose: false,
    };
  }
  if (shared) {
    return {
      visibility: "shared",
      visibilityLabel: "已向卖家公开",
      canDisclose: false,
    };
  }
  return {
    visibility: "private",
    visibilityLabel: "仅自己掌握",
    canDisclose: true,
  };
}

export function buildEvidenceDisclosure(
  caseDefinition: CaseDefinition,
  state: WorldState,
): EvidenceDisclosurePresentation {
  const items = state.discoveredEvidenceIds.flatMap((evidenceId) => {
    const evidence = caseDefinition.evidence[evidenceId];
    if (!evidence) return [];
    const visibility = visibilityForEvidence(
      evidence,
      state.sharedEvidenceIds.includes(evidence.id),
    );
    return [{
      id: evidence.id,
      name: evidence.name,
      kind: evidence.kind,
      ...visibility,
    }];
  });

  return {
    unit: "specific-evidence",
    canAskWithoutEvidence: true,
    items,
  };
}

function formatSignedValue(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

export function buildSettlementCard(
  settlement: SettlementResult | undefined,
): PlayerSettlementCard | null {
  if (!settlement) return null;

  return {
    title: settlement.endingTitle,
    choiceLabel: settlement.choiceLabel,
    overallLabel: "综合成果",
    overallGrade: settlement.overallGrade,
    outcomeLabel: settlement.outcomeLabel,
    summary: `${settlement.outcomeLabel}；判断质量 ${settlement.judgmentGrade}。`,
    sections: [
      {
        id: "quality",
        label: "器物客观品质",
        grade: settlement.qualityGrade,
      },
      {
        id: "net",
        label: "实际净收益",
        value: formatSignedValue(settlement.actualNet),
        grade: settlement.netGrade,
      },
      {
        id: "bargaining",
        label: "议价表现",
        grade: settlement.bargainingGrade,
      },
      {
        id: "judgment",
        label: "判断质量",
        grade: settlement.judgmentGrade,
      },
    ],
  };
}

export function buildPlayerPresentation(
  caseDefinition: CaseDefinition,
  state: WorldState,
): PlayerPresentation {
  return {
    atmosphere: describeNpcAtmosphere(state.npcState),
    latestResponse: summarizeTurnForPlayer(state.actionHistory.at(-1)),
    resources: buildPlayerResources(caseDefinition, state),
    evidence: buildEvidenceDisclosure(caseDefinition, state),
    settlement: buildSettlementCard(state.settlement),
  };
}
