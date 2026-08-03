import type {
  OutcomeGrade,
  OutcomeGrades,
  OutcomeTag,
} from "./types";

export const GRADE_ORDER = ["D", "C", "B", "A", "S", "SS", "SSS"] as const;

export type OutcomeGradeInput = {
  qualityGrade: OutcomeGrade;
  qualityCap: OutcomeGrade;
  acquired: boolean;
  trueValue: number;
  actualNet: number;
  paidPrice: number;
  entryAsk: number;
  entryFloor: number;
  judgmentScore: number;
  judgmentGrade: OutcomeGrade;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function gradeAt(index: number): OutcomeGrade {
  return GRADE_ORDER[clamp(Math.round(index), 0, GRADE_ORDER.length - 1)];
}

export function gradeIndex(grade: OutcomeGrade) {
  return GRADE_ORDER.indexOf(grade);
}

function netOutcome(input: OutcomeGradeInput): {
  grade: OutcomeGrade;
  tag: OutcomeTag;
  ratio: number;
} {
  if (!input.acquired) {
    const correctAvoidance = input.trueValue <= input.entryFloor;
    return {
      grade: correctAvoidance ? "A" : "D",
      tag: correctAvoidance ? "correct-avoidance" : "missed-opportunity",
      ratio: 0,
    };
  }

  if (input.actualNet < 0) {
    return {
      grade: "D",
      tag: "loss",
      ratio: input.actualNet / Math.max(1, input.trueValue),
    };
  }
  if (input.actualNet === 0) {
    return { grade: "C", tag: "break-even", ratio: 0 };
  }

  const ratio = input.actualNet / Math.max(1, input.trueValue);
  const grade =
    ratio < 0.1
      ? "C"
      : ratio < 0.2
        ? "B"
        : ratio < 0.3
          ? "A"
          : ratio < 0.45
            ? "S"
            : ratio < 0.6
              ? "SS"
              : "SSS";
  return { grade, tag: "profitable", ratio };
}

function bargainingOutcome(input: OutcomeGradeInput): {
  grade: OutcomeGrade;
  capture: number;
} {
  if (!input.acquired) return { grade: "C", capture: 0 };
  if (input.paidPrice <= input.entryFloor) {
    return { grade: "SSS", capture: 1 };
  }

  const reachableRange = Math.max(1, input.entryAsk - input.entryFloor);
  const capture = clamp(
    (input.entryAsk - input.paidPrice) / reachableRange,
    0,
    1,
  );
  const grade =
    capture < 0.2
      ? "D"
      : capture < 0.4
        ? "C"
        : capture < 0.6
          ? "B"
          : capture < 0.8
            ? "A"
            : capture < 0.95
              ? "S"
              : "SS";
  return { grade, capture };
}

export function calculateOutcomeGrades(
  input: OutcomeGradeInput,
): OutcomeGrades {
  const net = netOutcome(input);
  const bargaining = bargainingOutcome(input);
  const qualityIndex = gradeIndex(input.qualityGrade);
  const netIndex = gradeIndex(net.grade);
  const bargainingIndex = gradeIndex(bargaining.grade);
  const judgmentIndex = gradeIndex(input.judgmentGrade);
  const rawOverallIndex = Math.round(
    qualityIndex * 0.35
      + netIndex * 0.3
      + bargainingIndex * 0.2
      + judgmentIndex * 0.15,
  );
  const cappedOverallIndex = Math.min(
    rawOverallIndex,
    gradeIndex(input.qualityCap),
  );

  return {
    overallGrade: gradeAt(cappedOverallIndex),
    qualityGrade: input.qualityGrade,
    qualityCap: input.qualityCap,
    netGrade: net.grade,
    bargainingGrade: bargaining.grade,
    judgmentGrade: input.judgmentGrade,
    outcomeTag: net.tag,
    rawOverallIndex,
    cappedOverallIndex,
    formula: [
      `品质序号 = ${input.qualityGrade}(${qualityIndex})`,
      `净收益档位 = ${net.grade}(${netIndex})；净收益率 = ${Math.round(net.ratio * 1000) / 10}%`,
      `议价档位 = ${bargaining.grade}(${bargainingIndex})；让利捕获率 = ${Math.round(bargaining.capture * 1000) / 10}%`,
      `判断档位 = ${input.judgmentGrade}(${judgmentIndex})；判断原始分 = ${clamp(Math.round(input.judgmentScore), 0, 100)}`,
      `原始等级序号 = round(${qualityIndex}×0.35 + ${netIndex}×0.30 + ${bargainingIndex}×0.20 + ${judgmentIndex}×0.15) = ${rawOverallIndex}`,
      `综合等级序号 = min(${rawOverallIndex}, 品质上限${input.qualityCap}(${gradeIndex(input.qualityCap)})) = ${cappedOverallIndex}`,
    ],
  };
}
