# Architecture / Design Challenge: 必检 run 失败后的可审计重试语义

Status: Resolved

日期：2026-08-09

## 观察

`V2-PORTFOLIO-001` 的 `RUN-DOCX-01` 已真实失败并必须保留。当前 validator 同时要求 run ID 唯一、close 时存在固定 `RUN-DOCX-01`，并把每一条历史非 PASS run 永久计入 blocking。于是未来即使取得成功页面证据，也无法在不删除或改写失败历史的前提下解除阻塞。

## 受影响的现有决定

- 已批准的 V1 基线与作品集原始证据保全规格/计划；
- `V2-PORTFOLIO-001` 的追加式 `verification-runs.jsonl` 与 Critical 完成证据边界；
- Task 4 到 Task 5 的进入门。

## 证据

- `scripts/portfolio-evidence/verify-register.mjs`：重复 `runId` 报错；任何 `status !== PASS` 的 run 都增加 blocking；close 依赖固定 required run ID；
- `RUN-DOCX-01`：`FAIL` / exit `124`，现场 `0` PDF、`0` PNG；
- Task 4 新鲜独立 QA：P2，确认追加 `RUN-DOCX-02 PASS` 仍无法解除旧失败，复用 `RUN-DOCX-01` 又违反唯一性；
- 计划明确要求失败 run 保留并阻止关闭，但未定义何时、如何由后续成功证据接替其 active 状态。

## 不处理的后果

即使 DOCX 渲染环境修复且逐页 QA 全部通过，workstream 仍无法合法 close；执行者只能覆盖历史失败、删除失败行或降低 validator 标准，三者都破坏已经批准的可审计边界。

## 可选方案

1. **追加式 supersession（推荐）**：新 run 使用新 ID（例如 `RUN-DOCX-02`）并声明 `supersedesRunId: RUN-DOCX-01`。Validator 要求目标存在、发生在同一 gate、时间/引用有效、链无环且无分叉；历史 run 永久保留，但每条 required-run 链只有唯一 active leaf，只有 active leaf 的状态参与 blocking。补齐 missing target、跨 gate、环、分叉、active FAIL、active PASS 与双向 refs 的回归测试。
2. **原地替换固定 run**：成功后把 `RUN-DOCX-01` 改写为 PASS，把失败历史只留在 Task 4 report/EXP-018。改动小，但与“失败 run 保留”的批准语义冲突，也削弱机器可审计历史。
3. **不允许重试**：保持现状并永久终止该保全工作流。证据最保守，但无法完成已批准方案，且没有产品价值收益。

## 推荐

采用方案 1。它保留真实失败、允许后续成功成为唯一 active 证据，并能推广到其他必检门；实现仅修改保全 validator、测试和对应规格/计划，不修改 V1/V2 产品代码。应先写失败反例，再实现最小通用语义，并由新鲜独立 QA 复核。

## 需要用户拍板的问题

是否批准方案 1：为 `verification-runs.jsonl` 与 validator 增加追加式 `supersedesRunId` / active-leaf 语义，保留 `RUN-DOCX-01 FAIL`，未来以新 run ID 记录成功重试？

## 解决结果

2026-08-09：用户明确批准推荐方案 1。Validator 已按测试先行实现；完整回归 `59/59 PASS`。`RUN-DOCX-01 FAIL` 保留，`RUN-DOCX-02 PASS` 以同 gate、同资产集、较晚时间合法接续，draft validator 的 `blockingFailureCount` 为 `0`。新鲜独立 QA 重新执行语法、完整测试、run/ledger/hash/page/product 边界检查后给出 `pass-with-known-risk`，无 P0–P2；本 Challenge 关闭。
