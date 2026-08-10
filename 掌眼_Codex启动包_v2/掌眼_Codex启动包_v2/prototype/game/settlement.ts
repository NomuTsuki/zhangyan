import { calculatePosterior } from "./belief.ts";
import {
  calculateJudgmentQuality,
  type JudgmentQualityInput,
} from "./judgment-quality.ts";
import { getNpcPricing } from "./negotiation.ts";
import { calculateOutcomeGrades, gradeIndex } from "./outcome-grades.ts";
import type {
  CaseDefinition,
  ReasoningDimension,
  SettlementChoice,
  SettlementResult,
  TruthVariantId,
  WorldState,
} from "./types.ts";

function judgmentQualityInput(
  caseDefinition: CaseDefinition,
  state: WorldState,
  posterior: ReturnType<typeof calculatePosterior>,
  utilityGap: number,
  sellerExited: boolean,
): JudgmentQualityInput {
  const evidenceById = Object.fromEntries(
    [...new Set(state.discoveredEvidenceIds)].flatMap((evidenceId) => {
      const evidence = caseDefinition.evidence[evidenceId];
      return evidence ? [[evidenceId, evidence]] : [];
    }),
  );
  const statementTopicsById = Object.fromEntries(
    [...new Set(state.statementHistory.map((statement) => statement.topicId))]
      .flatMap((topicId) => {
        const topic = caseDefinition.dialogueTopics.find(
          (candidate) => candidate.id === topicId,
        );
        return topic ? [[topicId, topic]] : [];
      }),
  );
  const requiredDimensions: Record<TruthVariantId, readonly ReasoningDimension[]> = {} as Record<
    TruthVariantId,
    readonly ReasoningDimension[]
  >;
  for (const variantId of caseDefinition.judgmentModel.hypothesisOrder) {
    requiredDimensions[variantId] = [
      ...caseDefinition.judgmentModel.requiredDimensions[variantId],
    ];
  }

  return {
    judgmentModel: {
      hypothesisOrder: [...caseDefinition.judgmentModel.hypothesisOrder],
      requiredDimensions,
    },
    evidenceById,
    statementTopicsById,
    posterior,
    discoveredEvidenceIds: state.discoveredEvidenceIds,
    statementHistory: state.statementHistory,
    utilityGap,
    redundantActionCount: state.actionHistory.filter((turn) => turn.redundant)
      .length,
    sellerExited,
  };
}

function settlementPricingInput(
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
    npcState: {
      pressure: state.npcState.pressure,
      trust: state.npcState.trust,
      dealIntent: state.npcState.dealIntent,
      control: state.npcState.control,
    },
    npcPosterior: state.npcPosterior,
    currentPrice: state.currentPrice,
  };
}

export function calculateSettlement(
  caseDefinition: CaseDefinition,
  state: WorldState,
  choice: SettlementChoice,
  paidPrice: number,
  buyoutLine: number,
): SettlementResult {
  const truth = caseDefinition.truthVariants[state.truthVariantId];
  const acquired =
    choice === "buy"
    || choice === "discount-buy"
    || choice === "buyout-buy";

  // Objective outcome reads the hidden truth only in this local branch.
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
  if (buyoutLine < caseDefinition.seller.openingPrice) {
    oracleOptions.push({
      label: `完全知情时按${buyoutLine}点最低可达买断线成交`,
      net: truth.trueValue - buyoutLine,
    });
  }
  const oracleBestNet = Math.max(...oracleOptions.map((option) => option.net));
  const regret = Math.max(0, oracleBestNet - actualNet);
  const stakes = Math.max(caseDefinition.seller.openingPrice, truth.trueValue);

  // Judgment quality receives only the player's visible belief and signals.
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
  const judgmentBreakdown = calculateJudgmentQuality(
    judgmentQualityInput(
      caseDefinition,
      state,
      posterior,
      utilityGap,
      choice === "seller-exited",
    ),
  );

  const entryAsk = state.negotiation?.entryAsk ?? state.currentPrice;
  const entryFloor =
    state.negotiation?.entryFloor
    ?? getNpcPricing(settlementPricingInput(caseDefinition, state)).acceptLine;
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

export function settleWorldState(
  caseDefinition: CaseDefinition,
  state: WorldState,
  choice: SettlementChoice,
  paidPrice: number,
  buyoutLine: number,
): WorldState {
  const next = { ...state, status: "settled" as const };
  next.settlement = calculateSettlement(
    caseDefinition,
    next,
    choice,
    paidPrice,
    buyoutLine,
  );
  return next;
}
