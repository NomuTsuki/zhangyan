# Next Actions

> 推荐能够以较低成本减少最大重要未知、风险或阻塞的行动，而不是机械维护功能清单。

更新时间：2026-08-10

## 当前检查点

- V1 已冻结在提交 `f0b20b8` 与 annotated tag `v1.0.0-teacher-handoff`；
- V2 位于独立分支/worktree，启动只读审查已经完成，结论为“有条件通过”；
- V1 冻结资产未变化；V2 Task 1—14 已完成统一数值权威迁移，Task 15 已完成静态、全量、浏览器与 handoff 门；
- 原工作区 31 项、恢复点、教师交付包和浏览器证据均保持在原位置；
- `V2-PORTFOLIO-001` 已完成：独立 QA、cross-cutting gates、一次性文本冻结、18 项 checksum、双 close、最终仓库/项目记忆门和精确 staging 清理均通过；
- `V2-RESEARCH-001` 已完成：比较 boardgame.io、ink/inkjs、Yuka 与 OpenSpiel；未安装依赖、未复制代码、未修改产品；
- 用户已批准 15 任务计划、选择 Subagent-Driven，并授权按任务白名单创建本地 commits；Task 1—14 已闭环。当前最小剩余门是控制器安排的独立只读最终复核；该门不应被本任务的自检替代。

## 推荐主路径

1. 执行一次独立、只读的最终复核：对批准规格/计划、Task 15 diff、authority scans、V1/fixture/provenance 哈希与浏览器记录做交叉检查；若有 load-bearing finding，只重开最小受影响任务并保留本次运行记录；
2. 复核通过后，将 `V2-NUMERIC-AUTHORITY-EXEC-001` 标为 Completed，并把下一步限定为“客观收益与结算评分关系”的 Critical 证据设计，不自动调整平衡、扩写案件或改变叙事；
3. 进入后续开发时按 README 的 milestone/1–2 周/重大迁移/最终 PDF 触发点做增量素材整理、备份与复查。

## 已完成迁移的保留复核点

- 子目录历史治理身份、危险低保真生成路径、生产/显示/实验/历史/测试边界均已在 Task 1—14 中处理，最终复核应确认它们没有在结果中回流为第二权威；
- 最终复核应确认没有新增游戏/叙事依赖或第二状态机，且版本化 replay、行动日志、seed、计算轨迹和规则版本仍形成可审计链；
- 最终复核应确认 V1 tag/canonical、基线 fixture 与 provenance 哈希未漂移，并按记录区分自动一致性、平衡与真人体验证据。

## 完成标准

当前下一检查点是“独立最终复核可得出可审计结论”，不是把本任务的自检误写为独立验收。后续 Critical 证据设计至少必须：

- 覆盖 `EXP-016` 列出的所有现行数值来源、消费者、重复实现和危险生成路径；
- 把 `EXP-019` 的架构原则落实为明确批次，并说明为何第一阶段不需要新增框架依赖；
- 给出 Phase 0 三项边界、每批 changed/preserved surface、回滚点、差分/回放验证和停止条件；
- 分开代码一致性、设计例证、批量平衡与真人体验证据，不以既有 `81/81` 证明玩法平衡；
- 保持 V1 tag、canonical 教师交付、原工作区 31 项和作品集 capsule 不变。

独立最终复核通过后，产品工程才可从 `Controller Review Pending` 进入 Completed；产品工程的完成不外推为平衡、真人体验或正式发布完成。

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
- 本轮框架研究未创建子 Agent 或持久 Agent；项目仍没有持久 Agent 拓扑。

## 暂时不做

- 不修改或移动 V1 tag、V1 worktree、`main` 与原工作区未提交资产；
- 不在最终复核中顺手修改产品数值、构建物、单文件或测试；发现问题时只重开最小受影响任务；
- 不安装 boardgame.io、Yuka、inkjs 或 OpenSpiel，不把研究推荐误当依赖批准；
- 不创建持久 Agent，不扩大 Agent 权限，不取消独立验证；
- 不增加第二案件、长期经济、低中高级场或微信小游戏工程；
- 不制作最终作品集，不推送、部署、上传或公开发布材料。

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
- [V1 基线与作品集原始证据保全设计](../superpowers/specs/2026-08-04-v1-portfolio-evidence-preservation-design.md)
- [V1 作品集证据保全实施计划](../superpowers/plans/2026-08-04-v1-portfolio-evidence-preservation.md)
