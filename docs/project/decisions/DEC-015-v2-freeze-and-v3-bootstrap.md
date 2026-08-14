# DEC-015：冻结 V2 玩家试玩基线并从其启动 V3 设计阶段

Status: Active

日期：2026-08-14

## 决定

V2 以一个干净、经过新鲜验证的本地提交结束，并用 annotated tag `v2.0.0-player-prototype-freeze` 标记。V3 从该标签建立独立分支 `codex/v3-object-truth-topology` 和独立工作树，不从未提交目录副本或移动中的分支名冒充冻结基线。

V2 的终点定义为：**可运行、可回放、采用单一数值权威并具备第一批手机“人与物同屏”展示壳的玩家试玩底座。** 它没有实现真正的物品真相拓扑、玩家推理工作台、双方人物认知、连续 NPC、D20 或长期平衡。

V3 首次提交只建立项目权威记录并迁入带来源与哈希的设计证据。所有拓扑、数值终局和作品集叙事在被新的 V3 Decision 明确采用前均为 `Draft` 或 `Evidence`，不得写成已批准规格、已实现能力或已验证成果。

## 为什么这样做

- Git commit 才能准确重现工作树内容；未暂存与未跟踪文件不属于当前 HEAD；
- annotated tag 适合给不再移动的版本节点赋予发布／冻结身份；
- branch 会继续向前移动，负责 V3 演进，不承担 V2 永久冻结证明；
- 独立 worktree 让 V2 保持可查看、可复验，同时不把 V3 设计写回 V2 历史。

## 调查结论

- **Adopt：** 干净 commit＋annotated tag 冻结 V2；从 tag 建 V3 branch/worktree；
- **Borrow：** 借用稳定标签与持续开发分支分工，不照搬大型项目完整 release train；
- **Reject：** 给脏工作树的旧 HEAD 打标签、用目录副本或分支名冒充冻结、把已提交 Draft 当批准规格；
- **Unknown：** 是否未来创建远程 release、签名标签或 tag 保护；当前无 remote，也没有公开发布授权。

依据：[Git 记录变更](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository.html)、[Git tag](https://git-scm.com/docs/git-tag.html)、[Git branch](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell.html)、[Git worktree](https://git-scm.com/docs/git-worktree.html) 与 [Git status](https://git-scm.com/docs/git-status.html)。

## V2 冻结边界

冻结提交允许包含：

- 已完成的 Project Co-leader V2 `2.3`／`2.4` 治理与项目配置同步；
- 双向认知边界、NPC 混合行为架构和调查门证据；
- 人类可读 overview 与一张轻量候选作品集过程卡；
- 本决定、冻结证据和 V2 终态投影。

冻结提交不得包含：

- 产品源码、案例数值、玩家／教师 HTML 或 V1 冻结资产的新增差异；
- 外部 V3 暂存中的具体拓扑设计正文或用户批注图片；
- 推送、部署、公开 release、依赖安装或 Superpowers 调用。

## V3 继承规则

V2 的实现、Decision 和 Evidence 都是 V3 的历史输入，不自动成为 V3 当前规格。V3 必须逐项说明 `Adopt / Borrow / Reject / Unknown`，尤其包括 DEC-013 的估值与双轨评分，以及 DEC-014 中尚未实现的证据图、人物认知、D20 与议价方向。

启动 V3 不等于批准第一种拓扑、节点语义、经济终局、高估惩罚或 `2026-08-26` 交付细节；这些仍需在 V3 经过决策前调查门和用户确认。

## 验证要求

- 冻结前重跑完整自动测试、TypeScript 与 lint；
- 项目记忆、相对链接、代码围栏、Mermaid 静态结构和 `git diff --check` 通过；
- V1 canonical 哈希不变，V2 玩家 HTML 与冻结前产品基线无差异；
- 提交范围只含批准文档，提交后 V2 工作树干净；
- 标签目标可解析到唯一冻结提交且为 annotated tag；
- V3 证据迁入逐文件保留 SHA-256，V3 首次提交相对 V2 标签的产品 diff 为 `0`。

这些验证不证明数值平衡、文化准确性、真人趣味、视觉批准、微信内实机或公开发布可用。

## 重新讨论触发条件

- 冻结后发现 V2 产品字节或 V1 canonical 漂移；
- 需要修复 V2 的阻断性回归；
- V3 文档把 Draft／Evidence 误写成 Approved／Implemented／Verified；
- 用户决定公开发布、推送标签、签名或保护远程 tag。

## 相关记录

- [DEC-013：V2 独立玩家试玩版与双轨结算](DEC-013-v2-player-trial-and-dual-track-scoring.md)
- [DEC-014：人与物双重鉴定、证据拓扑与洞察附加层](DEC-014-human-object-dual-appraisal.md)
- [EXP-027：双向认知边界与 NPC 混合行为架构转折](../evidence/EXP-027-bidirectional-cognition-design-turning-point.md)
- [EXP-028：Project Co-leader V2 决策前调查门禁](../evidence/EXP-028-project-co-leader-research-before-decision-gate.md)
- [EXP-029：V2 玩家试玩原型冻结](../evidence/EXP-029-v2-player-prototype-freeze.md)
