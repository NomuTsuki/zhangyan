# 《掌眼》V2 统一数值权威源 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变 V1 冻结交付和已批准玩法语义的前提下，把首案规则迁移为单一、版本化、确定性且可回放的生产数值权威源。

**Architecture:** 保留 `createInitialWorldState → resolveTurn / replayActions → WorldState` 兼容外观，在内部建立 `RulesContext`、纯 `reduceTurn`、领域模块、版本化回放和玩家/开发投影。所有迁移先由现状基线和差分测试保护；V1 canonical、历史低保真和数值实验台只保留各自身份，不能反向成为生产规则。

**Tech Stack:** TypeScript 5.9、Node.js `>=22.13.0`、Node test runner、React 19、Vite 8、Next/vinext；第一阶段不增加游戏、叙事、AI 或概率框架依赖。

## Global Constraints

- 项目根目录固定为 `D:\实习工作\掌眼\.worktrees\v2-bootstrap`；产品根目录固定为 `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype`。
- V1 冻结引用固定为 annotated tag `v1.0.0-teacher-handoff`，剥离提交 `f0b20b8ef5f5246529027f90a3fb277659c329cf`；不得移动、重打或覆盖。
- V1 canonical `prototype/public/掌眼_高保真教师演示.html` 的 SHA-256 必须始终为 `8B46D415627A2BDAA6D90C68C61189496DEAACCC1D3F1213ADC45A794464925B`。
- 原工作区 31 项、教师五文件发布契约、作品集 capsule、V1 worktree 和历史 `RUN-DOCX-01 FAIL` 不得修改或删除。
- 第一阶段不安装 boardgame.io、Yuka、inkjs、OpenSpiel 或其他生产游戏/叙事框架。
- 物品真相、玩家认知、NPC 认知、共享信息、关系状态、交易与结算继续分层；NPC 与判断质量不得读取隐藏真相。
- 所有随机性仅来自显式 `seed + turn + stable key`；规则核不得读取 `Date.now()`、`Math.random()`、DOM、网络或组件状态。
- 既有 `81/81` 只作为 V1 历史证据；V2 必须产生新鲜的专项、完整、类型和 lint 结果。
- `.project-co-leader-v2.yaml` 的 `auto_git_commit: false` 有效。计划中的 commit 命令只有在用户另行明确授权 Git 后才执行；未获授权时只保留工作树差异和检查点记录。
- 每个 Phase 开始前在 `docs/project/02-CURRENT-STATE.md` 更新起点 SHA、changed/preserved surface、验证和停止条件；它仍是唯一活动工作 ledger。
- 每完成一个可展示里程碑或发生大迁移，Co-Leader 必须提醒用户整理一张成果图/短录屏、对应版本和验证结论；活跃开发每 1–2 周复查素材、路径、哈希、隐私和备份。不得改写已冻结的 V1 作品集文本。

---

## File Structure

### 新建生产模块

- `prototype/game/ruleset.ts`：规则集身份、生产规则配置和 `RulesContext`。
- `prototype/game/numeric.ts`：通用有限数值、clamp、舍入和价格档位工具。
- `prototype/game/random.ts`：seeded hash、单位随机数和行为扰动。
- `prototype/game/belief.ts`：玩家/NPC 后验、归一化、期望值、分位数和熵。
- `prototype/game/disclosure.ts`：披露合法性、相关性、重复签名和 framing 社会效果。
- `prototype/game/storylets.ts`：结构化陈述、一次性 Storylet 和重复规则。
- `prototype/game/npc-decision.ts`：候选生成、硬过滤、效用、稳定裁决与纺锤轨迹。
- `prototype/game/settlement.ts`：客观收益、判断质量和成果等级的唯一结算编排。
- `prototype/game/reducer.ts`：动作校验、领域模块组合与 `TransitionResult`。
- `prototype/game/replay.ts`：`ReplayEnvelope`、版本验证和确定性重放。
- `prototype/game/projections.ts`：开发投影及玩家/开发可见性边界的共享契约。

### 保留并收窄

- `prototype/game/resolve-action.ts`：迁移完成后只保留兼容导出和默认规则集绑定。
- `prototype/game/types.ts`：迁移期公共类型入口；仅在接口稳定后增加新类型，不先做目录美化式拆分。
- `prototype/game/negotiation.ts`：议价容量、NPC 定价、参考报价和正式重估的唯一生产模块。
- `prototype/game/judgment-quality.ts`、`outcome-grades.ts`：保留局部权威，由 `settlement.ts` 统一组合。
- `prototype/hifi/presentation.ts`：玩家显示投影；不得成为规则源。

### 新建测试与工具

- `prototype/tests/v2-boundaries.test.mjs`：V1/V2 产物、依赖和历史生成器边界。
- `prototype/tests/helpers/authority-scenarios.mjs`：十个固定行为基线场景和语义投影。
- `prototype/tests/fixtures/v2-numeric-authority-baseline.json`：迁移前语义快照；只允许经批准更新。
- `prototype/scripts/capture-authority-baseline.mjs`：显式 `--approve-baseline` 才能写夹具。
- `prototype/tests/ruleset-contract.test.mjs`、`numeric-random.test.mjs`、`belief.test.mjs`、`disclosure.test.mjs`、`storylets.test.mjs`、`npc-decision.test.mjs`、`replay-versioning.test.mjs`、`projections.test.mjs`：聚焦领域契约。
- `release/v2-development.json`：V2 开发产物身份；不替代 V1 教师发布 manifest。

## Verification Contract: Material behavior-preserving migration

**Purpose:** 证明职责拆分与版本化没有无声改变已批准的首案行为。

**Baseline:** 在 Task 1 的 V1/V2 生成路径隔离完成后、任何规则公式修改前，由当前 TypeScript 规则核捕获一次只读语义基线。基线记录源 HEAD、V1 tag、规则文件哈希和场景清单；夹具不是生产参数权威。

**Scenarios:**

1. `blind-buy`：三个真相变体，seed `20260723`，动作 `[buy]`；
2. `blind-reject`：三个真相变体，seed `20260723`，动作 `[reject]`；
3. `restored-disclosure-trade`：`restored-genuine`，seed `20260723`，`inspect joint → dialogue repair-history/professional/modern-adhesive-trace → discount 50 → buy`；
4. `restored-open-inquiry`：`restored-genuine`，seed `20260723`，`dialogue provenance/gentle → reject`；
5. `restored-lucky-seed-1` 与 `restored-ordinary-seed-5`：分别用 seed `1`、`5` 执行 `inspect joint → reject`。

**Compared fields:** `status`、`turn`、调查 AP、议价容量、费用、当前价格、NPC 四状态、私有/共享证据 ID、双方后验、价格历史、陈述信号、Storylet、每轮行动/公式/纺锤摘要、结算选择、客观收益、判断质量和 `D—SSS` 分项。新增的版本/provenance 字段单独验证，不参与旧语义相等比较。

**Thresholds:** 语义快照必须完全相等；后验归一误差不超过 `1e-10`；相同信封重复回放必须深相等；V1 canonical SHA-256 必须精确相等；任何差异都默认 FAIL，不能自动刷新夹具。

**Pass meaning:** 仅说明这些首案、路径和 seed 的现行行为在重构中保持，并且新增版本/边界契约有效。

**Blind spots:** 不证明数值平衡、支配策略不存在、一般玩家理解、趣味、第二案件、真实微信浏览器、正式部署或最终作品集美学。

**Failure handling:** 保存失败输出；停止当前提取任务。若差异是有意行为变化，先记录旧值、新值、原因、受影响决定与用户批准，再使用 `--approve-baseline` 生成新的追加证据；不得因测试失败直接覆盖夹具。

---

### Task 1: Phase 0 — 隔离 V1/V2 构建产物并冻结历史生成器

**Files:**
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/AGENTS.md:1-95`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/README.md:1-55`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/generate-hifi.mjs:1-94`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/generate-standalone.mjs:1-47`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-html.test.mjs:1-80`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/standalone-html.test.mjs:1-60`
- Modify: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/v1-release-contract.test.mjs:1-130`
- Create: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/v2-boundaries.test.mjs`
- Create: `release/v2-development.json`
- Generate: `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_V2_高保真演示.html`

**Interfaces:**
- Consumes: V1 frozen hash and existing Vite high-fidelity bundle.
- Produces: V2 output path `public/掌眼_V2_高保真演示.html`; fail-closed legacy generator; `release/v2-development.json` with `releaseId: "v2-development"` and `publicationStatus: "not-public"`.

- [ ] **Step 1: Record the Phase 0 preflight**

Run from repository root:

```powershell
git rev-parse HEAD
git rev-parse 'v1.0.0-teacher-handoff^{}'
git status --short
git diff --cached --name-only
Get-FileHash -Algorithm SHA256 -LiteralPath '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_高保真教师演示.html'
```

Expected: V1 resolves to `f0b20b8...`; staged output is empty; V1 SHA-256 is `8B46...925B`. Stop if product files are already dirty for unknown reasons.

- [ ] **Step 2: Write failing boundary tests**

Add exact assertions:

```js
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const V1_SHA256 = "8B46D415627A2BDAA6D90C68C61189496DEAACCC1D3F1213ADC45A794464925B";
const v1 = new URL("../public/掌眼_高保真教师演示.html", import.meta.url);
const v2 = new URL("../public/掌眼_V2_高保真演示.html", import.meta.url);

async function sha256(url) {
  return createHash("sha256").update(await readFile(url)).digest("hex").toUpperCase();
}

test("V2 build has a distinct output and V1 canonical remains byte-frozen", async () => {
  assert.equal(await sha256(v1), V1_SHA256);
  assert.notEqual(fileURLToPath(v1), fileURLToPath(v2));
  await access(v2);
});

test("legacy standalone generator fails before changing its snapshot", () => {
  const before = readFileSync(legacyHtml);
  const result = spawnSync(process.execPath, [fileURLToPath(generator)], { encoding: "utf8" });
  const after = readFileSync(legacyHtml);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /archived V1 low-fidelity generator is disabled/i);
  assert.deepEqual(after, before);
});
```

- [ ] **Step 3: Run tests and observe the expected red state**

```powershell
Set-Location '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype'
node --experimental-strip-types --test tests/v2-boundaries.test.mjs tests/v1-release-contract.test.mjs
```

Expected: FAIL because the V2 HTML/manifest do not exist and the legacy generator still writes.

- [ ] **Step 4: Make the legacy generator fail closed before any read/write work**

Replace its executable body with:

```js
throw new Error(
  "Archived V1 low-fidelity generator is disabled: its reservationPrice-era client is not compatible with the current CaseDefinition. Preserve the tracked HTML/client bytes; create a separately approved V2 generator instead.",
);
```

The historical HTML and `standalone/client.js` remain untouched and recoverable from the V1 tag/capsule.

- [ ] **Step 5: Redirect high-fidelity generation to the V2 filename**

In `generate-hifi.mjs` use:

```js
const outputUrl = new URL("./public/掌眼_V2_高保真演示.html", import.meta.url);
```

Update only V2-oriented high-fidelity tests to the V2 filename. Keep `v1-release-contract.test.mjs` pointing to the V1 filename and add its exact SHA-256 assertion.

- [ ] **Step 6: Add the V2 development manifest**

```json
{
  "schemaVersion": 1,
  "releaseId": "v2-development",
  "publicationStatus": "not-public",
  "runtime": "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_V2_高保真演示.html",
  "preservedV1Runtime": "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_高保真教师演示.html"
}
```

- [ ] **Step 7: Correct the nested phase identity**

Change the nested `AGENTS.md` stage label from active “低保真 UI 阶段” to “V1 历史约束 + V2 数值权威迁移”，link to `docs/project/02-CURRENT-STATE.md` and the approved spec, and retain all valid product/architecture restrictions. Update prototype README with this exact authority taxonomy:

| Identity | Owner | Direction |
|---|---|---|
| 生产规则权威 | `game/` + `content/` | 可被投影、测试和生成链读取；不读取下列身份 |
| 显示投影 | `hifi/presentation.ts` + `game/projections.ts` | 只读规则状态，不反向修改规则 |
| 实验模型 | `public/掌眼_数值实验台.html` | 隔离实验，不证明生产一致或平衡 |
| 调试轨迹 | `TurnRecord` / `CalculationTrace` | 解释输出，不参与下一轮计算 |
| 历史资产 | V1 canonical、低保真 HTML/client | 按字节保留，不继续生成生产规则 |
| 测试例证 | fixtures 与固定断言 | 检测漂移，不反向定义参数 |
| 生成产物 | V2 high-fidelity HTML | 只由构建产生并携带 provenance |

同一 README 将测试标注为 `consistency`、`design-example`、`balance-simulation`、`human-experience` 四层；当前自动套件只覆盖前两层与隔离实验台内部一致性，不把它们称为真人体验或平衡证据。

- [ ] **Step 8: Build only the V2 output and run Phase 0 gates**

```powershell
npm.cmd run build:hifi
node --experimental-strip-types --test tests/v2-boundaries.test.mjs tests/v1-release-contract.test.mjs tests/hifi-html.test.mjs tests/standalone-html.test.mjs
Get-FileHash -Algorithm SHA256 -LiteralPath 'public/掌眼_高保真教师演示.html'
```

Expected: all tests PASS; V1 hash remains exact; V2 file exists. Stop if V1 changes.

- [ ] **Step 9: Checkpoint without implicit Git authority**

```powershell
git diff --check
git status --short -- '掌眼_Codex启动包_v2/**' 'release/v2-development.json'
# Run only after separate user authorization:
git add -- '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/AGENTS.md' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/README.md' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/generate-hifi.mjs' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/generate-standalone.mjs' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_V2_高保真演示.html' 'release/v2-development.json'
git commit -m 'chore: establish V2 authority boundaries'
```

**Rollback:** Revert only Task 1 V2 changes; verify V1 hash. Never run the old generator to “restore” history.

---

### Task 2: Phase 0/1 — Capture and lock the semantic behavior baseline

**Files:**
- Create: `prototype/tests/helpers/authority-scenarios.mjs`
- Create: `prototype/scripts/capture-authority-baseline.mjs`
- Create: `prototype/tests/fixtures/v2-numeric-authority-baseline.json`
- Create: `prototype/tests/authority-baseline.test.mjs`
- Modify: `prototype/package.json:8-18`

**Interfaces:**
- Consumes: current `replayActions`, `lacquerBoxCase` and the ten scenarios in the Material contract.
- Produces: `captureAuthorityBaseline(): object`; immutable JSON fixture with `schemaVersion: 1`, source metadata and semantic snapshots.

- [ ] **Step 1: Implement the exact scenario table and semantic projection**

```js
export const AUTHORITY_SCENARIOS = [
  ...["counterfeit", "restored-genuine", "hidden-treasure"].flatMap((truthVariantId) => [
    { id: `blind-buy:${truthVariantId}`, truthVariantId, seed: 20260723, actions: [{ kind: "buy" }] },
    { id: `blind-reject:${truthVariantId}`, truthVariantId, seed: 20260723, actions: [{ kind: "reject" }] },
  ]),
  {
    id: "restored-disclosure-trade",
    truthVariantId: "restored-genuine",
    seed: 20260723,
    actions: [
      { kind: "inspect", targetId: "joint" },
      { kind: "dialogue", topicId: "repair-history", tone: "professional", evidenceId: "modern-adhesive-trace" },
      { kind: "discount", offer: 50 },
      { kind: "buy" },
    ],
  },
  { id: "restored-open-inquiry", truthVariantId: "restored-genuine", seed: 20260723, actions: [{ kind: "dialogue", topicId: "provenance", tone: "gentle" }, { kind: "reject" }] },
  { id: "restored-lucky-seed-1", truthVariantId: "restored-genuine", seed: 1, actions: [{ kind: "inspect", targetId: "joint" }, { kind: "reject" }] },
  { id: "restored-ordinary-seed-5", truthVariantId: "restored-genuine", seed: 5, actions: [{ kind: "inspect", targetId: "joint" }, { kind: "reject" }] },
];
```

`semanticState(state)` 使用下面的完整投影；不排序玩法数组，并故意排除未来的 identity/provenance 字段：

```js
export function semanticState(state) {
  return {
    status: state.status,
    turn: state.turn,
    actionPoints: state.actionPoints,
    negotiation: state.negotiation,
    feesPaid: state.feesPaid,
    currentPrice: state.currentPrice,
    npcState: state.npcState,
    discoveredEvidenceIds: state.discoveredEvidenceIds,
    sharedEvidenceIds: state.sharedEvidenceIds,
    npcPosterior: state.npcPosterior,
    priceHistory: state.priceHistory,
    statementHistory: state.statementHistory,
    triggeredStoryletIds: state.triggeredStoryletIds,
    actionHistory: state.actionHistory.map((turn) => ({
      turn: turn.turn,
      action: turn.action,
      actionPointCost: turn.actionPointCost,
      negotiationCapacityCost: turn.negotiationCapacityCost,
      after: turn.after,
      changes: turn.changes,
      evidenceAdded: turn.evidenceAdded,
      sharedEvidenceAdded: turn.sharedEvidenceAdded,
      priceChange: turn.priceChange,
      statement: turn.statement,
      formulaLog: turn.formulaLog,
      spindle: turn.spindle,
      redundant: turn.redundant,
    })),
    settlement: state.settlement,
  };
}

export function captureAuthorityBaseline() {
  return {
    schemaVersion: 1,
    snapshots: Object.fromEntries(
      AUTHORITY_SCENARIOS.map((scenario) => [
        scenario.id,
        semanticState(replayActions(
          lacquerBoxCase,
          scenario.actions,
          scenario.seed,
          scenario.truthVariantId,
        )),
      ]),
    ),
  };
}
```

- [ ] **Step 2: Add a write guard to the capture script**

```js
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { AUTHORITY_SCENARIOS, captureAuthorityBaseline } from "../tests/helpers/authority-scenarios.mjs";

const fixtureUrl = new URL("../tests/fixtures/v2-numeric-authority-baseline.json", import.meta.url);
const repositoryRoot = fileURLToPath(new URL("../../../../", import.meta.url));

if (!process.argv.includes("--approve-baseline")) {
  throw new Error("Baseline writes require --approve-baseline; a failed comparison must never regenerate automatically.");
}
const capture = captureAuthorityBaseline();
const snapshotsJson = JSON.stringify(capture.snapshots);
const fixture = {
  ...capture,
  provenance: {
    sourceHead: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, encoding: "utf8" }).trim(),
    v1FrozenCommit: execFileSync("git", ["rev-parse", "v1.0.0-teacher-handoff^{}"], { cwd: repositoryRoot, encoding: "utf8" }).trim(),
    scenarioCount: AUTHORITY_SCENARIOS.length,
    snapshotsSha256: createHash("sha256").update(snapshotsJson).digest("hex"),
  },
};
await writeFile(fixtureUrl, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
```

- [ ] **Step 3: Capture once before rule extraction**

```powershell
node --experimental-strip-types scripts/capture-authority-baseline.mjs --approve-baseline
Get-FileHash -Algorithm SHA256 -LiteralPath 'tests/fixtures/v2-numeric-authority-baseline.json'
```

Record the whole-file hash in `02-CURRENT-STATE.md`; the fixture itself records `snapshotsSha256`, avoiding a self-referential whole-file hash.

- [ ] **Step 4: Write the lock test**

```js
test("authority scenarios match the approved pre-refactor semantic baseline", async () => {
  const expected = JSON.parse(await readFile(fixtureUrl, "utf8"));
  const actual = captureAuthorityBaseline();
  assert.deepEqual(actual.snapshots, expected.snapshots);
});
```

- [ ] **Step 5: Add the test to the full suite and verify**

```powershell
node --experimental-strip-types --test tests/authority-baseline.test.mjs tests/rules.test.mjs
npm.cmd test
```

Expected: baseline and full suite PASS. The full build writes only V2 high-fidelity output; V1 hash remains exact.

- [ ] **Step 6: Record the Phase 1 checkpoint and portfolio reminder**

Update the active ledger with the fixture hash, scenario count `10`, full test result and V1 hash. Remind the user that a major authority migration is beginning and recommend a lightweight pre-migration screenshot/version note; do not create portfolio assets without separate authorization.

- [ ] **Step 7: Conditional checkpoint commit**

```powershell
git diff --check
# Run only after separate user authorization:
git add -- '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/helpers/authority-scenarios.mjs' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/scripts/capture-authority-baseline.mjs' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/fixtures/v2-numeric-authority-baseline.json' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/authority-baseline.test.mjs' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/package.json'
git commit -m 'test: lock V2 numeric authority baseline'
```

**Rollback:** Delete only the new baseline tooling/fixture and restore the package script. Never update the fixture to hide a subsequent difference.

---

### Task 3: Phase 1 — Add ruleset, case and state identity

**Files:**
- Create: `prototype/game/ruleset.ts`
- Modify: `prototype/game/types.ts:227-255,403-425`
- Modify: `prototype/content/lacquer-box.ts:3-22`
- Modify: `prototype/game/resolve-action.ts:818-851`
- Create: `prototype/tests/ruleset-contract.test.mjs`
- Modify: `prototype/package.json`

**Interfaces:**
- Produces: `RulesetIdentity`, `RulesetConfig`, `RulesContext`, `DEFAULT_RULESET_IDENTITY`, `DEFAULT_RULESET_CONFIG`, `createRulesContext`.
- Adds: `CaseDefinition.caseVersion: string`; `WorldState.rulesetId`, `rulesetVersion`, `caseVersion`.

- [ ] **Step 1: Write failing identity tests**

```js
test("initial state binds the case and ruleset identities", () => {
  const state = createInitialWorldState(lacquerBoxCase);
  assert.deepEqual(
    { rulesetId: state.rulesetId, rulesetVersion: state.rulesetVersion, caseVersion: state.caseVersion },
    { rulesetId: "zhangyan-core", rulesetVersion: "2.0.0-alpha.1", caseVersion: "1.0.0" },
  );
});
```

- [ ] **Step 2: Run the focused red test**

```powershell
node --experimental-strip-types --test tests/ruleset-contract.test.mjs
```

Expected: FAIL because identity types and state fields do not exist.

- [ ] **Step 3: Add the ruleset contracts**

```ts
export type RulesetIdentity = Readonly<{
  rulesetId: "zhangyan-core";
  rulesetVersion: string;
  caseSchemaVersion: number;
}>;

export type RulesetConfig = Readonly<{
  normalizationTolerance: number;
  minimumLikelihood: number;
  behaviorJitterSpan: number;
  priceTick: number;
}>;

export const DEFAULT_RULESET_IDENTITY: RulesetIdentity = Object.freeze({
  rulesetId: "zhangyan-core",
  rulesetVersion: "2.0.0-alpha.1",
  caseSchemaVersion: 1,
});

export const DEFAULT_RULESET_CONFIG: RulesetConfig = Object.freeze({
  normalizationTolerance: 1e-10,
  minimumLikelihood: 0.0001,
  behaviorJitterSpan: 3,
  priceTick: 5,
});

export type RulesContext = Readonly<{
  identity: RulesetIdentity;
  rules: RulesetConfig;
  caseDefinition: CaseDefinition;
}>;
```

- [ ] **Step 4: Bind identities during initialization**

Set `lacquerBoxCase.caseVersion = "1.0.0"`. Add the three identity fields to `WorldState` and populate them from `DEFAULT_RULESET_IDENTITY` and the case. Do not alter action results.

- [ ] **Step 5: Run identity, baseline and full contract checks**

```powershell
node --experimental-strip-types --test tests/ruleset-contract.test.mjs tests/authority-baseline.test.mjs tests/rules.test.mjs
npx.cmd tsc --noEmit
```

Expected: PASS; the semantic fixture remains equal because it intentionally excludes new metadata.

- [ ] **Step 6: Conditional checkpoint commit**

```powershell
git diff --check
# Run only after separate user authorization:
git add -- '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/ruleset.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/types.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/content/lacquer-box.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/ruleset-contract.test.mjs' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/package.json'
git commit -m 'feat: version the V2 ruleset and case state'
```

**Stop:** Any old replay silently acquiring a different behavior rather than only metadata is a failure.

---

### Task 4: Phase 2 — Extract finite numeric helpers and deterministic random

**Files:**
- Create: `prototype/game/numeric.ts`
- Create: `prototype/game/random.ts`
- Modify: `prototype/game/resolve-action.ts:71-100,432-442`
- Create: `prototype/tests/numeric-random.test.mjs`

**Interfaces:**
- Produces: `clamp`, `round1`, `roundToTick`, `ceilToTick`, `floorToTick`, `assertFiniteNumber`, `seededUnit`, `behaviorJitter`.
- Consumes: `RulesetConfig.behaviorJitterSpan` and `priceTick`.

- [ ] **Step 1: Write exact deterministic tests**

```js
test("seeded values are stable", () => {
  assert.equal(seededUnit(20260723, 1, "behavior:cooperate"), 0.7433075965382159);
  assert.equal(behaviorJitter(20260723, 1, "cooperate"), 0.7);
  assert.equal(behaviorJitter(20260723, 2, "exit"), -1.5);
});

test("numeric authority rejects non-finite input", () => {
  assert.throws(() => assertFiniteNumber(Number.NaN, "price"), /price.*finite/i);
});
```

- [ ] **Step 2: Run red**

```powershell
node --experimental-strip-types --test tests/numeric-random.test.mjs
```

- [ ] **Step 3: Move the current algorithms without changing keys**

`random.ts` must preserve the existing FNV-style hash and mixing body byte-for-byte. Implement jitter as:

```ts
export function behaviorJitter(seed: number, turn: number, key: string) {
  const span = DEFAULT_RULESET_CONFIG.behaviorJitterSpan;
  return round1((seededUnit(seed, turn, `behavior:${key}`) - 0.5) * span);
}
```

Replace imports in `resolve-action.ts`; do not rename any call-site key.

- [ ] **Step 4: Run focused differential gates**

```powershell
node --experimental-strip-types --test tests/numeric-random.test.mjs tests/authority-baseline.test.mjs tests/rules.test.mjs
npx.cmd tsc --noEmit
```

- [ ] **Step 5: Conditional checkpoint commit**

```powershell
git diff --check
# Run only after separate user authorization:
git add -- '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/numeric.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/random.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/numeric-random.test.mjs'
git commit -m 'refactor: extract deterministic numeric utilities'
```

**Stop:** Any baseline or seeded value drift is unexplained behavior change.

---

### Task 5: Phase 2 — Extract player and NPC belief authority

**Files:**
- Create: `prototype/game/belief.ts`
- Modify: `prototype/game/resolve-action.ts:299-430`
- Create: `prototype/tests/belief.test.mjs`

**Interfaces:**
- Produces: `calculatePosterior`, `calculateNpcPosterior`, `normalizePosterior`, `posteriorExpectedValue`, `posteriorQuantile`, `posteriorEntropy`.
- Consumes: `TRUTH_VARIANT_IDS`, `RulesContext.rules.minimumLikelihood`, `normalizationTolerance`.

- [ ] **Step 1: Write failing invariants**

```js
test("posterior is normalized and evidence order independent", () => {
  const a = calculatePosterior(lacquerBoxCase, ["modern-adhesive-trace", "restored-interior"]);
  const b = calculatePosterior(lacquerBoxCase, ["restored-interior", "modern-adhesive-trace"]);
  assert.deepEqual(a, b);
  assert.ok(Math.abs(a.reduce((sum, item) => sum + item.probability, 0) - 1) <= 1e-10);
});

test("normalization fails closed for invalid weights", () => {
  assert.throws(() => normalizePosterior(lacquerBoxCase, [
    { variantId: "counterfeit", weight: Number.NaN },
  ]), /finite/i);
});
```

- [ ] **Step 2: Move the six current belief functions**

Copy the current bodies from `resolve-action.ts` into `belief.ts`. Replace the silent `total || 1` fallback with explicit finite/nonnegative checks and throw when total is not positive. Preserve the `minimumLikelihood = 0.0001`, source de-duplication and statement confidence exponent exactly.

- [ ] **Step 3: Replace internal imports and preserve public exports**

`resolve-action.ts` imports the belief functions and re-exports `calculatePosterior` and `calculateNpcPosterior` so existing callers do not break.

- [ ] **Step 4: Run belief, truth-isolation and baseline gates**

```powershell
node --experimental-strip-types --test tests/belief.test.mjs tests/judgment-quality.test.mjs tests/authority-baseline.test.mjs tests/rules.test.mjs
npx.cmd tsc --noEmit
```

- [ ] **Step 5: Record a lightweight portfolio checkpoint**

Remind the user that “双方后验从单体规则文件变成显式领域模块” is a portfolio-worthy architecture milestone. Recommend one Mermaid before/after diagram and one verified interaction screenshot, not intermediate code slices.

- [ ] **Step 6: Conditional checkpoint commit**

```powershell
git diff --check
# Run only after separate user authorization:
git add -- '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/belief.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/belief.test.mjs'
git commit -m 'refactor: centralize player and NPC belief updates'
```

**Stop:** NPC posterior, price or settlement changes for any baseline path; truth ID entering the new NPC belief API.

---

### Task 6: Phase 3 — Make selective disclosure and framing explicit

**Files:**
- Create: `prototype/game/disclosure.ts`
- Modify: `prototype/game/types.ts`
- Modify: `prototype/game/resolve-action.ts:1097-1212`
- Create: `prototype/tests/disclosure.test.mjs`

**Interfaces:**
- Produces: `EvidencePayload`, `DisclosureSelection`, `FramingEffect`, `DisclosureEvaluation`, `evaluateDisclosure(caseDefinition, state, action)`.

- [ ] **Step 1: Define and test the four-channel boundary**

```ts
export type EvidencePayload = Readonly<Pick<
  EvidenceDefinition,
  "id" | "kind" | "name" | "topic" | "strength" | "likelihoods"
>>;

export type DisclosureSelection = Readonly<{
  evidenceId: string | null;
  newlyShared: boolean;
}>;

export type FramingEffect = Readonly<{
  pressureDelta: number;
  trustDelta: number;
  dealIntentDelta: number;
  controlDelta: number;
  formulas: string[];
}>;

export type DisclosureEvaluation = Readonly<{
  payload: EvidencePayload | null;
  selection: DisclosureSelection;
  framing: FramingEffect;
  relevant: boolean;
  repeatCount: number;
  power: number;
  relevanceFactor: number;
}>;
```

```js
test("framing changes social effects but never evidence likelihoods", () => {
  const state = resolveTurn(lacquerBoxCase, createInitialWorldState(lacquerBoxCase), { kind: "inspect", targetId: "joint" });
  const gentle = evaluateDisclosure(lacquerBoxCase, state, { kind: "dialogue", topicId: "repair-history", tone: "gentle", evidenceId: "modern-adhesive-trace" });
  const firm = evaluateDisclosure(lacquerBoxCase, state, { kind: "dialogue", topicId: "repair-history", tone: "firm", evidenceId: "modern-adhesive-trace" });
  assert.deepEqual(gentle.payload.likelihoods, firm.payload.likelihoods);
  assert.notDeepEqual(gentle.framing, firm.framing);
});
```

- [ ] **Step 2: Run red**

```powershell
node --experimental-strip-types --test tests/disclosure.test.mjs
```

- [ ] **Step 3: Move legality, relevance, repeat and delta calculation**

Move the exact logic for unknown/unheld evidence, relevance, signature, repeat count, evidence power, tone pressure, decay and four NPC deltas into `evaluateDisclosure`. It returns data only; it does not mutate `WorldState` and cannot receive `truthVariantId` as a parameter.

- [ ] **Step 4: Use the evaluation in dialogue resolution**

Replace local calculations with `const disclosure = evaluateDisclosure(...)`; share only `disclosure.payload.id` when it is non-statement evidence. Retain the existing public formula text through fields on `FramingEffect`.

- [ ] **Step 5: Run disclosure and information-boundary gates**

```powershell
node --experimental-strip-types --test tests/disclosure.test.mjs tests/hifi-presentation.test.mjs tests/authority-baseline.test.mjs tests/rules.test.mjs
npx.cmd tsc --noEmit
```

- [ ] **Step 6: Conditional checkpoint commit**

```powershell
git diff --check
# Run only after separate user authorization:
git add -- '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/disclosure.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/types.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/disclosure.test.mjs'
git commit -m 'refactor: separate disclosure facts from framing effects'
```

**Stop:** Framing changes posterior likelihoods, unheld evidence can be shared, or private evidence reaches NPC belief.

---

### Task 7: Phase 3 — Extract structured Storylet and statement authority

**Files:**
- Create: `prototype/game/storylets.ts`
- Modify: `prototype/game/resolve-action.ts:1214-1325`
- Create: `prototype/tests/storylets.test.mjs`

**Interfaces:**
- Produces: `resolveDialogueStorylet(caseDefinition, state, topic, selectedBehavior): StoryletResolution`.

- [ ] **Step 1: Define the result and failing repeat test**

```ts
export type StoryletResolution = Readonly<{
  storyletId: string;
  newlyTriggered: boolean;
  evidenceAdded: string[];
  statement: StatementRecord;
}>;
```

```js
test("partial admission is one-shot and statement signals remain one source", () => {
  const state = createInitialWorldState(lacquerBoxCase);
  const topic = lacquerBoxCase.dialogueTopics.find((item) => item.id === "repair-history");
  assert.ok(topic);
  const first = resolveDialogueStorylet(lacquerBoxCase, state, topic, "partial-admit");
  const repeatedState = { ...state, triggeredStoryletIds: [first.storyletId] };
  const second = resolveDialogueStorylet(lacquerBoxCase, repeatedState, topic, "partial-admit");
  assert.equal(first.newlyTriggered, true);
  assert.equal(second.newlyTriggered, false);
  assert.deepEqual(second.evidenceAdded, []);
  assert.equal(first.statement.signalId, second.statement.signalId);
});
```

- [ ] **Step 2: Move statement/source/confidence and one-shot effect logic**

Move the current `sourceKind`, confidence table, `StatementRecord`, `responseEvidenceId` and triggered Storylet logic unchanged. The function must not update prices, posterior or NPC state.

- [ ] **Step 3: Integrate and run gates**

```powershell
node --experimental-strip-types --test tests/storylets.test.mjs tests/judgment-quality.test.mjs tests/authority-baseline.test.mjs tests/rules.test.mjs
npx.cmd tsc --noEmit
```

- [ ] **Step 4: Conditional checkpoint commit**

```powershell
git diff --check
# Run only after separate user authorization:
git add -- '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/storylets.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/storylets.test.mjs'
git commit -m 'refactor: extract structured dialogue storylets'
```

**Stop:** A repeated Storylet adds evidence again or display cards double-weight the posterior.

---

### Task 8: Phase 3 — Extract NPC candidate expansion and deterministic convergence

**Files:**
- Create: `prototype/game/npc-decision.ts`
- Modify: `prototype/game/resolve-action.ts:919-1096,1230-1345,1575-1645,1725-1775`
- Create: `prototype/tests/npc-decision.test.mjs`

**Interfaces:**
- Produces: `createBehaviorCandidate`, `createFixedCandidate`, `chooseBehavior`, `buildDialogueCandidates`, `NPC_BEHAVIOR_LABELS`, `dialogueTitle`.
- Consumes: `behaviorJitter`, `DisclosureEvaluation`, `NPCState`, `BehaviorCandidate`.

- [ ] **Step 1: Write hard-filter and stable-tie tests**

```js
function candidate(id, eligible, score) {
  return {
    id,
    label: id,
    eligible,
    components: [],
    baseScore: score,
    jitter: 0,
    finalScore: eligible ? score : -999,
    score: eligible ? score : -999,
    formula: String(score),
    filterReasons: [],
    reasons: [],
  };
}

test("ineligible candidates never win", () => {
  assert.equal(chooseBehavior([
    candidate("blocked", false, 999),
    candidate("legal", true, 1),
  ]).id, "legal");
});

test("equal scores converge by declaration order", () => {
  assert.equal(chooseBehavior([
    candidate("first", true, 10),
    candidate("second", true, 10),
  ]).id, "first");
});
```

- [ ] **Step 2: Move candidate construction and make tie order explicit**

```ts
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
```

Move dialogue and negotiation candidate tables without changing coefficients or labels.

- [ ] **Step 3: Preserve the complete spindle trace**

Keep expansion inputs, every candidate component/filter/formula, selected ID/label and convergence reasons. No trace field can feed back into scoring.

- [ ] **Step 4: Run spindle and baseline gates**

```powershell
node --experimental-strip-types --test tests/npc-decision.test.mjs tests/authority-baseline.test.mjs tests/rules.test.mjs
npx.cmd tsc --noEmit
```

- [ ] **Step 5: Portfolio milestone reminder and conditional commit**

Recommend preserving one final “发散—硬过滤—效用分项—seed 近分—结构化收敛” diagram plus a verified developer-rail result, not several intermediate slices.

```powershell
git diff --check
# Run only after separate user authorization:
git add -- '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/npc-decision.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/npc-decision.test.mjs'
git commit -m 'refactor: centralize NPC spindle arbitration'
```

**Stop:** An ineligible behavior wins, stable seeds select differently, or trace loses a candidate/reason.

---

### Task 9: Phase 4 — Centralize pricing and negotiation authority

**Files:**
- Modify: `prototype/game/negotiation.ts:1-69`
- Modify: `prototype/game/resolve-action.ts:444-644,1519-1819`
- Modify: `prototype/hifi/HighFidelityApp.tsx:630-820`
- Modify: `prototype/app/page.tsx:620-710,1230-1350`
- Create: `prototype/tests/negotiation-authority.test.mjs`

**Interfaces:**
- Produces: existing `calculateNegotiationCapacity` plus `getNpcStance`, `getNpcPricing`, `getPlayerReferenceOffer`, `refreshNpcPricing`, `beginOrAdvanceNegotiation`.
- Consumes: belief statistics, numeric price tick, NPC profile and visible state only.

- [ ] **Step 1: Write pricing truth-isolation and resource tests**

```js
test("same NPC information gives identical pricing across hidden truths", () => {
  const states = TRUTH_VARIANT_IDS.map((truth) => createInitialWorldState(lacquerBoxCase, 20260723, truth));
  assert.deepEqual(states.map((state) => getNpcPricing(lacquerBoxCase, state)),
    states.map(() => getNpcPricing(lacquerBoxCase, states[0])));
});

test("a formal offer consumes negotiation capacity but not investigation AP", () => {
  const before = createInitialWorldState(lacquerBoxCase);
  const after = resolveTurn(lacquerBoxCase, before, { kind: "discount", offer: 50 });
  assert.equal(after.actionPoints, before.actionPoints);
  assert.equal(after.negotiation.remainingCapacity, after.negotiation.initialCapacity - 1);
});
```

- [ ] **Step 2: Move pure pricing and negotiation session functions**

Move stance, posterior statistics use, pricing/reference/reprice and session capacity logic to `negotiation.ts`. The module cannot accept `truthVariantId`; true value remains reachable only through posterior entries already owned by the belief layer.

- [ ] **Step 3: Replace UI preview calculations with production exports**

Keep UI read-only: it may call `calculateNegotiationCapacity` and `getPlayerReferenceOffer`, but must not reconstruct thresholds or acceptance lines. Action submission remains `PlayerAction` only.

- [ ] **Step 4: Run pricing, flow and baseline gates**

```powershell
node --experimental-strip-types --test tests/negotiation-authority.test.mjs tests/hifi-flow.test.mjs tests/authority-baseline.test.mjs tests/rules.test.mjs
npx.cmd tsc --noEmit
```

- [ ] **Step 5: Conditional checkpoint commit**

```powershell
git diff --check
# Run only after separate user authorization:
git add -- '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/negotiation.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/HighFidelityApp.tsx' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/app/page.tsx' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/negotiation-authority.test.mjs'
git commit -m 'refactor: centralize pricing and negotiation rules'
```

**Stop:** Hidden truth changes NPC pricing, UI contains acceptance formulas, or AP/capacity accounting drifts.

---

### Task 10: Phase 4 — Centralize settlement and remove UI grade duplication

**Files:**
- Create: `prototype/game/settlement.ts`
- Modify: `prototype/game/resolve-action.ts:645-817,1820-1851`
- Modify: `prototype/hifi/HighFidelityApp.tsx:48,840-900`
- Modify: `prototype/hifi/presentation.ts:291-329`
- Create: `prototype/tests/settlement-authority.test.mjs`

**Interfaces:**
- Produces: `calculateSettlement(caseDefinition, state, choice, paidPrice, buyoutLine): SettlementResult`; `settleWorldState(...)`.
- Consumes: `calculateJudgmentQuality`, `calculateOutcomeGrades`, `GRADE_ORDER`, player-visible belief and objective truth in separate local branches.

- [ ] **Step 1: Write separation and UI-authority tests**

```js
function settled(truthVariantId, action) {
  const initial = createInitialWorldState(lacquerBoxCase, 20260723, truthVariantId);
  return resolveTurn(lacquerBoxCase, initial, action).settlement;
}

test("objective net can change while judgment evidence remains identical", () => {
  const fake = settled("counterfeit", { kind: "buy" });
  const treasure = settled("hidden-treasure", { kind: "buy" });
  assert.notEqual(fake.actualNet, treasure.actualNet);
  assert.deepEqual(fake.posterior, treasure.posterior);
});

test("high-fidelity UI imports the production grade order", async () => {
  const source = await readFile(highFidelityAppUrl, "utf8");
  assert.match(source, /import\s*\{[^}]*GRADE_ORDER[^}]*\}\s*from/);
  assert.doesNotMatch(source, /const\s+gradeOrder\s*=\s*\[/);
});
```

- [ ] **Step 2: Move settlement composition**

Move `settlementResult`, `settle` and terminal composition into `settlement.ts`. Keep objective formula and judgment formula separate; the judgment call receives only visible evidence/statement inputs, not `truthVariantId`.

- [ ] **Step 3: Delete the UI grade copy**

Import `GRADE_ORDER` from `outcome-grades.ts` and replace `gradeOrder` references. Do not move display labels or CSS into the rules module.

- [ ] **Step 4: Run settlement, presentation and baseline gates**

```powershell
node --experimental-strip-types --test tests/settlement-authority.test.mjs tests/judgment-quality.test.mjs tests/hifi-presentation.test.mjs tests/authority-baseline.test.mjs tests/rules.test.mjs
npx.cmd tsc --noEmit
```

- [ ] **Step 5: Portfolio milestone reminder and conditional commit**

Recommend preserving one final result screen and one concise diagram showing “客观收益读取真相 / 判断质量只读当时证据 / 综合等级组合”，避免保存中间重构切片。

```powershell
git diff --check
# Run only after separate user authorization:
git add -- '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/settlement.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/HighFidelityApp.tsx' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/presentation.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/settlement-authority.test.mjs'
git commit -m 'refactor: centralize settlement and outcome grades'
```

**Stop:** Judgment reads hidden truth, objective and judgment formulas merge, or the UI keeps a second grade order.

---

### Task 11: Phase 4/5 — Introduce the pure reducer and auditable transition result

**Files:**
- Create: `prototype/game/reducer.ts`
- Modify: `prototype/game/types.ts`
- Replace contents: `prototype/game/resolve-action.ts`
- Modify consumers importing helpers from `resolve-action.ts` only as needed.
- Create: `prototype/tests/reducer-contract.test.mjs`

**Interfaces:**
- Produces: `DomainEvent`, `CalculationTrace`, `TransitionResult`, `reduceTurn(context, state, action)`.
- Preserves: `resolveTurn(caseDefinition, state, action): WorldState` and current helper exports via compatibility re-export.

- [ ] **Step 1: Add transition types and a failing purity test**

```ts
export type DomainEvent =
  | { kind: "evidence-discovered"; evidenceId: string }
  | { kind: "evidence-shared"; evidenceId: string }
  | { kind: "price-changed"; priceChange: PriceChange }
  | { kind: "case-settled"; settlement: SettlementResult };

export type CalculationTrace = Readonly<{
  turn: number;
  formulaLog: string[];
  spindle?: SpindleTrace;
}>;

export type TransitionResult = Readonly<{
  state: WorldState;
  events: DomainEvent[];
  trace: CalculationTrace;
}>;
```

```js
test("reduceTurn does not mutate its input and emits matching audit data", () => {
  const input = createInitialWorldState(lacquerBoxCase);
  const before = structuredClone(input);
  const result = reduceTurn(createRulesContext(lacquerBoxCase), input, { kind: "inspect", targetId: "joint" });
  assert.deepEqual(input, before);
  assert.equal(result.state.turn, 1);
  assert.deepEqual(result.trace.formulaLog, result.state.actionHistory.at(-1).formulaLog);
  assert.deepEqual(result.events.map((event) => event.kind), ["evidence-discovered"]);
});

test("an illegal action throws without mutating its input", () => {
  const input = createInitialWorldState(lacquerBoxCase);
  const before = structuredClone(input);
  assert.throws(() => reduceTurn(
    createRulesContext(lacquerBoxCase),
    input,
    { kind: "dialogue", topicId: "repair-history", tone: "firm", evidenceId: "modern-adhesive-trace" },
  ), /尚未发现/);
  assert.deepEqual(input, before);
});
```

- [ ] **Step 2: Move orchestration and action handlers into reducer.ts**

Move cloning, snapshots, action-cost/legality, turn append, inspect/dialogue/test/discount/buyout/terminal handlers and dispatch. Each handler consumes the extracted modules; no duplicated formula remains in `resolve-action.ts`.

- [ ] **Step 3: Implement the compatibility facade**

```ts
export function resolveTurn(caseDefinition: CaseDefinition, state: WorldState, action: PlayerAction) {
  return reduceTurn(createRulesContext(caseDefinition), state, action).state;
}

export { calculatePosterior, calculateNpcPosterior } from "./belief.ts";
export { getNpcPricing, getNpcStance, getPlayerReferenceOffer } from "./negotiation.ts";
```

- [ ] **Step 4: Derive events from the resolved turn exactly once**

Create events from `evidenceAdded`, `sharedEvidenceAdded`, `priceChange` and settlement on the newly appended `TurnRecord`. Events and traces are outputs only and are never read by the next reducer call.

- [ ] **Step 5: Run reducer, full rules and baseline gates**

```powershell
node --experimental-strip-types --test tests/reducer-contract.test.mjs tests/authority-baseline.test.mjs tests/rules.test.mjs tests/hifi-flow.test.mjs
npx.cmd tsc --noEmit
```

- [ ] **Step 6: Conditional checkpoint commit**

```powershell
git diff --check
# Run only after separate user authorization:
git add -- '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/reducer.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/types.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/reducer-contract.test.mjs'
git commit -m 'refactor: route actions through the pure rules reducer'
```

**Stop:** Input mutation, event/turn mismatch, or the compatibility API changes observable behavior.

---

### Task 12: Phase 5 — Add versioned replay envelopes and mismatch rejection

**Files:**
- Create: `prototype/game/replay.ts`
- Modify: `prototype/game/types.ts`
- Modify: `prototype/game/resolve-action.ts`
- Create: `prototype/tests/replay-versioning.test.mjs`

**Interfaces:**
- Produces: `ReplayEnvelope`, `createReplayEnvelope`, `replayEnvelope`, `assertReplayCompatible`.
- Preserves: legacy `replayActions(caseDefinition, actions, seed?, truthVariantId?)` as a wrapper around a current-version envelope.

- [ ] **Step 1: Define the exact envelope**

```ts
export type ReplayEnvelope = Readonly<{
  caseId: string;
  caseVersion: string;
  rulesetId: string;
  rulesetVersion: string;
  seed: number;
  truthVariantId: TruthVariantId;
  actions: PlayerAction[];
}>;
```

- [ ] **Step 2: Write mismatch and repeatability tests**

```js
test("replay rejects an unknown ruleset version", () => {
  assert.throws(() => replayEnvelope(lacquerBoxCase, { ...validEnvelope, rulesetVersion: "9.9.9" }), /rulesetVersion/i);
});

test("the same envelope replays deeply equal", () => {
  assert.deepEqual(replayEnvelope(lacquerBoxCase, validEnvelope), replayEnvelope(lacquerBoxCase, validEnvelope));
});
```

- [ ] **Step 3: Implement fail-closed compatibility checks**

Validate case ID/version and ruleset ID/version before creating state. Do not fall back to current values and do not partially execute actions after a mismatch.

- [ ] **Step 4: Run replay and baseline gates**

```powershell
node --experimental-strip-types --test tests/replay-versioning.test.mjs tests/authority-baseline.test.mjs tests/rules.test.mjs
npx.cmd tsc --noEmit
```

- [ ] **Step 5: Conditional checkpoint commit**

```powershell
git diff --check
# Run only after separate user authorization:
git add -- '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/replay.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/types.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/replay-versioning.test.mjs'
git commit -m 'feat: add versioned deterministic replay envelopes'
```

**Stop:** A mismatched replay executes, or identical envelopes differ.

---

### Task 13: Phase 5 — Separate player and developer projections

**Files:**
- Create: `prototype/game/projections.ts`
- Modify: `prototype/hifi/presentation.ts`
- Modify: `prototype/hifi/HighFidelityApp.tsx`
- Modify: `prototype/app/page.tsx`
- Create: `prototype/tests/projections.test.mjs`
- Modify: `prototype/tests/hifi-presentation.test.mjs`

**Interfaces:**
- Produces: `DeveloperProjection`, `buildDeveloperProjection(caseDefinition, state)`.
- Extends: `PlayerPresentation` with every value rendered in player surfaces; render code no longer reads hidden state directly.

The render-safe boundary is explicit:

```ts
export type PlayerProjection = Readonly<{
  status: CaseStatus;
  currentPrice: number;
  actionPoints: number;
  negotiationRemaining: number | null;
  atmosphere: NpcAtmospherePresentation;
  resources: PlayerResourcePresentation;
  evidence: EvidenceDisclosurePresentation;
  lastTurn: PlayerTurnSummary | null;
  settlement: PlayerSettlementCard | null;
}>;

export type DeveloperProjection = Readonly<{
  caseId: string;
  caseVersion: string;
  rulesetId: string;
  rulesetVersion: string;
  npcState: NPCState;
  npcPosterior: PosteriorEntry[];
  actionHistory: TurnRecord[];
  truth: TruthVariant | null;
  lastTrace: CalculationTrace | null;
}>;
```

- [ ] **Step 1: Write pre-settlement leakage tests**

```js
test("player projection has no truth, exact NPC state, posterior or formulas before settlement", () => {
  const projection = buildPlayerPresentation(lacquerBoxCase, createInitialWorldState(lacquerBoxCase));
  const serialized = JSON.stringify(projection);
  for (const forbidden of ["truthVariantId", "npcState", "npcPosterior", "formulaLog", "trueValue"]) {
    assert.doesNotMatch(serialized, new RegExp(forbidden));
  }
});

test("developer projection carries identity and audit data without mutating state", () => {
  const state = createInitialWorldState(lacquerBoxCase);
  const before = structuredClone(state);
  const projection = buildDeveloperProjection(lacquerBoxCase, state);
  assert.equal(projection.rulesetVersion, "2.0.0-alpha.1");
  assert.deepEqual(state, before);
});
```

- [ ] **Step 2: Implement developer projection as a deep read-only copy**

Return rules/case identity, exact NPC state, both posteriors, truth only when `status === "settled"`, action history and the last trace. Do not return the mutable `WorldState` object itself.

- [ ] **Step 3: Route rendered UI through the correct projection**

At component boundaries build:

```ts
const player = buildPlayerPresentation(lacquerBoxCase, world);
const developer = buildDeveloperProjection(lacquerBoxCase, world);
```

Player cards use `player`; developer rail uses `developer`; event handlers may keep `world` only to dispatch a typed `PlayerAction`. No component directly assigns rule fields.

- [ ] **Step 4: Run projection, accessibility and flow gates**

```powershell
node --experimental-strip-types --test tests/projections.test.mjs tests/hifi-presentation.test.mjs tests/hifi-flow.test.mjs tests/hifi-accessibility.test.mjs tests/authority-baseline.test.mjs
npx.cmd tsc --noEmit
```

- [ ] **Step 5: Conditional checkpoint commit**

```powershell
git diff --check
# Run only after separate user authorization:
git add -- '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/projections.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/presentation.ts' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/HighFidelityApp.tsx' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/app/page.tsx' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/projections.test.mjs' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-presentation.test.mjs'
git commit -m 'refactor: enforce player and developer projections'
```

**Stop:** Player projection leaks exact/hidden data, or developer projection becomes an input to rules.

---

### Task 14: Phase 5 — Embed deterministic V2 provenance without touching V1

**Files:**
- Modify: `prototype/generate-hifi.mjs`
- Modify: `prototype/package.json`
- Modify: `prototype/tests/hifi-html.test.mjs`
- Modify: `prototype/tests/v2-boundaries.test.mjs`
- Modify: `release/v2-development.json`
- Regenerate: `prototype/public/掌眼_V2_高保真演示.html`

**Interfaces:**
- Produces: `<script id="zhangyan-build-provenance" type="application/json">` containing ruleset/case identity, source commit and source-tree status.

- [ ] **Step 1: Write provenance tests**

```js
test("V2 artifact embeds exact rules and source provenance", async () => {
  const html = await readFile(v2HtmlUrl, "utf8");
  const match = html.match(/<script id="zhangyan-build-provenance" type="application\/json">([^<]+)<\/script>/);
  assert.ok(match);
  const provenance = JSON.parse(match[1]);
  assert.equal(provenance.rulesetId, "zhangyan-core");
  assert.equal(provenance.rulesetVersion, "2.0.0-alpha.1");
  assert.equal(provenance.caseId, "lacquer-box-001");
  assert.equal(provenance.caseVersion, "1.0.0");
  assert.match(provenance.sourceCommit, /^[0-9a-f]{40}$/);
  assert.match(provenance.sourceTreeStatus, /^(clean|dirty)$/);
});
```

- [ ] **Step 2: Import identity under Node type stripping**

Change the script to `node --experimental-strip-types generate-hifi.mjs`. Import `DEFAULT_RULESET_IDENTITY` and `lacquerBoxCase`. Obtain the base commit and product-tree status with:

```js
import { execFileSync } from "node:child_process";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const productRelativePath = "掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype";
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: repositoryRoot,
  encoding: "utf8",
}).trim();
const productStatus = execFileSync(
  "git",
  ["status", "--porcelain", "--untracked-files=all", "--", productRelativePath],
  { cwd: repositoryRoot, encoding: "utf8" },
).trim();
const sourceTreeStatus = productStatus === "" ? "clean" : "dirty";
```

Do not record wall-clock build time.

Update `release/v2-development.json` with:

```json
"identity": {
  "rulesetId": "zhangyan-core",
  "rulesetVersion": "2.0.0-alpha.1",
  "caseId": "lacquer-box-001",
  "caseVersion": "1.0.0"
}
```

- [ ] **Step 3: Inject escaped JSON before `</head>`**

```js
const provenanceJson = JSON.stringify(provenance).replaceAll("</script", "<\\/script");
html = html.replace(
  "</head>",
  `<script id="zhangyan-build-provenance" type="application/json">${provenanceJson}</script></head>`,
);
```

- [ ] **Step 4: Regenerate and verify both identities**

```powershell
npm.cmd run build:hifi
node --experimental-strip-types --test tests/hifi-html.test.mjs tests/v2-boundaries.test.mjs tests/v1-release-contract.test.mjs
Get-FileHash -Algorithm SHA256 -LiteralPath 'public/掌眼_高保真教师演示.html'
```

Expected: V2 provenance PASS; V1 remains `8B46...925B`.

- [ ] **Step 5: Portfolio milestone reminder and conditional commit**

Recommend saving one final V2 result capture only after browser verification, together with ruleset version and commit/provenance. Do not add raw build files to the school PDF asset set.

```powershell
git diff --check
# Run only after separate user authorization:
git add -- '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/generate-hifi.mjs' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/package.json' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-html.test.mjs' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/v2-boundaries.test.mjs' '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_V2_高保真演示.html' 'release/v2-development.json'
git commit -m 'feat: embed V2 rules provenance'
```

**Stop:** Provenance claims a clean tree when dirty, contains a non-commit sentinel value, introduces wall-clock nondeterminism, or changes V1.

---

### Task 15: Phase 6 — Authority audit, full verification and project handoff

**Files:**
- Modify: `docs/project/01-SYSTEM-MAP.md`
- Modify: `docs/project/02-CURRENT-STATE.md`
- Modify: `docs/project/03-NEXT-ACTIONS.md`
- Create: `docs/project/evidence/EXP-020-v2-numeric-authority-implementation.md`
- Modify only if findings require it: production modules/tests from Tasks 1–14.

**Interfaces:**
- Consumes: all task outputs and Material verification contract.
- Produces: implemented/verified boundary, residual-risk record and next evidence gate.

- [ ] **Step 1: Run static authority scans**

```powershell
$root='掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype'
rg -n 'function seededUnit|const gradeOrder|reservationPrice|Math\.random\(|Date\.now\(' "$root/game" "$root/hifi" "$root/app" "$root/content"
rg -n 'boardgame\.io|yuka|inkjs|open_spiel' "$root/package.json" "$root/game" "$root/hifi" "$root/app"
```

Expected: no active production duplicate/forbidden dependency. Matches inside frozen `standalone/`, V1 HTML, numeric lab or tests are allowed only when their identity is explicit and recorded.

- [ ] **Step 2: Run the complete fresh verification suite**

```powershell
Set-Location '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype'
npm.cmd test
npx.cmd tsc --noEmit
npm.cmd run lint
node --experimental-strip-types --test tests/authority-baseline.test.mjs tests/replay-versioning.test.mjs tests/projections.test.mjs tests/v2-boundaries.test.mjs
Get-FileHash -Algorithm SHA256 -LiteralPath 'public/掌眼_高保真教师演示.html'
```

Expected: all commands exit `0`; baseline exact; V1 SHA exact. Record actual test count rather than assuming `81/81`.

- [ ] **Step 3: Run real-browser regression on the V2 artifact**

Use the existing browser verification workflow at `1440 × 1000` and `390 × 844`:

1. inspect `joint` and disclose `modern-adhesive-trace`;
2. observe public repricing `80 → 65`;
3. offer `50`, observe counter `58`, then buy;
4. verify objective result and judgment grade render separately;
5. verify desktop developer rail shows exact state/trace while mobile has no rail;
6. verify no horizontal overflow and console `0 errors / 0 warnings`.

This is a UI regression, not user aesthetic acceptance or gameplay balance evidence.

- [ ] **Step 4: Obtain an independent read-only review**

Ask an independent reviewer to inspect only the approved spec, plan, final diff, tests and generated provenance. The reviewer must not edit files and must report: hidden second authorities, truth leaks, unprotected V1 surfaces, replay/version gaps, missing test layers and unsupported completion claims. Main-agent checks are not labeled independent QA.

- [ ] **Step 5: Fix only evidence-backed defects and rerun affected gates**

For every review finding, record accepted/rejected/deferred with file/line evidence. Any fix reruns its focused test, baseline, TypeScript, lint and V1 hash gate. Do not widen into balance tuning or a new dependency.

- [ ] **Step 6: Write EXP-020 and close the ledger honestly**

`EXP-020` must contain:

- authorization and exact changed/preserved surfaces;
- task/phase checkpoints and any stopped/retried runs using append-only supersession;
- actual commands, exit codes, test counts, hashes and browser scenarios;
- implemented vs verified vs not verified;
- independent review provenance;
- residual risks: balance, general-player comprehension, real WeChat, deployment and final portfolio aesthetics;
- trigger for the deferred Critical “客观收益与结算评分关系” verification.

Update SYSTEM-MAP to the new module flow; mark the workstream Completed only if all engineering criteria pass. NEXT-ACTIONS must recommend the smallest next evidence gate, not automatically choose balance, player testing or narrative adapter.

- [ ] **Step 7: Run project memory and repository checks**

```powershell
Set-Location 'D:\实习工作\掌眼\.worktrees\v2-bootstrap'
python 'C:/Users/ASUS/.agents/skills/project-co-leader-v2/scripts/check_project_memory.py' --root .
git diff --check
git status --short
git diff --cached --name-only
```

Expected: project memory `0 errors / 0 warnings`; no unintended staged files.

- [ ] **Step 8: Final portfolio/backup reminder**

Tell the user this is a major authority migration checkpoint. Recommend: one final V2 outcome screenshot, one dual-posterior/disclosure architecture diagram, one NPC spindle diagram, one concise “V1 duplicate authority → V2 versioned core” comparison, and an incremental backup/restore check. Avoid adding internal task slices or failed intermediate UI to the final Figma/PDF unless they explain a decisive design change.

- [ ] **Step 9: Conditional final commit**

```powershell
# Run only after separate user authorization and after reviewing this exact allowlist:
$authorityFiles = @(
  'docs/project/01-SYSTEM-MAP.md',
  'docs/project/02-CURRENT-STATE.md',
  'docs/project/03-NEXT-ACTIONS.md',
  'docs/project/evidence/EXP-020-v2-numeric-authority-implementation.md',
  'release/v2-development.json',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/AGENTS.md',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/README.md',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/package.json',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/content/lacquer-box.ts',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/generate-hifi.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/generate-standalone.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/public/掌眼_V2_高保真演示.html',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/types.ts',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/ruleset.ts',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/numeric.ts',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/random.ts',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/belief.ts',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/disclosure.ts',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/storylets.ts',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/npc-decision.ts',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/negotiation.ts',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/settlement.ts',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/reducer.ts',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/replay.ts',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/projections.ts',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/HighFidelityApp.tsx',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/hifi/presentation.ts',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/app/page.tsx',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/scripts/capture-authority-baseline.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/helpers/authority-scenarios.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/fixtures/v2-numeric-authority-baseline.json',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/v2-boundaries.test.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-html.test.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/standalone-html.test.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/v1-release-contract.test.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/authority-baseline.test.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/ruleset-contract.test.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/numeric-random.test.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/belief.test.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/disclosure.test.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/storylets.test.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/npc-decision.test.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/negotiation-authority.test.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/settlement-authority.test.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/reducer-contract.test.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/replay-versioning.test.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/projections.test.mjs',
  '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-presentation.test.mjs'
)
git add -- $authorityFiles
git commit -m 'refactor: unify V2 numeric authority'
```

Do not include unrelated portfolio preservation files, original-worktree assets or pre-existing untracked records merely because they are present.

**Completion claim:** “统一数值权威源已实现并通过列明的代码一致性、固定设计例证、回放、投影、构建和浏览器回归验证。” It must still say that balance, general-player comprehension, real WeChat deployment and portfolio acceptance are unverified.

---

## Phase Rollback and Stop Matrix

| Phase | Changed surface | Preserved surface | Required evidence | Stop/rollback trigger |
|---|---|---|---|---|
| 0 | nested governance, generators, V2 artifact/manifest, boundary tests | V1 HTML/tag/release, legacy HTML/client | V1 hash, fail-closed generator, V2 distinct path | any V1 byte change or legacy write |
| 1 | baseline fixture, identity fields, ruleset contract | gameplay semantics | 10-scenario exact diff, identity tests | unexplained semantic diff or silent version fallback |
| 2 | numeric/random/belief modules | keys, coefficients, posterior results | seeded exact values, normalization, truth isolation | posterior/price/action drift |
| 3 | disclosure, Storylet, NPC decision modules | evidence truth, existing lines/trace | framing separation, one-shot, hard-filter/tie tests | truth/private leak or illegal candidate wins |
| 4 | pricing/negotiation/settlement and UI imports | AP/capacity split, objective/judgment split | pricing isolation, no grade/formula copies, no deadlock | UI authority or settlement cross-contamination |
| 5 | reducer, replay, projections, provenance | public compatibility, V1 identity | purity, deep replay, leakage, provenance | mismatch executes, input mutates, V1 changes |
| 6 | evidence and project memory | all preserved surfaces | full suite, browser, independent review, checker | any unresolved second authority or unsupported claim |

Each rollback reverts only the current Phase V2 change set. If Git commits are not authorized, use the task allowlist plus `git diff -- <paths>` to construct a reviewed inverse patch; never use `git reset --hard` or broad checkout.

## Execution Order and Review Gates

Tasks are sequential. Task 1 must pass before any full build/test. Task 2 baseline must freeze before Tasks 3–14. After Tasks 5, 8, 10 and 14, pause for a short reviewer gate because each completes a portfolio-relevant architecture boundary. Task 15 cannot claim completion until fresh full verification and independent read-only review both finish.

The plan authorizes no product implementation by itself. Execution begins only after the user chooses an execution mode and explicitly approves implementation under this plan. Git commits remain a separate authorization even after implementation approval.
