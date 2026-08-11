# Next Actions

> 推荐能够以较低成本减少最大重要未知、风险或阻塞的行动，而不是机械维护功能清单。

更新时间：2026-08-11

## 当前检查点

- V1 已冻结在提交 `f0b20b8` 与 annotated tag `v1.0.0-teacher-handoff`；
- V2 位于独立分支/worktree，启动只读审查已经完成，结论为“有条件通过”；
- V1 冻结资产未变化；V2 统一数值权威迁移、Task 15、最终修复波与 scoped re-review 已完成。四项 Important finding 已在 `7949cf1` 修复，独立复审为 `0 Critical / 0 Important / 0 Minor`，完整自动回归为 `142/142 PASS`；既有浏览器 action chain/截图由 implementation owner 产生，本次 scoped re-review 未独立重跑；
- 原工作区 31 项、恢复点、教师交付包和浏览器证据均保持在原位置；
- `V2-PORTFOLIO-001` 已完成：独立 QA、cross-cutting gates、一次性文本冻结、18 项 checksum、双 close、最终仓库/项目记忆门和精确 staging 清理均通过；
- `V2-RESEARCH-001` 已完成：比较 boardgame.io、ink/inkjs、Yuka 与 OpenSpiel；未安装依赖、未复制代码、未修改产品；
- 用户已批准 15 任务计划、选择 Subagent-Driven，并授权按任务白名单创建本地 commits；15 项任务、最终修复波和独立只读 re-review 均已闭环。分支仍未 push、merge 或 deploy。
- `V2-PLAYER-TRIAL-001` 已完成：独立玩家单文件、三案例、稳定局号、提交鉴定和双轨评分已实现；完整自动验证 `170/170 PASS`，两目标视口无横向溢出且控制台 0/0；该验证不是文化、平衡或真人体验结论。
- `V2-HUMAN-OBJECT-REDESIGN-001` 已完成第一批产品切片：漆器 `390×844` 人物／器物同屏、占位立绘、漫画气泡、行动模式、只读案卷和终局回复停留已实现；`176/176` 自动回归和真实 Chrome 状态链通过，独立只读 QA 为 `pass-with-known-risk`、`0 Critical / 0 Important / 0 Minor`。用户已决定暂不继续打磨画面，该工作流结构化停放，不外推为审美或真人体验批准。
- 当前转向 `V2-NUMERIC-SYSTEM-ORIENTATION-001`：已保存工作树锚点与五个 HTML 身份清单，并从现行 `content/ + game/` 形成自然语言数值地图；本批次只读，没有改数值、安装解释工具或执行 Git 写操作。
- 用户已批准把此前全部未提交内容收录进本地提交“研究数值系统前的快照”；当前玩家 HTML、玩家源码目录与 `generate-player.mjs` 随该提交成为可从 Git 恢复的资产。仍没有独立 player release manifest，且该提交未 push、merge 或部署。

## 推荐主路径

1. 用户先阅读 [EXP-026](evidence/EXP-026-current-numeric-system-atlas.md) 的自然语言架构、行动影响和风险清单；后续所有数值讨论都从现行 `content/ + game/` 出发，不再从旧数值实验台反推规则；
2. 默认先用现有 Codex／Project Co-Leader 生成中文解释，不安装第三方工具。若用户希望获得可长期浏览的知识图谱，再单独审批一个限定目录、不开自动更新、不上传仓库的 Understand Anything 试点；
3. 第一项建议规格化的问题是“NPC 实际议价与 N 分可见解释模型的一致性”：同时处理“不急出售”被误判为急售、买断／离场报价漏出 N、D 把购买尝试改写成拒绝，以及普通还价绕过 `priceTick`；在用户批准语义前不修代码；
4. 该批闭环后，再依次审计旧评分／Q20 残余消费面、证据相关性重复计权、NPC 未生效字段、询问与细看的职责分配，以及三案件数值骨架差异；
5. 规则语义稳定后才进入批量种子、支配策略和“客观收益与能力评分关系”的 Critical 平衡验证；文化专家校订安排在正式平衡前；
6. 视觉切片保持停放；后续仍按 milestone／1—2 周／重大迁移／最终 PDF 触发点做轻量素材整理、备份与复查，只保留关键设计转折和成果截图。

## 已停放视觉批次的自动门（保留为历史检查点）

- 产品改动只落在漆器手机场景与共享展示外壳；16 个内容／规则保留文件前后 SHA-256 一致；
- `390×844` 首屏同时看见器物、NPC 和当前人物回复；议价页 NPC 不消失，拒绝／还价／接受都有占位人物气泡；
- 人物入口不再渲染卖家事实摘要或实时接受概率，也不读取 `publicTraits` 驱动画面；
- `细看／询问`是行动模式，案卷只读且可关闭返回，形成判断是独立提交；
- TypeScript、HTML 构建与完整 `176/176` 自动回归通过；Chrome 手机／桌面无横向溢出且 console 0/0；
- 这些证据不等于用户视觉批准。该批次当前保持停放，没有提前实现证据拓扑、8 AP、D20、受控误导、察人分或书画／瓷器内容迁移；视觉确认不再是只读数值审计的前置依赖。

## 已完成迁移的保留复核点

- 子目录历史治理身份、危险低保真生成路径、生产/显示/实验/历史/测试边界均已在 Task 1—14 中处理，最终复核应确认它们没有在结果中回流为第二权威；
- 最终复核应确认没有新增游戏/叙事依赖或第二状态机，且版本化 replay、行动日志、seed、计算轨迹和规则版本仍形成可审计链；
- 最终复核应确认 V1 tag/canonical、基线 fixture 与 provenance 哈希未漂移，并按记录区分自动一致性、平衡与真人体验证据。

## 完成标准

以下首先保留已完成统一数值工程的审计边界；当前人与物重构的最近一批完成标准以上文“下一检查点完成标准”为准。

独立 scoped re-review 已得出可审计通过结论；该结论只覆盖统一数值权威源产品工程，不外推为数值平衡或真人体验。后续 Critical 证据设计至少必须：

- 覆盖 `EXP-016` 列出的所有现行数值来源、消费者、重复实现和危险生成路径；
- 把 `EXP-019` 的架构原则落实为明确批次，并说明为何第一阶段不需要新增框架依赖；
- 给出 Phase 0 三项边界、每批 changed/preserved surface、回滚点、差分/回放验证和停止条件；
- 分开代码一致性、设计例证、批量平衡与真人体验证据，不以既有 `81/81` 证明玩法平衡；
- 保持 V1 tag、canonical 教师交付、原工作区 31 项和作品集 capsule 不变。

产品工程现已进入 Completed；这一状态不外推为平衡、真人体验或正式发布完成。

## 已完成研究结论

- 没有一个候选能以合理成本完整替换《掌眼》现有规则核心；
- boardgame.io 的纯 move、可序列化状态和日志回放值得借鉴，但正式包已约四年未发布且与现有骨架重叠，不作为依赖；
- Yuka 的候选 evaluator/arbiter 值得借鉴，但库面过宽、发布停滞，不作为依赖；
- ink/inkjs 只保留为规则接口稳定后的叙事适配候选，不得持有生产数值；
- OpenSpiel 只作为不完全信息、议价、信号与离线验证参考，不嵌入 H5；
- 详细来源、矩阵、选择性披露语义和架构输入见 [EXP-019](evidence/EXP-019-v2-framework-research.md)。

## 审查后的第一项核心工程

**统一数值权威源已经获批，是 V2 第一项核心产品工程。** 作品集保全与框架研究均已完成，当前回到以下已批准完成定义：

- 每个数值模块只有一个明确的生产权威源；
- 高保真、低保真、数值实验台、生成单文件和测试不再各自复制核心公式；
- 实验参数、生产参数、显示投影和调试数据有明确边界；
- 单文件由构建生成并能追溯到源提交；
- 回归测试区分代码一致性、设计例证、批量平衡和真人体验，不再用“测试通过”代替“玩法正确”；
- 迁移能够分批回滚，并保持 V1 冻结版不变。

统一数值权威源已在本轮处理启动审查发现的三个边界：嵌套旧 `AGENTS.md` 的治理身份、危险低保真生成路径、生产/显示/实验/历史/测试的类型化分类；最终复核只检查其效果和未引入的回归，不自行扩展产品范围。

## 延后触发项：客观收益与结算评分

记录但近期不处理：在自动测试中衡量玩家实际客观收益与结算页面评分的关系，寻找既不把评分退化为利润、又不让两者完全脱节的平衡点。

- 触发：统一数值权威源完成、结算模型和评分维度稳定之后；V2 正式数值平衡或下一次对外发布之前；
- 届时等级：Critical 游戏平衡验证；
- 前置用户拥有字段：收益定义、评分版本、允许相关/必须独立的维度、样本与种子、阈值、漂移规则和允许的反例；
- 失效/重开：结算模型被替换、客观收益定义改变或综合评分不再存在；
- 当前限制：不预设相关系数或权重，不把现有 `81/81` 回归测试当作平衡证据。

## 已完成依赖：同类游戏与现有框架调研

工作流 ID：`V2-RESEARCH-001`；状态：Completed；完成日期：2026-08-10。

- 已覆盖证据/调查、有限议价、双方信念更新、NPC 候选仲裁、Storylet、数值模拟和确定性回放；
- 已按许可证、维护、测试、Web 适配和集成成本比较四个候选；
- 未安装或运行候选，因此研究支持“计划依据”，不构成依赖兼容性验证；
- 重开触发：计划拟引入候选依赖、维护/许可证实质变化、现有内核无法满足完成标准，或后续需要隔离的 inkjs/OpenSpiel spike。

## Agent 治理分支

- `project-co-leader-v2` 已加载并负责当前工作流；
- `project-agent-governance` 若以后可调用，只预览最小能力与责任拓扑；创建持久 Agent、扩大权限或改变决策权仍需另行批准；
- 本轮人与物审查使用临时只读审查者作为运行池，没有创建持久 Agent、扩大权限或改变决策权；项目仍没有持久 Agent 拓扑。

## 暂时不做

- 不修改或移动 V1 tag、V1 worktree、`main` 与原工作区未提交资产；
- 不在最终复核中顺手修改产品数值、构建物、单文件或测试；发现问题时只重开最小受影响任务；
- 不安装 boardgame.io、Yuka、inkjs 或 OpenSpiel，不把研究推荐误当依赖批准；
- 不创建持久 Agent，不扩大 Agent 权限，不取消独立验证；
- 不继续增加第四案例、长期经济、低中高级场或微信小游戏工程；
- 不制作最终作品集，不推送、部署、上传或公开发布材料。
- 不安装或运行仓库解释候选，不把本地仓库上传到外部服务，不启用自动 Git hook；任何试点必须先披露限定目录、模型、费用／token、数据去向与生成文件边界并取得批准。
- 在用户批准新的数值语义规格前，不修复本次审查发现的 N／D、接受曲线、`priceTick` 或其他实现问题；不把只读发现误报成已修复。
- 视觉工作保持停放；证据图、8 AP、连续对话、D20、受控误导、察人分或其他案例内容迁移仍需各自边界与授权。

## 当前证据与决定

- [V1 最小修正与封存](decisions/DEC-010-v1-minimal-fix-and-freeze.md)
- [V2 启动审查与数值权威源](decisions/DEC-011-v2-startup-audit-and-numeric-authority.md)
- [V1 定稿预检与恢复点](evidence/EXP-014-v1-preflight-recovery-and-classification.md)
- [V1 教师交付收口与冻结前验证](evidence/EXP-015-v1-teacher-handoff.md)
- [V2 启动只读审查与数值权威边界](evidence/EXP-016-v2-startup-audit.md)
- [学校作品集成果/过程取舍核实](evidence/EXP-017-portfolio-curation-guidance-review.md)
- [V1 基线与作品集原始证据保全](evidence/EXP-018-v1-portfolio-evidence-preservation.md)
- [V2 同类框架与社区方案只读调研](evidence/EXP-019-v2-framework-research.md)
- [V2 统一数值权威源设计规格](../superpowers/specs/2026-08-10-v2-numeric-authority-design.md)
- [V2 统一数值权威源逐步实施计划](../superpowers/plans/2026-08-10-v2-numeric-authority.md)
- [必检 run 失败后的可审计重试语义](challenges/resolved/CH-003-verification-run-retry-semantics.md)
- [必检 run 使用追加式 supersession](decisions/DEC-012-verification-run-supersession.md)
- [V2 独立玩家试玩版与双轨结算](decisions/DEC-013-v2-player-trial-and-dual-track-scoring.md)
- [V2 玩家试玩版、三案例与双轨评分验证](evidence/EXP-021-v2-player-trial-and-dual-track-scoring.md)
- [NPC 受控误导与人与物双重鉴定边界](challenges/resolved/CH-005-human-object-dual-appraisal-boundary.md)
- [人与物双重鉴定、证据拓扑与洞察附加层](decisions/DEC-014-human-object-dual-appraisal.md)
- [玩家试玩版“人与物”体验、数值与证据结构审查](evidence/EXP-022-human-object-player-trial-audit.md)
- [首个手机“人与物同屏”玩家切片](evidence/EXP-023-first-mobile-human-object-slice.md)
- [当前检查点与 public HTML 身份清单](evidence/EXP-024-current-checkpoint-and-public-html-inventory.md)
- [自然语言仓库解释工具只读调研](evidence/EXP-025-natural-language-codebase-tools.md)
- [现行 V2 数值系统自然语言地图](evidence/EXP-026-current-numeric-system-atlas.md)
- [V1 基线与作品集原始证据保全设计](../superpowers/specs/2026-08-04-v1-portfolio-evidence-preservation-design.md)
- [V1 作品集证据保全实施计划](../superpowers/plans/2026-08-04-v1-portfolio-evidence-preservation.md)
