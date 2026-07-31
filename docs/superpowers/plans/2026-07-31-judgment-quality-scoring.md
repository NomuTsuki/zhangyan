# 《掌眼》判断质量评分修正 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把判断质量从“单次买／拒方向是否符合期望值”改为决策合理性 D、后验确定性 C、证据稳健度 R 的组合，并确保普通单条强证据不能获得 SSS、整案决定性证据仍可单独获得 SSS。

**Architecture:** 新建纯规则模块 `game/judgment-quality.ts`，由案件配置提供来源组、推理维度和决定性证据语义；`resolve-action.ts` 只负责组装终局输入，`outcome-grades.ts` 只消费已经封顶的最终判断档位。玩家复盘仍只显示一个判断档位和一句原因，精确 D/C/R/J、封顶和维度缺口只进入开发调试栏。

**Tech Stack:** TypeScript 5.9、Node.js 24 原生测试、React 19、Vite 8、自包含离线 HTML、PowerShell。

## Global Constraints

- 判断质量只能读取玩家已发现的物证、检测、结构化 NPC 陈述和玩家可见后验；不得读取本局 `truthVariantId`。
- 没有证据最高 B；单条弱／中证据最高 A；单条普通强证据最高 S；单条局部锚点最高 SS。
- `counterfeit-bonus` 与 `treasure-bonus` 是首案仅有的整案决定性证据；`counterfeit-interior`、`restored-bonus` 和专项检测仍是局部锚点。
- SSS 同时要求 `J >= 95`、`D >= 95`、`C >= 85`、`R >= 90`，并满足交叉验证或决定性证据资格。
- 综合成果必须消费封顶后的最终判断档位，不能让未封顶的原始 J 继续抬高综合等级。
- 玩家主界面不显示 D/C/R/J、主导假设、来源组、缺失维度、决定性资格或封顶公式。
- 精确分项仅在桌面开发栏和开发调试页局末展示；手机玩家界面继续隐藏开发栏。
- 权威离线交付物是 `prototype/public/掌眼_高保真教师演示.html`，必须由构建生成，不能手工修改。
- 本轮不修改或暂存 `prototype/app/globals.css`、`prototype/standalone/client.js`、`prototype/public/掌眼_低保真交互原型.html`、`周报/**`、`近期开发对齐/**` 和未跟踪的短名 `prototype/public/掌眼_高保真演示.html`。
- 所有行为改动遵循 RED → GREEN；每个新增测试必须先在旧实现上按预期失败。

---

## Execution Preflight

当前检出目录不是 linked worktree，且有用户未提交内容。执行前：

1. 先完成 Task 0，把上一轮已经实现并独立验证的滚动修复单独封存；
2. 经用户同意后，使用 `superpowers:using-git-worktrees` 建立隔离工作区和 `codex/judgment-quality-scoring` 分支；
3. 在隔离工作区执行 Task 1—4；
4. 不使用 `git add -A`、`git add .`、`git clean`、`git reset` 或覆盖用户文件的命令。

Task 1—3 与 Task 4 的 Step 1—5 均从隔离工作区的 `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype` 目录执行；Task 4 的 Step 6—9 从隔离工作区的仓库根目录执行。

### Task 0: 封存上一轮还价后终局操作滚动修复

**Files:**
- Modify already present: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/HighFidelityApp.tsx`
- Regenerate: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_高保真教师演示.html`

**Interfaces:**
- Consumes: 当前 `Trade` 中的 `tradeScreenRef`、`terminalActionsRef` 与 `offersMade` 滚动修复。
- Produces: 一个独立 Git 提交，供新的隔离分支继承；不会纳入短名 HTML 或低保真脏文件。

- [ ] **Step 1: 重建 canonical 高保真单文件**

Run from `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype`:

```powershell
npm.cmd run build
```

Expected: exit `0`；重新生成 `public/掌眼_高保真教师演示.html` 并复制到 `dist/client/`。

- [ ] **Step 2: 重新验证上一轮滚动修复**

```powershell
node --experimental-strip-types --test tests/hifi-html.test.mjs tests/hifi-flow.test.mjs tests/hifi-accessibility.test.mjs
```

Expected: 所有专项测试通过；canonical public 与 dist 文件完全一致。

- [ ] **Step 3: 核对只包含上一轮修复**

```powershell
git -c core.quotepath=false status --short
git diff --check -- hifi/HighFidelityApp.tsx public/掌眼_高保真教师演示.html
```

Expected: 目标文件无 whitespace error；短名 `掌眼_高保真演示.html` 仍保持未跟踪且未被覆盖。

- [ ] **Step 4: 只暂存两个明确文件**

```powershell
git add -- hifi/HighFidelityApp.tsx public/掌眼_高保真教师演示.html
git diff --cached --name-only
git diff --cached --check
```

Expected staged list:

```text
掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/HighFidelityApp.tsx
掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_高保真教师演示.html
```

- [ ] **Step 5: 提交旧修复**

```powershell
git commit -m "fix: 修复还价后终局操作可见性"
```

---

### Task 1: 建立纯判断质量模型与首案证据语义

**Files:**
- Create: `prototype/game/judgment-quality.ts`
- Create: `prototype/tests/judgment-quality.test.mjs`
- Modify: `prototype/game/types.ts`
- Modify: `prototype/content/lacquer-box.ts`
- Modify: `prototype/package.json`

**Interfaces:**
- Consumes: `CaseDefinition`、`PosteriorEntry[]`、唯一物证 ID、唯一结构化 `StatementRecord`、`utilityGap`、重复行动数和卖家离场状态。
- Produces:

```ts
export function calculateJudgmentQuality(input: {
  caseDefinition: CaseDefinition;
  posterior: PosteriorEntry[];
  discoveredEvidenceIds: string[];
  statementHistory: StatementRecord[];
  utilityGap: number;
  redundantActionCount: number;
  sellerExited: boolean;
}): JudgmentQualityBreakdown;
```

`JudgmentQualityBreakdown` 必须包含：

```ts
{
  decisionScore: number;
  certaintyScore: number;
  robustnessScore: number;
  rawScore: number;
  baseGrade: OutcomeGrade;
  evidenceCap: OutcomeGrade;
  finalGrade: OutcomeGrade;
  dominantVariantId: TruthVariantId;
  supportingSignalIds: string[];
  independentSourceGroups: EvidenceSourceGroup[];
  coveredDimensions: ReasoningDimension[];
  missingDimensions: ReasoningDimension[];
  crossValidated: boolean;
  decisiveEvidenceId?: string;
  sssEligible: boolean;
  capApplied: boolean;
  capReason: string;
  playerLabel: string;
  formula: string[];
}
```

- [ ] **Step 1: 写纯规则 RED 测试**

Create `tests/judgment-quality.test.mjs` with these imports and real-engine helpers:

```js
import assert from "node:assert/strict";
import test from "node:test";

import { lacquerBoxCase } from "../content/lacquer-box.ts";
import { calculateJudgmentQuality } from "../game/judgment-quality.ts";
import { calculatePosterior } from "../game/resolve-action.ts";

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
  return calculateJudgmentQuality({
    caseDefinition,
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
```

Then add literal expectations:

```js
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
```

The helper derives the visible posterior with the real `calculatePosterior()` and uses the literal decision price `80`; expected D/C/R/J values remain handwritten literals.

- [ ] **Step 2: 运行 RED**

```powershell
node --experimental-strip-types --test tests/judgment-quality.test.mjs
```

Expected: FAIL because `judgment-quality.ts` and the new configuration fields do not exist.

- [ ] **Step 3: 加入判别类型与案件模型**

Add to `types.ts`:

```ts
export type EvidenceSourceGroup =
  | "surface"
  | "bottom"
  | "joint"
  | "latch"
  | "interior"
  | "hidden-mark"
  | "specialist-test"
  | "npc-statement";

export type ReasoningDimension =
  | "material-era"
  | "modern-restoration"
  | "component-era-consistency"
  | "provenance-craft-identity"
  | "price-context";
```

Make `EvidenceDefinition` a discriminated union so `object/test` evidence requires `sourceGroup` and `dimensions`, while statement display cards cannot accidentally participate in R. Add `signalSourceGroup` and `signalDimensions` to `DialogueTopic`. Add to `CaseDefinition`:

```ts
judgmentModel: {
  hypothesisOrder: TruthVariantId[];
  requiredDimensions: Record<TruthVariantId, ReasoningDimension[]>;
};
```

- [ ] **Step 4: 配置首案全部证据**

Copy the exact mapping from `docs/superpowers/specs/2026-07-31-judgment-quality-scoring-design.md` into `content/lacquer-box.ts`.

The only decisive declarations must be exactly:

- add `caseDecisiveFor: ["counterfeit"]` inside the existing `counterfeit-bonus` definition;
- add `caseDecisiveFor: ["hidden-treasure"]` inside the existing `treasure-bonus` definition.

Do not mark `counterfeit-interior`, `restored-bonus`, `treasure-interior`, `test-modern-adhesive`, or `test-old-organic-adhesive` decisive. Change the `counterfeit-interior` player copy from “足以锚定整体仿制判断” to “强支持木胎为现代制作，仍待独立佐证”，so content does not contradict the new scope.

- [ ] **Step 5: 实现 D/C/R/J 和证据封顶**

Implement in `judgment-quality.ts`:

```ts
const decisionScore = clamp(
  Math.round(
    100
      - input.utilityGap * 3
      - input.redundantActionCount * 4
      - (input.sellerExited ? 15 : 0),
  ),
);

const entropy = input.posterior.reduce(
  (sum, entry) =>
    entry.probability > 0
      ? sum - entry.probability * Math.log2(entry.probability)
      : sum,
  0,
);

const certaintyScore = Math.round(
  100 * (1 - entropy / Math.log2(input.posterior.length)),
);

const rawScore = Math.round(
  decisionScore * 0.55
    + certaintyScore * 0.25
    + robustnessScore * 0.20,
);
```

Supporting signals must satisfy:

```ts
signalLikelihoodForDominant
  > Math.max(...signalLikelihoodsForOtherVariants)
```

For each `sourceGroup`, choose exactly one signal by:

1. higher `strength`;
2. more required dimensions covered;
3. original discovery order.

Do not union dimensions from multiple signals in the same group. Treat all structured NPC statements as one `npc-statement` group with maximum robustness strength `medium`; their `confidence` continues to affect posterior C.

Apply the exact R tiers and grade ceilings from the approved spec. A decisive signal only qualifies when its `caseDecisiveFor` includes the visible dominant hypothesis and the D/C/R/J gates all pass.

Generate `playerLabel` from the actual limiting condition, in this priority order:

1. `decisionScore < 70`: `最终选择与当前证据下的较优决策偏差较大`;
2. no supporting signal: `方向可能合理，但目前没有证据支撑`;
3. exactly one independent source and no decisive evidence: `方向合理，但目前只由单点证据支撑，仍缺独立佐证`;
4. missing required dimensions: `关键事实已有依据，主要替代解释仍待排除`;
5. final SSS through decisive evidence or cross-validation: `关键结论已锁定`;
6. otherwise: `判断方向合理，证据链仍可继续补强`.

- [ ] **Step 6: 增加同源、冲突、tie-break 和错误决策测试**

Add real-behavior cases:

```js
test("same-source signals cannot merge dimensions or raise robustness", () => {
  const one = scoreWithCase(sameSourceFixture, ["signal-a"]);
  const two = scoreWithCase(sameSourceFixture, ["signal-a", "signal-b"]);
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
        {
          strength: "weak",
          sourceGroup: "surface",
          dimensions: ["material-era"],
        },
        {
          strength: "weak",
          sourceGroup: "bottom",
          dimensions: ["modern-restoration"],
        },
      ],
    },
    {
      expected: 75,
      specs: [
        {
          strength: "medium",
          sourceGroup: "surface",
          dimensions: ["material-era"],
        },
        {
          strength: "strong",
          sourceGroup: "bottom",
          dimensions: ["material-era"],
        },
      ],
    },
    {
      expected: 90,
      requiredDimensions: [
        "material-era",
        "modern-restoration",
        "price-context",
      ],
      specs: [
        {
          strength: "medium",
          sourceGroup: "surface",
          dimensions: ["material-era"],
        },
        {
          strength: "strong",
          sourceGroup: "bottom",
          dimensions: ["modern-restoration"],
        },
      ],
    },
  ];

  for (const item of cases) {
    const fixture = multiSourceFixture(
      item.specs,
      item.requiredDimensions,
    );
    const ids = item.specs.map((_, index) => `r-tier-${index}`);
    assert.equal(
      scoreWithCase(fixture, ids).robustnessScore,
      item.expected,
    );
  }
});

test("conflicting quantity cannot buy SSS", () => {
  const result = score([
    "counterfeit-bottom",
    "restored-interior",
    "treasure-latch",
  ]);
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
  assert.equal(
    score([], { redundantActionCount: 1 }).decisionScore,
    96,
  );
  assert.equal(score([], { sellerExited: true }).decisionScore, 85);
  assert.equal(
    score([], {
      redundantActionCount: 1,
      sellerExited: true,
    }).decisionScore,
    81,
  );
});
```

- [ ] **Step 7: 运行 GREEN**

```powershell
node --experimental-strip-types --test tests/judgment-quality.test.mjs
```

Expected: all judgment-quality tests pass.

- [ ] **Step 8: 把测试加入完整门禁**

Insert `tests/judgment-quality.test.mjs` into `package.json`'s `test` command before `tests/rules.test.mjs`.

- [ ] **Step 9: 提交纯模型**

```powershell
git add -- game/judgment-quality.ts game/types.ts content/lacquer-box.ts tests/judgment-quality.test.mjs package.json
git diff --cached --check
git commit -m "feat: 建立判断质量证据稳健度模型"
```

---

### Task 2: 接入终局结算与综合等级

**Files:**
- Modify: `prototype/game/resolve-action.ts`
- Modify: `prototype/game/outcome-grades.ts`
- Modify: `prototype/game/types.ts`
- Modify: `prototype/tests/rules.test.mjs`
- Modify: `prototype/tests/hifi-flow.test.mjs`
- Modify: `prototype/docs/03_NUMERIC_MODEL.md`

**Interfaces:**
- Consumes: `calculateJudgmentQuality()` and its final capped grade.
- Produces: `SettlementResult.judgmentBreakdown`；兼容保留 `judgmentScore = rawScore`、`judgmentGrade = finalGrade`、`judgmentLabel = playerLabel`。

- [ ] **Step 1: 写结算集成 RED 测试**

Add this helper to `rules.test.mjs`:

```js
function settleWithCase(
  caseDefinition,
  variant,
  evidenceIds,
  action,
) {
  const initial = createInitialWorldState(caseDefinition, 5, variant);
  const visibleState = {
    ...initial,
    discoveredEvidenceIds: [...evidenceIds],
  };
  return resolveTurn(caseDefinition, visibleState, action).settlement;
}

function settleWithEvidence(variant, evidenceIds, action) {
  return settleWithCase(
    lacquerBoxCase,
    variant,
    evidenceIds,
    action,
  );
}
```

Add to `rules.test.mjs`:

```js
test("settlement uses capped judgment grades and preserves objective fields", () => {
  const visible = ["restored-bottom"];
  const results = ["counterfeit", "restored-genuine", "hidden-treasure"].map(
    (variant) => settleWithEvidence(variant, visible, { kind: "reject" }),
  );

  assert.deepEqual(
    results.map((result) => result.judgmentGrade),
    ["A", "A", "A"],
  );
  assert.equal(new Set(results.map((result) =>
    JSON.stringify(result.judgmentBreakdown))).size, 1);
  assert.equal(new Set(results.map((result) => result.trueValue)).size, 3);
});

test("settlement consumes the capped final judgment grade", () => {
  const cappedCase = {
    ...lacquerBoxCase,
    evidence: {
      ...lacquerBoxCase.evidence,
      "cap-signal": {
        ...lacquerBoxCase.evidence["counterfeit-bonus"],
        id: "cap-signal",
        name: "高确定性非决定性强证据",
        strength: "strong",
        caseDecisiveFor: undefined,
      },
    },
  };
  const result = settleWithCase(
    cappedCase,
    "counterfeit",
    ["cap-signal"],
    { kind: "reject" },
  );

  assert.equal(result.judgmentBreakdown.baseGrade, "SS");
  assert.equal(result.judgmentBreakdown.evidenceCap, "S");
  assert.equal(result.judgmentBreakdown.finalGrade, "S");
  assert.equal(
    result.judgmentGrade,
    result.judgmentBreakdown.finalGrade,
  );
  assert.notEqual(
    result.judgmentGrade,
    result.judgmentBreakdown.baseGrade,
  );
});

test("raw SSS cannot bypass the final evidence cap in overall grading", () => {
  const result = calculateOutcomeGrades({
    qualityGrade: "S",
    qualityCap: "SSS",
    acquired: true,
    trueValue: 100,
    actualNet: 40,
    paidPrice: 60,
    entryAsk: 80,
    entryFloor: 60,
    judgmentScore: 99,
    judgmentGrade: "S",
  });
  assert.equal(result.judgmentGrade, "S");
  assert.equal(result.rawOverallIndex, 4);
  assert.equal(result.overallGrade, "S");
});
```

- [ ] **Step 2: 运行 RED**

```powershell
node --experimental-strip-types --test tests/rules.test.mjs tests/hifi-flow.test.mjs
```

Expected: FAIL because settlement lacks `judgmentBreakdown` and `calculateOutcomeGrades` still re-grades raw score.

- [ ] **Step 3: 让综合等级消费最终判断档位**

Change `OutcomeGradeInput` to:

```ts
type OutcomeGradeInput = {
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
```

Remove internal judgment re-grading from `calculateOutcomeGrades()`. Use `input.judgmentGrade` for `judgmentIndex`, returned `judgmentGrade`, and overall weighting. Keep `judgmentScore` only in the formula trace.

- [ ] **Step 4: 在 settlementResult() 接入纯模型**

Remove the old `strongestPosterior`、`visibleSignalCount`、`uncertaintyPenalty` and `unsupportedRiskPenalty` branches. Call:

```ts
const judgmentBreakdown = calculateJudgmentQuality({
  caseDefinition,
  posterior,
  discoveredEvidenceIds: state.discoveredEvidenceIds,
  statementHistory: state.statementHistory,
  utilityGap,
  redundantActionCount: state.actionHistory.filter((turn) => turn.redundant).length,
  sellerExited: choice === "seller-exited",
});
```

Pass `judgmentBreakdown.finalGrade` to `calculateOutcomeGrades()` and store:

```ts
judgmentScore: judgmentBreakdown.rawScore,
judgmentGrade: judgmentBreakdown.finalGrade,
judgmentLabel: judgmentBreakdown.playerLabel,
judgmentBreakdown,
judgmentFormula: judgmentBreakdown.formula,
```

Deep-clone every array in `judgmentBreakdown` inside `cloneState()`.

- [ ] **Step 5: 更新直接调用 outcome-grades 的测试**

In `hifi-flow.test.mjs`, give every `calculateOutcomeGrades()` fixture an explicit final `judgmentGrade`. Preserve the existing rule that a counterfeit can have judgment SSS while its overall result remains capped at C.

- [ ] **Step 6: 更新数值说明**

Replace the old judgment section in `docs/03_NUMERIC_MODEL.md` with the approved D/C/R/J formula, grade ceilings, SSS gate, and one worked example:

```text
单条强证据“后刻底款”：
D=100，C=32，R=50
J=round(100×0.55 + 32×0.25 + 50×0.20)=73
最终判断质量=A
```

Remove the obsolete “最大后验超过55%即不罚不确定性”和“85以上证据充分” description.

- [ ] **Step 7: 运行专项 GREEN**

```powershell
node --experimental-strip-types --test tests/judgment-quality.test.mjs tests/rules.test.mjs tests/hifi-flow.test.mjs
```

Expected: all three rule suites pass.

- [ ] **Step 8: 类型与 lint 检查**

```powershell
npx.cmd tsc --noEmit
npm.cmd run lint
```

Expected: both commands exit `0`.

- [ ] **Step 9: 提交结算接线**

```powershell
git add -- game/resolve-action.ts game/outcome-grades.ts game/types.ts tests/rules.test.mjs tests/hifi-flow.test.mjs docs/03_NUMERIC_MODEL.md
git diff --cached --check
git commit -m "feat: 接入判断质量分层结算"
```

---

### Task 3: 渐进式披露调试分项并更新高保真 HTML

**Files:**
- Modify: `prototype/hifi/HighFidelityApp.tsx`
- Modify: `prototype/hifi/presentation.ts`
- Modify: `prototype/hifi/styles.css`
- Modify: `prototype/app/page.tsx`
- Modify: `prototype/tests/hifi-presentation.test.mjs`
- Modify: `prototype/tests/hifi-html.test.mjs`
- Regenerate: `prototype/public/掌眼_高保真教师演示.html`

**Interfaces:**
- Consumes: `SettlementResult.judgmentBreakdown`.
- Produces: 玩家卡片只显示最终档位与 `judgmentReason`；开发栏局末显示 D/C/R/J、基础档、证据上限、最终档、来源组、覆盖／缺失维度和决定性证据。

- [ ] **Step 1: 写玩家隔离与生成物 RED 测试**

Replace the setup in the existing settlement-card test in `hifi-presentation.test.mjs` and extend its assertions with:

```js
const visible = {
  ...start("restored-genuine"),
  discoveredEvidenceIds: ["restored-bottom"],
};
const settled = resolveTurn(lacquerBoxCase, visible, {
  kind: "reject",
});
const card = buildSettlementCard(settled.settlement);
assert.ok(card);
assert.match(card.judgmentReason, /单点|独立佐证/);

const serialized = JSON.stringify(card);
for (const forbidden of [
  "judgmentBreakdown",
  "decisionScore",
  "certaintyScore",
  "robustnessScore",
  "rawScore",
  "baseGrade",
  "evidenceCap",
  "dominantVariantId",
  "supportingSignalIds",
  "independentSourceGroups",
  "coveredDimensions",
  "missingDimensions",
  "crossValidated",
  "decisiveEvidenceId",
  "sssEligible",
  "capApplied",
  "capReason",
  "formula",
]) {
  assert.doesNotMatch(serialized, new RegExp(forbidden));
}
```

Extend `hifi-html.test.mjs` so the generated artifact must contain:

```js
for (const label of [
  "决策合理性 D",
  "后验确定性 C",
  "证据稳健度 R",
  "证据上限",
  "缺失维度",
]) {
  assert.match(html, new RegExp(label));
}
```

- [ ] **Step 2: 运行 RED**

```powershell
node --experimental-strip-types --test tests/hifi-presentation.test.mjs tests/hifi-html.test.mjs
```

Expected: generated HTML test fails because the developer rail does not contain the new breakdown.

- [ ] **Step 3: 在高保真开发栏增加局末 breakdown**

In `TeacherRail`, render a new section only when:

```tsx
world.status === "settled" && world.settlement?.judgmentBreakdown
```

Use copy:

```text
判断质量拆解
决策合理性 D
后验确定性 C
证据稳健度 R
综合判断 J
基础档
证据上限
最终档
独立来源
已覆盖维度
缺失维度
决定性证据
SSS资格
```

Do not change the player Review card structure at lines currently displaying `settlement.judgmentGrade` and `settlement.judgmentLabel`. Preserve the existing `Trade` auto-scroll refs and effect from Task 0.

- [ ] **Step 4: 收口玩家展示模型**

Add `judgmentReason: string` to `PlayerSettlementCard` in `hifi/presentation.ts` and populate it only from `settlement.judgmentLabel`. Do not copy `judgmentBreakdown` or any of its fields into the player presentation model.

- [ ] **Step 5: 在 React 开发调试页增加相同分项**

In `app/page.tsx`'s existing “判断质量公式” debug panel, display the three exact scores and the capped grade before `judgmentFormula`. Reuse existing `posterior-grid` and `debug-formula-stack`; do not edit dirty `app/globals.css`.

- [ ] **Step 6: 加入仅供开发栏的样式**

Add `.judgment-debug-grid` and `.judgment-debug-list` under `.teacher-rail` in `hifi/styles.css`. Do not target `.player-frame .grade-cards` or alter mobile player layout. Preserve the existing `max-width: 820px` rule that removes the developer rail on phones.

- [ ] **Step 7: 重建 canonical HTML**

```powershell
npm.cmd run build
```

Expected: exit `0`；canonical public 与 dist/client 文件更新；短名未跟踪 HTML 不变。

- [ ] **Step 8: 运行高保真 GREEN**

```powershell
node --experimental-strip-types --test tests/hifi-html.test.mjs tests/hifi-flow.test.mjs tests/hifi-presentation.test.mjs tests/hifi-accessibility.test.mjs
```

Expected: all high-fidelity suites pass.

- [ ] **Step 9: 提交调试展示和生成物**

```powershell
git add -- hifi/HighFidelityApp.tsx hifi/presentation.ts hifi/styles.css app/page.tsx tests/hifi-presentation.test.mjs tests/hifi-html.test.mjs public/掌眼_高保真教师演示.html
git diff --cached --check
git commit -m "feat: 展示判断质量分项复盘"
```

---

### Task 4: 完整验证、真实浏览器复核与项目记录

**Files:**
- Modify: `docs/superpowers/specs/2026-07-31-judgment-quality-scoring-design.md`
- Modify: `docs/project/decisions/DEC-004-objective-outcome-and-judgment.md`
- Modify: `docs/project/02-CURRENT-STATE.md`
- Create: `docs/project/evidence/EXP-013-judgment-quality-scoring.md`

**Interfaces:**
- Consumes: Tasks 1—3 的实际测试、构建和浏览器观察。
- Produces: 可追溯的验证记录；只有实际执行过的结果才能写入 Evidence。

- [ ] **Step 1: 运行完整自动门禁**

```powershell
npm.cmd test
npx.cmd tsc --noEmit
npm.cmd run lint
```

Expected: every command exits `0` with no failed test, TypeScript error, ESLint error, build warning, or runtime warning.

- [ ] **Step 2: 核对生成物一致性**

```powershell
Get-FileHash -Algorithm SHA256 public/掌眼_高保真教师演示.html
Get-FileHash -Algorithm SHA256 dist/client/掌眼_高保真教师演示.html
```

Expected: the two SHA256 hashes are identical.

- [ ] **Step 3: 在 1440 × 1000 真实 Chrome 完成单条强证据流程**

Open canonical HTML directly with `file://` and perform:

```text
开始本案
→ 检查底款，获得“后刻底款”
→ 不再取得第二条证据
→ 进入交易并拒绝
→ 查看玩家复盘
→ 展开开发栏
```

Assert:

- 玩家判断质量不是 SSS；
- 玩家区只见最终档位和一句原因；
- 开发栏显示 D、C、R、J、来源组、缺失维度、证据上限和最终档；
- 控制台无 error/warning；
- 页面与开发栏无横向溢出。

- [ ] **Step 4: 在 390 × 844 真实 Chrome 完成同一路径**

Assert:

- 开发栏不可见且不进入玩家可访问树；
- 玩家卡片不泄漏 D/C/R/J；
- 所有操作仍可完成；
- 页面无横向溢出；
- 控制台无 error/warning。

- [ ] **Step 5: 复核还价滚动回归**

At both viewports:

```text
现代胶痕 → 公开证据 → 进入交易 → 报价50 → NPC还价58
```

Assert “按当前要价买下”和“拒绝交易”完整可见、可点击，底部至少保留 `16px` 余量。

- [ ] **Step 6: 写入项目证据**

Update the scoring spec status to `已确认并实现（2026-07-31）`。Update DEC-004 with:

```text
判断质量内部拆为 D/C/R/J；普通单条强证据最高 S，局部锚点最高 SS；
整案决定性证据或完成交叉验证后才有资格进入 SSS。
```

Create `EXP-013-judgment-quality-scoring.md` with exact executed commands, test counts, both viewport observations, evidence provenance, unverified surfaces, and residual risks. Update CURRENT-STATE only with facts supported by those fresh results.

- [ ] **Step 7: 独立代码与浏览器审查**

Dispatch an independent reviewer with the complete branch diff and the canonical HTML. Require separate verdicts for:

- spec compliance;
- code quality;
- hidden-truth isolation;
- player/developer information boundary;
- desktop/mobile behavior.

Any Critical or Important finding must enter the bounded fix/re-review loop before completion.

- [ ] **Step 8: 最终 Git 门禁**

```powershell
git diff --check
git -c core.quotepath=false status --short
git diff --cached --name-only
git diff --cached --check
```

Confirm no unrelated dirty file is staged.

- [ ] **Step 9: 提交验证记录**

```powershell
git add -- docs/superpowers/specs/2026-07-31-judgment-quality-scoring-design.md docs/project/decisions/DEC-004-objective-outcome-and-judgment.md docs/project/02-CURRENT-STATE.md docs/project/evidence/EXP-013-judgment-quality-scoring.md
git diff --cached --check
git commit -m "docs: 记录判断质量修正验证"
```
