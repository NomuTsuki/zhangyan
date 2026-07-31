# 《掌眼》高保真教师演示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保留低保真原型和数值实验台的同时，新增一份共享 TypeScript 规则核心、可离线双击打开、可完整走通首案的高保真教师演示 HTML。

**Architecture:** 先把等级制结算、调查行动点与议价容量分账、具体证据披露写成纯规则契约，再建立独立 Vite 客户端入口。高保真 React UI 直接导入现有案件内容和 TypeScript 规则，通过构建脚本把 JS、CSS 和 SVG 内联到一个 HTML；低保真静态文件继续保留，不复制第三套规则。

**Tech Stack:** TypeScript 5.9、React 19、Vite 8、CSS、内联 SVG、Node.js 22 原生测试、真实浏览器人工任务流验证。

## Global Constraints

- 最终文件固定为 `prototype/public/掌眼_高保真教师演示.html`，不得覆盖 `掌眼_低保真交互原型.html` 和 `掌眼_数值实验台.html`。
- 最终载体是通过微信内网址打开的普通响应式 H5 网页，不创建 Unity/团结工程或微信小游戏工程。
- 教师演示 HTML 必须自包含，不引用 CDN、远程字体、远程图片、外部脚本或外部样式表，并能通过 `file://` 直接打开。
- 器物使用精致、非写实、非 3D 的二维插画；插画负责位置与氛围，`EvidenceDefinition.detail/inference/lead` 负责鉴定事实。
- 当前低价值首案不制作结算后的写实器物讲解图，也不显示空素材占位。
- 玩家流程只有开店、来客、调查、交易、复盘五个阶段；证据簿是只读信息层。
- 调查行动点与议价容量必须独立；正式报价只扣议价容量，调查耗尽后仍可议价，议价耗尽后仍可接受或拒绝。
- 第一版议价容量使用已确认公式：基础 `3`，信任 `>=55` 加 `1`，成交意愿 `>=65` 加 `1`，压力 `>=75` 减 `1`，控制感 `<=35` 减 `1`，最终 `clamp(2, 5)`；默认 NPC 得到 `5`。
- 选择具体证据自然形成披露，不提供“完整说明事实 / 只强调部分信息”的抽象按钮。
- 玩家结算不显示 0—100 总分或 70 分胜利线；综合成果使用 `D < C < B < A < S < SS < SSS`，并受物品品质上限约束。
- 桌面 `1440 × 1000` 验收三栏与外置调试栏，手机 `390 × 844` 验收玩家画布、无横向溢出和最小 `44 × 44px` 触控目标。
- 所有规则结果必须来自 `resolveTurn` 或纯规则辅助函数，React 组件不得复制接受线、状态 delta、后验或等级公式。
- 工作区已有未提交内容；禁止 `git clean`、`git reset --hard` 或覆盖式切换。每次提交前只暂存任务列出的文件，并检查 `git diff --cached --name-only`。

---

## File Structure

### Shared rule source

- `prototype/game/types.ts`：新增等级、议价会话和结算结构。
- `prototype/game/outcome-grades.ts`：纯函数计算品质、净收益、议价、判断和综合等级。
- `prototype/game/negotiation.ts`：纯函数计算议价容量与调试公式。
- `prototype/game/resolve-action.ts`：将双资源、阶段锁、具体证据披露和新结算接入现有回放链。
- `prototype/content/lacquer-box.ts`：为三个真相补充品质和综合等级上限。

### High-fidelity client

- `prototype/hifi/index.html`：Vite 入口壳和网页元数据。
- `prototype/hifi/main.tsx`：挂载 React。
- `prototype/hifi/HighFidelityApp.tsx`：五阶段任务流、规则调用和错误恢复。
- `prototype/hifi/presentation.ts`：观察目标到二维视图、热点坐标和局部示意的展示映射。
- `prototype/hifi/session-reducer.ts`：只管理屏幕、浮层、选择项和焦点返回，不计算规则结果。
- `prototype/hifi/components/GameShell.tsx`：桌面三栏、手机画布和阶段头部。
- `prototype/hifi/components/ArtifactIllustration.tsx`：三视图 SVG 和可访问热点。
- `prototype/hifi/components/InvestigationStage.tsx`：调查工作台、目标说明和行动入口。
- `prototype/hifi/components/EvidenceBook.tsx`：只读证据仓库。
- `prototype/hifi/components/DialogueComposer.tsx`：问题、具体证据和语气选择。
- `prototype/hifi/components/TradeStage.tsx`：当前价、谨慎参考、报价和议价容量。
- `prototype/hifi/components/ReviewStage.tsx`：D—SSS 结算和分项结果。
- `prototype/hifi/components/DebugDrawer.tsx`：玩家画布外的精确状态、公式和回放。
- `prototype/hifi/styles.css`：设计令牌、响应式布局、交互状态与 reduced-motion。

### Build and verification

- `prototype/vite.hifi.config.ts`：独立客户端构建，不加载 Vinext 或 Cloudflare。
- `prototype/generate-hifi.mjs`：把 Vite 输出内联为单文件并写入 `public/`。
- `prototype/tests/hifi-flow.test.mjs`：新规则契约。
- `prototype/tests/hifi-html.test.mjs`：自包含 HTML 与语义结构契约。
- `prototype/tests/hifi-presentation.test.mjs`：五个观察目标的视图和热点映射。
- `prototype/package.json`：高保真开发、构建和测试脚本。
- `prototype/README.md`：三份 HTML 的用途和打开方式。

---

### Task 1: 建立 D—SSS 纯等级模型

**Files:**
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/outcome-grades.ts`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/types.ts`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/content/lacquer-box.ts`
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-flow.test.mjs`

**Interfaces:**
- Consumes: `TruthVariant.trueValue`、成交价、首次议价开价/普通接受线、仅由玩家可见历史计算的 `judgmentScore`。
- Produces: `game/types.ts` 中的 `GRADE_ORDER`，以及 `gradeIndex()`、`calculateOutcomeGrades(input): OutcomeGrades`，供 `settlementResult` 和高保真复盘使用。

- [ ] **Step 1: 写出会失败的等级测试**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateOutcomeGrades,
  gradeIndex,
} from "../game/outcome-grades.ts";

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
  assert.ok(gradeIndex(fiveProfit.overallGrade) >= gradeIndex(atValue.overallGrade));
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
```

- [ ] **Step 2: 运行专项测试并确认因模块不存在而失败**

Run:

```powershell
node --experimental-strip-types --test tests/hifi-flow.test.mjs
```

Expected: `ERR_MODULE_NOT_FOUND` 指向 `game/outcome-grades.ts`。

- [ ] **Step 3: 在类型和案件内容中加入等级元数据**

在 `game/types.ts` 定义：

```ts
export const GRADE_ORDER = ["D", "C", "B", "A", "S", "SS", "SSS"] as const;
export type OutcomeGrade = (typeof GRADE_ORDER)[number];

export type OutcomeTag =
  | "profitable"
  | "break-even"
  | "loss"
  | "correct-avoidance"
  | "missed-opportunity";

export type OutcomeGrades = {
  overallGrade: OutcomeGrade;
  qualityGrade: OutcomeGrade;
  qualityCap: OutcomeGrade;
  netGrade: OutcomeGrade;
  bargainingGrade: OutcomeGrade;
  judgmentGrade: OutcomeGrade;
  outcomeTag: OutcomeTag;
  rawOverallIndex: number;
  cappedOverallIndex: number;
  formula: string[];
};
```

给 `TruthVariant` 增加：

```ts
qualityGrade: OutcomeGrade;
overallGradeCap: OutcomeGrade;
```

在 `lacquer-box.ts` 写入：

```ts
counterfeit: { qualityGrade: "C", overallGradeCap: "C" }
"restored-genuine": { qualityGrade: "A", overallGradeCap: "A" }
"hidden-treasure": { qualityGrade: "SSS", overallGradeCap: "SSS" }
```

- [ ] **Step 4: 实现纯等级函数**

`outcome-grades.ts` 固定使用以下输入和规则：

```ts
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
};

export function gradeIndex(grade: OutcomeGrade) {
  return GRADE_ORDER.indexOf(grade);
}
```

净收益档位：

```text
成交：actualNet / trueValue < 0 → D
成交：= 0 → C
成交：0—10% → C，10—20% → B，20—30% → A
成交：30—45% → S，45—60% → SS，>=60% → SSS
未成交且 trueValue <= entryFloor → A，并标记 correct-avoidance
未成交且 trueValue > entryFloor → D，并标记 missed-opportunity
```

议价档位以首次议价时冻结的 `entryAsk` 与 `entryFloor` 计算：

```text
capture = clamp((entryAsk - paidPrice) / max(1, entryAsk - entryFloor), 0, 1)
未成交 → C
0—20% → D，20—40% → C，40—60% → B，60—80% → A
80—95% → S，95—100% → SS，达到或低于冻结线 → SSS
```

判断档位：

```text
0—39 D，40—54 C，55—69 B，70—79 A，80—87 S，88—94 SS，95—100 SSS
```

综合等级：

```text
round(品质×0.35 + 净收益×0.30 + 议价×0.20 + 判断×0.15)
再用 qualityCap 的序号封顶
```

每个档位、权重、原始序号和封顶结果都写入 `formula`，但只供调试栏读取。

- [ ] **Step 5: 运行测试和类型检查**

Run:

```powershell
node --experimental-strip-types --test tests/hifi-flow.test.mjs
npx tsc --noEmit
```

Expected: 新等级测试通过；若 TypeScript 报告旧 `TruthVariant` 缺字段，只修改三个现有真相对象，不添加默认逃生值。

- [ ] **Step 6: 提交这一独立规则单元**

```powershell
git add -- `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/outcome-grades.ts" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/types.ts" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/content/lacquer-box.ts" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-flow.test.mjs"
git diff --cached --name-only
git commit -m "feat: add graded settlement model"
```

---

### Task 2: 将正式报价改为独立议价容量

**Files:**
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/negotiation.ts`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/types.ts`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-flow.test.mjs`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/rules.test.mjs`

**Interfaces:**
- Consumes: `NPCState` 和首次正式报价前的 `getNpcPricing()`。
- Produces: `calculateNegotiationCapacity()`、`WorldState.negotiation`、每轮独立的 `negotiationCapacityCost`。

- [ ] **Step 1: 写双资源失败测试**

```js
import {
  createInitialWorldState,
  getNpcPricing,
  resolveTurn,
} from "../game/resolve-action.ts";
import { calculateNegotiationCapacity } from "../game/negotiation.ts";
import { lacquerBoxCase } from "../content/lacquer-box.ts";

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
});

test("首次正式报价后锁定调查，容量为0仍可接受或拒绝", () => {
  const initial = createInitialWorldState(lacquerBoxCase);
  const pricing = getNpcPricing(lacquerBoxCase, initial);
  const quoted = resolveTurn(lacquerBoxCase, initial, {
    kind: "discount",
    offer: pricing.acceptLine - 4,
  });
  assert.throws(
    () => resolveTurn(lacquerBoxCase, quoted, { kind: "inspect", targetId: "latch" }),
    /正式议价已经开始/,
  );

  const exhausted = {
    ...quoted,
    negotiation: { ...quoted.negotiation, remainingCapacity: 0 },
  };
  assert.throws(
    () => resolveTurn(lacquerBoxCase, exhausted, {
      kind: "discount",
      offer: pricing.acceptLine - 2,
    }),
    /议价容量不足/,
  );
  assert.doesNotThrow(() => resolveTurn(lacquerBoxCase, exhausted, { kind: "buy" }));
  assert.doesNotThrow(() => resolveTurn(lacquerBoxCase, exhausted, { kind: "reject" }));
});
```

- [ ] **Step 2: 运行测试并确认失败原因是议价模型不存在**

Run:

```powershell
node --experimental-strip-types --test tests/hifi-flow.test.mjs
```

Expected: `negotiation.ts` 不存在或 `WorldState.negotiation` 缺失。

- [ ] **Step 3: 定义议价类型和纯容量函数**

在 `game/types.ts` 增加：

```ts
export type NegotiationState = {
  started: true;
  initialCapacity: number;
  remainingCapacity: number;
  entryAsk: number;
  entryFloor: number;
  offersMade: number;
};
```

`WorldState.negotiation` 和 `StateSnapshot.negotiation` 使用 `NegotiationState | null`；`TurnRecord` 增加必填的 `negotiationCapacityCost: number`。

`cloneState()` 和 `snapshot()` 必须深复制议价会话：

```ts
negotiation: state.negotiation ? { ...state.negotiation } : null,
```

`appendTurn()` 的输入允许省略议价成本，但写入的每条 `TurnRecord` 必须补成精确数值：

```ts
type AppendTurnInput =
  Omit<TurnRecord, "turn" | "before" | "after" | "negotiationCapacityCost">
  & { negotiationCapacityCost?: number };

const record: TurnRecord = {
  turn,
  before: snapshot(before),
  after: snapshot(next),
  ...input,
  negotiationCapacityCost: input.negotiationCapacityCost ?? 0,
};
```

`game/negotiation.ts` 导出：

```ts
export type NegotiationCapacityResult = {
  capacity: number;
  adjustments: Array<{ label: string; value: number; reason: string }>;
  formula: string[];
};

export function calculateNegotiationCapacity(
  npcState: NPCState,
): NegotiationCapacityResult;
```

函数严格执行全局约束中的 `3 + 修正 → clamp(2,5)`，默认状态必须返回 `5`，并记录每项未触发或已触发的原因。

- [ ] **Step 4: 在规则入口分开两种成本**

将 `actionPointCost()` 政名为 `investigationPointCost()`：

```ts
if (action.kind === "buy" || action.kind === "reject") return 0;
if (action.kind === "discount" || action.kind === "buyout") return 0;
if (action.kind === "test") return caseDefinition.test.actionPointCost;
return 1;
```

新增：

```ts
function negotiationCapacityCost(action: PlayerAction) {
  return action.kind === "discount" || action.kind === "buyout" ? 1 : 0;
}
```

`ensureActionAllowed()` 必须按顺序检查：

1. 本局未结束、卖家未离场；
2. `state.negotiation !== null` 时禁止 `inspect/dialogue/test`；
3. 调查成本不能超过 `actionPoints`；
4. 正式报价成本不能超过“已冻结剩余容量”或当前 `calculateNegotiationCapacity()` 预览值。

- [ ] **Step 5: 首次报价冻结会话并只扣一次容量**

在 `resolveDiscount()` 和 `resolveBuyout()` 共用：

```ts
function beginOrAdvanceNegotiation(
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
```

`resolveDiscount()` 以首次报价前 `getNpcPricing(caseDefinition, state).acceptLine` 作为 `entryFloor`；后续 NPC 状态和当前价变化不得覆盖它。`resolveBuyout()` 沿用同一会话，避免特殊交易条件另开一套容量。

NPC 还价只更新 `currentPrice`，不再执行第二次扣减。报价回合写入：

```ts
actionPointCost: 0,
negotiationCapacityCost: 1,
```

其他回合由 `appendTurn()` 自动补 `negotiationCapacityCost: 0`。还价说明改为“可以继续报价、接受现价或拒绝”，不再写“继续调查”。

- [ ] **Step 6: 改写正在保护旧共享预算的回归测试**

在 `rules.test.mjs` 替换以下旧断言：

- `0 AP blocks every costed action` 改为“0 调查点阻止调查，但不阻止有容量的正式报价”；
- 正式折价和买断的 `actionPointCost` 改为 `0`；
- 回放守恒同时检查 `actionPointCost` 和 `negotiationCapacityCost`；
- NPC 还价前后只减少一次容量。

保留真相隔离、证据去重、纺锤候选、seed 重放和零成本终局测试。

- [ ] **Step 7: 运行规则测试**

Run:

```powershell
node --experimental-strip-types --test tests/hifi-flow.test.mjs tests/rules.test.mjs
npx tsc --noEmit
```

Expected: 双资源专项与原有信息边界测试全部通过。

- [ ] **Step 8: 提交双资源规则**

```powershell
git add -- `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/negotiation.ts" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/types.ts" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-flow.test.mjs" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/rules.test.mjs"
git diff --cached --name-only
git commit -m "feat: separate investigation and bargaining resources"
```

---

### Task 3: 接入具体证据披露和等级制结算

**Files:**
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/types.ts`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/app/page.tsx`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-flow.test.mjs`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/rules.test.mjs`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/standalone-html.test.mjs`

**Interfaces:**
- Consumes: `calculateOutcomeGrades()`、`WorldState.negotiation`、现有 `evidenceId → sharedEvidenceIds → npcPosterior`。
- Produces: 新 `SettlementResult` 和不含 `disclosureFrame` 的 `DialogueAction`。

- [ ] **Step 1: 写会失败的披露和结算契约**

```js
test("质询只公开所选具体证据，不产生抽象披露状态", () => {
  let state = createInitialWorldState(lacquerBoxCase);
  state = resolveTurn(lacquerBoxCase, state, { kind: "inspect", targetId: "joint" });
  state = resolveTurn(lacquerBoxCase, state, { kind: "inspect", targetId: "latch" });
  const [chosen, retained] = state.discoveredEvidenceIds;
  state = resolveTurn(lacquerBoxCase, state, {
    kind: "dialogue",
    topicId: "repair-history",
    tone: "professional",
    evidenceId: chosen,
  });
  assert.ok(state.sharedEvidenceIds.includes(chosen));
  assert.ok(!state.sharedEvidenceIds.includes(retained));
  assert.ok(!("disclosureFrame" in state.actionHistory.at(-1).action));
});

test("结算输出等级和避损标签，不再输出0—100客观胜利线", () => {
  const counterfeit = createInitialWorldState(
    lacquerBoxCase,
    lacquerBoxCase.seed,
    "counterfeit",
  );
  const settled = resolveTurn(lacquerBoxCase, counterfeit, { kind: "reject" });
  assert.equal(settled.settlement?.overallGrade, "C");
  assert.equal(settled.settlement?.outcomeTag, "correct-avoidance");
  assert.equal(settled.settlement?.actualNet, 0);
  assert.ok(!("objectiveScore" in settled.settlement));
  assert.ok(!settled.settlement?.objectiveFormula.some((line) => line.includes("70")));
});
```

- [ ] **Step 2: 运行专项测试并观察旧契约失败**

Run:

```powershell
node --experimental-strip-types --test tests/hifi-flow.test.mjs
```

Expected: 动作仍保存 `disclosureFrame` 或结算仍输出 `objectiveScore`。

- [ ] **Step 3: 删除抽象披露的规则影响**

- 从 `game/types.ts` 删除 `DisclosureFrame` 和 `DialogueAction.disclosureFrame`；
- 从 `resolveDialogue()` 删除 `framingPenalty`、披露框架签名和对应公式；
- 动作签名只由 `topicId + evidenceId + tone` 组成；
- 动作名使用“引用《证据名》追问”或“开放询问”，不描述披露风格；
- 无证据询问继续合法，且不增加任何 `sharedEvidenceIds`。

- [ ] **Step 4: 将结算替换为四分项等级**

`SettlementResult` 保留真实价值、成交价、费用、实际净结果、后验和调试中间量，同时新增：

```ts
overallGrade: OutcomeGrade;
qualityGrade: OutcomeGrade;
qualityCap: OutcomeGrade;
netGrade: OutcomeGrade;
bargainingGrade: OutcomeGrade;
judgmentGrade: OutcomeGrade;
outcomeTag: OutcomeTag;
rawOverallIndex: number;
cappedOverallIndex: number;
gradeFormula: string[];
```

删除玩家旧契约字段：

```ts
objectiveScore
objectiveSuccess
objectiveLabel
```

未成交时 `actualNet` 固定为 `0`；检测费继续保存在 `feesPaid` 并进入开发复盘，不把未成交显示成持有器物的负收益。判断中间分 `judgmentScore` 可以保留用于调试，但玩家只读取 `judgmentGrade`。

`settlementResult()` 必须把 `state.negotiation?.entryAsk/entryFloor` 传给 `calculateOutcomeGrades()`；若玩家未正式报价，则使用结算前的 `currentPrice` 和当时 `getNpcPricing().acceptLine`。多轮报价后不得重新定义首次参考线。

- [ ] **Step 5: 让现有 React 开发版跟随新类型**

在 `app/page.tsx`：

- 删除 `selectedDisclosureFrame` 和两个抽象披露按钮；
- 调试区用 `overallGrade`、等级序号与 `gradeFormula` 替代 `objectiveScore / 100`；
- 玩家复盘用综合等级、物品品质、实际净收益、议价表现、判断质量五项；
- 调查页把正式报价描述改为“使用独立议价容量”；
- 不改动低保真视觉结构，只保证开发版继续编译和反映新规则。

`standalone-html.test.mjs` 不再要求 React 源含 `selectedDisclosureFrame` 或高保真当前规则保留“只强调不利部分”；旧静态低保真 HTML 只验证仍可打开和自包含。

- [ ] **Step 6: 运行规则、类型和主构建**

Run:

```powershell
node --experimental-strip-types --test tests/hifi-flow.test.mjs tests/rules.test.mjs tests/standalone-html.test.mjs
npx tsc --noEmit
npm run build
```

Expected: 新结算契约通过；现有 React 开发版构建成功；旧静态低保真文件未被覆盖。

- [ ] **Step 7: 提交规则对齐**

```powershell
git add -- `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/types.ts" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/app/page.tsx" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-flow.test.mjs" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/rules.test.mjs" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/standalone-html.test.mjs"
git diff --cached --name-only
git commit -m "feat: align evidence disclosure and graded settlement"
```

---

### Task 4: 建立独立高保真单文件构建

**Files:**
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/index.html`
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/main.tsx`
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/HighFidelityApp.tsx`
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/styles.css`
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/vite.hifi.config.ts`
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/generate-hifi.mjs`
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-html.test.mjs`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/package.json`

**Interfaces:**
- Consumes: React、Vite 和共享规则模块。
- Produces: `npm run build:hifi` 与自包含 `public/掌眼_高保真教师演示.html`。

- [ ] **Step 1: 写输出文件失败测试**

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const outputUrl = new URL(
  "../public/%E6%8E%8C%E7%9C%BC_%E9%AB%98%E4%BF%9D%E7%9C%9F%E6%95%99%E5%B8%88%E6%BC%94%E7%A4%BA.html",
  import.meta.url,
);

test("高保真教师演示是自包含中文H5", async () => {
  const html = await readFile(outputUrl, "utf8");
  assert.match(html, /<html[^>]+lang="zh-CN"/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /name="theme-color"/);
  assert.doesNotMatch(html, /<script[^>]+src=/);
  assert.doesNotMatch(html, /<link[^>]+rel="stylesheet"/);
  assert.doesNotMatch(html, /(?:src|href)=["']https?:\/\//i);
  assert.doesNotMatch(html, /@import\s+url\(["']?https?:/i);
  assert.match(html, /data-player-canvas/);
  assert.match(html, /data-debug-drawer/);
});
```

- [ ] **Step 2: 运行测试并确认输出文件不存在**

Run:

```powershell
node --test tests/hifi-html.test.mjs
```

Expected: `ENOENT` 指向高保真 HTML。

- [ ] **Step 3: 创建独立 Vite 配置**

`vite.hifi.config.ts` 使用：

```ts
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: resolve(rootDir, "hifi"),
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: resolve(rootDir, "work/hifi"),
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: "assets/app.js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
```

- [ ] **Step 4: 创建最小可构建客户端**

`hifi/index.html` 包含 `lang="zh-CN"`、viewport、描述、theme-color 和 `<div id="root"></div>`。

`main.tsx`：

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HighFidelityApp } from "./HighFidelityApp";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HighFidelityApp />
  </StrictMode>,
);
```

最小 `HighFidelityApp` 只建立玩家和调试区域：

```tsx
export function HighFidelityApp() {
  return (
    <main className="hifi-demo">
      <section data-player-canvas aria-label="《掌眼》玩家界面">
        <h1>掌眼</h1>
        <button type="button">开始今日鉴定</button>
      </section>
      <aside data-debug-drawer aria-label="开发复盘" hidden />
    </main>
  );
}
```

- [ ] **Step 5: 实现内联生成器**

`generate-hifi.mjs` 必须：

1. 读取 `work/hifi/index.html`；
2. 找到构建后的本地 JS 和 CSS；
3. 把 CSS 替换为 `<style>`，把 JS 替换为 `<script type="module">`；
4. 将 JS 中的 `</script` 转义为 `<\/script`；
5. 拒绝残留 `<script src>`、外部 stylesheet 或 `http://`/`https://`；
6. 写入 `public/掌眼_高保真教师演示.html`。

核心校验：

```js
const forbidden = [
  /<script[^>]+src=/i,
  /<link[^>]+rel=["']stylesheet["']/i,
  /(?:src|href)=["']https?:\/\//i,
  /@import\s+url\(["']?https?:/i,
];
for (const pattern of forbidden) {
  if (pattern.test(inlinedHtml)) {
    throw new Error(`高保真HTML仍含外部依赖：${pattern}`);
  }
}
```

- [ ] **Step 6: 增加构建脚本**

`package.json` 增加或调整：

```json
{
  "scripts": {
    "dev:hifi": "vite --config vite.hifi.config.ts",
    "build:hifi:bundle": "vite build --config vite.hifi.config.ts",
    "build:hifi": "npm run build:hifi:bundle && node generate-hifi.mjs",
    "build:app": "cross-env WRANGLER_LOG_PATH=.wrangler/wrangler.log vinext build",
    "build": "npm run build:hifi && npm run build:app",
    "test:hifi": "npm run build && node --experimental-strip-types --test tests/hifi-flow.test.mjs tests/hifi-html.test.mjs"
  }
}
```

当前 `test` 脚本在原测试列表后加入 `hifi-flow.test.mjs` 与 `hifi-html.test.mjs`；Task 5 创建展示测试后再加入 `hifi-presentation.test.mjs`。`lint` 忽略 `work` 和 `dist`。

- [ ] **Step 7: 构建并验证自包含文件**

Run:

```powershell
npm run build:hifi
node --test tests/hifi-html.test.mjs
```

Expected: public 高保真 HTML 生成，且没有外部依赖。

- [ ] **Step 8: 提交构建骨架**

```powershell
git add -- `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/vite.hifi.config.ts" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/generate-hifi.mjs" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-html.test.mjs" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/package.json" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_高保真教师演示.html"
git diff --cached --name-only
git commit -m "feat: add standalone high fidelity build"
```

---

### Task 5: 实现二维器物插画和可访问观察映射

**Files:**
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/presentation.ts`
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/components/ArtifactIllustration.tsx`
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/components/GameShell.tsx`
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/components/InvestigationStage.tsx`
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-presentation.test.mjs`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/styles.css`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/HighFidelityApp.tsx`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/package.json`

**Interfaces:**
- Consumes: `lacquerBoxCase.observationTargets` 和 `WorldState.inspectedTargetIds`。
- Produces: 三个二维视图、五个真实热点按钮、选中目标与检查确认事件。

- [ ] **Step 1: 写展示映射失败测试**

```js
import { artifactPresentation } from "../hifi/presentation.ts";

test("每个观察目标都有视图、热点和局部示意", () => {
  for (const target of lacquerBoxCase.observationTargets) {
    const item = artifactPresentation[target.id];
    assert.ok(item, `${target.id}缺少展示映射`);
    assert.ok(["front", "bottom", "open"].includes(item.view));
    assert.ok(item.hotspot.x >= 0 && item.hotspot.x <= 100);
    assert.ok(item.hotspot.y >= 0 && item.hotspot.y <= 100);
    assert.ok(item.focusLabel.length > 0);
  }
});
```

- [ ] **Step 2: 运行测试并确认映射不存在**

Run:

```powershell
node --experimental-strip-types --test tests/hifi-presentation.test.mjs
```

Expected: `presentation.ts` 不存在。

- [ ] **Step 3: 建立不污染规则的数据映射**

`presentation.ts` 固定导出：

```ts
export type ArtifactViewId = "front" | "bottom" | "open";

export const artifactPresentation = {
  surface: {
    view: "front",
    hotspot: { x: 27, y: 29 },
    focusLabel: "漆面光泽与裂纹分布",
  },
  latch: {
    view: "front",
    hotspot: { x: 51, y: 62 },
    focusLabel: "锁扣、螺钉与旧孔位",
  },
  joint: {
    view: "front",
    hotspot: { x: 79, y: 53 },
    focusLabel: "拼接缝与胶层",
  },
  bottom: {
    view: "bottom",
    hotspot: { x: 50, y: 60 },
    focusLabel: "底款切口与底部磨损",
  },
  interior: {
    view: "open",
    hotspot: { x: 50, y: 43 },
    focusLabel: "木胎、内腔与工具痕",
  },
} as const;
```

- [ ] **Step 4: 绘制三视图并叠加语义热点**

`ArtifactIllustration`：

- 使用同一套漆棕、墨松和铜金色内联 SVG；
- `front` 展示盒盖、锁扣和右侧接口；
- `bottom` 展示底板、边缘磨损与底款示意；
- `open` 展示打开的盒盖、内腔隔板和木胎；
- 装饰路径 `aria-hidden="true"`；
- 整体 SVG 使用简短 `aria-label`，不宣称已显示微观事实；
- 热点使用绝对定位的真实 `<button>`，最小 `44 × 44px`，带 `aria-pressed` 和“已检查”文本；
- DOM 顺序固定为漆面、锁扣、接口、底部、内腔，不依赖坐标顺序。

- [ ] **Step 5: 实现观察前后的渐进披露**

选中热点时显示：

```text
观察位置
要看什么：target.short
参考提示：target.knowledgeHint
成本：1 调查行动点
主按钮：检查这里
```

`resolveTurn({kind:"inspect", targetId})` 返回后，结果面板从已加入的证据读取：

```text
看到什么：evidence.detail
这意味着什么：evidence.inference
还能核验什么：evidence.lead
主按钮：收进证据簿并返回调查
```

已经检查的热点默认只打开已记录证据；若允许复查，必须显示单独的“再次检查（消耗 1 点）”按钮，不能让普通查看误扣资源。

- [ ] **Step 6: 建立桌面三栏和手机单画布基础样式**

`GameShell` 负责：

- 左侧案件档案 `240—280px`；
- 中央玩家画布 `420—440px`；
- 右侧开发抽屉默认关闭；
- 小于 `720px` 时只保留玩家画布；
- `min-height: 100dvh`、`env(safe-area-inset-*)`；
- 正文 `14—16px`，控制不小于 `44px`；
- 墨松、暖纸、宣纸白、漆朱、铜金设计令牌；
- `:hover`、`:focus-visible`、`:active`、`:disabled`；
- `prefers-reduced-motion: reduce`。

- [ ] **Step 7: 把展示映射测试加入高保真测试脚本**

将 `test:hifi` 更新为：

```json
"test:hifi": "npm run build && node --experimental-strip-types --test tests/hifi-flow.test.mjs tests/hifi-html.test.mjs tests/hifi-presentation.test.mjs"
```

- [ ] **Step 8: 构建与测试**

Run:

```powershell
npm run build:hifi
node --experimental-strip-types --test tests/hifi-presentation.test.mjs tests/hifi-html.test.mjs
npx tsc --noEmit
```

Expected: 五个目标都有映射，高保真 HTML 仍自包含。

- [ ] **Step 9: 提交器物工作台**

```powershell
git add -- `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-presentation.test.mjs" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/package.json" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_高保真教师演示.html"
git diff --cached --name-only
git commit -m "feat: build illustrated investigation workspace"
```

---

### Task 6: 完成五阶段玩家循环与外置调试

**Files:**
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/session-reducer.ts`
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/components/EvidenceBook.tsx`
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/components/DialogueComposer.tsx`
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/components/TradeStage.tsx`
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/components/ReviewStage.tsx`
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/components/DebugDrawer.tsx`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/HighFidelityApp.tsx`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/styles.css`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-html.test.mjs`

**Interfaces:**
- Consumes: `createInitialWorldState()`、`resolveTurn()`、`getPlayerReferenceOffer()`、`calculateNegotiationCapacity()`、`getDiscoveredEvidence()`。
- Produces: 可完整走通的开店 → 来客 → 调查/询问 → 交易 → 复盘循环。

- [ ] **Step 1: 扩展 HTML 契约为玩家任务语义**

```js
test("高保真只暴露批准后的玩家概念", async () => {
  const html = await readFile(outputUrl, "utf8");
  for (const label of [
    "调查行动点",
    "议价容量",
    "证据簿",
    "谨慎参考",
    "综合成果",
    "判断质量",
  ]) {
    assert.match(html, new RegExp(label));
  }
  assert.doesNotMatch(html, /客观分|70分|胜利阈值/);
  assert.doesNotMatch(html, /完整说明事实|只强调不利部分/);
});
```

- [ ] **Step 2: 运行测试并确认任务流尚不完整**

Run:

```powershell
npm run build:hifi
node --test tests/hifi-html.test.mjs
```

Expected: 缺少调查、议价或结算语义而失败。

- [ ] **Step 3: 用 reducer 管理纯 UI 状态**

`session-reducer.ts` 定义：

```ts
export type PlayerStage =
  | "opening"
  | "arrival"
  | "investigation"
  | "trade"
  | "review";

export type OverlayState =
  | { kind: "none" }
  | { kind: "case-summary"; returnStage: PlayerStage }
  | { kind: "evidence-book"; returnStage: PlayerStage }
  | { kind: "evidence-found"; targetId: string; triggerId: string }
  | { kind: "dialogue"; triggerId: string }
  | { kind: "npc-response"; triggerId: string };
```

reducer 只处理阶段、浮层、选中目标/问题/证据/语气和焦点返回 ID；`WorldState` 始终由 `resolveTurn` 产生，reducer 不扣资源、不算价格、不生成证据。

- [ ] **Step 4: 实现证据簿和询问**

`EvidenceBook`：

- 按器物证据、NPC 陈述、共同检测分组；
- 显示 `detail / inference / lead`；
- “仅自己掌握 / 已向卖家公开”使用文字和图标；
- 只有“返回调查”或“返回交易”，没有行动按钮；
- 关闭后把焦点还给打开证据簿的按钮。

`DialogueComposer`：

1. 选择问题主题；
2. 选择“不带证据”或一条玩家私有具体证据；
3. 选择温和、专业、强硬语气；
4. 提交一个 `DialogueAction`。

提交后展示卖家原话、可观察变化、新陈述证据和价格重估原因；精确 NPC 数值不进入玩家面板。

- [ ] **Step 5: 实现独立议价界面**

`TradeStage` 显示：

- 卖家当前报价；
- `getPlayerReferenceOffer()` 的谨慎参考价，并注明“依据当前已知信息，不保证成交”；
- 正式议价开始前的 `calculateNegotiationCapacity()` 精确预览，开始后显示冻结剩余容量；
- 自定义正整数输入；
- 减 5、加 5 快捷按钮；
- 提交报价、接受当前价、拒绝交易；
- 首次报价前允许“返回调查”，首次报价后不显示该控制；
- 容量为 0 时禁用新报价并解释原因，接受和拒绝保持可用；
- 风险转移不作为常驻主按钮。

- [ ] **Step 6: 实现 D—SSS 复盘**

`ReviewStage` 首屏依次显示：

1. `overallGrade`；
2. `qualityGrade` 与真实器物类型；
3. `actualNet`；
4. `bargainingGrade`；
5. `judgmentGrade`；
6. `outcomeTag` 对应的“盈利成交 / 持平 / 亏损 / 正确避损 / 错失机会”；
7. “查看本局因果”和“重新开始”。

不显示写实器物图。本轮只显示真相文字、关键事实和分项解释。

- [ ] **Step 7: 实现外置调试抽屉**

`DebugDrawer`：

- 宽屏位于玩家画布外，默认收起；
- 手机小于 `720px` 完全隐藏；
- 未结算前显示精确行动点、议价容量公式、NPC 四状态、行动链和公开价格变化；
- 未结算前不显示隐藏真相、真实价值、卖家底线和后验秘密；
- 结算后解锁隐藏真相、首次议价冻结线、每轮 delta、候选评分、Storylet、`gradeFormula` 和判断公式；
- 标题固定写“开发复盘 · 不属于玩家界面”。

- [ ] **Step 8: 加入焦点、反馈和错误恢复**

- 对话框打开时聚焦标题或首个安全操作；
- 关闭时恢复到 `triggerId` 对应元素；
- 只用一个小型 `aria-live="polite"` 播报证据、价格和阶段变化；
- 非法报价在输入附近显示规则返回的错误；
- 捕获渲染/规则异常时显示“重新开始本案”错误卡，不显示堆栈；
- 所有按钮都有可见焦点，不让焦点进入关闭的抽屉。

- [ ] **Step 9: 构建并运行自动检查**

Run:

```powershell
npm run build:hifi
node --experimental-strip-types --test tests/hifi-flow.test.mjs tests/hifi-presentation.test.mjs tests/hifi-html.test.mjs
npx tsc --noEmit
npm run lint
```

Expected: 高保真契约、规则、类型和 lint 全部通过。

- [ ] **Step 10: 提交完整玩家循环**

```powershell
git add -- `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-html.test.mjs" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_高保真教师演示.html"
git diff --cached --name-only
git commit -m "feat: complete high fidelity teacher demo"
```

---

### Task 7: 完整回归、真实浏览器审查与项目交接

**Files:**
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/package.json`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/README.md`
- Modify: `docs/project/01-SYSTEM-MAP.md`
- Modify: `docs/project/02-CURRENT-STATE.md`
- Modify: `docs/project/03-NEXT-ACTIONS.md`
- Create: `docs/project/evidence/EXP-012-high-fidelity-teacher-demo.md`

**Interfaces:**
- Consumes: 三份 public HTML、全部自动测试和真实浏览器观察。
- Produces: 可交给老师的文件、可追溯验证证据和明确的 Git 增量说明。

- [ ] **Step 1: 把高保真测试并入完整测试命令**

`package.json` 的 `test` 必须先构建，再运行：

```text
rendered-html.test.mjs
rules.test.mjs
standalone-html.test.mjs
numeric-lab.test.mjs
hifi-flow.test.mjs
hifi-html.test.mjs
hifi-presentation.test.mjs
```

同时扩展 `hifi-html.test.mjs`：在完整 `npm run build` 后读取
`dist/client/掌眼_高保真教师演示.html`，并与 `public/掌眼_高保真教师演示.html`
进行字节级比较：

```js
const publicHtml = await readFile(outputUrl);
const distHtml = await readFile(
  new URL(
    "../dist/client/%E6%8E%8C%E7%9C%BC_%E9%AB%98%E4%BF%9D%E7%9C%9F%E6%95%99%E5%B8%88%E6%BC%94%E7%A4%BA.html",
    import.meta.url,
  ),
);
assert.deepEqual(distHtml, publicHtml);
```

- [ ] **Step 2: 运行完整自动验证**

Run:

```powershell
npm test
npm run lint
npx tsc --noEmit
git diff --check
```

Expected: 全部通过，无尾随空格或冲突标记。

- [ ] **Step 3: 在桌面真实浏览器走完整关键路径**

启动：

```powershell
npm run dev:hifi -- --host 127.0.0.1
```

在 `1440 × 1000` 验证：

1. 开始今日鉴定；
2. 接下来客；
3. 从正面选择接口；
4. 检查并收进证据簿；
5. 打开证据簿并返回，页面和滚动位置恢复；
6. 用现代胶痕询问修复历史；
7. 检查 NPC 回应、共享标记和价格原因；
8. 进入交易，确认调查点与议价容量不同容器；
9. 提交一次会触发还价的正式报价；
10. 确认调查入口锁定、容量只减 1；
11. 接受或继续报价完成交易；
12. 检查 D—SSS 复盘和局外调试抽屉。

记录控制台错误、可见重叠、焦点丢失和任何不可达状态。

- [ ] **Step 4: 在手机真实浏览器走完整关键路径**

在 `390 × 844` 验证：

- 页面级 `scrollWidth === clientWidth`；
- 桌面案件栏和开发抽屉不显示；
- 五个热点与所有按钮不小于 `44 × 44px`；
- 正面、底部、打开视图切换；
- 证据结果只有“收进证据簿并返回调查”一个主按钮；
- 询问、交易输入、键盘弹出后的滚动和复盘均可完成；
- safe-area、`100dvh` 和底部操作区不被遮挡。

- [ ] **Step 5: 完成键盘与 reduced-motion 审查**

- 不使用鼠标，从开店完成一局；
- 检查 Tab 顺序、Enter/Space 激活、热点 `aria-pressed`、浮层焦点恢复；
- 模拟 `prefers-reduced-motion: reduce`，确认没有依赖位移才能理解的反馈；
- 检查正文对比度、选中/已检查/私有/共享均不只依赖颜色。

- [ ] **Step 6: 按 UI 任务流标准记录审查结果**

EXP-012 必须分别记录：

- 观察到的行为或截图证据；
- 对应的任务阶段；
- 控制对象与直接结果是否正确映射；
- 主/次/恢复操作层级；
- 加载、空、错误、禁用、完成和中断状态；
- 桌面、手机、键盘中未覆盖的状态；
- “已实现”“已技术验证”“仍待平衡”“仍待老师反馈”四种结论。

- [ ] **Step 7: 更新 README 和项目记忆**

README 清楚列出：

```text
掌眼_低保真交互原型.html：规则定位与历史对照
掌眼_数值实验台.html：开发侧批量模拟
掌眼_高保真教师演示.html：老师演示与玩家体验审查
```

项目状态只在有证据时把高保真标记为已验证；等级阈值、议价参数、美术资产和微信内实机仍保持“待平衡/待验证”。

- [ ] **Step 8: 最终提交**

```powershell
git add -- `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/package.json" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/README.md" `
  "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_高保真教师演示.html" `
  "docs/project/01-SYSTEM-MAP.md" `
  "docs/project/02-CURRENT-STATE.md" `
  "docs/project/03-NEXT-ACTIONS.md" `
  "docs/project/evidence/EXP-012-high-fidelity-teacher-demo.md"
git diff --cached --name-only
git commit -m "test: verify high fidelity teacher demo"
```

- [ ] **Step 9: 最终交接**

向用户提供：

- 高保真 HTML 的绝对路径；
- 已验证的桌面、手机和键盘路径；
- 仍属于工作参数的等级阈值与议价容量；
- 低保真、高保真、数值实验台各自用途；
- Git 中“旧提交不变、新文件与规则改动形成后续提交”的准确解释。
