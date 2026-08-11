# Architecture / Design Challenge: Task 10 结算权威与展示边界冲突

Status: Resolved

日期：2026-08-10

## 观察

Task 10 commit `568ac1d` 已把结算编排集中到 `settlement.ts`，指定门禁 `54/54 PASS` 且 TypeScript 通过；独立任务复核仍给出三项 Important：

1. `calculateJudgmentQuality` 继续接收完整 `CaseDefinition`，类型上仍可读取隐藏 `truthVariants`，因此“判断质量只读玩家可见信息”没有形成能力边界；
2. `judgment-quality.ts` 仍保留一份等级顺序数组，未消费 `outcome-grades.ts` 的 `GRADE_ORDER`；
3. 新 `settlement.ts` 包含结果标签与审计公式文字，而计划同时要求不要把 display labels/CSS 移入规则模块。

前两项要修复必须修改原 Task 10 白名单外的 `prototype/game/judgment-quality.ts`；第三项存在领域结果语义与展示投影边界的解释冲突。

## 受影响的现有决定

- 已批准的 V2 统一数值权威源书面规格与 15 任务实施计划；
- Task 10 的五文件白名单和按任务本地 commit 授权；
- “物品真相 / 玩家认知 / NPC 认知 / 交易 / 结算分层”与隐藏真相能力隔离；
- Task 11 纯 reducer 的进入门。

## 证据

- Task 10 implementer：commit `568ac1d`，指定门禁 `54/54 PASS`、`tsc --noEmit PASS`、fixture 未刷新；
- Task 10 独立复核：focused `3/3 PASS`、`git diff --check PASS`、`tsc --noEmit PASS`，但判定上述三项 Important；
- `prototype/game/settlement.ts` 的 judgment branch 调用仍传完整 `caseDefinition`；
- `prototype/game/judgment-quality.ts` 自有等级数组；
- `prototype/hifi/presentation.ts` 已拥有结算卡片布局与展示标签投影。

## 不处理的后果

Task 10 无法通过独立规格/质量门，Task 11 不能合法开始；若直接忽略，隐藏真相隔离与等级单一权威只靠开发者自律。若擅自扩大文件白名单，则越过用户批准的执行边界。

## 可选方案

1. **最小能力边界修复（推荐）**：允许 Task 10 修复轮额外修改 `prototype/game/judgment-quality.ts`。把 judgment 输入收窄为显式的判断模型、证据定义、后验、陈述与行动统计，不再接收完整 `CaseDefinition`；改用 canonical `GRADE_ORDER`。同时明确：`SettlementResult` 中的 outcome/choice/ending 标签与 formula 数组属于版本化领域结果和审计解释，不是 UI 布局/CSS；`presentation.ts` 仍独占卡片布局、显示分组和样式。保持 fixture 与现有产品语义不变。
2. **严格展示纯化**：除方案 1 外，重设计 `SettlementResult`，把所有面向玩家的标签/文案从规则状态移到 `presentation.ts`。这会扩大到公共类型、基线字段与 UI 投影，可能构成行为/回放契约变化，需要补充规格和重新批准基线变化，不能作为当前 Task 10 的小修完成。
3. **保持原白名单**：不修改 `judgment-quality.ts`，将三项 Important 保持开放并停止本实施计划；不能声称 Task 10 或统一数值权威源完成。

## 推荐

采用方案 1。它用最小新增文件建立真正的隐藏真相能力隔离和等级单一权威，同时保留已经通过基线的结算结果契约；把审计解释与 UI 布局明确分层，避免把一次重构升级为未批准的状态/回放格式改版。

## 需要用户拍板的问题

是否批准方案 1：将 `prototype/game/judgment-quality.ts` 加入 Task 10 修复白名单，并确认 `SettlementResult` 的结果标签/公式属于领域审计输出、UI 布局与样式仍由 `presentation.ts` 独占？

## 解决结果

2026-08-10：用户明确批准方案 1。Task 10 修复白名单增加 `prototype/game/judgment-quality.ts`；修复必须把 judgment 输入收窄为显式可见信息并改用 canonical `GRADE_ORDER`。同时确认 `SettlementResult` 的 outcome/choice/ending 标签与 formula 数组属于版本化领域结果和审计解释，UI 布局、显示分组与样式仍由 `presentation.ts` 独占；不启动方案 2 的状态/回放格式改版。完成修复与定向复核后关闭 Task 10 review gate。
