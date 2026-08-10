# Current State

> 只保存项目此刻的真实状态。历史结论进入 Decision、Evidence 或 archive。

更新时间：2026-08-10

## 一句话状态

V1 已冻结在提交 `f0b20b8` 与 annotated tag `v1.0.0-teacher-handoff`；V2 统一数值权威源的 Task 1—14 已按批准计划实现并逐项提交。Task 15 的静态/全量/浏览器验证已完成，等待控制器安排的独立只读最终复核；尚未 push、merge 或部署。

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

- Workstream：`V2-NUMERIC-AUTHORITY-EXEC-001`；状态：Controller Review Pending；责任载体：Project Co-Leader 控制器 + 逐任务临时 Agent；
- 当前检查点：Task 1—14 已闭环；Task 15 已完成 authority audit、完整验证、真实浏览器回归与项目 handoff。`npm.cmd test` 为 `88/88 PASS`，指定聚焦套件 `14/14 PASS`，TypeScript 通过，lint 为 `0 errors / 17 warnings`，V1 canonical SHA-256 仍为 `8B46D415627A2BDAA6D90C68C61189496DEAACCC1D3F1213ADC45A794464925B`；V2 生成单文件 provenance 已从旧 `a7f1b38`/dirty 更新为 `d366476`/clean。独立最终只读复核未由本任务执行，保留给控制器；
- 授权边界：允许按批准计划修改产品代码、使用逐任务临时 Agent，并在 `codex/v2-bootstrap` 中按每任务明确白名单创建本地 commit；不允许 stage/commit 既有无关改动，不允许 push/merge/deploy；
- 已知 changed surface：Task 1—3 的边界、基线与身份白名单文件及本 ledger；Phase 2 仅允许 Task 4 明示的数值/随机模块与调用点。已知 preserved surface：V1 canonical 与历史低保真字节、十场景首案语义、fixture、V1 tag/worktree、原工作区 31 项、教师交付包、作品集 capsule 与既有未提交资产；
- 验证状态：Task 1 `11/11 PASS`；Task 2 `28/28` 与完整 `82/82 PASS`；Task 3 身份/基线/规则 `30/30 PASS`；Task 15 完整 `88/88 PASS`、聚焦 `14/14 PASS`、TypeScript 通过、lint `0 errors / 17 warnings`；桌面 `1440×1000` 与移动 `390×844` 均无横向溢出、控制台 `0 errors / 0 warnings`。fixture SHA-256 持续为 `909075060FC994501D1D4B6505D203AB70A9B88F639488C803510523CAF0A522`；
- Durable handoff：计划 `docs/superpowers/plans/2026-08-10-v2-numeric-authority.md`，运行账本 `.superpowers/sdd/2026-08-10-v2-numeric-authority/progress.md`，最终验证见 `EXP-020` 与未暂存 Task 15 report；最后更新：2026-08-10；停止/重开触发：独立最终审查出现 load-bearing finding、完整/类型/lint/authority/browser 任一门失败，或 V1/基线/provenance 漂移。治理 Minor：`AGENT-ROSTER.md` 缺失，需在最终 handoff 说明；当前会话没有 `project-agent-governance` capability，不擅自建立持久 Agent。

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

## 三份可运行文件

| 文件 | 当前用途 |
|---|---|
| `掌眼_低保真交互原型.html` | 历史规则定位、对照与开发调试；不是当前生产规则权威 |
| `掌眼_数值实验台.html` | 批量模拟、参数实验与公式检查；结论仍是工作假设 |
| `掌眼_高保真教师演示.html` | V1 唯一 canonical，供老师演示与玩家体验审查 |

高保真没有覆盖低保真。它使用独立界面源文件，但复用同一案件内容和 TypeScript 规则核心。

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
- 当前只有一个低级场教学案，不能代表中级场、高级场和厚尾价值体验已经成立；
- 高保真器物图仍是程序内联二维插画，不是最终正式美术资产；
- 精品、珍品局末写实器物讲解图只被记录为后续方向，本轮没有制作；
- 单文件可以离线展示，但公开托管、HTTPS、微信聊天内置浏览器和公众号链接实机仍未验证；
- Safari、320px 极窄屏、软键盘遮挡、真实设备 safe-area 尚未做专项验证。
- 既有 `npm audit --omit=dev` 记录曾报告 Next.js 服务端依赖链有 3 项高危公告；2026-08-03 冻结前刷新因 npm registry `ECONNRESET` 未取得在线结果。离线单文件不使用该服务端，但公开部署前必须在网络可用时重新审计、升级并回归。

## 已批准但尚未实现

- V2 启动审查、书面规格、15 任务实施、Task 15 自动/浏览器验证均已完成；这里不再把“统一数值权威源尚未开始”作为当前事实，最终独立只读复核仍待控制器；
- `V2-RESEARCH-001` 已完成；`EXP-019` 的“内部确定性规则核 + 可替换适配层”已经落实为本轮实现。任何后续新生产依赖仍需单独证明必要性；
- 面向老师的自动化、低认知门槛层继续作为后续上层能力，不在治理迁移中提前编码；
- `project-agent-governance` 的本机文件可找到，但当前可调用 Skill 清单尚未暴露它；若以后需要持久 Agent 拓扑，必须现场核验注册状态，不能假装已调用。

## 当前最大风险

V1 已有明确冻结引用，当前最大风险转为 V2 演进时重新制造多套权威和治理误配：

1. 未来改动可能重新让实验台、历史单文件、生成文件或测试成为第二数值权威；本轮已完成生产权威收敛，`EXP-020` 记录当前审计边界；
2. 若整体引入 boardgame.io、Yuka、OpenSpiel 或让 ink 持有生产数值，会新增第二状态机或与现有回放骨架重复；
3. 根工作区仍保存 31 项历史混合改动，V2 不能把这些内容整包导入或误认成冻结基线；
4. 当前只有一个简单教学案，无法证明数值平衡、不同案件的信息披露与一般玩家体验；
5. 新任务若未正确加载 V2 Skill 或错误同时启用 V1/V2，会破坏单一项目负责人入口；
6. 公开 H5 的依赖安全、真实微信环境和一般目标玩家体验仍未验证。

## 当前阻塞

- V2 最小治理迁移没有技术阻塞；
- 当前产品工作没有技术阻塞；当前流程门是控制器安排的独立最终只读复核，不应倒退为再次等待书面规格或实施计划批准；
- `project-agent-governance` 是否会在新顶层任务中出现在可调用 Skill 清单，仍需现场核验；
- 公开 H5 地址和微信内实机验证需要后续选择托管方式，不属于当前 V2 启动范围。

## 当前边界

- V1 tag、V1 worktree 和原工作区未提交资产保持不变；
- 不创建持久 Agent、不扩大 Agent 权限、不改变决策权限、不移除独立验证边界；
- 不迁移 Unity，不制作微信小游戏工程；
- 不把高保真完成等同于玩法平衡或正式美术验收；
- 不接真实市场价格、登录、云存档、支付或长期经济；
- 独立最终复核前不宣称本 workstream 已完成；不安装候选框架、不扩写第二案件、不把自动回归替代平衡或真人体验证据。

## 关键记录

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
- [V1 基线与作品集原始证据保全设计](../superpowers/specs/2026-08-04-v1-portfolio-evidence-preservation-design.md)
- [V1 作品集证据保全实施计划](../superpowers/plans/2026-08-04-v1-portfolio-evidence-preservation.md)
