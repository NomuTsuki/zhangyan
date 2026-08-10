import assert from "node:assert/strict";
import test from "node:test";

import { lacquerBoxCase } from "../content/lacquer-box.ts";
import { calculateJudgmentQuality } from "../game/judgment-quality.ts";
import {
  calculatePosterior,
  createInitialWorldState,
  resolveTurn,
} from "../game/resolve-action.ts";

function scoreWithCase(
  caseDefinition,
  evidenceIds,
  {
    acquired = false,
    price = 80,
    statementHistory = [],
    redundantActionCount = 0,
    sellerExited = false,
  } = {},
) {
  const posterior = calculatePosterior(
    caseDefinition,
    evidenceIds,
    statementHistory,
  );
  const expectedValue = posterior.reduce(
    (sum, entry) => sum + entry.probability * entry.trueValue,
    0,
  );
  const buyExpectedNet = expectedValue - price;
  const chosenExpectedNet = acquired ? buyExpectedNet : 0;
  const bestExpectedNet = Math.max(0, buyExpectedNet);
  const utilityGap = Math.max(0, bestExpectedNet - chosenExpectedNet);

  const evidenceById = Object.fromEntries(
    [...new Set(evidenceIds)].flatMap((evidenceId) => {
      const evidence = caseDefinition.evidence[evidenceId];
      return evidence ? [[evidenceId, evidence]] : [];
    }),
  );
  const statementTopicsById = Object.fromEntries(
    [...new Set(statementHistory.map((statement) => statement.topicId))].flatMap(
      (topicId) => {
        const topic = caseDefinition.dialogueTopics.find(
          (candidate) => candidate.id === topicId,
        );
        return topic ? [[topicId, topic]] : [];
      },
    ),
  );

  return calculateJudgmentQuality({
    judgmentModel: caseDefinition.judgmentModel,
    evidenceById,
    statementTopicsById,
    posterior,
    discoveredEvidenceIds: evidenceIds,
    statementHistory,
    utilityGap,
    redundantActionCount,
    sellerExited,
  });
}

function score(evidenceIds, options) {
  return scoreWithCase(lacquerBoxCase, evidenceIds, options);
}

const sameSourceFixture = {
  ...lacquerBoxCase,
  evidence: {
    ...lacquerBoxCase.evidence,
    "same-source-a": {
      ...lacquerBoxCase.evidence["restored-interior"],
      id: "same-source-a",
      name: "同源信号A",
      dimensions: ["material-era"],
    },
    "same-source-b": {
      ...lacquerBoxCase.evidence["restored-interior"],
      id: "same-source-b",
      name: "同源信号B",
      dimensions: ["modern-restoration"],
    },
  },
};

function singleSignalFixture(strength) {
  return {
    ...lacquerBoxCase,
    evidence: {
      ...lacquerBoxCase.evidence,
      "cap-signal": {
        ...lacquerBoxCase.evidence["counterfeit-bonus"],
        id: "cap-signal",
        name: `非决定性${strength}信号`,
        strength,
        caseDecisiveFor: undefined,
      },
    },
  };
}

function makeStatement(topicId, behaviorId, turn) {
  const topic = lacquerBoxCase.dialogueTopics.find(
    (candidate) => candidate.id === topicId,
  );
  assert.ok(topic);
  const signal = topic.signals[behaviorId];
  assert.ok(signal);
  return {
    turn,
    topicId,
    behaviorId,
    sourceKind: "memory",
    confidence: 1,
    text: signal.label,
    signalId: signal.id,
    signalLabel: signal.label,
    likelihoods: signal.likelihoods,
  };
}

function multiSourceFixture(specs, requiredDimensions = [
  "material-era",
  "modern-restoration",
]) {
  const evidence = Object.fromEntries(
    specs.map((spec, index) => [
      `r-tier-${index}`,
      {
        ...lacquerBoxCase.evidence["restored-interior"],
        id: `r-tier-${index}`,
        name: `R档测试信号${index}`,
        strength: spec.strength,
        sourceGroup: spec.sourceGroup,
        dimensions: spec.dimensions,
        caseDecisiveFor: undefined,
      },
    ]),
  );
  return {
    ...lacquerBoxCase,
    judgmentModel: {
      ...lacquerBoxCase.judgmentModel,
      requiredDimensions: {
        ...lacquerBoxCase.judgmentModel.requiredDimensions,
        "restored-genuine": requiredDimensions,
      },
    },
    evidence: {
      ...lacquerBoxCase.evidence,
      ...evidence,
    },
  };
}

test("single signals receive the approved evidence ceilings", () => {
  const none = score([]);
  assert.equal(none.certaintyScore, 0);
  assert.equal(none.robustnessScore, 0);
  assert.equal(none.rawScore, 55);
  assert.equal(none.evidenceCap, "B");
  assert.equal(none.finalGrade, "B");

  const weak = score(["restored-surface"]);
  const medium = score(["counterfeit-surface"]);
  const strong = score(["restored-bottom"]);
  const anchor = score(["restored-bonus"]);
  assert.equal(weak.evidenceCap, "A");
  assert.equal(medium.evidenceCap, "A");
  assert.equal(strong.evidenceCap, "S");
  assert.equal(anchor.evidenceCap, "SS");
  assert.equal(weak.finalGrade, "B");
  assert.notEqual(medium.finalGrade, "SSS");
  assert.equal(strong.finalGrade, "A");
  assert.equal(anchor.finalGrade, "S");
  assert.notEqual(score(["counterfeit-interior"]).finalGrade, "SSS");
});

test("a high-certainty non-decisive single source is actually capped", () => {
  const weak = scoreWithCase(singleSignalFixture("weak"), ["cap-signal"]);
  const medium = scoreWithCase(singleSignalFixture("medium"), ["cap-signal"]);
  const strong = scoreWithCase(singleSignalFixture("strong"), ["cap-signal"]);
  const anchor = scoreWithCase(singleSignalFixture("anchor"), ["cap-signal"]);

  assert.equal(weak.baseGrade, "S");
  assert.equal(weak.evidenceCap, "A");
  assert.equal(weak.finalGrade, "A");
  assert.equal(medium.baseGrade, "S");
  assert.equal(medium.evidenceCap, "A");
  assert.equal(medium.finalGrade, "A");
  assert.equal(strong.baseGrade, "SS");
  assert.equal(strong.evidenceCap, "S");
  assert.equal(strong.finalGrade, "S");
  assert.equal(anchor.baseGrade, "SS");
  assert.equal(anchor.evidenceCap, "SS");
  assert.equal(anchor.finalGrade, "SS");
});

test("both approved case-decisive signals can independently reach SSS", () => {
  for (const [evidenceId, dominantVariantId, options] of [
    ["counterfeit-bonus", "counterfeit", { acquired: false }],
    ["treasure-bonus", "hidden-treasure", { acquired: true }],
  ]) {
    const result = score([evidenceId], options);
    assert.equal(result.dominantVariantId, dominantVariantId);
    assert.equal(result.decisiveEvidenceId, evidenceId);
    assert.equal(result.sssEligible, true);
    assert.equal(result.finalGrade, "SSS");
  }
});

test("two independent sources can close the restored hypothesis", () => {
  const result = score(["restored-interior", "restored-bonus"]);
  assert.deepEqual(result.missingDimensions, []);
  assert.equal(result.crossValidated, true);
  assert.equal(result.finalGrade, "SSS");
});

test("same-source signals cannot merge dimensions or raise robustness", () => {
  const one = scoreWithCase(sameSourceFixture, ["same-source-a"]);
  const two = scoreWithCase(sameSourceFixture, ["same-source-a", "same-source-b"]);
  assert.equal(two.robustnessScore, one.robustnessScore);
  assert.deepEqual(two.independentSourceGroups, one.independentSourceGroups);
  assert.deepEqual(two.coveredDimensions, one.coveredDimensions);
});

test("duplicate evidence ids do not change any judgment component", () => {
  const one = score(["restored-bottom"]);
  const duplicate = score(["restored-bottom", "restored-bottom"]);
  for (const key of [
    "decisionScore",
    "certaintyScore",
    "robustnessScore",
    "rawScore",
    "evidenceCap",
    "finalGrade",
  ]) {
    assert.equal(duplicate[key], one[key]);
  }
});

test("multiple NPC statements remain one capped source", () => {
  const first = makeStatement("repair-history", "cooperate", 1);
  const second = makeStatement("repair-history", "partial-admit", 2);
  const one = score([], { statementHistory: [first] });
  const two = score([], { statementHistory: [first, second] });
  assert.deepEqual(one.independentSourceGroups, ["npc-statement"]);
  assert.deepEqual(two.independentSourceGroups, ["npc-statement"]);
  assert.equal(one.robustnessScore, 30);
  assert.equal(two.robustnessScore, 30);
});

test("statement display cards never double-count structured statements", () => {
  const statement = makeStatement("repair-history", "partial-admit", 1);
  const structuredOnly = score([], { statementHistory: [statement] });
  const withDisplayCard = score(["repair-admission"], {
    statementHistory: [statement],
  });
  assert.equal(
    withDisplayCard.robustnessScore,
    structuredOnly.robustnessScore,
  );
  assert.deepEqual(
    withDisplayCard.independentSourceGroups,
    structuredOnly.independentSourceGroups,
  );
});

test("multi-source robustness tiers remain reachable and distinct", () => {
  const cases = [
    {
      expected: 60,
      specs: [
        { strength: "weak", sourceGroup: "surface", dimensions: ["material-era"] },
        { strength: "weak", sourceGroup: "bottom", dimensions: ["modern-restoration"] },
      ],
    },
    {
      expected: 75,
      specs: [
        { strength: "medium", sourceGroup: "surface", dimensions: ["material-era"] },
        { strength: "strong", sourceGroup: "bottom", dimensions: ["material-era"] },
      ],
    },
    {
      expected: 90,
      requiredDimensions: ["material-era", "modern-restoration", "price-context"],
      specs: [
        { strength: "medium", sourceGroup: "surface", dimensions: ["material-era"] },
        { strength: "strong", sourceGroup: "bottom", dimensions: ["modern-restoration"] },
      ],
    },
  ];

  for (const item of cases) {
    const fixture = multiSourceFixture(item.specs, item.requiredDimensions);
    const ids = item.specs.map((_, index) => `r-tier-${index}`);
    assert.equal(scoreWithCase(fixture, ids).robustnessScore, item.expected);
  }
});

test("conflicting quantity cannot buy SSS", () => {
  const result = score(["counterfeit-bottom", "restored-interior", "treasure-latch"]);
  assert.ok(result.certaintyScore < 85);
  assert.notEqual(result.finalGrade, "SSS");
});

test("ties use configured hypothesis order without hidden truth", () => {
  assert.equal(score([]).dominantVariantId, "counterfeit");
});

test("a decisive declaration for another hypothesis does not qualify", () => {
  const mismatched = {
    ...lacquerBoxCase,
    evidence: {
      ...lacquerBoxCase.evidence,
      "counterfeit-bonus": {
        ...lacquerBoxCase.evidence["counterfeit-bonus"],
        caseDecisiveFor: ["hidden-treasure"],
      },
    },
  };
  const result = scoreWithCase(mismatched, ["counterfeit-bonus"]);
  assert.equal(result.dominantVariantId, "counterfeit");
  assert.equal(result.decisiveEvidenceId, undefined);
  assert.notEqual(result.finalGrade, "SSS");
});

test("high evidence quality cannot rescue a high utility gap", () => {
  const result = score(["counterfeit-bonus"], { acquired: true });
  assert.ok(result.decisionScore < 95);
  assert.notEqual(result.finalGrade, "SSS");
});

test("decision score keeps the approved process penalties", () => {
  assert.equal(score([]).decisionScore, 100);
  assert.equal(score([], { redundantActionCount: 1 }).decisionScore, 96);
  assert.equal(score([], { sellerExited: true }).decisionScore, 85);
  assert.equal(
    score([], { redundantActionCount: 1, sellerExited: true }).decisionScore,
    81,
  );
});

test("irrelevant statement dimensions cannot inflate restored robustness", () => {
  const priceStatement = makeStatement("price", "cooperate", 1);
  const result = score(["restored-interior"], {
    statementHistory: [priceStatement],
  });

  assert.equal(result.dominantVariantId, "restored-genuine");
  assert.deepEqual(result.missingDimensions, ["modern-restoration"]);
  assert.equal(result.robustnessScore, 75);
  assert.equal(result.rawScore, 86);
  assert.equal(result.finalGrade, "S");
});

test("counterfeit interior feedback keeps the whole-case conclusion open", () => {
  const initial = createInitialWorldState(
    lacquerBoxCase,
    lacquerBoxCase.seed,
    "counterfeit",
  );
  const inspected = resolveTurn(lacquerBoxCase, initial, {
    kind: "inspect",
    targetId: "interior",
  });
  const feedback = inspected.actionHistory.at(-1);

  assert.ok(feedback);
  assert.match(feedback.description, /强支持木胎为现代制作，仍待独立佐证/);
  assert.doesNotMatch(feedback.description, /足以锚定现代制作/);
});
