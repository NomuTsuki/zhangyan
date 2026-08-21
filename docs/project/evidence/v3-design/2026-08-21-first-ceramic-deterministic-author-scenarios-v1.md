# 第一器物确定性作者侧场景演算 v1

Status: Independent structural/deterministic Pass / Pre-product only

日期：2026-08-21
运行时：Node `v24.15.0`

## 目的

本记录封存 v0.3 档案关系轴与领域能力收窄后的隔离演算。它回答的是：固定作者合同在声明场景、换序、冲突与反例下是否产生一致的结构后果。

它不回答实物检测是否可达、具名专家是否签字、路线成本是否非支配、玩家是否理解、游戏是否好玩、数值是否平衡，也不构成正式产品架构或产品代码开工许可。

## 冻结输入

Manifest 的当前解释优先级为：v0.3 在档案、领域能力和具体路线主题上覆盖 v0.2／v0.1；未点名的 v0.2 不变量继续继承。`manifest.json` 中 6 个来源在负责人和独立复核者处均为 `6/6` SHA-256 匹配。

| 输入 | SHA-256 |
|---|---|
| 三档作者模型 v0.3 | `F1D9A2B3C7CA4265049A8A3D0A991806A6E886D11C00FA3418F9E916F244DD03` |
| 具体一局 v0.1 | `D184168F6193268563184FA5EE374C9FFC5F0DDBEF3CE2FE0C80B2AAE94343B3` |
| 限定领域复核闭环 v0 | `1FD21487059B52D51A395C08D82D2AF3BC21ADE84500827EC9E4F4EE0F3E3E08` |

完整继承来源、历史复核输入及其哈希见[夹具 manifest](validation/first-ceramic-author-scenarios-v0/manifest.json)。

## 最终六文件哈希

| 文件 | SHA-256 |
|---|---|
| `solver.mjs` | `E217CAF56A9961EA7C46151E1CA6B0546A6C408CCC8ECDDB21E4B9DA66EE72D1` |
| `fixtures.mjs` | `B3ED4F357B8FB84EAAB4F14CAF4629E62BF11F9C44BEFA5AAD6730C3393E0FDD` |
| `golden.mjs` | `6814029A5C85B17719D1F8761C1F86DED5A5E2606F618F353F08F7AB798422BB` |
| `contract.test.mjs` | `F5E9550DC5FA6BF7FA7DB875F67BE32EFA5B465F747F931EA65C021E887B83FB` |
| `README.md` | `D4FFE289765B3F2E0D4CDC243E4F2FD2F03A89523052C877B2E4BD926DB3CE08` |
| `manifest.json` | `66C8A51637BE14460AAE3EBA2E28DEBB9CD1CA7DB5B8AC7A53D180ACEFEDBBCB` |

负责人和独立复核者分别重算行为版本，均为 `6/6` 匹配；独立复核运行后哈希未变化。Pass 记录写入项目状态后，v0.3 只修改首行状态为“Independent Pass／用户批准待定”，并同步 manifest 来源哈希；规则正文、求解器、夹具、golden、合同测试和 README 均未改变。同一复核者通过反向替换该单行分别重建出旧 v0.3 哈希 `71C8608C...78D2C` 与旧 manifest 哈希 `6CF81D7B...02626`，确认只有两处预期字节变化；最终 4/4 语法检查、`40/40` 与六来源哈希再次通过，Verdict 仍为 **Pass**。复核指出的唯一 Low 导航标签随后已机械修正为“用户批准作者规格／当前下一门”。

## 保留的失败史

### 首轮独立复核：Fail

负责人初始版本为 4/4 `node --check`、`38/38` 测试绿灯。临时只读独立复核者没有接受该绿灯，另行加入冲突探针后发现：

- 规格允许 T2／T3 的记录内部、记录—现器、事件—物证六个关系槽进入 `contested`，实现却只有 T2 对象归属槽真正读取争议；
- 其余五槽即使正证与冲突同时存在，系统仍可能错误建立 G2／G3 主张；
- T1／T2／T3 时间顺序只有正向标签，没有显式顺序冲突探针；
- `01-SYSTEM-MAP.md` 仍残留“v0.2 是当前候选／限定领域复核尚未启动”的旧状态。

首轮 Verdict 为 **Fail**。这证明负责人绿灯没有独立性，也证明另写 golden 仍可能与求解器共同遗漏同一状态维度。

### 修复后的首轮负责人运行：39/40

负责人补齐六槽争议优先、时间顺序冲突和导航后，第一次运行新增测试全部通过，但 golden 仍保存 T2 对象归属争议事件的旧 `dependencyUnitId`，使全套为 `39 pass / 1 fail`。失败输出明确指向预言机元数据差异；修正该一项明确合同名称后才再次运行。

该 `39/40` 原始标准输出只由负责人现场观察，未另存原始日志文件；独立复核者明确把它列为 owner-supplied provenance，没有把它冒充独立复现。

## 最终负责人验证

在夹具目录运行：

```powershell
node --check .\solver.mjs
node --check .\fixtures.mjs
node --check .\golden.mjs
node --check .\contract.test.mjs
node --test .\contract.test.mjs
```

观察结果：

- 4/4 JavaScript 语法检查通过；
- `40 tests / 40 pass / 0 fail / exit 0`；
- 24 个场景；
- 35 条已声明合法顺序；
- 324 个联合作者状态；
- 24 × 324 = `7,776` 个场景 golden cells；
- 任务相关本地链接与行尾检查通过，`git diff --check` 通过；
- 工作树变化仍只位于 `docs/`、`AGENTS.md` 与 `CONTEXT.md`，Git 暂存区为 0，没有产品代码路径进入本轮。

## 独立复查

同一名临时只读复核者对最终六哈希重新开始一轮只读复查，执行并确认：

- 最终六文件哈希 `6/6`；
- manifest 来源哈希 `6/6`；
- 4/4 `node --check`；
- `40/40` 测试，0 失败；
- 24 个场景、35 条声明顺序、7,776 个场景 golden cells；
- 六个 T2／T3 关系槽均为冲突优先，正证与冲突并存不能升格；
- 冲突事件不能绕过 action／method／fact authority 或依赖完整性；
- 冲突先于正证与正证先于冲突得到相同完整快照：T2 冲突回到 G1，T3 冲突回到 G2；
- 三阶段时间冲突阻断 G3 但保留 G2；
- golden 不导入求解器／夹具，没有写入、参数驱动更新或 accept 路径；
- 既有换序、同源折叠、阴性／反证、边际拼接、答案键、档案 OR、纯物证路线、STOP、领域能力和 G3 未知攻击保持通过；
- 运行后哈希未变化，没有文件或 Git 写入。

Findings：None in repaired scope。
Verdict：**Pass**。

## Pass 的精确含义

本次 Pass 支持以下完成声明：v0.3 固定作者合同在当前隔离求解器、24 个声明场景、35 条声明顺序、六槽冲突、时间冲突和既有攻击探针下，已经由负责人执行并由临时只读复核者独立重放，结构后果一致。

它不支持以下声明：

- 35 条之外的所有可能顺序已被穷举；
- golden 独立覆盖完整诊断 `marginals`／`evidence` 元数据；
- 非因子冲突的依赖标签已经成为通用生产 schema 不变量；
- 实物可达性、具名外部专家、成本／路线非支配、玩家理解、UI、趣味、平衡或正式数值已经通过；
- V3 产品代码已经实现、可合并、可部署或获准开工。

夹具仍处于未跟踪的脏工作树，缺少 Git provenance；本轮没有取得暂存、提交、推送或发布授权。

## 下一道门

作者侧结构与限定领域映射现可进入阶段交接，由用户批准或重开作者纸面规格。只有用户批准该作者体验与边界后，才可按 DEC-023 进入玩家知识工作台微循环；该批准仍不授权正式产品代码。
