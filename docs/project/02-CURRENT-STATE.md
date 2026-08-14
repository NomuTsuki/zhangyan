# Current State

> 只保存项目此刻的真实状态。历史结论进入 Decision、Evidence 或 archive。

更新时间：2026-08-14

## 一句话状态

V2 项目内收口和冻结前验证已经完成；commit、annotated tag 与 V3 worktree 属于本记录所在 tree 形成后的外部 Git 身份门，实际结果必须从现场核对。V2 的产品代码保持不变，真实终点是“可运行、可回放、单一数值权威的玩家试玩底座”，不是“物品真相拓扑已经实现”；拓扑与玩家推断工作台只作为 V3 设计输入。

## V2 治理迁移

- Workstream：`V2-GOV-001`；状态：Completed；责任载体：V2 迁移负责人（Project Co-leader）+ 项目治理 Skill；
- 授权边界：只创建 V2 分支/worktree、切换 V1/V2 项目入口、加入 V2 配置与验证契约模板并更新项目状态；不创建持久 Agent，不扩张权限；
- 起点：`v1.0.0-teacher-handoff^{}` = `f0b20b8ef5f5246529027f90a3fb277659c329cf`；
- V2 工作区：`.worktrees/v2-bootstrap`；分支：`codex/v2-bootstrap`；V1 封存 worktree 与原工作区均保持不变；
- 治理状态：`AGENTS.md` 中 V1 block 为 `disabled`、V2 block 为 `enabled`；`.project-co-lead.yaml` 作为回滚资料保留，`.project-co-leader-v2.yaml` 成为当前配置；
- 新增边界：持久 Agent 创建、Agent 权限扩大、决策权限改变和移除独立验证均需用户明确批准；本次均未发生；
- 迁移前基线：在干净 V2 worktree 执行 `npm.cmd ci` 与完整 `npm.cmd test`，结果 `81/81`；构建后工作树仍干净；
- 启动审查收口：2026-08-04 已完成冻结点、数值来源与 Agent 框架只读审查，证据见 `EXP-016`；该门不再作为未来重开条件。

## Active Work Ledger

- Workstream：`V2-FREEZE-V3-BOOTSTRAP-001`；状态：Completed（项目内收口与 pre-tag 验证；commit／tag／V3 worktree 结果不由本文件自证）；责任载体：Project Co-Leader（版本边界、文档收口、验证、Git 冻结与 V3 交接负责人）+ 临时只读复核者；
- 当前检查点：分支为 `codex/v2-bootstrap`，本批开始前 HEAD 为 `bfca0667500dce446932fcb4d40d079b1f350c0c`；隔离完整回归 `176/176`、TypeScript、lint `0 errors / 20 warnings`、项目记忆、静态文档、V1／V2 哈希和产品 diff 门均通过。单次本地提交、annotated tag 与 V3 独立工作树必须在提交后从 Git 现场核对；
- 授权边界：允许收口并提交当前 V2 文档／治理／证据批次，创建本地 V2 冻结标签、V3 分支与独立 worktree，并在 V3 中提交仅文档与设计证据的启动批次；不得修改产品代码、推送、部署、公开发布或调用 Superpowers；
- 已知 changed surface：最终提交前为 27 份治理、领域、证据、overview 与轻量作品集文件（17 tracked modifications＋10 untracked）；已知 preserved surface：全部产品源码、案例数值、生成 HTML、V1 tag／canonical／证据 capsule、原工作区与外部系统；
- 验证状态：完整结果与运行位置见 [EXP-029](evidence/EXP-029-v2-player-prototype-freeze.md)。通过只代表版本可复现、自动规则未回归和文档边界成立，不代表平衡、文化准确性、真人趣味、视觉批准或发布可用；
- Durable handoff：本批将形成 `DEC-015`、`EXP-029`、本地 annotated tag `v2.0.0-player-prototype-freeze` 与独立 V3 工作树；最后更新：2026-08-14；停止／重开触发：产品路径出现意外差异、回归／哈希失败、标签或工作树名称冲突、迁入证据哈希不一致，或文档把 Draft 误写成已批准／已实现。

- Workstream：`V2-EVIDENCE-BEFORE-DECISION-001`；状态：Completed（治理、证据、作品集轻量固化与兼容／独立前向验证均完成，由 V2 冻结提交收口）；责任载体：Project Co-Leader（全局 Skill、项目记录、作品集轻量固化与验证负责人）+ 临时只读调查者与前向测试者；
- 当前检查点：两段双向认知回答已逐字符保存，重大产品决定调查门已加入全局 Skill 与掌眼配置，系统边界转折已形成轻量候选作品集卡；下一讨论已改为“两部分游戏”范围收敛，但没有预设答案。全局 Skill 修改前恢复点的 `27/27` 文件哈希仍一致；
- 授权边界：允许修改已安装的 `project-co-leader-v2` Skill、配置／AGENTS 模板、配置检查器和掌眼治理／证据／宏观／轻量作品集记录；允许只读外部资料复核、临时目录初始化测试和临时只读 Agent 前向测试；不得修改产品代码、案例数值、玩家／教师 HTML 或 V1 证据，不安装依赖，不 stage/commit/push/merge/deploy，不调用 Superpowers；
- 已知 changed surface：全局 Skill 的 `SKILL.md`、新调查参考、UI metadata、项目配置／AGENTS 模板与配置检查器；掌眼配置、AGENTS、Project Compass、System Map、Current State、Next Actions、DEC-014、风险、overview、`EXP-027`／`EXP-028` 和一张轻量 V2 作品集卡。已知 preserved surface：全部产品源码、案例数值、生成 HTML、V1 冻结资产／作品集 capsule、原工作区与 Git 历史；
- 验证状态：两段附录与 JSONL 原文逐字符一致，分别匹配 `4347 / 9497 bytes / 753069...` 与 `1699 / 4103 bytes / ee04bf...`；备份清单 `27/27`、Skill 结构与引用、Python AST、当前配置 `0 errors / 0 warnings`、新项目初始化与二次不覆盖、旧配置 warning、坏配置 error 均通过。四次独立只读前向运行覆盖五个行为面：“新玩法先调查、普通修错不研究、新算法只暂停相关分支、核心架构自动 Deep、证据饱和后停放旁支”；最后两个行为面来自同一次组合压力输入。`git diff --check` 通过，暂存、产品路径与冻结 V1 路径均为 `0`；独立只读 QA 为 `Critical 0 / Important 0 / Minor 0`、verdict `pass`。官方 Skill Creator 因本机缺 `PyYAML` 未启动，本批未安装依赖；Mermaid 仅做静态检查、未渲染验收；
- Durable handoff：[EXP-027](evidence/EXP-027-bidirectional-cognition-design-turning-point.md)、[EXP-028](evidence/EXP-028-project-co-leader-research-before-decision-gate.md) 与 [轻量作品集转折卡](../portfolio/v2-process/2026-08-13-system-boundary-turning-point.md)；最后更新：2026-08-13；停止/重开触发：原文哈希不一致、备份无法恢复、新旧项目配置兼容失败、调查门对普通编码造成仪式化阻塞、产品／V1 路径被误改，或下一轮未经用户决定就把“两部分”写成既定方案。

- Workstream：`V2-BIDIRECTIONAL-COGNITION-001`；状态：Completed（领域澄清与文档同步已实现并验证，由 V2 冻结提交收口）；责任载体：Project Co-Leader（领域边界、权威记录与宏观投影同步负责人）；
- 当前检查点：用户已明确认可“五个开发责任区，不是五套孤立引擎”；玩家认知与 NPC 认知各自扩展为“辨物＋识人”。当时确认的下一依赖是漆器客观真相与证据拓扑；它未在 V2 实现，现作为 V3 设计输入；
- 授权边界：允许更新统一词汇、DEC-014、系统图、当前状态、下一行动、风险和宏观驾驶舱；不得修改产品代码、案例数值、玩家／教师 HTML、历史资产或全局 Skill，不 stage/commit/push/merge/deploy，不调用 Superpowers；
- 已知 changed surface：根 `CONTEXT.md`、README、Project Compass、System Map、Current State、Next Actions、DEC-005／006／007／014、HYP-002／004、索引、风险登记与宏观驾驶舱；已知 preserved surface：全部产品源码、生成物、V1 冻结资产、作品集 capsule、Git 历史与全局 Skill；
- 验证状态：项目记忆检查 `0 errors / 0 warnings`；20 份变更中的 Markdown、156 个本地链接与 7 个 Mermaid 图块通过静态检查；必需术语齐全且当前入口不存在“玩家信念／NPC 信念／双后验拆分／当前转向”等旧称；`git diff --check` 通过，21 条脏路径中 staged 为 0、越界为 0、产品路径为 0。独立只读复核覆盖 8/8 个核心文件，未发现语义矛盾；其指出的“旧局部状态机可能被误读成人物模型已完成”已补充消歧。Mermaid 本轮未做渲染视觉验收；
- Durable handoff：DEC-014 的 2026-08-13 澄清、[EXP-027](evidence/EXP-027-bidirectional-cognition-design-turning-point.md)、根 `CONTEXT.md` 与 `docs/project/overview/`；最后更新：2026-08-13；停止/重开触发：文档把两种认知误写成共用答案、把玩家内心自动系统化、把人物认知直接改写器物真相，或本批越过纯文档边界。

- Workstream：`V2-HUMAN-READABLE-COMMS-001`；状态：Completed（治理与文档已实现并验证，由 V2 冻结提交收口）；责任载体：Project Co-Leader（全局 Skill 升级、掌眼宏观投影与验证负责人）+ 三个临时只读前向测试者；
- 当前检查点：`2.3-human-readable-steering` 已加入人话优先、两层信息、阶段交接理解门、Mermaid 关系图和直接但可覆盖的追兔子刹车；掌眼 `docs/project/overview/` 已成为只读宏观投影。它现在作为已验证基线，由 `V2-EVIDENCE-BEFORE-DECISION-001` 的 `2.4` 调查门增量扩展，不改写当时验证历史；
- 授权边界：允许修改已安装的 `project-co-leader-v2` Skill、其脚手架／校验器和掌眼治理／概览／项目记录；允许在临时目录运行初始化验证并使用临时只读 Agent 做无答案泄漏的前向测试；不得修改产品代码、案例数值、玩家 HTML 或历史资产，不安装依赖，不 stage/commit/push/merge/deploy，不启用 Superpowers；
- 已知 changed surface：全局 Skill 的 `SKILL.md`、沟通参考、UI metadata、项目模板和初始化／检查脚本，以及掌眼 `AGENTS.md`、`.project-co-leader-v2.yaml`、README、`docs/project/overview/`、风险／当前状态／下一行动。已知 preserved surface：全部产品源码、案例与规则数值、玩家／教师 HTML、V1 冻结资产、作品集 capsule、原工作区和 Git 历史；
- 验证状态：修改前全局 Skill 已完整备份，22/22 文件哈希一致、差异为 0；临时新项目 preview/apply、二次 apply 不覆盖、旧项目缺失 overview 仅警告均通过；掌眼项目记忆检查为 `0 errors / 0 warnings`，8 个 overview 模板／实例的相对链接、围栏、Mermaid 静态结构和权威声明检查通过；三个无答案泄漏的独立只读前向测试分别通过阶段交接、追兔子刹车和轻量局部任务。官方 Skill Creator `quick_validate.py` 因本机缺少 `PyYAML` 未启动，本轮未安装依赖，改用 frontmatter／命名／引用／行数／YAML 结构、Python AST 与模板同步检查；Mermaid 未做渲染视觉验收；
- Durable handoff：[宏观入口](overview/00-START-HERE.md)、[五阶段路线图](overview/01-ROADMAP.md)、[树和剪影模型](overview/02-MENTAL-MODEL.md)、[阶段卡](overview/03-MILESTONES.md)，以及可恢复备份 `C:\Users\ASUS\.codex\backups\project-co-leader-v2\pre-human-readable-steering-20260812-221521`；最后更新：2026-08-12；重开触发：备份无法恢复、Skill 结构或初始化回归失败、宏观投影成为第二活动账本、真实沟通不能稳定触发阶段交接／追兔子刹车／轻量模式，或改动越过批准的治理与文档边界。

- Workstream：`V2-PRE-NUMERIC-RESEARCH-SNAPSHOT-001`；状态：Completed（本条与快照在同一提交中）；责任载体：Project Co-Leader（提交范围、验证与 Git 检查点负责人）；
- 当前检查点：以 `b211e64132c1217bb6fc008cc9993710db8755c1` 为父提交，用户明确批准把当时全部 70 条未提交状态（18 个已跟踪修改、52 个未跟踪文件）收录为本地提交，提交信息为“研究数值系统前的快照”；
- 授权边界：允许 `git add -A` 和一次普通本地 commit，覆盖当时全部未提交内容；不允许修改产品语义来追求通过、不允许 push、merge、rebase、reset、clean、部署或发布；
- 已知 changed surface：V2 玩家版／三案例／估值与评分实现、对应测试和生成 HTML、项目治理与证据记录、V1 作品集证据登记／验证脚本，以及 EXP-022／023 的 11 张截图。已知 preserved surface：V1 canonical 字节、V1 tag/worktree、原工作区、外部证据 capsule 与未授权外部系统；
- 验证状态：预提交范围为新增约 2.619 MB，无嵌套 Git、重解析点、依赖缓存、大型压缩包或真实凭据命中；完整 `npm.cmd test` 为 `176/176 PASS`，`npx.cmd tsc --noEmit` 通过，lint 为 `0 errors / 20 warnings`，作品集登记验证器单测为 `59/59 PASS`。以上证明构建／自动一致性与快照范围，不证明数值平衡、文化准确性、审美批准或真人趣味；
- Durable handoff：本条所在、主题为“研究数值系统前的快照”的本地 Git commit；最终 SHA 以 Git 对象为准。最后更新：2026-08-11；重开触发：该提交不存在、提交后工作树不干净、暂存范围与 70 条批准状态不一致，或后续要求 push／merge／发布。

- Workstream：`V2-NUMERIC-SYSTEM-ORIENTATION-001`；状态：Completed（只读盘点与工具调研，等待用户选择下一批）；责任载体：Project Co-Leader（仓库盘点、解释与项目记忆负责人）+ 临时只读研究者；
- 当前检查点：已把当前手机切片的文件与证据身份结构化停放，并把 `prototype/public` 五个 HTML 分成当前玩家入口、较早 V2 开发诊断面、V1 canonical、历史低保真和 V1 隔离数值实验；已从现行 `content/ + game/` 形成中文架构图、行动影响、权威文件和 12 项优先风险；已比较 Understand Anything、Repomix、GitHub Copilot 与 Sourcegraph Cody；
- 授权边界：允许只读检查工作树、构建清单、生成物、测试和 GitHub／官方资料，并新增或更新仓库内项目记录与研究证据；不修改产品代码或数值，不安装或运行候选工具，不上传仓库，不创建外部 issue／PR，不 stage/commit/push/merge/deploy；
- 已知 changed surface：`README.md`、`prototype/README.md`、`01-SYSTEM-MAP.md`、`02-CURRENT-STATE.md`、`03-NEXT-ACTIONS.md` 与新证据 `EXP-024`—`EXP-026`。已知 preserved surface：五个 `public` HTML 的现有字节、全部产品／数值模块、V1 冻结点、作品集 capsule、原工作区和既有未提交资产；
- 验证状态：五个 HTML 的文件名、大小、SHA-256、`public`／`dist/client` 字节一致性、release manifest、生成脚本与测试引用已交叉核对；四个现行数值缺口已有静态锚点和只读最小复现。候选工具结论来自官方仓库／文档，但未安装或本机试跑，因此不是兼容性、安全性或中文质量验收；
- Durable handoff：[EXP-024](evidence/EXP-024-current-checkpoint-and-public-html-inventory.md)、[EXP-025](evidence/EXP-025-natural-language-codebase-tools.md) 与 [EXP-026](evidence/EXP-026-current-numeric-system-atlas.md)；最后更新：2026-08-11；重开触发：用户批准 Understand Anything 限定试点，或批准统一 NPC 实际议价／N 分解释模型及其记账语义的书面规格。若工具需要上传私有代码、外部付费服务、持久 Agent、额外权限或不可逆索引，必须先停止并重新授权。

- Workstream：`V2-HUMAN-OBJECT-REDESIGN-001`；状态：Parked（第一批实现与独立只读 QA 完成，视觉精修暂不继续）；责任载体：Project Co-Leader（实现、验证与项目记忆负责人）+ 临时只读代码探索者 + 独立只读审查者；
- 当前检查点：漆器 `390×844` 调查与议价已保持器物／NPC／人物气泡同屏；中性半身占位、`细看／询问`行动层、组外只读案卷、独立“形成判断”入口和终局回复停留已接入。默认调查、细看、询问、案卷、拒绝、还价、接受与玩家离场截图、生成 HTML 哈希和独立 QA 结论已经固化；用户明确暂不继续打磨画面；
- 授权边界：允许修改玩家 React／CSS 展示层、对应聚焦 UI/HTML 测试和构建生成的独立玩家 HTML，并增量更新项目记录／本批浏览器证据；不得修改器物后验、NPC 决策、议价数值、评分、seed、replay、案例真相或 V1／教师资产，不安装依赖，不整理无关脏文件，不 stage/commit/push/merge/deploy；
- 已知 changed surface：既有文档固化记录和两张基线截图；本批 `player/PlayerApp.tsx`、`player/styles.css`、`tests/player-v2-html.test.mjs`、新增 `tests/player-v2-ui.test.mjs`、生成的独立玩家 HTML、`EXP-023` 与九张状态截图。已知 preserved surface：全部 V1 冻结资产、V2 规则／内容／评分／回放模块、教师入口、作品集 capsule、原工作区和其他既有未提交资产；
- 验证状态：实现负责人完成 TypeScript、完整构建与自动回归 `176/176 PASS`、玩家聚焦 `34/34 PASS`、lint `0 errors / 20 warnings`（均为既有非玩家 warning）及 Chrome `390×844`／`1440×1000` 状态链，无横向溢出，手机器物／NPC／气泡同屏且 console `0 errors / 0 warnings`。独立只读审查者直接重跑玩家聚焦 `34/34`、TypeScript、聚焦 ESLint、16 文件保留哈希、生成物／截图哈希和项目记忆门，结论 `pass-with-known-risk`、`0 Critical / 0 Important / 0 Minor`；其未独立重跑浏览器。V1 canonical 哈希不变；以上均不代表真人体验或用户视觉批准；
- Durable handoff：[DEC-014](decisions/DEC-014-human-object-dual-appraisal.md)、[EXP-022](evidence/EXP-022-human-object-player-trial-audit.md) 与 [EXP-023](evidence/EXP-023-first-mobile-human-object-slice.md)；最后更新：2026-08-11；重开触发：用户重新选择视觉精修，或完成数值系统理解后另行授权漆器证据图与 8 AP。未获授权前不得跨入证据拓扑、D20、连续对话、受控误导、察人分或其他案例内容迁移。

- Workstream：`V2-PLAYER-TRIAL-001`；状态：Completed；责任载体：Project Co-Leader（实现与验证，非独立 QA）；
- 当前检查点：独立 `掌眼_V2_玩家试玩版.html`、三案例目录、稳定局号、提交鉴定、玩家估值、公开议价效用与双轨结算已完成；旧综合成果等级和 Q20 自动报价已由 DEC-013 取代。完整 `npm.cmd test` 为 `170/170 PASS`；新增聚焦测试为 `28/28 PASS`；
- 授权边界：允许修改本计划列出的产品、测试、构建与项目记录；不允许覆盖 V1/教师历史、整理无关脏文件、stage/commit/push/merge/deploy。本轮未调用 Superpowers、未创建子 Agent、未新增生产依赖；
- 已知 changed surface：`AGENTS.md`，玩家案例/估值/评分/状态/结算模块，独立玩家 React/CSS/构建链，自包含玩家 HTML，新测试，DEC-013、EXP-021、系统图、当前状态与下一行动。已知 preserved surface：V1 canonical/tag/worktree、旧 authority fixture、原工作区、教师入口、作品集 capsule 与既有未提交记录；
- 验证状态：10,000 局分布通过；27 组固定回放深度一致；14 个手算场景通过；后验、区间、分数和隐藏信息边界通过；`375×812` 与 `1440×1000` 无横向溢出且控制台 0/0。浏览器证据属于 implementation-owner verification，不代表独立 QA、文化校订、平衡或真人趣味验收；
- Durable handoff：[DEC-013](decisions/DEC-013-v2-player-trial-and-dual-track-scoring.md) 与 [EXP-021](evidence/EXP-021-v2-player-trial-and-dual-track-scoring.md)；最后更新：2026-08-10；重开触发：确定性/分布/评分/HTML 边界失败，文化专家指出实质错误，或后续平衡验证要求调整已批准评分规则。

- Workstream：`V2-NUMERIC-AUTHORITY-EXEC-001`；状态：Completed；责任载体：Project Co-Leader 控制器 + 逐任务临时 Agent；
- 当前检查点：Task 1—15、最终修复波与精确修复 diff 的独立 scoped re-review 已闭环。四项 Important finding 全部修复，复审未发现 Critical、Important 或 Minor regression。`npm.cmd test` 构建并自动发现全部测试，为 `142/142 PASS`；独立 reviewer 直接 Node 全发现也为 `142/142 PASS`；TypeScript 通过；lint 为 `0 errors / 17 warnings`，warnings 位于本轮改动的两个应用文件，未误标为全部来自未改写表面。V1 canonical SHA-256 仍为 `8B46D415627A2BDAA6D90C68C61189496DEAACCC1D3F1213ADC45A794464925B`；V2 生成单文件 provenance 为 `7949cf19bb32fe59e46b997bd54bd9a5b2deea3b`/clean。既有桌面/移动 action chain 与截图属于 implementation-owner evidence；本次 scoped re-review 未独立重跑浏览器、settlement、viewport overflow 或 console，因此不把产品工程完成外推为独立视觉/真人体验验收；
- 授权边界：允许按批准计划修改产品代码、使用逐任务临时 Agent，并在 `codex/v2-bootstrap` 中按每任务明确白名单创建本地 commit；不允许 stage/commit 既有无关改动，不允许 push/merge/deploy；
- 已知 changed surface：Task 1—14 的批准迁移表面，以及最终修复波的 `game/ruleset.ts`、`game/resolve-action.ts`、`game/reducer.ts`、`game/types.ts`、`content/lacquer-box.ts`、`hifi/HighFidelityApp.tsx`、`app/page.tsx`、`package.json`、四个对应测试与 V2 生成单文件。已知 preserved surface：V1 canonical 与历史低保真字节、十场景首案语义、fixture、V1 tag/worktree、原工作区 31 项、教师交付包、作品集 capsule 与既有未提交资产；
- 验证状态：Task 1 `11/11 PASS`；Task 2 `28/28` 与完整 `82/82 PASS`；Task 3 身份/基线/规则 `30/30 PASS`；最终修复波 RED 按四 finding 分别失败，GREEN 后完整 `142/142 PASS`、直接 Node 全发现 `142/142 PASS`、聚焦 `14/14 PASS`、TypeScript 通过、lint `0 errors / 17 warnings`。既有 implementation-owner 浏览器证据显示桌面 `1440×1000` 与移动 `390×844` 均无横向溢出、控制台 `0 errors / 0 warnings`，但本修复波未独立重跑。fixture SHA-256 持续为 `909075060FC994501D1D4B6505D203AB70A9B88F639488C803510523CAF0A522`；
- Durable handoff：计划 `docs/superpowers/plans/2026-08-10-v2-numeric-authority.md`，运行账本 `.superpowers/sdd/2026-08-10-v2-numeric-authority/progress.md`，最终验证、finding 处置与独立 scoped re-review 结论见 `EXP-020`；最后更新：2026-08-10；停止/重开触发：完整/类型/lint/authority 门失败，V1/基线/provenance 漂移，或后续发现 load-bearing second authority、真相泄漏或不受支持的完成声明。治理 Minor：`AGENT-ROSTER.md` 缺失；当前会话没有 `project-agent-governance` capability，不擅自建立持久 Agent。

- Workstream：`V2-NUMERIC-AUTHORITY-PLAN-001`；状态：Completed；责任载体：Project Co-Leader（实施计划负责人）；
- 当前检查点：统一数值权威源书面规格与 15 任务计划均已获用户批准；用户已选择 Subagent-Driven 执行；
- 授权边界：允许只读检查产品实现与测试，并新增/更新实施计划、批准状态和项目 ledger；不修改产品代码、产品测试、构建物或依赖，不 stage/commit/push；
- 已知 changed surface：批准后的设计规格、本 ledger、`03-NEXT-ACTIONS.md` 与 `docs/superpowers/plans/2026-08-10-v2-numeric-authority.md`；已知 preserved surface：全部产品目录、V1 tag/worktree、原工作区 31 项、教师交付包、作品集 capsule 与既有未提交资产；
- 验证状态：规格与计划均已获用户批准；计划已完成规格覆盖、占位符、类型/接口一致性与路径/命令自检；当前没有产品实现结果；
- Durable handoff：`docs/superpowers/plans/2026-08-10-v2-numeric-authority.md`；最后更新：2026-08-10；停止/重开触发：计划发现规格内部不可实施、需要新增生产依赖、需要改变产品边界，或用户要求改写/放弃该工程。

- Workstream：`V2-NUMERIC-AUTHORITY-DESIGN-001`；状态：Completed；责任载体：Project Co-Leader（设计规格负责人）；
- 当前检查点：用户已批准 `EXP-019` 推荐方向与完整书面规格；“内部确定性规则核 + 可替换适配层”及 Phase 0—6 迁移边界已冻结为计划输入；
- 授权边界：允许只读检查现有实现、测试、生成链与项目记录，并新增/更新设计规格和项目状态；不修改产品代码、测试或生成物，不安装依赖，不 stage/commit/push；
- 已知 changed surface：本 ledger、`03-NEXT-ACTIONS.md` 与 `docs/superpowers/specs/2026-08-10-v2-numeric-authority-design.md`；已知 preserved surface：V1 tag/worktree、全部产品目录、原工作区 31 项、教师交付包、作品集 capsule 及既有未提交资产；
- 验证状态：设计方向和书面规格均已获用户批准；规格完成覆盖项与矛盾自检；当前没有产品实现或产品验证结果；
- Durable handoff：`docs/superpowers/specs/2026-08-10-v2-numeric-authority-design.md`；最后更新：2026-08-10；停止/重开触发：发现设计与既有决定冲突、需要新增外部依赖、需要改变已批准产品边界，或用户要求改写/放弃当前方向。

- Workstream：`V2-RESEARCH-001`；状态：Completed；责任载体：Project Co-Leader（研究负责人）；
- 当前检查点：已对 boardgame.io、ink/inkjs、Yuka 与 OpenSpiel 完成官方文档、源码、测试、许可证、维护、Web 适配和集成成本比较，并形成采用/借鉴/拒绝结论；
- 授权边界：只读访问 GitHub、框架官方文档、相关社区与研究资料，允许新增/更新项目研究证据和状态记录；不安装依赖、不复制外部代码、不修改产品、不创建外部 issue/PR、不 stage/commit/push；
- 已知 changed surface：本 ledger、`03-NEXT-ACTIONS.md`、`EXP-019`；已知 preserved surface：V1 tag/worktree、全部产品目录、原工作区 31 项、教师交付包、作品集 capsule 与既有未提交资产；
- 验证状态：只读研究完成。四个候选均有官方来源和许可证证据，测试与维护差异已明确；没有安装、执行或本机兼容性验证候选，因此结论只授权架构输入，不授权依赖采用；
- Durable handoff：`docs/project/evidence/EXP-019-v2-framework-research.md`；最后更新：2026-08-10；重开触发：准备引入任一外部依赖、候选维护/许可发生实质变化、现有内核无法满足计划完成标准，或离线平衡阶段需要 OpenSpiel/inkjs spike。

- Workstream：`V2-PORTFOLIO-001`；状态：Completed；责任载体：Project Co-Leader 控制器 + 独立审查者运行池；
- 当前检查点：任务 1—6 全部闭环。`RUN-DOCX-01 FAIL` 作为历史保留，`RUN-DOCX-02 PASS` 合法接续；最终独立 QA 修正两处 README provenance 矛盾后 PASS。三份文本一次性冻结、18 项 checksum 与 frozen close 通过；精确 QA staging 已删除且不存在；
- 授权边界：允许新增仓库内文档、只读校验脚本与测试，非覆盖创建 `D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline` 和唯一 QA staging，复制恰好 15 项白名单，生成仅供验证的 DOCX 渲染，使用临时 Chrome profile，执行只读复验，并在收口时安全删除该精确 staging；不修改产品代码，不 stage/commit/push，不移动或改写 V1 tag/worktree，不部署或公开发布；
- 已知 changed surface：本 ledger、`03-NEXT-ACTIONS.md`、`EXP-016`、`EXP-017`、保全规格/计划、`docs/portfolio/v1-evidence/`、`scripts/portfolio-evidence/`、SDD 审查记录、待建 `EXP-018`、已创建的精确胶囊与 QA staging；已知 preserved surface：V1 冻结点、产品目录、原工作区 31 项、教师交付包、浏览器原始证据、恢复 master 和既有项目记忆；
- 验证状态：validator 语法与完整套件 `59/59 PASS`；Task 4 与 Task 6 新鲜独立 QA 均通过。十四条 runs 含十二道 required gates 与保留的 DOCX 失败/成功链；账本终态为 `15 private-master-copied / 105 private-recovery-master-verified-in-place / 59 duplicate-reference / 31 rebuildable`。pre-freeze、frozen 与 cleanup 后 frozen close 均返回 copied `15` / `6,604,677` bytes、unresolved `0`、blocking `0`、errors `0`；冻结 checksum `18/18`；最终 project memory `0 errors / 0 warnings`；同盘 capsule 不构成异盘灾难恢复；
- Durable handoff：规格 `docs/superpowers/specs/2026-08-04-v1-portfolio-evidence-preservation-design.md`；计划 `docs/superpowers/plans/2026-08-04-v1-portfolio-evidence-preservation.md`；运行账本 `.superpowers/sdd/2026-08-04-v1-portfolio-evidence-preservation/progress.md`；
- 最后更新：2026-08-10；重开触发：冻结 checksum/close 失败、源路径/许可/隐私状态变化、需要异盘灾难恢复或最终学校 PDF 策展。已冻结文本不得覆盖；历史 `RUN-DOCX-01 FAIL` 不得删除。

## V1 教师交付收口

- 仓库外恢复点已保存三条项目分支、四条有效 Codex tree 引用、两个无分支历史提交、修复前完整 .git 和 31 个未提交文件；
- 41 字节损坏 Codex 引用已按原字节移入恢复点，Git 的 show-ref、fsck 与 log --all 恢复为退出码 0；
- V1 定稿分支 `codex/v1-teacher-finalize` 从最新评分修正版 `34f97e2` 创建；
- 已提交预检/决策/规格检查点 `e57ac06`，以及低保真历史快照与正式规则边界修正 `ffee1b3`；
- `release/v1-teacher-handoff.json` 将高保真教师演示设为唯一 canonical，低保真与数值实验台明确排除在正式教师包之外；
- 基线唯一失败被确认是缺失配套实现的历史静态测试契约，而原工作区版本仍含旧结算和错误成本，未被迁入；测试已改为与 legacy 身份相符的基础完整性 smoke；
- 根 README、教师“请先看”、项目说明和演示说明已经创建；两份教师 HTML 在桌面与手机真实浏览器中完成视觉复核；
- 完整构建与测试为 `81/81`，TypeScript 与 ESLint 通过；canonical 与 `dist/client` 哈希一致；
- V1 最终提交与 annotated tag 已形成明确冻结点；没有合并或移动 `main`，也没有推送、部署或公开托管。本 V2 迁移不修改教师交付内容。

## 五份可运行文件

| 文件 | 当前用途 |
|---|---|
| `掌眼_V2_玩家试玩版.html` | 当前 V2 玩家入口；三案例、稳定局号与双轨结算；不含教师／开发表面 |
| `掌眼_V2_高保真演示.html` | V2 非公开首案开发／诊断运行时；当前文件来自较早构建检查点，可用于技术解释但不能替代当前玩家版 |
| `掌眼_高保真教师演示.html` | V1 唯一 canonical 冻结演示；只作老师旧演示、回归和历史对照 |
| `掌眼_低保真交互原型.html` | 历史规则定位与调试快照；当前数值和产品决策可忽略 |
| `掌眼_数值实验台.html` | V1 时期隔离实验模型；只证明自身内部一致，不代表当前生产数值或平衡 |

五份文件的精确大小、哈希、生成身份和关注级别见 [EXP-024](evidence/EXP-024-current-checkpoint-and-public-html-inventory.md)。`public` 与 `dist/client` 字节一致只证明复制完整，不证明其身份仍是当前产品权威。

## 已完成且已验证

- 普通 Web / H5 路线已经确认；当前不需要 Unity、微信小游戏 AppID 或小游戏提审工程；
- 新增独立高保真首案，完整覆盖来客、器物观察、证据收录、具体证据询问、有限议价和多维复盘；
- 器物使用非写实二维插画定位，细纹、胶痕、锁扣和木胎判断由文字承担；
- 调查行动点与议价容量分开计算；正式报价只消耗议价容量；
- 首次正式报价后锁定调查，NPC 还价不重复扣容量，容量耗尽后仍可买下或拒绝；
- 证据簿保持只读；玩家只能主动公开选中的具体证据，未选证据继续私有；
- 玩家区只显示定性 NPC 氛围；精确状态和规则进程在桌面外置开发栏，手机端隐藏；
- 开发栏默认收起；隐藏真相、真实价值和品质只在本局结束后解锁；
- 公开“现代胶痕”导致 `80 → 65` 正式重估时，玩家区紧邻显示旧价、新价和公开原因；
- 复盘不再显示旧 0—100 客观分，而是显示综合等级、器物品质、净收益、议价表现和判断质量；
- 高保真输出是无外网依赖的自包含单文件，并由完整构建复制到 `dist/client/`；
- 2026-08-03 V1 收口后的完整 `npm.cmd test` 为 `81/81`，`npx.cmd tsc --noEmit` 与 `npm.cmd run lint` 均通过；历史低保真只保留自包含与嵌入 client 的 smoke，现行买断和资源语义继续由 TypeScript rules 与高保真流程测试保护；
- 2026-08-03 两份高保真生成物的 SHA-256 均为 `8B46D415627A2BDAA6D90C68C61189496DEAACCC1D3F1213ADC45A794464925B`；
- 2026-08-03 已用本机 Chrome headless + CDP 附着复核 canonical `file://`：`1440 × 1000` 与 `390 × 844` 的单条强证据终局均为判断质量 `A`、综合等级 `B`，并显示同一条单点证据原因；桌面开发栏显示 `D=100 / C=32 / R=50 / J=73`、`base A / cap S / final A`，玩家 `main` 不含精确 D/C/R/J 标签，移动端没有 Developer Rail 或展开按钮；两种视口无横向溢出、目标页控制台均为 `0 errors / 0 warnings`；
- 两种视口均完成“现代胶痕公开、要价 `80 → 65`、报价 `50`、NPC 还价 `58`”回归。买下与拒绝均可见、启用且 trial-clickable；桌面按钮底部余量 `45.109px`，移动端 `16.109px`，移动端 `MAIN scrollTop=126 / clientHeight=716 / scrollHeight=843`。详见 [EXP-013](evidence/EXP-013-judgment-quality-scoring.md) 与其四张浏览器截图；
- 2026-08-03 V1 收口再次用 Playwright 驱动真实 Chromium 在 `1440 × 1000` 与 `390 × 844` 完整走通“收证 → 证据簿只读返回 → 具体证据公开 → `80 → 65` → 报价 `50` → 还价 `58` → 买下 → 复盘”；两端均为综合 `A`、净结果 `+7`、判断质量 `A`，无横向溢出，控制台 `0 errors / 0 warnings`；
- 两份教师 HTML 均在桌面与手机视口通过全页视觉复核，无横向溢出与控制台错误；它们无脚本、无外部资源依赖，并明确 `80 → 65 → 58` 只是演示路径而非平衡结论；
- `390 × 844` 当前可见操作控件均达到至少 `44 × 44px`；
- 无鼠标键盘激活路径可以完成检查、收证、证据询问、报价和成交；主阶段切换后焦点分别落到调查、证据结果、交易和复盘；
- 证据簿浮层打开后进入安全焦点，`Escape` 关闭后返回证据簿入口，内容区没有询问或交易动作。

详细证据见 [EXP-012](evidence/EXP-012-high-fidelity-teacher-demo.md)、[EXP-013](evidence/EXP-013-judgment-quality-scoring.md) 与 [EXP-015](evidence/EXP-015-v1-teacher-handoff.md)。

## 已完成但尚未验证

- 当前等级阈值、议价容量、参考报价、NPC 状态权重和案件费用仍是工作参数，尚未证明平衡或有趣；
- 用户已确认老师能够找到关键入口、理解证据公开并完成交易；这一确认只适用于当前老师与演示闭环，尚不能外推为一般目标玩家验证；
- V2 已有三个类别案例，但内容仍是初始样本，尚未经过文化专家校订或一般玩家测试，不能代表中级场、高级场和长期厚尾价值体验已经成立；
- 高保真器物图仍是程序内联二维插画，不是最终正式美术资产；
- 精品、珍品局末写实器物讲解图只被记录为后续方向，本轮没有制作；
- 单文件可以离线展示，但公开托管、HTTPS、微信聊天内置浏览器和公众号链接实机仍未验证；
- Safari、320px 极窄屏、软键盘遮挡、真实设备 safe-area 尚未做专项验证。
- 既有 `npm audit --omit=dev` 记录曾报告 Next.js 服务端依赖链有 3 项高危公告；2026-08-03 冻结前刷新因 npm registry `ECONNRESET` 未取得在线结果。离线单文件不使用该服务端，但公开部署前必须在网络可用时重新审计、升级并回归。

## V2 未实现并转交 V3 重新采用的候选

- [DEC-014](decisions/DEC-014-human-object-dual-appraisal.md) 在 V2 曾批准“器物／NPC 同屏、人物表现替代事实标签、统一案卷、三张证据图、器物双后验、双向人物认知、连续对话、受控 NPC 误导、D20 洞察附加层、人物鉴定与单列察人分”。其中第一批共享展示外壳、漆器手机切片和器物双后验已经实现；三张证据图及其可见性／共享元数据、玩家人物线索与明确提交、NPC 器物知识账本与对玩家模型、画像／关系／成交意愿分账、8 AP、连续对话、受控误导、D20 与察人分仍未实现。DEC-014 已归档，这些未实现方向只有在 V3 重新 Adopt／Borrow 后才生效；
- 第一批产品检查点已经按用户决定停放，不自动进入视觉精修、证据图代码或 D20。范围讨论形成的 V3 设计材料在独立版本中继续收敛，不回写 V2；
- “客观收益与能力评分关系”继续作为后续 Critical 证据设计，排在本轮体验／系统重构和评分维度稳定之后；
- `V2-RESEARCH-001` 已完成；`EXP-019` 的“内部确定性规则核 + 可替换适配层”已经落实为本轮实现。任何后续新生产依赖仍需单独证明必要性；
- 面向老师的自动化、低认知门槛层继续作为后续上层能力，不在治理迁移中提前编码；
- `project-agent-governance` 的本机文件可找到，但当前可调用 Skill 清单尚未暴露它；若以后需要持久 Agent 拓扑，必须现场核验注册状态，不能假装已调用。

## 当前最大风险

V1 已有明确冻结引用；V2 已批准冻结标签名称，实际引用须在提交后从 Git 现场确认。当前最大风险转为 V3 继承时重新制造多套权威、把草稿冒充规格或产生治理误配：

1. 未来改动可能重新让实验台、历史单文件、生成文件或测试成为第二数值权威；本轮已完成生产权威收敛，`EXP-020` 记录当前审计边界；
2. 若整体引入 boardgame.io、Yuka、OpenSpiel 或让 ink 持有生产数值，会新增第二状态机或与现有回放骨架重复；
3. 根工作区仍保存 31 项历史混合改动，V2 不能把这些内容整包导入或误认成冻结基线；
4. 当前三个初始案例尚未经专家校订或一般玩家测试，无法证明文化准确性、数值平衡、不同案件的信息披露与一般玩家体验；
5. 当前证据仍是平铺来源／维度覆盖，NPC 行为模板又能通过作者似然直接影响器物后验；在拆分人物可信度与器物推断前加入 D20 会放大错误因果；
6. 若把器物估值、人物认知、关系状态、成交意愿和行为仲裁压成一个轴，人物反应会失真；若直接随机排列画像参数，又会产生不可解释的组合爆炸；
7. 当前人物事实标签和中文文案解析同时参与议价评分，显示文案与规则参数尚未解耦；
8. 新任务若未正确加载 V2 Skill 或错误同时启用 V1/V2，会破坏单一项目负责人入口；
9. 公开 H5 的依赖安全、真实微信环境和一般目标玩家体验仍未验证。

## 当前阻塞

以下只描述 V2 冻结／交接时仍需从现场确认的事项，不再承载 V3 活动计划：

- V2 冻结前的项目内验证没有技术阻塞；提交与 annotated tag 是提交外部身份门，结果必须从 Git 现场核对；
- 第一批漆器手机场景已按用户选择结构化停放，V2 不再继续视觉精修、证据图代码、人物认知、Understand Anything 试点、议价／N 分规格或产品数值修改；
- “两部分游戏”的范围讨论及其后的真相拓扑构思已转入 V3 设计材料；它们不再是 V2 当前检查点，也不自动成为 V3 已批准规格；
- `project-agent-governance` 是否会在新顶层任务中出现在可调用 Skill 清单，仍需现场核验；
- 公开 H5 地址和微信内实机验证需要后续选择托管方式，不属于当前 V2 冻结／交接范围。

## 当前边界

- V1 tag、V1 worktree 和原工作区未提交资产保持不变；
- 不创建持久 Agent、不扩大 Agent 权限、不改变决策权限、不移除独立验证边界；
- 不迁移 Unity，不制作微信小游戏工程；
- 不把高保真完成等同于玩法平衡或正式美术验收；
- 当前文档批准不等于产品已实现；没有真实截图确认前，不把无溢出或自动测试外推为手机布局获批；
- 不接真实市场价格、登录、云存档、支付或长期经济；
- 不安装候选框架或仓库解释工具、不上传本地仓库、不启用自动 Git hook；不继续扩写第四案例，不把自动回归或本次产品工程完成替代平衡、真人体验或正式发布证据；
- 在用户批准新数值语义前，不修复 N／D、接受概率、`priceTick` 或其他只读审查 finding。

## 关键记录

- [统一领域语境](../../CONTEXT.md)
- [宏观驾驶舱入口](overview/00-START-HERE.md)
- [DEC-003：调查与议价资源](decisions/DEC-003-integrated-investigation-loop.md)
- [DEC-004：等级制结算](decisions/DEC-004-objective-outcome-and-judgment.md)
- [DEC-007：具体证据公开](decisions/DEC-007-dual-belief-and-strategic-disclosure.md)
- [DEC-008：普通网页 H5](decisions/DEC-008-standard-web-h5-delivery.md)
- [DEC-009：二维插画与文字证据](decisions/DEC-009-illustrated-object-textual-inspection.md)
- [DEC-010：V1 最小修正与封存](decisions/DEC-010-v1-minimal-fix-and-freeze.md)
- [DEC-011：V2 启动审查与数值权威源](decisions/DEC-011-v2-startup-audit-and-numeric-authority.md)
- [EXP-012：高保真教师演示验证](evidence/EXP-012-high-fidelity-teacher-demo.md)
- [EXP-013：判断质量评分修正验证](evidence/EXP-013-judgment-quality-scoring.md)
- [EXP-014：V1 定稿预检与恢复点](evidence/EXP-014-v1-preflight-recovery-and-classification.md)
- [EXP-015：V1 教师交付收口与冻结前验证](evidence/EXP-015-v1-teacher-handoff.md)
- [EXP-016：V2 启动只读审查与数值权威边界](evidence/EXP-016-v2-startup-audit.md)
- [EXP-017：学校作品集成果/过程取舍核实](evidence/EXP-017-portfolio-curation-guidance-review.md)
- [EXP-018：V1 基线与作品集原始证据保全](evidence/EXP-018-v1-portfolio-evidence-preservation.md)
- [EXP-019：V2 同类框架与社区方案只读调研](evidence/EXP-019-v2-framework-research.md)
- [CH-003：必检 run 失败后的可审计重试语义](challenges/resolved/CH-003-verification-run-retry-semantics.md)
- [DEC-012：必检 run 使用追加式 supersession](decisions/DEC-012-verification-run-supersession.md)
- [DEC-013：V2 独立玩家试玩版与双轨结算](decisions/DEC-013-v2-player-trial-and-dual-track-scoring.md)
- [CH-005：NPC 受控误导与人与物双重鉴定边界](challenges/resolved/CH-005-human-object-dual-appraisal-boundary.md)
- [DEC-014：人与物双重鉴定、证据拓扑与洞察附加层](decisions/DEC-014-human-object-dual-appraisal.md)
- [DEC-015：冻结 V2 玩家试玩基线并从其启动 V3 设计阶段](decisions/DEC-015-v2-freeze-and-v3-bootstrap.md)
- [EXP-021：V2 玩家试玩版、三案例与双轨评分验证](evidence/EXP-021-v2-player-trial-and-dual-track-scoring.md)
- [EXP-022：玩家试玩版“人与物”体验、数值与证据结构审查](evidence/EXP-022-human-object-player-trial-audit.md)
- [EXP-023：首个手机“人与物同屏”玩家切片](evidence/EXP-023-first-mobile-human-object-slice.md)
- [EXP-024：当前检查点与 public HTML 身份清单](evidence/EXP-024-current-checkpoint-and-public-html-inventory.md)
- [EXP-025：自然语言仓库解释工具只读调研](evidence/EXP-025-natural-language-codebase-tools.md)
- [EXP-026：现行 V2 数值系统自然语言地图](evidence/EXP-026-current-numeric-system-atlas.md)
- [EXP-027：双向认知边界与 NPC 混合行为架构转折](evidence/EXP-027-bidirectional-cognition-design-turning-point.md)
- [EXP-028：Project Co-leader V2 决策前调查门禁](evidence/EXP-028-project-co-leader-research-before-decision-gate.md)
- [EXP-029：V2 玩家试玩原型冻结](evidence/EXP-029-v2-player-prototype-freeze.md)
- [V2 轻量作品集系统边界转折卡](../portfolio/v2-process/2026-08-13-system-boundary-turning-point.md)
- [V1 基线与作品集原始证据保全设计](../superpowers/specs/2026-08-04-v1-portfolio-evidence-preservation-design.md)
- [V1 作品集证据保全实施计划](../superpowers/plans/2026-08-04-v1-portfolio-evidence-preservation.md)
