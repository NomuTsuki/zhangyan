import type {
  CaseDefinition,
  EvidenceLikelihoods,
  NPCBehaviorId,
  OutcomeGrade,
  ReasoningDimension,
} from "../game/types.ts";

const behaviorIds: NPCBehaviorId[] = [
  "cooperate",
  "deflect",
  "partial-admit",
  "counter",
  "refuse",
  "exit",
];

type TruthConfig = {
  id: string;
  label: string;
  summary: string;
  value: number;
  grade: OutcomeGrade;
  facts: string[];
};

type TargetConfig = {
  id: string;
  label: string;
  short: string;
  hint: string;
  topic: string;
  sourceGroup: "surface" | "bottom" | "joint";
  dimensions: ReasoningDimension[];
  findings: Record<string, { name: string; detail: string; inference: string }>;
};

type PlayerCaseConfig = {
  id: string;
  title: string;
  sellerName: string;
  sellerSummary: string;
  openingPrice: number;
  profileId: string;
  profileLabel: string;
  beliefSummary: string;
  personalitySummary: string;
  publicTraits: string[];
  urgency: number;
  riskAversion: number;
  truths: [TruthConfig, TruthConfig, TruthConfig];
  targets: [TargetConfig, TargetConfig, TargetConfig];
  provenanceClaim: string;
  conditionClaim: string;
  provenanceQuestion: string;
  conditionQuestion: string;
  testLabel: string;
  testDescription: string;
  testCost: number;
  knowledge: Array<{ title: string; body: string }>;
};

function likelihoodsFor(
  truthIds: string[],
  favoredId: string,
  strength: "medium" | "strong" | "anchor",
): EvidenceLikelihoods {
  const values = strength === "anchor" ? [0.01, 0.04, 0.95]
    : strength === "strong" ? [0.05, 0.15, 0.8]
      : [0.12, 0.23, 0.65];
  const output: EvidenceLikelihoods = {};
  let otherIndex = 0;
  for (const truthId of truthIds) {
    output[truthId] = truthId === favoredId ? values[2] : values[otherIndex++];
  }
  return output;
}

function statementLikelihoods(truthIds: string[], focus = 1): EvidenceLikelihoods {
  return Object.fromEntries(
    truthIds.map((truthId, index) => [truthId, index === focus ? 0.5 : 0.25]),
  );
}

export function createPlayerCase(config: PlayerCaseConfig): CaseDefinition {
  const truthIds = config.truths.map((truth) => truth.id);
  const evidence: CaseDefinition["evidence"] = {};
  const observationTargets: CaseDefinition["observationTargets"] = [];

  for (const target of config.targets) {
    const results: CaseDefinition["observationTargets"][number]["results"] = {};
    for (const truth of config.truths) {
      const finding = target.findings[truth.id];
      const evidenceId = `${config.id}:${target.id}:${truth.id}`;
      evidence[evidenceId] = {
        id: evidenceId,
        name: finding.name,
        kind: "object",
        topic: target.topic,
        strength: target.id === config.targets[0].id ? "medium" : "strong",
        sourceGroup: target.sourceGroup,
        dimensions: target.dimensions,
        detail: finding.detail,
        inference: finding.inference,
        lead: "将这项观察与另一独立位置或专项检测交叉验证。",
        likelihoods: likelihoodsFor(truthIds, truth.id, target.id === config.targets[0].id ? "medium" : "strong"),
      };
      results[truth.id] = {
        evidenceId,
        title: finding.name,
        description: finding.detail,
        bonusChance: 0,
      };
    }
    observationTargets.push({
      id: target.id,
      label: target.label,
      short: target.short,
      knowledgeHint: target.hint,
      results,
    });
  }

  const testEvidenceByVariant: Record<string, string> = {};
  for (const truth of config.truths) {
    const evidenceId = `${config.id}:test:${truth.id}`;
    testEvidenceByVariant[truth.id] = evidenceId;
    evidence[evidenceId] = {
      id: evidenceId,
      name: `${config.testLabel}：${truth.label}信号`,
      kind: "test",
      topic: "专项检测",
      strength: "anchor",
      sourceGroup: "specialist-test",
      dimensions: ["material-era", "component-era-consistency"],
      caseDecisiveFor: [truth.id],
      detail: `检测结果与“${truth.label}”的材料结构最为吻合。`,
      inference: "该结果权重很高，但仍应与器物位置证据互相印证。",
      lead: "回看已记录的位置证据，确认是否来自独立来源。",
      likelihoods: likelihoodsFor(truthIds, truth.id, "anchor"),
    };
  }

  const makeTopic = (
    id: string,
    label: string,
    prompt: string,
    initialClaim: string,
    dimension: ReasoningDimension,
  ): CaseDefinition["dialogueTopics"][number] => ({
    id,
    label,
    evidenceTopics: [label, "专项检测"],
    prompt,
    initialClaim,
    signalSourceGroup: "npc-statement",
    signalDimensions: [dimension],
    responses: {
      cooperate: `我把知道的${label}都说清楚，你可以据此判断。`,
      deflect: `我只能确认自己经手以后的${label}。`,
      "partial-admit": `有一部分${label}和我最初说的不完全一样。`,
      counter: `这项疑点不能单独否定整件东西。`,
      refuse: `关于${label}，我没有更多可补充的。`,
      exit: "既然彼此无法信任，这次交易就到这里。",
    },
    signals: Object.fromEntries(
      behaviorIds.map((behaviorId, index) => [
        behaviorId,
        {
          id: `${config.id}:${id}:${behaviorId}`,
          label: `${label}回应：${behaviorId}`,
          likelihoods: statementLikelihoods(truthIds, index === 2 ? 1 : 0),
        },
      ]),
    ) as CaseDefinition["dialogueTopics"][number]["signals"],
  });

  return {
    id: config.id,
    caseVersion: "2.0.0",
    title: config.title,
    seller: {
      name: config.sellerName,
      summary: config.sellerSummary,
      openingPrice: config.openingPrice,
    },
    actionBudget: 6,
    seed: 20260810,
    requiresAppraisal: true,
    claims: [
      { id: `${config.id}:provenance-claim`, text: config.provenanceClaim, topic: "来源经历" },
      { id: `${config.id}:condition-claim`, text: config.conditionClaim, topic: "品相变化" },
      { id: `${config.id}:price-claim`, text: `我的开价是 ${config.openingPrice} 点。`, topic: "开价依据" },
    ],
    initialNpcState: {
      pressure: 25,
      trust: 58,
      dealIntent: Math.round(55 + config.urgency * 25),
      control: Math.round(72 - config.urgency * 15),
      phase: "relaxed",
    },
    npcProfile: {
      id: config.profileId,
      label: config.profileLabel,
      beliefSummary: config.beliefSummary,
      personalitySummary: config.personalitySummary,
      publicTraits: config.publicTraits,
      expertise: 0.62,
      honestySensitivity: 0.8,
      openness: 0.66,
      riskAversion: config.riskAversion,
      urgency: config.urgency,
      markup: 0.08,
      outsideOption: Math.round(config.openingPrice * 0.2),
      privateSignals: [{
        id: `${config.id}:seller-memory`,
        label: "卖家自己的来源记忆",
        kind: "memory",
        confidence: 0.7,
        likelihoods: statementLikelihoods(truthIds, 1),
      }],
    },
    truthVariants: Object.fromEntries(
      config.truths.map((truth) => [truth.id, {
        id: truth.id,
        label: truth.label,
        summary: truth.summary,
        trueValue: truth.value,
        qualityGrade: truth.grade,
        overallGradeCap: truth.grade,
        facts: truth.facts,
      }]),
    ),
    evidence,
    observationTargets,
    dialogueTopics: [
      makeTopic("provenance", "来源经历", config.provenanceQuestion, config.provenanceClaim, "provenance-craft-identity"),
      makeTopic("condition", "品相变化", config.conditionQuestion, config.conditionClaim, "modern-restoration"),
    ],
    knowledgeCards: config.knowledge.map((item, index) => ({
      id: `${config.id}:knowledge:${index + 1}`,
      ...item,
    })),
    test: {
      id: `${config.id}:specialist-test`,
      label: config.testLabel,
      description: config.testDescription,
      actionPointCost: 2,
      valueCost: config.testCost,
      evidenceByVariant: testEvidenceByVariant,
    },
    judgmentModel: {
      hypothesisOrder: truthIds,
      requiredDimensions: Object.fromEntries([
        [truthIds[0], ["material-era", "component-era-consistency"]],
        [truthIds[1], ["material-era", "modern-restoration"]],
        [truthIds[2], ["material-era", "provenance-craft-identity"]],
      ]),
    },
  };
}
