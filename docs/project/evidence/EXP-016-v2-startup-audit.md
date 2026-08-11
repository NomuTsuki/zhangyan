# EXP-016：V2 启动只读审查与数值权威边界

日期：2026-08-04

状态：Executed（只读审查完成；未实施产品重构）

## 测试了什么

在 `D:\实习工作\掌眼\.worktrees\v2-bootstrap` 中完成 V2 启动前只读审查，回答以下问题：

1. V1 冻结提交、tag、worktree、原工作区 31 项未提交资产与 V2 分支是否保持清楚、隔离且可回滚；
2. 生产规则、案件配置、NPC、定价、结算、数值实验台、历史低保真、玩家显示投影、生成单文件和测试分别在哪里定义数值；
3. 哪些是生产权威、实验参数、复制实现、生成结果或测试例证；
4. `project-co-leader-v2` 与 Agent 治理依赖是否正确加载；
5. 哪些冲突会阻塞统一数值权威源，哪些只是后续清理。

审查边界是只读：不修改产品代码，不运行会重写 `public`、`dist` 或生成 HTML 的构建/测试命令，不移动 Git 引用，不导入原工作区混合资产。

## 方法

- 检查 `git status`、HEAD、V1 annotated tag、提交亲缘、worktree 列表、V1→V2 文件差异和产品目录 tree OID；
- 检查原工作区 staged/unstaged/untracked 状态与仓库外恢复记录；
- 静态追踪 TypeScript 案件、规则、NPC、定价、结算、UI 投影、生成脚本、历史 standalone、数值实验台与测试消费者；
- 核对发布白名单、根 README、SYSTEM-MAP、V1 冻结证据和生成链；
- 执行 `project-co-leader-v2` 项目记忆结构检查；
- 比较现存 `public` canonical 与 `dist/client` 高保真文件 SHA-256；
- 使用三个边界明确的临时只读审查者分别复核 Git 冻结、生产数值来源、非生产资产与治理加载，主 Agent 汇总结论。

## 观察结果

### Git 冻结、隔离与回滚

- V2 worktree 位于 `codex/v2-bootstrap`，审查时 HEAD 为 `d4ca03725e56061481c6db0aad5b10d47957718e`，工作树与索引均干净；
- annotated tag `v1.0.0-teacher-handoff` 剥离后指向 `f0b20b8ef5f5246529027f90a3fb277659c329cf`；
- `f0b20b8` 是 `d4ca037` 的直接父提交，V2 仅领先一个治理提交；
- V1→V2 只新增/修改 `.project-co-leader-v2.yaml`、根 `AGENTS.md`、`02-CURRENT-STATE.md`、`03-NEXT-ACTIONS.md` 和验证契约模板；产品目录 tree OID 两端同为 `c01eb4ad05ccce7b62711d06140adb901629bf48`；
- 原工作区仍有 31 项混合资产：0 staged、3 tracked modified、28 untracked；它们没有进入 V2；
- V1 冻结 worktree 干净，可直接作为代码级回滚点；不能把脏原工作区当作回滚载体；
- 仓库外恢复点存在，但当时没有验证一个包含最终 `f0b20b8` tag 的真正异地副本。Git tag/worktree 和同盘 bundle 不是独立容灾。

### 当前数值身份与消费者

| 领域 | 当前身份与权威 | 主要消费者 | 已知复制、耦合与迁移风险 |
|---|---|---|---|
| 案件内容 | `prototype/content/lacquer-box.ts` 是首案生产参数权威 | 规则核心、高保真、开发页、生产规则测试 | 旧 JSON 示例、低保真内嵌 CASE、旧 schema 与实验台各有不同结构；不能反向提升为生产契约 |
| 规则与 NPC | `prototype/game/types.ts`、`resolve-action.ts` | 高保真、开发页、规则测试 | `resolve-action.ts` 同时承载资源、后验、NPC、定价、对话和结算；真值 ID、证据/语气系数等有复制，迁移耦合高 |
| 定价与议价 | `resolve-action.ts` 的 NPC 后验定价与 `negotiation.ts` 的容量规则 | 引擎、交易 UI、测试 | 历史 standalone 仍使用已删除的 `reservationPrice`；实验台使用近似术语但有意不同的公式 |
| 判断与结算 | `judgment-quality.ts`、`outcome-grades.ts` 与 `resolve-action.ts` 的结算组合 | 终局、复盘、判断质量测试 | 等级顺序在生产规则和高保真 UI 重复；历史低保真仍是旧 0—100 客观分 |
| 玩家显示投影 | `prototype/hifi/presentation.ts` | 高保真玩家区 | 氛围与可见变化阈值应明确为显示投影，不是 NPC 核心状态权威；高保真仍硬编码建议报价 `"60"` 与等级顺序 |
| 高保真 HTML | `prototype/public/掌眼_高保真教师演示.html` 是 V1 canonical 发布产物，不是数值源 | 教师演示、发布白名单 | 由 TypeScript/React 构建并内联；生成物尚未嵌入源 commit 或规则版本标识 |
| 数值实验台 | `prototype/public/掌眼_数值实验台.html` 是实验参数和独立实验模型 | 实验页面、自身 VM 测试、EXP/HYP 记录 | 与生产定价共享概念但公式和参数有意不同；测试证明实验模型内部一致，不证明生产一致或玩法平衡 |
| 历史低保真 | `prototype/standalone/client.js` 与低保真 HTML 是历史复制实现/快照 | legacy smoke、历史对照 | 当前案件使用 `outsideOption`，旧 client 仍读取 `reservationPrice`；现在运行 `generate-standalone.mjs` 可能生成 `NaN` 定价 |
| 测试 | 生产行为、显示投影、实验模型、生成物与发布契约的不同证据层 | 自动化门禁 | 固定数字可以是独立设计例证，不能反向成为生产参数权威；尚未正式分为一致性、设计例证、批量平衡、真人体验四类 |

### 发布与生成物

- `release/v1-teacher-handoff.json` 将高保真设为唯一 canonical，并排除低保真与数值实验台进入教师五文件包；
- `package.json` 的完整 `test` 会先执行构建，因此本次只读审查没有重跑；
- 审查时 `public/掌眼_高保真教师演示.html` 与 `dist/client` 副本 SHA-256 均为 `8B46D415627A2BDAA6D90C68C61189496DEAACCC1D3F1213ADC45A794464925B`；
- 应用构建会把完整 `public` 内容复制进 `dist/client`，所以教师发布白名单不等于公开 H5 路由白名单；正式托管不能直接暴露完整 `dist/client`。

### Agent 治理

- 根 `AGENTS.md` 中 V1 `project-co-lead` 为 disabled，V2 `project-co-leader-v2` 为 enabled；V2 Skill 已实际加载；
- `check_project_memory.py` 返回 `Errors: 0`、`Warnings: 0`；
- `project-agent-governance` 本机文件存在，但当时的可调用 Skill 清单未暴露它；`.project-governance.yaml` 与 `docs/project/AGENT-ROSTER.md` 也不存在；因此不能声称项目 Agent 拓扑已经采用；
- 产品子目录的嵌套 `AGENTS.md` 对其下代码作用域更近，却仍声明“低保真 UI 阶段”并指向旧 ledger，与根 V2 入口冲突。开始产品代码修改前必须修正或明确其历史身份。

### 阻塞项与非阻塞清理

开始统一数值权威源产品代码前必须处理：

1. 消除或明确嵌套 `AGENTS.md`、旧启动提示与当前 V2 ledger 的治理冲突；
2. 冻结危险的低保真生成路径，决定其归档或迁移身份前不得重跑；
3. 先声明生产规则、显示投影、实验参数、调试数据、历史资产和测试例证的类型化边界，避免机械抽取覆盖实验差异或吸收旧字段。

不阻塞 Phase 0 规划、但必须保留的后续项：

- UI 默认报价与等级顺序去重；
- 高保真生成物的 source commit / rule version 溯源；
- 文档、JSON schema 与旧示例的当前/历史身份；
- 测试证据四层分类；
- `dist/client` 的公开部署白名单；
- 真正独立于 `D:` 的恢复副本。

## 对决定或假设的影响

- 支持 [DEC-011](../decisions/DEC-011-v2-startup-audit-and-numeric-authority.md)：V1/V2 边界清楚且可回滚，没有发现需要推翻核心价值或重大已批准规则的新冲突；
- **统一数值权威源已经获批，是 V2 第一项核心产品工程。** 它不需要重新讨论是否实施；下一步是先通过作品集原始证据保全门，再形成独立实施与验证计划；
- 启动审查结论为“有条件通过”：可以进入非产品代码的 Phase 0，但产品数值修改必须等待治理与历史资产边界明确。

## 结论的局限

- 本轮没有运行 `npm.cmd test`、构建、生成器或浏览器；`81/81`、TypeScript、ESLint 与视觉路径来自 V1 冻结证据，不是本轮重新执行；
- `81/81` 只证明实现符合当前已写契约，不证明参数平衡、有趣、一般玩家理解或真实微信环境；
- 静态检查证明了低保真生成器的字段不兼容风险，但没有执行危险生成路径来复现 `NaN`；
- 当前哈希和同盘恢复点不等于异地容灾。

## 下一步

先完成 `V2-PORTFOLIO-001`：保存 V1 原始界面、图片、设计决策、架构迭代、Git 里程碑和验证证据，并保持“历史材料”与“当前生产权威”分离。其书面设计规格经用户复核后，再编写统一数值权威源的实施计划。
