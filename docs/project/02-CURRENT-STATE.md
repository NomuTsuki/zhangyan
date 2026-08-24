# Current State

> 只保存 V3 此刻的真实状态。V2 终态由 frozen tag 与对应项目记录保留。

更新时间：2026-08-24

## 一句话状态

本仓库已于 2026-08-24 完成 **V3 Design 冻结交接**：作者规格、渐进玩家知识地图核心语义与首案稳定 G2 边界已经留存，知识地图低保真切片尚未开始；后续工作迁移至新仓库，本仓库只作存档。

## V3 于本日冻结交接

- **一句话状态：** 当前仓库冻结在“作者侧规格已通过限定结构验证，玩家侧渐进知识地图核心语义已批准，但新版知识地图低保真切片尚未制作”的检查点；
- **本次收尾提交：** 补入 DEC-027、首案 G2 稳定性与场景范围重分类覆盖层及隔离验证脚本，统一项目记忆、overview、风险与导航投影，并加入仓库冻结路标；另在 `codex/archive-parked-legacy-assets` 保存 14 份完整周报／模板（`78d650a`）和旧工作树 parked 资产（`9da0758`）；
- **Parked 与重启条件：** 旧“双后验最小玩家切片”三个未进入冻结 tag 的遗留文件、六份历史对齐文档及第三周报告生成材料只作历史保存。仅当新仓库明确需要考古 V1/V2 原型或重建第三周报告时重开；重开前必须先与 `v1.0.0-teacher-handoff`／`v2.0.0-player-prototype-freeze` 比对，恢复来源与测试关系，不能把 parked 内容静默继承为 V3 规格；
- **收尾验证：** 项目记忆检查 `0 errors / 0 warnings`，冻结作者合同 `40/40`、新增范围合同 `6/6`，本轮 18 份 Markdown 的 287 个本地链接 `0 broken`，`git diff --check` 通过；14 份周报／模板的 OOXML 包与全部压缩条目可读；
- **明确未验证：** 冻结不背书玩家理解、趣味、知识地图具体布局、粗概率表达、当前最优调查排序数值、真人盲测、调查成本／市场平衡、具名领域专家意见、正式产品架构或任何新版产品代码；周报只完成 OOXML 包结构可读检查，没有在本次收尾中重新逐页视觉验收；
- **迁移后的下一步：** 在新仓库以 DEC-024／026／027 和冻结作者规格为输入，制作与正式产品代码隔离的**知识地图低保真切片**；若切片暴露新的玩家选择、作者图／玩家图边界或数值问题，再一次只对齐一个问题。

## 已完成且已验证

- V2 annotated tag `v2.0.0-player-prototype-freeze` 为真实 `tag` 对象，解析到提交 `32db763e2fcdcfcb5f090b38405498105d904e19`；V2 工作树在创建 V3 前干净；
- V3 分支 `codex/v3-object-truth-topology` 从该提交建立，创建时 HEAD 与 tag 目标一致；
- 五份 Markdown 原始材料与一张 PNG 已从 `D:\实习工作\掌眼_V3_设计暂存` 迁入，六项源／目标 SHA-256 一致；
- V2 的实际终点和未实现边界已由 [DEC-015](decisions/DEC-015-v2-freeze-and-v3-bootstrap.md) 与 [EXP-029](evidence/EXP-029-v2-player-prototype-freeze.md) 固定。

## 已完成但尚未验证

- 物品真相拓扑、玩家引导、定量价值／信息价值／收手研究已经形成候选原则和 Unknown，但没有通过第一纸面切片或无答案玩家测试；
- [DEC-017](decisions/DEC-017-v3-stage-claims-stopping-and-fixed-price-listing.md) 已固定“鉴定主张作为中间节点、阶段成果不自动结束、玩家手动停手、系统估值／玩家挂牌／客观市场三轨分离、单次一口价挂牌和局末完整揭示”；这些语义尚未实现或验证；
- [DEC-018](decisions/DEC-018-v3-provisional-claim-thresholds-and-valuation-projection.md) 已把阶段迟滞、证据依赖、后验价值混合和多峰投影登记为 Experimental 默认；文献与反例只支持结构选择，不证明具体数值可玩；
- [DEC-019](decisions/DEC-019-v3-evidence-rich-first-object-and-legacy-npc-exclusion.md) 已固定第一器物跨品类筛选、停止旧内容壳继承和 V2 NPC 逻辑排除边界；
- [DEC-020](decisions/DEC-020-v3-first-ceramic-object-and-core-dispute.md) 已批准 Hong Bowl 修复史的虚构外销瓷大碗类比结构，并固定“18 世纪末中国外销瓷基本成立，但重组／补绘程度与价值仍不清楚”为核心争议；阶段交接补充已记录“真相先于证据、首案手工设计、程序化生成后期 Unknown”。DEC-021 已补齐具体作者真相包，第一纸面拓扑也已形成 Design Candidate；确定性结构演算已通过，正式数值、领域与玩法验证仍未完成；
- [DEC-021](decisions/DEC-021-v3-first-ceramic-objective-truth-package-and-gameplay-first-authorship.md) 已在用户直接确认的“无外来旧片、非游戏性器物个性不再逐项上交”边界内，固定珠江商馆与帆船图大碗的同器原片、多阶段修复、空间材料图、两条文档链和正向／负向／转向发现；这是作者真相设计，不是已验证玩法、文化结论或市场数值；
- [DEC-022](decisions/DEC-022-v3-first-ceramic-three-result-gates-over-branching-evidence.md) 已固定第一陶瓷切片的三档结果、开放调查路线、意义门而非行动门、早期证据保留／后续重释、结果 2 可停手与结果 3 多证据汇合边界；三档精确 `proofRule`、玩家表现和数值未批准；
- [DEC-023](decisions/DEC-023-v3-pre-product-validation-and-player-projection-boundary.md) 已固定正式产品代码前依次通过作者结构／演算、限定领域、用户作者规格、玩家微循环／真人测试、数值模拟、整局原型／真人测试、V2 技术审查和明确开工批准；系统整理／玩家确认、粗数按需、常驻方向／提示按需加深继续有效。其“文字首层”已经由 DEC-026 收窄为地图上的就地解释，不再充当玩家知识结构的主骨架；具体替代 UI、测试合同、正式数值和产品实现仍未批准；
- [DEC-024](decisions/DEC-024-v3-first-ceramic-author-spec-approval-and-player-microcycle-entry.md) 已记录用户批准当前冻结作者规格作为玩家微循环输入；批准不扩张结构 Pass，也不批准具体 UI、粗概率组件、真人测试合同、数值或产品代码；
- [DEC-026](decisions/DEC-026-v3-progressive-player-knowledge-map-and-current-best-hint.md) 已固定玩家图的地点／两态道路／地标／足迹／罗盘语法、纯黑与显影不变量、竞争解释保留、由已知内容生长的问题级探索前沿，以及玩家主动请求最强帮助时点名当前最优调查。该决定批准的是产品语义与排序原则，不批准具体界面、概率组件、行动权重、并列规则、焦点作用域、测试或代码；
- [DEC-027](decisions/DEC-027-v3-first-ceramic-stable-g2-and-post-g2-fallback.md) 已固定首案 G2 为稳定里程碑：后段局部 Finding、档案关系、价值和 G3 路线可以变化或被排除，未形成 G3 时以更丰富且付出成本的 G2 收手；永久 G2→G1 不再是首案正常内容，但继续作为通用引擎防御、未来案件能力与对抗性测试保留；
- [第一器物纸面证据拓扑 v0.1](evidence/v3-design/2026-08-15-first-ceramic-paper-evidence-topology-v0.md) 已把真相包拆成原始观察、只读推断 Finding、依赖单元、八个互斥身份／修复史／关键材料解释、条件价值情景、Draft 主张／摘要、调查动作、估值连接和经济终局。其事实分账、联合后验、分轴、替代／回退和区域覆盖继续作为结构底稿；“单身份锚点＋并列深挖”阶段解释及旧演算入口已经废止；
- [第一器物三档作者覆盖层 v0.1](evidence/v3-design/2026-08-16-first-ceramic-three-result-gate-author-overlay-v0.md) 保留为方向纠偏记录；[三档作者模型 v0.2](evidence/v3-design/2026-08-17-first-ceramic-three-result-author-model-v0-2.md) 已把修复史细化为三态，逐包枚举 12 个核心候选解释，写出 G1／G2／G3 联合支持与 `proofRule`、G3 允许未知、结果 2—3 局部成果、“证据可提前、意义延迟、只计一次”合同，以及新区分／独立印证／重复／反向四类探测回报、负向结果能力门和按主张范围生效的反证层级。静态规格与确定性场景已分别取得独立 Pass；领域、玩家、成本、数值和趣味仍未验证；
- [第一器物具体一局与作者侧对抗复核 v0](evidence/v3-design/2026-08-20-first-ceramic-concrete-session-and-owner-structural-review-v0.md) 已用 15 拍演示路线和四条换序把抽象模型落回具体行动、观察、判断、停手和市场揭示，并完成模型负责人对抗复核。三项表达／前置问题及一项 G3 外推歧义已修复，后续补入重复信息、阴性能力门与抽象反证作用域验收，复核输入扩为 `OR-01—12`；精确概率、调查成本、路线非支配、玩家概率组件与独立 QA 仍未验证；
- [第一器物独立结构复核 v0](evidence/v3-design/2026-08-20-first-ceramic-independent-structural-review-v0.md) 由临时只读复核者对 v0.2、具体一局、四条换序、`OR-01—12` 与必要 v0.1 继承段落给出 Pass；它关闭规格层阻断并允许进入确定性演算，但明确不验证实际后验、换序、领域、玩家、趣味、数值或代码。唯一 Minor 玩家投影状态漂移已修复并由同一复核者复查关闭；
- [第一器物确定性作者侧场景演算 v0](evidence/v3-design/2026-08-20-first-ceramic-deterministic-author-scenarios-v0.md) 保存隔离求解器、22 个场景、34 条已声明合法顺序、7,128 个黄金状态单元、完整失败修复史和第 5 轮独立 Pass。它验证固定夹具的规则后果，不是产品架构、领域专家意见、玩法证据或正式数值；
- [第一器物限定领域复核 v0](evidence/v3-design/2026-08-20-first-ceramic-limited-domain-review-v0.md) 对材料、检测、修复史、对象／档案连续性、静态陈列和方向性价值因果给出 Conditional Pass：客观真相包与 G1／G2 核心含义可保留；`DR-B05` 暴露 T2／T3 档案路线缺少对象绑定，`DR-B01—04` 要求收窄 G3 的 X 射线、试窗外推、材料／层序分析和静态陈列证明能力。该案头结论不是具名外部专家签字，也不证明玩法或数值成立；
- [三档作者模型 v0.3](evidence/v3-design/2026-08-21-first-ceramic-three-result-author-model-v0-3.md) 已把档案改成玩家可感知的三类关系问题，保留候选记录早拿的局部价值与玩家直觉自由，并把深档案放在 G2 软转折后的主要注意力位置；[具体一局 v0.1](evidence/v3-design/2026-08-21-first-ceramic-concrete-session-v0-1.md) 改为纯物证主线先形成 G2、再通过多记录／多阶段关系重建走向 G3；[确定性作者侧场景演算 v1](evidence/v3-design/2026-08-21-first-ceramic-deterministic-author-scenarios-v1.md) 保存首轮独立 Fail、负责人 39/40 失败、最终 40/40 与同一只读复核者 Pass。其冻结字节与历史结论继续保留，但三个永久 G2 降级场景现仅证明通用防御能力；[G2 稳定性与场景范围重分类 v0](evidence/v3-design/2026-08-23-first-ceramic-g2-stability-and-scenario-scope-reclassification-v0.md) 追加当前首案范围合同；
- [限定领域复核闭环 v0](evidence/v3-design/2026-08-21-first-ceramic-limited-domain-review-closure-v0.md) 已按 `Adopt／Borrow／Reject` 记录 `DR-B01—05` 的作者映射：X 射线逐区可读、表面点位／区域分账、材料基底／层序拆分、静态陈列条件化，以及拒绝单一 `ARCHIVE_OBJECT_MATCH`、采用关系状态。它关闭的是作者接口缺口，不关闭实物可达性、具名专家、玩家理解或玩法验证；
- [第一器物候选家族筛选研究](evidence/v3-design/2026-08-14-first-object-candidate-screening-research.md) 已完成七类横向比较：陶瓷／瓷器、钱币和有条件的历史机械表分类为下一轮单件研究 `Adopt`，青铜／家具为 `Borrow`，漆器为 `Unknown`，绘画／书法为当前首案 `Reject` 但借用检查结构；这些分类不等于最终器物选择，也未证明玩法成立；
- [陶瓷／瓷器具体对象候选研究](evidence/v3-design/2026-08-15-ceramic-specific-object-candidates.md) 已把候选限制为两个 accession 级现实锚点；用户随后通过 DEC-020 选择主推荐 A。候选研究仍只是来源证据，不会因被采用而变成产品规格，馆藏品本身也不被质疑；
- [第一外销瓷真相包与关卡创作／自动化边界研究](evidence/v3-design/2026-08-15-first-ceramic-truth-package-and-authoring-boundary-research.md) 已按身份／制造、空间材料图、损伤／修复、装饰／补绘、稳定性、provenance、保护档案与固定市场情景建立候选结构，并推荐“多阶段修复、无外来旧片”；来源只支持分层与检查边界，不批准虚构事实、数值或趣味；
- 两份轻量作品集过程卡已经保存；[作者拓扑过程资产](evidence/v3-design/2026-08-13-object-truth-topology-portfolio-process-asset.md) 已续记从概念图、领域纠偏、独立 Fail 到 `40/40` Pass 与用户批准的作者侧转折，[2026-08-14 派生资产](evidence/v3-design/2026-08-14-v3-decision-and-numeric-governance-portfolio-process-asset.md) 记录数值治理转折。它们仍只是候选过程证据，须与未来玩家画面和盲测结果配对后才可筛入最终 PDF；
- “前中期较快下降、后期小步承担风险”已经澄清为叙事与决策节奏，不是另起连续检定玩法；尚未做成可玩节奏；
- `2026-08-26` 与 `2026-10-20` 是内部计划目标／候选，不是已经验证可达的排期或外部截止日。

## Active Work Ledger

- Workstream：`V3-FIRST-PAPER-TOPOLOGY-001`；状态：Completed / Frozen base Pass preserved / DEC-027 scope overlay independently verified；责任载体：V3 作者模型负责人；当前检查点：v0.3、具体一局 v0.1、领域闭环和旧六文件 `40/40` 独立 Pass 均保持冻结。用户于 2026-08-23 批准 DEC-027，只重开“哪些场景属于首案正常内容”的解释层：三个永久 G2 降级场景改列通用防御／未来案件，首案纯物证 G2 遇后段局部冲突仍保持 G2。新增范围覆盖层经负责人 `2/2 node --check`、`6/6` 测试、旧六哈希 `6/6` 后取得只读独立 **Pass**；该结论不验证 UI、玩家体验、数值、成本张力、领域真实性、历史状态降级生命周期或产品代码。durable handoff：[G2 稳定性与场景范围重分类 v0](evidence/v3-design/2026-08-23-first-ceramic-g2-stability-and-scenario-scope-reclassification-v0.md)；
- Workstream：`V3-PLAYER-KNOWLEDGE-MICROCYCLE-001`；状态：Parked / Repository frozen / Replacement prototype not started；责任载体：迁移后新仓库的玩家投影负责人；冻结检查点：旧文字／面板原型已否决并删除，项目级 UI／UX Skills 已建立可退出检查点；DEC-025 固定玩家责任，DEC-026 固定渐进地图，DEC-027 固定首案 G2 地标稳定而局部道路／Finding 可变，其范围覆盖层已独立 Pass。changed surface：DEC-027、既有 Decision 的日期化澄清、范围覆盖层、领域词义、状态／路线／overview／风险／证据导航与冻结路标；preserved surface：冻结作者六文件与哈希、DEC-018 Experimental 数值、三轨经济、H5 路线、Agent 权限和产品开工门。迁移后下一检查点：以冻结语义制作知识地图低保真切片；stop／reopen trigger：首案正常内容重新永久撤销 G2、地图擦除足迹或预描隐藏节点、焦点锁行动、最强提示读取真相，或需要新数值、真人测试、产品实现；
- 档案关系模型修订已获授权（2026-08-21）：用户确认档案归属是玩家可感知的正式推理轴，深档案调查以 G2 为软转折而非动作锁，多份记录可分别真实、部分相关、误归属或指向不同修复阶段；“记录彼此、记录与现器、所述事件与现存物证”三个关系问题持续更新，只约束系统能否负责地建立主张，不限制玩家凭直觉判断、调查、报价或收手。授权不包含玩家 UI、正式产品代码、产品数值、真人测试、Git 暂存／提交／推送或发布。preserved surface：12 个核心对象候选包、G1—G3 含义、开放顺序、早拿后懂、手动停手、玩家／系统可分歧、纯物证替代路线。verification：首轮独立 **Fail** 已按原规格修复，同一只读 Agent 最终复查为 **Pass**；任一三档含义、玩家／作者边界或冻结输入变化立即重开。owner：V3 作者模型负责人；最后更新：2026-08-21；durable handoff：[确定性作者侧场景演算 v1](evidence/v3-design/2026-08-21-first-ceramic-deterministic-author-scenarios-v1.md)；
- 历史静态检查基线（已由下方最终验证更新）：撤回误升格举例后，v0.2 SHA-256 为 `073A10D52E8337361AE21DFBFB69256592CEDD2567EF5E188454E652DD023A00`，具体一局／作者复核记录 SHA-256 为 `E4EA127106D5D57BF43E432FD71CF23D52E8251022E26B5B91964387A3991BFE`；12 包与蕴含计数、`OR-01—12`、四类探测回报、阴性语义、抽象反证作用域及文档静态检查均通过。该检查在当时只支持“撤回与路线同步已经落实且静态自洽”，其后续独立静态 Pass、确定性失败修复史与最终执行 Pass 分别由对应 Evidence 和下方检查点保存，不以本条替代。
- 用户中断／安全暂停检查点（2026-08-20）：所有临时 Agent 已完成或中断，无后台任务继续。确定性夹具第 4 轮独立复核结论为 **Fail**：v0.2 已批准的档案路线 `T2 来源组 +（现器具名修复图 OR 跨时点对应）` 被求解器静默收紧为必须有现器修复图；其余重放探针无新增发现。修复停在中间态：`solver.mjs`、`fixtures.mjs`、`golden.mjs`、`contract.test.mjs` 与夹具 `README.md` 已写入显式档案跨时点证明槽、OR 逻辑及正向场景骨架，但负向探针尚未补完，补丁后尚未运行 `node --check` 或测试，也未交回独立复核。当前五文件 SHA-256 依次为 `621BD1540FA7D5BFB77B3BDD0A35712C05A53FC04839C9125BD16E51D46D2381`、`6580BD10454EB16280E944BDA6F07037003754E4A4323F1949BA90EED5F94250`、`9817145B69BB5E05578C09A0C72A9E567005ED4F7C3816FA5A695344F1AE1A85`、`F71A0591DB024772AC1763AE204D12C25D2B73930261ACED37BD56FA39BC5FFC`、`DA3519F9A4AFCD78B1327278C9E7423C562B1CAF2352374D484598D98CFA6574`；`manifest.json` 未改，暂存 `0`、冲突 `0`、产品路径差异 `0`。恢复触发仅为用户明确要求继续；恢复后第一步是只读检查这五个文件的半成品，再补完负向探针、运行首次测试、修复并以新哈希交回同一只读复核者。在取得 Pass 前不得进入限定领域复核。
- 恢复／描述性更正检查点（2026-08-20）：用户已明确要求继续；现场五文件哈希与暂停记录逐项一致。恢复后的独立只读静态审计确认，同一批冻结字节其实已经包含单来源、额外来源、错误覆盖、缺原子事实、缺证明角色和物理路线不放宽等负向探针，因此上条“负向探针尚未补完”是中断时的描述性误判，由本条更正但保留其历史上下文。负责人首次对该补丁运行 `node --check`，4/4 JavaScript 语法通过；随后在 Node `v24.15.0` 运行 `node --test .\contract.test.mjs`，结果 `37 tests / 37 pass / 0 fail / exit 0`，无文件写入。该结果只表示负责人验证下的隔离夹具合同成立，尚不是独立复核 Pass；下一检查点仍是以当前六文件哈希交回只读复核者，独立重放档案 OR、答案键、来源／覆盖、物理路线、换序、黄金预言机和既往攻击路径。复核 Pass 前不得进入限定领域复核。
- 确定性演算最终验证（2026-08-20）：同一只读复核任务对六个冻结文件重算哈希 `6/6`、四项 manifest 输入 `4/4`，独立运行 4/4 `node --check` 与 `37 tests / 37 pass / 0 fail / exit 0`，并重放档案 OR、物理路线、单 X-ray、单文档、空来源、嵌套 schema、STOP、阴性越权、分栏、覆盖、非有限数值、上下文来源、依赖／换序、反证和全部 G3 关键未知探针；22 个场景 × 324 个状态为 7,128 个黄金单元，34 条已声明合法顺序逐项一致，Findings 为 None，Verdict 为 **Pass**。最终六哈希为 `solver 621BD154...2381`、`fixtures 6580BD10...4250`、`golden 9817145B...E1A85`、`contract F71A0591...5FFC`、`README DA3519F9...6574`、`manifest 3D99FFE5...446C`；完整值、失败史和原始摘要见确定性 Evidence。验证目录仍未跟踪，缺少 Git provenance；proof role／source ID 是作者合同而非外部真实性证明；未穷举未声明顺序，golden 不独立覆盖完整 `marginals`／`evidence`。Durable handoff：[第一器物确定性作者侧场景演算 v0](evidence/v3-design/2026-08-20-first-ceramic-deterministic-author-scenarios-v0.md)；最后更新：2026-08-20；重开触发：冻结哈希漂移、manifest 来源漂移、档案 OR 或物理路线合同改变、任何已关闭攻击探针复现，或领域复核要求改变关键事实／证明关系。
- Workstream：`CROSS-PROJECT-NUMERIC-GOVERNANCE-001`；状态：Completed（跨项目规则与派生过程资产已记录；长期项目使用与玩法校准未验证）；责任载体：Project Co-Leader（跨项目规则归纳、V3 过程资产与最终一致性）+ Skill maintainer（`project-co-leader-v2` 最小更新）+ 临时只读复核者；
- 当前检查点：全局 `project-co-leader-v2` 已把产品影响数值的本地接缝审查、现实／领域约束研究、数值身份分类、来源主张与项目推断分离、Experimental 可回退决定、决策／实现／校准状态分离、参数族集中权威和后续复审写入默认工作流；单个低耦合数值可留在 Decision 邻接记录，但与注册表条目拥有同一复审入口；技术常数与已批准精确值保留轻量路径。V3 同时新增本日派生作品集过程资产并接入证据导航；
- 授权边界：允许修改全局 `project-co-leader-v2` Skill 及其必要 reference，允许新增一份 V3 派生过程资产并更新导航／当前状态；不修改产品代码、不改六项原始证据及其 SHA-256、不执行数值模拟／试玩、不提交／推送／发布；
- changed surface：全局 Skill 共 5 个文件（正文、两份既有 reference、1 份新数值 reference、入口元数据）；V3 本工作流触及当前状态、证据导航和 1 份新派生过程资产。preserved surface：现有用户决策、DEC-017／018、产品源码、V1/V2 冻结点、六项原始证据及其 SHA-256、最终作品集版式与公开素材授权；
- 验证状态：Skill frontmatter 通过 `quick_validate.py` 同一验证逻辑的内存兼容解析检查；标准入口因本机两个 Python 均缺少 `PyYAML` 而未能直接启动。4 份相关 Skill Markdown 本地链接 `0 broken`、目标文件行尾空白 `0`，入口元数据满足字段／长度／单句 prompt 约束；无仓库上下文的前向场景正确把掉率、保底和价格取整送入完整数值治理，把不影响产品行为的浮点 epsilon 留在轻量技术路径。独立 QA 首轮发现 Decision-only 参数缺少复审入口，修复后复核 `pass`。V3 项目记忆检查 `0 errors / 0 warnings`，3 份本工作流文档链接 `0 broken`，六项原始证据哈希 `6/6`，`git diff --check` 通过，未见产品代码路径差异。以上不证明规则经过跨项目长期使用，也不证明过程资产、数值政策或玩法已经实现、校准、好玩或适合作品集发布。Durable handoff：全局 `references/numerical-decision-and-calibration.md`、[2026-08-14 派生作品集过程资产](evidence/v3-design/2026-08-14-v3-decision-and-numeric-governance-portfolio-process-asset.md)；最后更新：2026-08-14；重开触发：产品影响数值绕过研究与留痕、技术常数被无差别重型治理、Decision-only 参数在调参时未被带回，或后续真实使用证明字段与复审流程不可维护。
- Workstream：`V3-STAGE-VALUATION-CALIBRATION-001`；状态：Completed（研究与暂定政策记录；玩法验证未开始）；责任载体：Project Co-Leader（研究门、项目比较、参数决策与持久记录）+ 临时有界研究者（原始来源检索、V2 数值接缝审查与独立反例复核）；
- 当前检查点：DEC-017 已保存用户连续确认的稳定产品语义；研究已排除“通用 50%／75% 现实标准、相关证据朴素相乘、Q90 上尾开关、单条区间跨多峰空谷、阶段价格倍率”，DEC-018 将可演算默认及其重开触发集中登记；
- 授权边界：允许检索原始研究／官方估值规范／相邻实践，形成可追溯的 provisional 参数决策并更新 V3 项目记忆；暂不要求用户逐项批准具体数值，不修改产品代码、不绘制正式拓扑、不执行玩法平衡或趣味性验证、不改变已确认的单次挂牌与局末真相揭示边界；
- changed surface：本工作流只更新 `docs/project/` 下的研究、Decision、索引、状态／行动／overview／风险记录，以及根目录领域词义 `CONTEXT.md`；preserved surface：产品源码、V1/V2 冻结记录、外部暂存原文、客观市场模型与玩家报价规则；
- 验证状态：Deep evidence floor、V2 接缝审查、数学反例和独立 QA 已完成；项目记忆检查 `0 errors / 0 warnings`，本轮 15 份未提交 Markdown 的 87 个本地链接 `0 broken`，13 个 Mermaid 围栏均配对，`git diff --check` 通过，未见产品代码改动。以上只验证研究归因、文档一致性与模型边界；75%／50%、50%／80%、5% 和最多 3 个情景均未通过纸模、模拟或真人理解测试，后续验证属于另一个需预先披露的 Critical verification contract。Durable handoff：[阶段阈值与估值映射研究](evidence/v3-design/2026-08-14-stage-threshold-and-valuation-mapping-research.md)、[DEC-017](decisions/DEC-017-v3-stage-claims-stopping-and-fixed-price-listing.md)、[DEC-018](decisions/DEC-018-v3-provisional-claim-thresholds-and-valuation-projection.md)；最后更新：2026-08-14；重开触发：第一拓扑无法表达证据依赖／阶段回退，或场景演算推翻当前默认。
- Workstream：`V3-DESIGN-BOOTSTRAP-001`；状态：Completed（项目内启动与 pre-commit 验证；commit／post-commit clean 结果不由本文件自证）；责任载体：Project Co-Leader（版本来源、证据迁入、V3 权威记录与验证负责人）+ 临时只读复核者；
- 当前检查点：V3 worktree、六项原始证据、DEC-016／EXP-030、领域语境和人话驾驶舱已经形成；六项哈希、项目记忆、22 份 Markdown／91 链接／21 Mermaid 静态结构、作者新增文档 whitespace 检查与产品 diff 门通过。四份逐字节迁入的原始 Markdown 保留源文件已有的 8 处行尾空格，因此完整 staged `diff --check` 会如实报告这些已知例外；首次提交与 post-commit clean 状态须从 Git 现场核对；
- 授权边界：允许建立 V3 分支／worktree，迁入设计证据，更新治理／设计／overview／轻量作品集记录并本地提交；不得修改产品代码、V1/V2 tag、外部源材料、推送、部署、公开发布或调用 Superpowers；
- changed surface：提交前共 24 份 V3 项目记录、领域语境、原始证据包与轻量作品集入口（13 tracked modifications＋11 untracked）；preserved surface：全部产品源码、案例数值、生成 HTML、V1/V2 frozen refs、V2 worktree、外部暂存源与原工作区；
- 验证状态：详细结果见 [EXP-030](evidence/EXP-030-v3-design-intake-and-research-capsule.md)。通过不代表产品设计、趣味、视觉、文化、平衡或进度可行性；
- Durable handoff：[DEC-016](decisions/DEC-016-v3-design-stage-bootstrap.md)、[EXP-030](evidence/EXP-030-v3-design-intake-and-research-capsule.md) 与 [V3 设计证据包](evidence/v3-design/README.md)；最后更新：2026-08-14；停止／重开触发：哈希漂移、产品路径出现差异、Draft 被写成已批准／实现、V3 不是从冻结 tag 建立，或下一步未经用户确认就写代码。

## 当前阻塞

当前仓库是迁移后的活跃仓库，正在承接 V3 玩家侧工作。DEC-027 已关闭首案“回退”的内容范围：G2 保持稳定，后段失败表现为局部路线被排除、G3 未形成和成本保留；通用降级仍在引擎防御层。新增范围覆盖层已经只读独立 **Pass**。当前阻断只有一项：**罗盘对“当前最优调查”排序范围的作用**尚未对齐，它是可玩切片的最后一项语义前置条件。地标汇合与重排语义已由 DEC-028 依据三个模型的渲染比较定案。

v0.3 的旧冻结输入已取得独立结构／确定性 Pass 并由 DEC-024 完成作者规格门；DEC-027 不改旧字节，只新增当前范围解释和验证层，该层现已独立 Pass。剩余玩家侧工作从知识地图低保真切片开始，在本仓库继续。2026-08-24 用户批准压缩顺序：粗概率呈现形式不再作为切片前置条件，改由切片内变体验证；无答案真人测试合同、数值模拟、整局原型、V2 技术审查和用户明确开工批准仍全部保留为后续必经门，但排序按切片实际暴露的问题决定。任何阶段都不把 DEC-018 的 Experimental 数值或“当前最优调查”的未校准排序称为玩法定稿。

## 当前边界

- V3 总范围包含物品真相、证据拓扑、玩家知识图、玩家后验与调查／停止后果；**作者侧责任区已完成当前门，玩家地图核心语义已批准；新版知识地图低保真切片尚未开始，是当前唯一在推进的工作**；
- 第一切片完整手工设计；自动化先限于结构校验与作者辅助，程序化器物真相／证据语义／完整拓扑保持后期 `Unknown`；
- 第一切片不使用器物物损；调查机会和专业检测费用与器物价值分账；
- 系统证据估值、玩家一次挂牌价和客观市场结算严格分离；结果后才揭示完整真相与拓扑；
- V2 的 NPC 认知、人物画像、关系状态、连续对话、D20、受控误导、议价和人物评分只保留历史身份，不进入 V3；
- V2 代码可以被 V3 后续显式 Adopt／Borrow，但不能静默继承固定三真相、平铺似然或评分公式；
- 玩家图不得直接显示完整作者图、隐藏节点数量、真实边权或隐藏真相路线；常驻层不指定唯一动作，只有玩家主动请求最强帮助时才显示按本局已知信息计算的当前最优调查；
- 第一陶瓷切片正常内容不永久撤销已经充分建立的 G2；局部关系与价值可变、G3 可不形成、成本不退。真正 G2→G1 只保留为通用系统／未来案件能力；
- 作品集材料保持轻量，最终以完成成果、界面、自动化和玩家证据为主；
- 旧仓库 `zhangyan_V2` 的冻结提交、annotated tag 与全 refs 已镜像迁入本仓库并逐一核对；旧仓库不再新增提交。本仓库不 deploy、不制作最终 PDF、不公开使用私有批注图。

## 关键记录

- [V2 冻结与 V3 启动边界](decisions/DEC-015-v2-freeze-and-v3-bootstrap.md)
- [V3 设计阶段启动决定](decisions/DEC-016-v3-design-stage-bootstrap.md)
- [阶段主张、手动停手与单次挂牌决定](decisions/DEC-017-v3-stage-claims-stopping-and-fixed-price-listing.md)
- [暂定阶段阈值与估值投影政策](decisions/DEC-018-v3-provisional-claim-thresholds-and-valuation-projection.md)
- [第一器物与旧内容／NPC 继承边界](decisions/DEC-019-v3-evidence-rich-first-object-and-legacy-npc-exclusion.md)
- [第一器物结构与核心争议](decisions/DEC-020-v3-first-ceramic-object-and-core-dispute.md)
- [第一器物客观真相包与游戏性优先作者边界](decisions/DEC-021-v3-first-ceramic-objective-truth-package-and-gameplay-first-authorship.md)
- [第一陶瓷切片三档结果与开放证据网](decisions/DEC-022-v3-first-ceramic-three-result-gates-over-branching-evidence.md)
- [正式产品代码前验证与玩家投影边界](decisions/DEC-023-v3-pre-product-validation-and-player-projection-boundary.md)
- [第一陶瓷切片作者规格批准与玩家微循环阶段入口](decisions/DEC-024-v3-first-ceramic-author-spec-approval-and-player-microcycle-entry.md)
- [玩家知识工作台快照、焦点与最终判断责任](decisions/DEC-025-v3-player-workbench-snapshots-focus-and-final-judgment.md)
- [渐进玩家知识地图与当前最优按需提示](decisions/DEC-026-v3-progressive-player-knowledge-map-and-current-best-hint.md)
- [首案稳定 G2 与后段回退边界](decisions/DEC-027-v3-first-ceramic-stable-g2-and-post-g2-fallback.md)
- [G2 稳定性与场景范围重分类](evidence/v3-design/2026-08-23-first-ceramic-g2-stability-and-scenario-scope-reclassification-v0.md)
- [第一器物候选家族筛选研究](evidence/v3-design/2026-08-14-first-object-candidate-screening-research.md)
- [陶瓷／瓷器具体对象候选研究](evidence/v3-design/2026-08-15-ceramic-specific-object-candidates.md)
- [第一外销瓷真相包与关卡创作／自动化边界研究](evidence/v3-design/2026-08-15-first-ceramic-truth-package-and-authoring-boundary-research.md)
- [第一器物纸面证据拓扑 v0.1](evidence/v3-design/2026-08-15-first-ceramic-paper-evidence-topology-v0.md)
- [第一器物三档作者覆盖层 v0.1](evidence/v3-design/2026-08-16-first-ceramic-three-result-gate-author-overlay-v0.md)
- [第一器物三档作者模型 v0.2](evidence/v3-design/2026-08-17-first-ceramic-three-result-author-model-v0-2.md)
- [第一器物具体一局与作者侧对抗复核 v0](evidence/v3-design/2026-08-20-first-ceramic-concrete-session-and-owner-structural-review-v0.md)
- [第一器物独立结构复核 v0](evidence/v3-design/2026-08-20-first-ceramic-independent-structural-review-v0.md)
- [第一器物确定性作者侧场景演算 v0](evidence/v3-design/2026-08-20-first-ceramic-deterministic-author-scenarios-v0.md)
- [阶段阈值与估值映射研究](evidence/v3-design/2026-08-14-stage-threshold-and-valuation-mapping-research.md)
- [作者拓扑与验证转折作品集过程资产](evidence/v3-design/2026-08-13-object-truth-topology-portfolio-process-asset.md)
- [本日决策与数值治理作品集过程资产（派生）](evidence/v3-design/2026-08-14-v3-decision-and-numeric-governance-portfolio-process-asset.md)
- [V2 冻结证据](evidence/EXP-029-v2-player-prototype-freeze.md)
- [V3 设计证据迁入](evidence/EXP-030-v3-design-intake-and-research-capsule.md)
- [V3 原话／研究证据包](evidence/v3-design/README.md)
- [领域语境](../../CONTEXT.md)
- [宏观入口](overview/00-START-HERE.md)
