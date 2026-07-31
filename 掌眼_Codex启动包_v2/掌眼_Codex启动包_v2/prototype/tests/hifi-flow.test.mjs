import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateOutcomeGrades,
  gradeIndex,
} from "../game/outcome-grades.ts";
import { calculateNegotiationCapacity } from "../game/negotiation.ts";
import {
  createInitialWorldState,
  getNpcPricing,
  resolveTurn,
} from "../game/resolve-action.ts";
import { lacquerBoxCase } from "../content/lacquer-box.ts";

test("65价值按65成交不再得到顶级结果，净收益提高时等级单调不降", () => {
  const common = {
    qualityGrade: "A",
    qualityCap: "A",
    acquired: true,
    trueValue: 65,
    entryAsk: 80,
    entryFloor: 55,
    judgmentScore: 86,
  };
  const atValue = calculateOutcomeGrades({
    ...common,
    paidPrice: 65,
    actualNet: 0,
  });
  const fiveProfit = calculateOutcomeGrades({
    ...common,
    paidPrice: 60,
    actualNet: 5,
  });

  assert.equal(atValue.netGrade, "C");
  assert.notEqual(atValue.overallGrade, "SSS");
  assert.ok(gradeIndex(fiveProfit.netGrade) >= gradeIndex(atValue.netGrade));
  assert.ok(
    gradeIndex(fiveProfit.overallGrade) >= gradeIndex(atValue.overallGrade),
  );
});

test("赝品综合封顶C，但判断质量可以达到SSS", () => {
  const result = calculateOutcomeGrades({
    qualityGrade: "C",
    qualityCap: "C",
    acquired: false,
    trueValue: 20,
    actualNet: 0,
    paidPrice: 0,
    entryAsk: 80,
    entryFloor: 55,
    judgmentScore: 98,
  });

  assert.equal(result.overallGrade, "C");
  assert.equal(result.judgmentGrade, "SSS");
  assert.equal(result.outcomeTag, "correct-avoidance");
});

test("默认NPC得到5点议价容量，报价不消耗调查点", () => {
  let state = createInitialWorldState(lacquerBoxCase);
  assert.equal(calculateNegotiationCapacity(state.npcState).capacity, 5);

  for (let index = 0; index < 6; index += 1) {
    state = resolveTurn(lacquerBoxCase, state, {
      kind: "inspect",
      targetId: "surface",
    });
  }
  assert.equal(state.actionPoints, 0);

  const pricing = getNpcPricing(lacquerBoxCase, state);
  state = resolveTurn(lacquerBoxCase, state, {
    kind: "discount",
    offer: pricing.acceptLine - 4,
  });

  assert.equal(state.actionPoints, 0);
  assert.equal(state.negotiation?.initialCapacity, 5);
  assert.equal(state.negotiation?.remainingCapacity, 4);
  assert.equal(state.negotiation?.offersMade, 1);
  assert.equal(state.actionHistory.at(-1)?.negotiationCapacityCost, 1);
});

test("首次正式报价后锁定调查，容量为0仍可接受或拒绝", () => {
  const initial = createInitialWorldState(lacquerBoxCase);
  const pricing = getNpcPricing(lacquerBoxCase, initial);
  const quoted = resolveTurn(lacquerBoxCase, initial, {
    kind: "discount",
    offer: pricing.acceptLine - 4,
  });

  assert.throws(
    () =>
      resolveTurn(lacquerBoxCase, quoted, {
        kind: "inspect",
        targetId: "latch",
      }),
    /正式议价已经开始/,
  );

  const exhausted = {
    ...quoted,
    negotiation: {
      ...quoted.negotiation,
      remainingCapacity: 0,
    },
  };
  assert.throws(
    () =>
      resolveTurn(lacquerBoxCase, exhausted, {
        kind: "discount",
        offer: pricing.acceptLine - 2,
      }),
    /议价容量不足/,
  );
  assert.doesNotThrow(() =>
    resolveTurn(lacquerBoxCase, exhausted, { kind: "buy" }),
  );
  assert.doesNotThrow(() =>
    resolveTurn(lacquerBoxCase, exhausted, { kind: "reject" }),
  );
});

test("质询只公开所选具体证据，不产生抽象披露状态", () => {
  let state = createInitialWorldState(lacquerBoxCase);
  state = resolveTurn(lacquerBoxCase, state, {
    kind: "inspect",
    targetId: "joint",
  });
  state = resolveTurn(lacquerBoxCase, state, {
    kind: "inspect",
    targetId: "latch",
  });
  state = resolveTurn(lacquerBoxCase, state, {
    kind: "dialogue",
    topicId: "repair-history",
    tone: "professional",
    evidenceId: "modern-adhesive-trace",
  });

  assert.ok(state.sharedEvidenceIds.includes("modern-adhesive-trace"));
  assert.ok(!state.sharedEvidenceIds.includes("restored-latch"));
  assert.ok(!("disclosureFrame" in state.actionHistory.at(-1).action));
});

test("结算输出等级和避损标签，不再输出0—100客观胜利线", () => {
  const counterfeit = createInitialWorldState(
    lacquerBoxCase,
    lacquerBoxCase.seed,
    "counterfeit",
  );
  const settled = resolveTurn(lacquerBoxCase, counterfeit, {
    kind: "reject",
  });

  assert.equal(settled.settlement?.overallGrade, "C");
  assert.equal(settled.settlement?.outcomeTag, "correct-avoidance");
  assert.equal(settled.settlement?.actualNet, 0);
  assert.ok(!("objectiveScore" in settled.settlement));
  assert.ok(
    !settled.settlement?.objectiveFormula.some((line) => line.includes("70")),
  );
});
