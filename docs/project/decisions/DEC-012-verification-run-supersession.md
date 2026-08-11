# DEC-012: 必检 run 使用追加式 supersession

Status: Active

日期：2026-08-09

## 当前决定

`verification-runs.jsonl` 的必检 run 采用追加式重试：失败记录永久保留；后续尝试使用新的稳定 `runId`，通过 `supersedesRunId` 指向同一 gate 的上一 active run。每条 required-run 链必须只有一个无环、无分叉的 active leaf；只有 active leaf 的状态参与 blocking。

## 背景和问题

`RUN-DOCX-01` 已真实失败。旧 validator 同时要求 run ID 唯一、close 使用固定 required run，并把所有历史非 PASS 永久计入 blocking，因此成功重试无法在保留失败历史的同时解除阻塞。

## 考虑过的替代方案

1. 原地覆盖 `RUN-DOCX-01`：简单，但丢失机器可审计的失败历史，并违反已批准的“失败 run 保留”边界。
2. 不允许重试：最保守，但会让已批准的保全工作流永久无法完成。
3. 追加式 `supersedesRunId` / active leaf：保留历史并允许唯一后继接替完成状态。

## 选择理由

用户明确批准方案 3。它同时满足历史真实性、稳定 ID、可恢复执行和 close 可判定性，并可通用于其他必检门。

## 影响范围

- `scripts/portfolio-evidence/verify-register.mjs` 与对应回归测试；
- 保全规格、计划、README 和 staging run schema；
- `RUN-DOCX-01 FAIL` 保留，成功重试使用新的 run ID；
- 不修改 V1/V2 产品代码、产品数值、Git 历史或公开材料。

## 当前信心

高；实现、对抗性回归、真实失败到成功的 active-leaf 接续和新鲜独立复审均已通过。

## 重新讨论触发条件

- supersession 需要跨 gate、分叉或撤销历史；
- active-leaf 判定无法保持确定性；
- close verifier 出现旧失败被错误忽略或多个成功 leaf 同时有效。

## 相关证据与记录

- [CH-003](../challenges/resolved/CH-003-verification-run-retry-semantics.md)
- [Task 4 独立审查](../../../.superpowers/sdd/2026-08-04-v1-portfolio-evidence-preservation/task-4-independent-review.md)
