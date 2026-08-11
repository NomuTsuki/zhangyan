# V1 Portfolio Evidence Preservation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不修改 V1/V2 产品代码、不生成新的低保真或数值实验截图、也不制作最终学校 PDF 的前提下，建立一个可审计但轻量的 V1 作品集证据索引，并把仅有的高价值孤立原件与六张结果/验证图非覆盖地保全到私有胶囊。

**Architecture:** 仓库内以 `docs/portfolio/v1-evidence/assets.jsonl` 作为唯一逐项资产 ledger，以同目录 `README.md` 保存人读叙事、主张矩阵和成果优先的策展边界；仓库外同盘胶囊只保存 15 个白名单文件和简短验证记录。既有恢复点、Git bundle、教师交付包、31 项未提交 overlay、42 项浏览器证据和字节重复材料在原位复验并引用，不重复镜像。一个只读 Node 校验器负责结构、覆盖、哈希关系与完成门，人工视觉判断仍由审查者逐项记录。

**Tech Stack:** Markdown、JSONL、Node.js 内建库、PowerShell、Git、SHA-256、Python 标准库、bundled Documents renderer、人工图片/文档逐页检查。

## Global Constraints

- 本文件是执行计划，不是执行授权。只有用户在审阅本计划后明确回复批准执行，才能创建仓库内索引、仓库外胶囊、测试脚本、QA staging 或任何衍生文件。
- 批准后的唯一胶囊目标为 `D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline`；唯一 QA staging 为 `D:\实习工作\掌眼_作品集证据保全\.qa-staging-2026-08-04-v1-baseline`。2026-08-04 计划编写时两者均不存在；执行时任一路径已经存在都必须停止，不覆盖、不合并、不自动改名。
- 该目标仍位于 `D:`。批准执行同时只接受“同盘语境保全、抗工作树变化”的残余风险，不得声明已经建立异盘灾难恢复。若用户在执行前提供独立位置，应先修订本计划和声明，再开始复制。
- 不修改、移动、重命名或清理任何源文件；不修改 V1 tag、V1 worktree、原工作区 31 项、正式交付包、恢复点或 Git 引用。
- 不修改 `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/`、`release/`、`docs/teacher/` 中的产品/发布文件；不运行 `npm test`、`npm run build`、`generate-hifi.mjs`、`generate-standalone.mjs` 或任何会重写 `public`/`dist` 的命令。
- 不安装依赖，不上传、推送、部署、公开分享或创建 Figma/PDF；不生成低保真、数值实验台或早期架构的新截图。
- 不创建复制器、打包器、截图生成器或新的资产数据库。只新增一个使用 Node 内建库的只读登记校验器和对应小型测试。
- `.project-co-leader-v2.yaml` 的 `auto_git_commit` 为 `false`。本计划不授权 commit、stage、push 或 PR；每个任务以可审阅 checkpoint 代替自动提交。
- `useStatus: "portfolio-candidate"` 仅表示以后可策展，不表示进入最终 PDF。四张最终交易/结算图是默认直接候选；两张诊断图、流程图和文字过程材料仍需未来按目标项目重新选择。
- `useStatus: "withheld"` 是合法发布终态，不等同于验证失败；必检 run 的 `status: "FAIL"` 或 `status: "WITHHELD"` 均计入 blocking failure。可打开但不可公开的材料应记录 `status: "PASS"` + `useStatus: "withheld"`，不能用发布限制逃避必检。
- 只有 `unresolvedCount = 0` 且 `blockingFailureCount = 0`，并完成独立只读 QA，才能关闭 `V2-PORTFOLIO-001`。

---

## Fixed Copy Allowlist

白名单恰好 15 个文件、源文件合计 `6,604,677` bytes。执行不得扩大该集合；若任一源大小或 SHA-256 与表中不一致，停止并重新审查来源身份。

| Asset ID | Source | Capsule destination | Bytes | SHA-256 | Initial use status |
|---|---|---|---:|---|---|
| `DOC-PITCH-01` | `D:\实习工作\掌眼_古玩小游戏初步策划说明.docx` | `originals/DOC-PITCH-01.docx` | 34,374 | `F354830A903CF98D99640A2140E2BEE6234B331F007814345389849B5864985A` | `private-only` |
| `DOC-REPORT-01` | `D:\实习工作\第一次汇报7.15.docx` | `originals/DOC-REPORT-01.docx` | 15,125 | `61407A425D863398D4808626DA85B1145C14B4B1E9C3950C5E6DF1D3CD3DD57E` | `private-only` |
| `PKG-BOOTSTRAP-01` | `D:\实习工作\掌眼_Codex启动包_v2.zip` | `originals/PKG-BOOTSTRAP-01.zip` | 4,545,757 | `EA5D007D0BBC43B0FE286F1E560ADFAD991C3AB13E2695AE7A43BDA8D5270354` | `private-only` |
| `ARCH-LATE-01` | `D:\实习工作\program\《掌眼》流程图.drawio` | `originals/ARCH-LATE-01.drawio` | 47,314 | `426757D9B481030B488FDC21B0FAFB28744D115BB893B1858A2B7FFE2BB74A35` | `private-only` |
| `ARCH-LATE-SVG-01` | `D:\实习工作\program\《掌眼》流程图.svg` | `originals/ARCH-LATE-SVG-01.svg` | 146,365 | `4CEAE967CD373BD21A72A98480EA5A6BF49CAC90F6A3546E10FA3EBFD19EAA49` | `private-only` |
| `ARCH-LATE-PNG-01` | `D:\实习工作\program\《掌眼》流程图-单局游玩流程.drawio.png` | `originals/ARCH-LATE-PNG-01.drawio.png` | 664,582 | `F6B6BB8D808146C7FCCA8A27369A019F3D4B4E8365D81B729F319231B4D00618` | `private-only` |
| `DOC-WEEK1-DRAFT-01` | `D:\实习工作\周报\李晟豪第一周工作周报.docx` | `originals/DOC-WEEK1-DRAFT-01.docx` | 17,191 | `24D9DC20C36BCF78B8CB62F4645AE9A69A8908AA09F9D61AA9F2E493A005ED0A` | `withheld` |
| `DOC-WEEK1-DRAFT-02` | `D:\实习工作\周报\李晟豪_第一周工作总结报告_掌眼项目.docx` | `originals/DOC-WEEK1-DRAFT-02.docx` | 16,176 | `7374144E1AF95A3F0DE386E23840A6FB0A643DA6C9ED94754B91F37416C28625` | `withheld` |
| `DOC-WEEK1-DRAFT-03` | `D:\实习工作\周报\李晟豪_工作周报_掌眼项目.docx` | `originals/DOC-WEEK1-DRAFT-03.docx` | 13,032 | `9AACCCD51B8EE948BEBC05C356750FB4CDA438C0E0032938BAC3A191D8027276` | `withheld` |
| `IMG-DIAG-DESKTOP-01` | `D:\实习工作\掌眼\.worktrees\v2-bootstrap\.superpowers\sdd\2026-07-31-judgment-quality-scoring\desktop-single-evidence-review.png` | `screens/IMG-DIAG-DESKTOP-01.png` | 284,937 | `84DE77D53C73726F707E83349DA5D001667861920783E9228883DB1768327DA6` | `private-only` |
| `IMG-DIAG-MOBILE-01` | `D:\实习工作\掌眼\.worktrees\v2-bootstrap\.superpowers\sdd\2026-07-31-judgment-quality-scoring\mobile-single-evidence-review.png` | `screens/IMG-DIAG-MOBILE-01.png` | 100,488 | `D12938FB942FF592AB640EF01D4BB8A97EEC0DF9D83FDB34B2509C76E59C8977` | `private-only` |
| `IMG-TRADE-DESKTOP-01` | `D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\browser-evidence-v1-teacher-handoff\page-2026-08-03T10-52-22-136Z.png` | `screens/IMG-TRADE-DESKTOP-01.png` | 234,371 | `D5290FFE9BB6BF7AC85173BEFCABC04CDC30CDC33B7AC630F03FBCBEDCF0A62A` | `portfolio-candidate` |
| `IMG-TRADE-MOBILE-01` | `D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\browser-evidence-v1-teacher-handoff\page-2026-08-03T10-55-27-470Z.png` | `screens/IMG-TRADE-MOBILE-01.png` | 97,754 | `4BD8A5CA5319D7EB1A290DA66A16E7248680225DFEF798A6F58DF77E4380AF90` | `portfolio-candidate` |
| `IMG-RESULT-DESKTOP-01` | `D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\browser-evidence-v1-teacher-handoff\page-2026-08-03T10-53-05-257Z.png` | `screens/IMG-RESULT-DESKTOP-01.png` | 286,861 | `3BD48049895AD2111D8DA928FDD572574A885AD13CA039A08E8406005E399D81` | `portfolio-candidate` |
| `IMG-RESULT-MOBILE-01` | `D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\browser-evidence-v1-teacher-handoff\page-2026-08-03T10-55-57-760Z.png` | `screens/IMG-RESULT-MOBILE-01.png` | 100,350 | `5C318D75A4D7D4E0C98FAA84211538A83747D7649A44F10C6D3BD05709602007` | `portfolio-candidate` |

三个周报草稿体积很小、彼此也不是现有恢复 master 的字节副本；复制只是避免孤立原件丢失。它们因姓名、metadata 与半成品语境保持 `withheld`，不会自动成为学校作品集页面。

## Explicit No-Copy / No-Generation Set

- 不复制整个恢复点、正式教师交付包、交付包副本、Git bundle、patch、完整 `.git` 或未提交 overlay；
- 不把原工作区 31 项再拆成第二套散装文件；只验证 overlay 的 `31/31`；
- 不复制 canonical/低保真/数值实验台 HTML、Git 已跟踪代码、项目记忆或测试；
- 不复制两张 AI 视觉方向图、早期 `references/掌眼_完整游玩流程.drawio`、`D:\实习工作\program\掌眼_完整游玩流程.drawio`、字节重复的 `original-playwright-cli` 截图；
- 不复制 Chrome profile/cache、`verify-hifi-clone`、展开目录、`node_modules` 或 `dist`；
- 不生成新低保真图、数值实验图、早期 Draw.io 预览、公开脱敏 DOCX、Figma 或 PDF。

这些表面仍进入 ledger，分别使用 `private-recovery-master-verified-in-place`、`duplicate-reference`、`rebuildable` 或合法的私有使用状态，不能靠“不复制”从覆盖范围消失。

## Data Contracts

### `assets.jsonl`

每行一个 JSON 对象。文件实例必须逐项登记；大型 Git 目录可用 `recordType: "git-tree"`，已有 manifest 管理的恢复集合可用 `recordType: "collection"`，但原工作区 31 项必须各自拥有稳定 ID。共同字段如下：

```json
{
  "schemaVersion": 1,
  "assetId": "IMG-RESULT-DESKTOP-01",
  "sourceGroup": "v1-browser-evidence",
  "recordType": "file",
  "source": {
    "absolutePath": "D:\\实习工作\\掌眼_恢复点\\2026-08-03-v1-preflight\\browser-evidence-v1-teacher-handoff\\page-2026-08-03T10-53-05-257Z.png",
    "relativePath": "browser-evidence-v1-teacher-handoff/page-2026-08-03T10-53-05-257Z.png",
    "manifestRef": "D:\\实习工作\\掌眼_恢复点\\2026-08-03-v1-preflight\\browser-evidence-v1-teacher-handoff\\copy-verification.sha256.json",
    "gitCommit": "f0b20b8ef5f5246529027f90a3fb277659c329cf",
    "gitTag": "v1.0.0-teacher-handoff"
  },
  "file": {
    "name": "page.png",
    "mediaType": "image/png",
    "bytes": 286861,
    "sha256": "3BD48049895AD2111D8DA928FDD572574A885AD13CA039A08E8406005E399D81",
    "dimensions": { "width": 1440, "height": 1000 },
    "pages": null
  },
  "identity": "交付/验证证据",
  "stage": "V1 教师冻结",
  "authority": "冻结运行证据；不单独证明控制台或交互可达性",
  "masterId": "IMG-RESULT-DESKTOP-01",
  "supports": ["最终结算同时展示客观净结果与判断质量"],
  "doesNotSupport": ["长期数值平衡已经成立"],
  "provenance": { "creator": "项目浏览器验证", "thirdParty": [], "license": "private-project-evidence" },
  "privacy": { "status": "reviewed-private", "risks": [] },
  "storageStatus": "private-master-copied",
  "useStatus": "portfolio-candidate",
  "duplicateOf": null,
  "destinationPath": "D:\\实习工作\\掌眼_作品集证据保全\\2026-08-04-v1-baseline\\screens\\IMG-RESULT-DESKTOP-01.png",
  "rebuild": null,
  "riskAcceptance": null,
  "verificationRefs": ["RUN-IMG-01", "RUN-COPY-01"]
}
```

`storageStatus` 的最终值只允许：`private-master-copied`、`private-recovery-master-verified-in-place`、`duplicate-reference`、`rebuildable`、`withheld-in-place-risk-accepted`。在执行尚未到达终态时，ledger 必须显式写 `storageStatus: null`；`draft` 模式把它计入 `unresolvedCount`，`close` 模式拒绝任何 `null`。不得用 `pending` 冒充第六种终态，也不得为了通过 schema 提前伪造五种终态。`useStatus` 从首次登记起必须独立填写，只允许：`private-only`、`portfolio-candidate`、`public-redacted`、`withheld`。

各 `recordType` 的条件字段固定如下：

- `file`：必须有 `source.absolutePath`、完整 `file`、`masterId`；若已复制，还必须有 `destinationPath`；
- `archive`：满足 `file` 的全部要求，并增加 `archive: { "format": "zip|tar|git-bundle", "memberCount": 0, "manifestAssetId": null }`；
- `archive-member`：必须有 `source.containerAssetId`、`source.memberPath`、完整 `file`，不得伪造磁盘绝对路径；
- `git-tree`：必须有 `source.gitCommit`、`source.gitTag`、`gitTreeOid`、`pathPrefix`、`memberCount`，`file` 固定为 `null`；
- `collection`：必须有 `source.absolutePath` 或 `source.manifestRef`、`memberCount`、`memberAssetIds`；所有需要逐项终态的成员仍须有自己的记录，collection 不能替代 31 项或外部二进制实例；
- `private-recovery-master-verified-in-place` 还必须有例如 `recovery: { "containerAssetId": "REC-OVERLAY-01", "manifestAssetId": "REC-UNCOMMITTED-MANIFEST-01", "memberPath": "近期开发对齐/00-从这里开始.md" }` 的实际引用与本轮 verification ref；不适用的键写 `null`；
- `rebuildable` 还必须有 `rebuild: { "sourceAssetIds": [], "command": "字面可执行命令", "expectedOutput": "精确文件或目录" }`；
- `withheld-in-place-risk-accepted` 还必须有 `riskAcceptance: { "approvedBy": "user", "approvedAt": "ISO-8601", "scope": "单一 assetId", "reason": "原因", "residualRisk": "可能丢失什么" }`。本计划的 15 项复制和既有 master 路径不预设使用该状态；同盘总体风险记录在 capsule/README，不冒充逐项 risk acceptance。

### `verification-runs.jsonl`

QA staging 中先形成草稿，全部门通过后才一次性复制进胶囊根目录。每行必须包含 `runId`、`gateId`、`at`、`reviewer`、`status`、`assetIds`、`commandOrMethod`、`exitCode`、`observations`、`blindSpots`。`status` 只允许 `PASS`、`FAIL`、`WITHHELD`；`gateId` 必须完整覆盖 `GATE-12.2.1` 到 `GATE-12.2.12`。失败记录永久保留；重试必须使用新 `runId` 和 `supersedesRunId`，指向同 gate、同 asset 集合且时间更早的上一 active run。链必须锚定下表 required run、无环、无分叉；只有每条链唯一 active leaf 的 `FAIL/WITHHELD` 计入 blocking。

| Completion gate | Required run/evidence |
|---|---|
| `GATE-12.2.1` | `RUN-REGISTER-01`：所有来源、31 项与新增发现均有唯一终态 |
| `GATE-12.2.2` | `RUN-COPY-01`：15 个副本源/目标 bytes 与 SHA-256 |
| `GATE-12.2.3` | `RUN-RECOVERY-01`：duplicate master 与 verified-in-place 覆盖 |
| `GATE-12.2.4` | `RUN-IMG-01`：六张固定图、两张 AI 方向图逐张人工检查 |
| `GATE-12.2.5` | `RUN-ARCH-01`：两版 Draw.io XML 与晚版现有导出 |
| `GATE-12.2.6` | `RUN-DOCX-01`：OOXML/隐私检查及两份主张文档逐页检查 |
| `GATE-12.2.7` | `RUN-HTML-01`：三类 HTML 的身份、只读静态契约和真实 Chrome `file://` 打开 |
| `GATE-12.2.8` | `RUN-GIT-01` + `RUN-ARCHIVE-01`：tag/tree、bundle、ZIP/TAR 与 overlay 恢复性 |
| `GATE-12.2.9` | `RUN-PRIVACY-01`：许可、个人信息、AI 来源与零 `public-redacted` 审计 |
| `GATE-12.2.10` | `RUN-PRESERVE-01`：产品/V1/31 项/交付包/恢复点未改变 |
| `GATE-12.2.11` | `RUN-PROJECT-CHECK-01`：diff、链接、项目记忆和冻结 checksum |
| `GATE-12.2.12` | `RUN-HONESTY-01`：失败、未知、盲点与同盘限制未被删改 |

### Read-only verifier CLI

```powershell
& 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/portfolio-evidence/verify-register.mjs --register docs/portfolio/v1-evidence/assets.jsonl --runs 'D:\实习工作\掌眼_作品集证据保全\.qa-staging-2026-08-04-v1-baseline\verification-runs.jsonl' --capsule 'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline' --mode close
```

校验器只读输入并把 JSON 摘要写到 stdout，不自行修改 ledger、复制文件或生成截图。`draft` 模式只要求 `--register`，允许 `storageStatus: null` 以及尚不存在的 runs/capsule，并以退出码 0 报告未解决项；结构/枚举/ID/supersession 错误仍返回非零。`close` 模式要求三个输入齐全，并在语法错误、稳定 ID 重复、31 项缺失、终态为 null/非法、哈希关系错误、必检字段/门缺失、任一 required-run 链的 active leaf 非 `PASS`、`unresolvedCount > 0` 或 `blockingFailureCount > 0` 时返回非零。

---

### Task 1: 用测试先定义只读登记校验器

**Files:**

- Create: `scripts/portfolio-evidence/verify-register.mjs`
- Create: `scripts/portfolio-evidence/verify-register.test.mjs`

**Interfaces:**

- Consumes: JSONL asset records、JSONL verification runs、可选 capsule root。
- Produces: stdout JSON summary 与退出码；不得写文件。

- [ ] **Step 1: 在执行开始时重查授权与路径安全**

  记录当前 `git status --short`；确认用户批准的是本计划；用 `[System.IO.Path]::GetFullPath()` 解析胶囊和 staging，要求分别与 Global Constraints 的两个绝对路径完全相等，并要求 `Test-Path` 均为 `False`。任一不符立即停止，不进入红灯测试。

- [ ] **Step 2: 先写 validator 测试**

  使用 `node:test`、`node:assert/strict`、`fs.mkdtemp` 与内存生成的临时 JSONL 覆盖：重复 `assetId`；非法或混用两类状态；draft 中 null 被计为 unresolved、close 中 null 被拒绝；`file/archive/archive-member/git-tree/collection` 条件字段缺失；31 项 manifest 路径遗漏；复制源/目标大小或哈希不一致；duplicate 指向不存在/异哈希 master；recovery-in-place 缺 manifest/container/本轮 run；rebuildable 缺来源或命令；risk-accepted 缺逐项批准；12 道门缺失或 active leaf 含 `FAIL/WITHHELD`；合法 supersession、缺失目标、跨 gate、不同资产集合、非递增时间、分叉、环与未锚定 retry；必检图片 dimensions 缺失；合法关闭样本。

- [ ] **Step 3: 运行红灯并确认失败原因是实现尚不存在**

  ```powershell
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test scripts/portfolio-evidence/verify-register.test.mjs
  ```

  预期：非零，且失败指向 `verify-register.mjs` 尚未实现；若因 Node、权限或临时目录问题失败，先解决环境问题，不能把它当成有效红灯。

- [ ] **Step 4: 实现最小只读 validator**

  只用 Node 内建模块；实现 JSONL 逐行解析、record-type 条件字段、状态枚举、master/duplicate 图、manifest 覆盖、源/目标 hash/bytes、verification run 引用与十二道完成门。摘要至少输出 `assetCount`、`bytesRepresented`、`copiedFileCount`、`copiedBytes`、`duplicateGroups`、`withheldUseCount`、`unresolvedCount`、`blockingFailureCount` 与 `errors`。

- [ ] **Step 5: 运行绿灯与静态检查**

  ```powershell
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check scripts/portfolio-evidence/verify-register.mjs
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test scripts/portfolio-evidence/verify-register.test.mjs
  ```

  预期：两项退出码为 0。建立 checkpoint；不 commit。

### Task 2: 建立全量文本 ledger 与成果优先叙事

**Files:**

- Create: `docs/portfolio/v1-evidence/assets.jsonl`
- Create: `docs/portfolio/v1-evidence/README.md`

**Interfaces:**

- Consumes: 已批准规格、`EXP-017`、Git 历史、恢复点三份 manifest、正式交付清单和祖先目录盘点。
- Produces: 唯一资产 ledger、人读历史/主张/策展索引；不复制二进制。

- [ ] **Step 1: 固定来源基线**

  记录并要求：`v1.0.0-teacher-handoff^{}` 为 `f0b20b8ef5f5246529027f90a3fb277659c329cf`，其 tree 为 `a5f9cbdb65e227d70c95464ebf6530224b78583b`；当前 HEAD 为 V2 起点或其纯文档/工具后继，且下列产品表面相对 V1 没有 diff：

  ```powershell
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe' diff --name-only 'v1.0.0-teacher-handoff^{}' -- '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype' 'release' 'docs/teacher'
  ```

  预期：无输出。

- [ ] **Step 2: 导入原工作区 31 项**

  从 `D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\uncommitted-files.sha256.json` 按数组顺序建立 `REC-UNCOMMITTED-001` 至 `REC-UNCOMMITTED-031`，保留 path/category/length/sha256；在复验前写 `storageStatus: null`，预期 master 指向 `uncommitted-working-tree-overlay.zip`，不能提前写 verified-in-place。

- [ ] **Step 3: 导入恢复点 26 项**

  逐行登记 `D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\artifacts-final.sha256.json` 的 26 项恢复制品；bundle、patch、overlay、manifest 与重复坏引用各自有稳定 ID，未执行本轮复验前写 `storageStatus: null`。

- [ ] **Step 4: 导入浏览器证据 42 项**

  逐行登记 `D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\browser-evidence-v1-teacher-handoff\copy-verification.sha256.json` 的 42 项。顶层路径是预期 master，`original-playwright-cli` 只是预期 duplicate；本轮 hash 复验前两者都保持 `storageStatus: null`，不把重复路径表述成独立验证。

- [ ] **Step 5: 登记第 7 节其余来源面与本计划新增发现**

  登记 Git/tag/tree、项目决定/假设/实验/挑战树、canonical/历史/实验 HTML、两张 AI 概念图、`ARCH-EARLY-01`、正式交付包及副本、启动包、两份早期文档、较晚 Draw.io 三件套、三个非字节重复周报草稿、六张固定图片和可再生成缓存集合。大型 Git 目录可以 `git-tree`/`collection` 表示，但十五个复制白名单和所有外部二进制实例必须逐文件记录。

- [ ] **Step 6: 为每项先赋予准确身份、主张边界和使用状态**

  四张最终交易/结算图设为 `portfolio-candidate`；两张诊断图设为 `private-only`；AI 概念图与三份含个人信息周报设为 `withheld`；原 DOCX、bundle、overlay、patch、Chrome QA 资料和完整历史均不得设为 `public-redacted`。历史低保真/数值实验只能支持迭代主张，不能支持 V1 当前权威或长期平衡。

- [ ] **Step 7: 写 `README.md` 的叙事索引而非开发日志**

  固定结构为：范围与权威层；同盘/异盘声明；复制白名单/排除集；设计历史的九个提交节点；五条主张矩阵（玩家后验决策、NPC 纺锤、NPC 动态后验、具体真实证据披露、客观得失与判断质量分离）；成果优先 PDF 边界；许可/隐私/AI 限制；如何运行 validator。每条主张链接 approved spec 与项目 evidence，不重复粘贴全部过程材料。

- [ ] **Step 8: 用 draft 模式准确表达“已登记但未完成”**

  此时 QA staging 尚未创建，因此只传 `--register docs/portfolio/v1-evidence/assets.jsonl --mode draft`。预期退出码为 0，但 `unresolvedCount` 大于 0，并逐项报告 `storageStatus: null`、复制/人工验证/十二道门尚未完成；不得提前伪造终态。`close` 对 null/缺 runs/缺 capsule 返回非零的行为由 Task 1 单元测试覆盖。

### Task 3: 非覆盖创建轻量胶囊并复制恰好 15 项

**Files:**

- Create outside repository: `D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\originals\`
- Create outside repository: `D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\screens\`
- Create outside repository: `D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\qa\`
- Create outside repository: `D:\实习工作\掌眼_作品集证据保全\.qa-staging-2026-08-04-v1-baseline\`

**Interfaces:**

- Consumes: Fixed Copy Allowlist。
- Produces: 15 个不可覆盖副本；不生成 archive，不复制现有 recovery master。

- [ ] **Step 1: 再做绝对路径与不存在门**

  用 PowerShell 把 `$capsuleRoot` 与 `$qaStaging` 设为 Global Constraints 中的两个字面绝对路径，分别运行 `GetFullPath` 并进行字符串全等比较；随后要求 `Test-Path -LiteralPath` 为 False。不要用 `$HOME`、`~`、glob 或相对路径。

- [ ] **Step 2: 建立最小目录树**

  只创建 capsule root、`originals`、`screens`、`qa` 和独立 QA staging。此时不创建 ZIP，也不复制 README/ledger；它们在最终冻结后只复制一次。

- [ ] **Step 3: 逐项执行源前置门并非覆盖复制**

  对表中每一项先检查源存在、类型为 file、bytes 与 SHA-256 精确匹配，再确认目标不存在，才以 Fixed Copy Allowlist 同一行给出的字面 source 和 capsule destination 执行 `Copy-Item -LiteralPath $sourcePath -Destination $destinationPath`；两个变量只允许来自该固定表的 15 行。任何一项失败即停止剩余复制并保留已完成事实；不回滚、不覆盖、不猜测替代源。

- [ ] **Step 4: 逐项比较源/目标 bytes 与 SHA-256**

  预期恰好 15 个目标、合计 `6,604,677` bytes，且每一对源/目标哈希相同。把结果写入 staging 的 `verification-runs.jsonl`，对应 `RUN-COPY-01` 与 `GATE-12.2.2`；不要把命令退出 0 单独当作复制验证。

- [ ] **Step 5: 记录复制证据并保持未决终态**

  十五项写入精确 `destinationPath`、逐项独立记录 source/destination bytes 与 SHA-256 的 `copyVerification`，并引用 `RUN-COPY-01`；在各自适用的可打开性或完整性 run 为 `PASS` 之前，`storageStatus` 必须保持 `null`。任何未复制项不得伪造 destination 或复制证据；`RUN-COPY-01` 失败会阻止关闭。建立 checkpoint；不 commit。

### Task 4: 完成图片、架构与文档人工门

**Files:**

- Modify: `docs/portfolio/v1-evidence/assets.jsonl`
- Modify outside repository staging: `D:\实习工作\掌眼_作品集证据保全\.qa-staging-2026-08-04-v1-baseline\verification-runs.jsonl`
- Generate temporarily under staging: `D:\实习工作\掌眼_作品集证据保全\.qa-staging-2026-08-04-v1-baseline\docx-renders\`

**Interfaces:**

- Consumes: 六张固定图、两张 AI 概念图、两版 Draw.io、五份新保全 DOCX。
- Produces: 人工 `PASS/FAIL` 与主张限制；不新增作品集展示图。

- [ ] **Step 1: 读取尺寸并逐张查看六张固定图**

  使用以下只读命令取得六个 destination 与两张 AI 概念图的 PNG 尺寸；再用 `view_image` 以 original detail 逐张打开六个 destination。记录画面内容、可读性、是否为开发视图、能支持/不能支持的主张。源/目标视觉都正常且哈希一致后，写 `RUN-IMG-01`；四张最终图保持 `portfolio-candidate`，诊断图保持 `private-only`。

  ```powershell
  $imagePaths = @(
    'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\screens\IMG-DIAG-DESKTOP-01.png',
    'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\screens\IMG-DIAG-MOBILE-01.png',
    'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\screens\IMG-TRADE-DESKTOP-01.png',
    'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\screens\IMG-TRADE-MOBILE-01.png',
    'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\screens\IMG-RESULT-DESKTOP-01.png',
    'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\screens\IMG-RESULT-MOBILE-01.png',
    'D:\实习工作\掌眼\.worktrees\v2-bootstrap\掌眼_Codex启动包_v2\掌眼_Codex启动包_v2\references\视觉方向_明亮新中式.png',
    'D:\实习工作\掌眼\.worktrees\v2-bootstrap\掌眼_Codex启动包_v2\掌眼_Codex启动包_v2\references\视觉方向_暗色鉴定桌.png'
  )
  $dimensionCode = @'
  import json, sys
  from PIL import Image
  for path in sys.argv[1:]:
      with Image.open(path) as image:
          print(json.dumps({"path": path, "width": image.width, "height": image.height, "format": image.format}, ensure_ascii=False))
  '@
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -c $dimensionCode @imagePaths
  ```

- [ ] **Step 2: 逐张查看两张 AI 方向图但不复制**

  用 `view_image` 查看仓库内 `references/视觉方向_明亮新中式.png` 与 `references/视觉方向_暗色鉴定桌.png`，记录可打开性和“AI 辅助方向探索，不是已实现 UI/本人手绘/文化真实性验证”的限制。视觉检查可为 `PASS`，使用状态仍保持 `withheld`，直到来源、政策和许可另行解决。

- [ ] **Step 3: 验证两版 Draw.io 而不制造新预览**

  用下列 Python 标准库命令解析仓库源 `ARCH-EARLY-01` 与 capsule `originals\ARCH-LATE-01.drawio` 的 XML，记录 diagram page 名称、页数、节点/边摘要；对晚版另行解析 capsule `originals\ARCH-LATE-SVG-01.svg`，并用 `view_image` 查看 capsule `originals\ARCH-LATE-PNG-01.drawio.png`。校验 `D:\实习工作\program\掌眼_完整游玩流程.drawio` 与仓库 `ARCH-EARLY-01` 的 SHA-256 同为 `E44B9FD0673921DE5565F5CF67AABBE488607E68770B2E1A9509FAA150B33C37`，登记为 duplicate。早版不生成预览；现有晚版 PNG/SVG 只承担历史架构主张，不自动进入 PDF。

  ```powershell
  $drawioCode = @'
  import json, sys, xml.etree.ElementTree as ET
  for path in sys.argv[1:]:
      root = ET.parse(path).getroot()
      pages = []
      for diagram in root.findall("diagram"):
          cells = diagram.findall(".//mxCell")
          pages.append({"name": diagram.get("name"), "nodes": sum(c.get("vertex") == "1" for c in cells), "edges": sum(c.get("edge") == "1" for c in cells)})
      print(json.dumps({"path": path, "pageCount": len(pages), "pages": pages}, ensure_ascii=False))
  '@
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -c $drawioCode 'D:\实习工作\掌眼\.worktrees\v2-bootstrap\掌眼_Codex启动包_v2\掌眼_Codex启动包_v2\references\掌眼_完整游玩流程.drawio' 'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\originals\ARCH-LATE-01.drawio'

  $svgCode = @'
  import json, sys, xml.etree.ElementTree as ET
  root = ET.parse(sys.argv[1]).getroot()
  print(json.dumps({"path": sys.argv[1], "tag": root.tag, "width": root.get("width"), "height": root.get("height"), "viewBox": root.get("viewBox")}, ensure_ascii=False))
  '@
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -c $svgCode 'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\originals\ARCH-LATE-SVG-01.svg'
  ```

- [ ] **Step 4: 对五份 DOCX 做 OOXML/隐私前置检查**

  用以下 Python `zipfile.ZipFile.testzip()` 和只读 XML 检查确认每份包含 `word/document.xml`，只输出 metadata part 名称与非空字段数，不把字段值打印到 terminal。登记 `docProps/core.xml`、`docProps/custom.xml`、WPS custom parts、作者/修改者/姓名/设备标识风险。三份周报只承担“原件已保全”主张，不渲染、不提取正文、不提升为候选。

  ```powershell
  $docxPaths = @(
    'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\originals\DOC-PITCH-01.docx',
    'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\originals\DOC-REPORT-01.docx',
    'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\originals\DOC-WEEK1-DRAFT-01.docx',
    'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\originals\DOC-WEEK1-DRAFT-02.docx',
    'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\originals\DOC-WEEK1-DRAFT-03.docx'
  )
  $docxAuditCode = @'
  import json, sys, zipfile, xml.etree.ElementTree as ET
  for path in sys.argv[1:]:
      with zipfile.ZipFile(path) as archive:
          names = set(archive.namelist())
          metadata_parts = sorted(name for name in names if name.startswith("docProps/") or "custom" in name.lower())
          nonempty_fields = 0
          for name in metadata_parts:
              try:
                  root = ET.fromstring(archive.read(name))
                  nonempty_fields += sum(bool((element.text or "").strip()) for element in root.iter())
              except ET.ParseError:
                  pass
          print(json.dumps({"path": path, "badMember": archive.testzip(), "hasDocumentXml": "word/document.xml" in names, "metadataParts": metadata_parts, "nonemptyMetadataFieldCount": nonempty_fields}, ensure_ascii=False))
  '@
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -c $docxAuditCode @docxPaths
  ```

- [ ] **Step 5: 只渲染承担内容主张的两份文档**

  ```powershell
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'C:\Users\ASUS\.codex\plugins\cache\openai-primary-runtime\documents\26.802.11031\skills\documents\render_docx.py' 'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\originals\DOC-PITCH-01.docx' --output_dir 'D:\实习工作\掌眼_作品集证据保全\.qa-staging-2026-08-04-v1-baseline\docx-renders\DOC-PITCH-01' --emit_pdf
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'C:\Users\ASUS\.codex\plugins\cache\openai-primary-runtime\documents\26.802.11031\skills\documents\render_docx.py' 'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\originals\DOC-REPORT-01.docx' --output_dir 'D:\实习工作\掌眼_作品集证据保全\.qa-staging-2026-08-04-v1-baseline\docx-renders\DOC-REPORT-01' --emit_pdf
  ```

  bundled Python 当前没有 `fitz`，且本计划禁止安装依赖；因此使用工作区自带 Poppler `pdfinfo.exe` 比较 emitted PDF 页数与 PNG 数量，二者必须相等且大于 0。然后用 `view_image` 以 original detail 检查两个目录中的每一张 PNG，记录乱码、缺字、溢出、截断、空白页和页序。`PAGES 0`、仅运行未查看、页数不等或任一页不可读均为 `FAIL`。

  ```powershell
  $pdfInfo = 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdfinfo.exe'
  $renderDirectories = @(
    'D:\实习工作\掌眼_作品集证据保全\.qa-staging-2026-08-04-v1-baseline\docx-renders\DOC-PITCH-01',
    'D:\实习工作\掌眼_作品集证据保全\.qa-staging-2026-08-04-v1-baseline\docx-renders\DOC-REPORT-01'
  )
  foreach ($directory in $renderDirectories) {
    $pdfs = @(Get-ChildItem -LiteralPath $directory -File -Filter '*.pdf')
    $pngs = @(Get-ChildItem -LiteralPath $directory -File -Filter '*.png' | Sort-Object Name)
    if ($pdfs.Count -ne 1) { throw "expected one PDF in $directory, found $($pdfs.Count)" }
    $pageLine = @(& $pdfInfo $pdfs[0].FullName | Where-Object { $_ -match '^Pages:\s+\d+' })
    if ($LASTEXITCODE -ne 0 -or $pageLine.Count -ne 1) { throw "pdfinfo failed for $($pdfs[0].FullName)" }
    $pdfPages = [int]([regex]::Match($pageLine[0], '\d+').Value)
    if ($pdfPages -eq 0 -or $pdfPages -ne $pngs.Count) { throw "page mismatch pdf=$pdfPages png=$($pngs.Count) in $directory" }
    [pscustomobject]@{ Directory=$directory; PdfPages=$pdfPages; PngPages=$pngs.Count; PngFiles=@($pngs.Name) }
  }
  ```

- [ ] **Step 6: 写入 `RUN-IMG-01`、`RUN-ARCH-01`、`RUN-DOCX-01`**

  三个 required run 分别覆盖 `GATE-12.2.4`、`.5`、`.6`，并把验证 refs 回填 ledger。只有 image/architecture/DOCX 对应 run 链的 active leaf 为 `PASS` 后，才分别提升六张图片、三份晚版 architecture 和五份 DOCX。任一类别失败时，该类别 `storageStatus` 保持 `null`，失败 run 永久保留并由 active leaf 阻止关闭。`RUN-DOCX-01 FAIL` 的获批重试使用新 ID `RUN-DOCX-02` 与 `supersedesRunId: "RUN-DOCX-01"`；不得覆盖旧行。人工观察必须写实际结果，不能写“应该正常”。建立 checkpoint；不 commit。

### Task 5: 复验既有 recovery master、HTML 身份与 Git 基线

**Files:**

- Modify: `docs/portfolio/v1-evidence/assets.jsonl`
- Modify outside repository staging: `D:\实习工作\掌眼_作品集证据保全\.qa-staging-2026-08-04-v1-baseline\verification-runs.jsonl`
- Generate temporarily under staging: `D:\实习工作\掌眼_作品集证据保全\.qa-staging-2026-08-04-v1-baseline\overlay-verify\`

**Interfaces:**

- Consumes: V1 tag/tree、三类 HTML、恢复点、正式交付包、副本、启动 ZIP、overlay。
- Produces: verified-in-place/duplicate/rebuildable 终态和恢复性证据；不重建产品。

- [ ] **Step 1: 重验 Git 身份与两个 bundle**

  ```powershell
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe' rev-parse 'v1.0.0-teacher-handoff^{}'
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe' rev-parse 'v1.0.0-teacher-handoff^{tree}'
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe' bundle verify 'D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\all-preserved-refs.bundle'
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe' bundle verify 'D:\实习工作\掌眼_交付包\2026-08-03-v1.0.0-teacher-handoff\掌眼_V1_Git冻结_v1.0.0-teacher-handoff_f0b20b8.bundle'
  ```

  记录实际 refs/HEAD 列表和退出码；bundle 可验证不等于已经异盘备份。

- [ ] **Step 2: 重验恢复点 26 项与浏览器 42 项 manifest**

  用以下只读函数对 `artifacts-final.sha256.json` 的每条 path 重算 bytes/SHA-256，要求 `26/26`；对 `copy-verification.sha256.json` 要求 `42/42`。顶层浏览器文件是 master，`original-playwright-cli` 的同哈希实例设为 `duplicate-reference`。Chrome profile/cache/verify clone 只设 `rebuildable` 或私有取证集合，不复制。

  ```powershell
  function Test-ShaManifest([string]$manifestPath, [string]$rootPath, [string]$pathField, [string]$lengthField, [string]$hashField, [int]$expectedCount) {
    $rows = @(Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json)
    if ($rows.Count -ne $expectedCount) { throw "manifest count $($rows.Count), expected $expectedCount" }
    foreach ($row in $rows) {
      $relativePath = [string]$row.$pathField
      $sourcePath = Join-Path $rootPath $relativePath
      if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) { throw "missing $sourcePath" }
      $file = Get-Item -LiteralPath $sourcePath
      if ($file.Length -ne [int64]$row.$lengthField) { throw "bytes mismatch $sourcePath" }
      $hash = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash
      if ($hash -ne [string]$row.$hashField) { throw "hash mismatch $sourcePath" }
    }
    [pscustomobject]@{ Manifest=$manifestPath; Verified=$rows.Count; Mismatch=0 }
  }
  Test-ShaManifest 'D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\artifacts-final.sha256.json' 'D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight' 'path' 'length' 'sha256' 26
  Test-ShaManifest 'D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\browser-evidence-v1-teacher-handoff\copy-verification.sha256.json' 'D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\browser-evidence-v1-teacher-handoff' 'RelativePath' 'Length' 'SHA256' 42
  ```

- [ ] **Step 3: 在全新 staging 非破坏展开 overlay 并比较 31 项**

  只对 `D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\uncommitted-working-tree-overlay.zip` 使用以下命令，目标为不存在的 `D:\实习工作\掌眼_作品集证据保全\.qa-staging-2026-08-04-v1-baseline\overlay-verify`。必须得到 `31/31`、零额外、零缺失、零 mismatch；31 条 ledger 根据结果设为 `private-recovery-master-verified-in-place` 或同哈希 `duplicate-reference`，不复制散装文件。

  ```powershell
  $overlayZip = 'D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\uncommitted-working-tree-overlay.zip'
  $overlayManifest = 'D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\uncommitted-files.sha256.json'
  $overlayTarget = 'D:\实习工作\掌眼_作品集证据保全\.qa-staging-2026-08-04-v1-baseline\overlay-verify'
  if (Test-Path -LiteralPath $overlayTarget) { throw 'overlay target must not pre-exist' }
  Expand-Archive -LiteralPath $overlayZip -DestinationPath $overlayTarget
  $expectedRows = @(Get-Content -LiteralPath $overlayManifest -Raw -Encoding UTF8 | ConvertFrom-Json)
  $actualFiles = @(Get-ChildItem -LiteralPath $overlayTarget -Recurse -File)
  if ($expectedRows.Count -ne 31 -or $actualFiles.Count -ne 31) { throw "overlay count expected=$($expectedRows.Count) actual=$($actualFiles.Count)" }
  $actualByPath = @{}
  foreach ($file in $actualFiles) {
    $relativePath = [System.IO.Path]::GetRelativePath($overlayTarget, $file.FullName).Replace('\', '/')
    $actualByPath[$relativePath] = $file
  }
  foreach ($row in $expectedRows) {
    if (-not $actualByPath.ContainsKey($row.path)) { throw "overlay missing $($row.path)" }
    $actual = $actualByPath[$row.path]
    if ($actual.Length -ne $row.length) { throw "overlay bytes mismatch $($row.path)" }
    $actualHash = (Get-FileHash -LiteralPath $actual.FullName -Algorithm SHA256).Hash
    if ($actualHash -ne $row.sha256) { throw "overlay hash mismatch $($row.path)" }
  }
  $expectedPaths = @($expectedRows | ForEach-Object { $_.path })
  $extraPaths = @($actualByPath.Keys | Where-Object { $_ -notin $expectedPaths })
  if ($extraPaths.Count -ne 0) { throw "overlay extras: $($extraPaths -join ', ')" }
  ```

- [ ] **Step 4: 做 ZIP/TAR 完整性与内部清单检查**

  对以下字面路径运行 Python CRC/member-list 检查；所有 ZIP 的 `badMember` 必须为 null、所有 archive 的 `memberCount` 必须大于 0：

  ```powershell
  $zipPaths = @(
    'D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\git-admin-raw-before-ref-repair.zip',
    'D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\uncommitted-working-tree-overlay.zip',
    'D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\package-staging-v1.0.0-teacher-handoff\teacher-sources.zip',
    'D:\实习工作\掌眼_交付包\2026-08-03-v1.0.0-teacher-handoff\掌眼_V1_完整源码_v1.0.0-teacher-handoff_f0b20b8.zip',
    'D:\实习工作\掌眼_交付包\2026-08-03-v1.0.0-teacher-handoff\掌眼_V1_教师提交包_v1.0.0-teacher-handoff_f0b20b8.zip',
    'D:\实习工作\掌眼_交付包 - 副本\2026-08-03-v1.0.0-teacher-handoff\皇城艺鉴-掌眼V1\掌眼_V1_完整源码_v1.0.0-teacher-handoff_f0b20b8.zip',
    'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\originals\PKG-BOOTSTRAP-01.zip'
  )
  $zipAuditCode = @'
  import json, sys, zipfile
  for path in sys.argv[1:]:
      with zipfile.ZipFile(path) as archive:
          bad = archive.testzip()
          print(json.dumps({"path": path, "memberCount": len(archive.infolist()), "badMember": bad}, ensure_ascii=False))
          if bad is not None or len(archive.infolist()) == 0:
              raise SystemExit(1)
  '@
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -c $zipAuditCode @zipPaths

  $tarAuditCode = @'
  import json, sys, tarfile
  for path in sys.argv[1:]:
      with tarfile.open(path, "r:*") as archive:
          members = archive.getmembers()
          print(json.dumps({"path": path, "memberCount": len(members)}, ensure_ascii=False))
          if len(members) == 0:
              raise SystemExit(1)
  '@
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -c $tarAuditCode 'D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\package-staging-v1.0.0-teacher-handoff\teacher-sources.tar'
  ```

  随后解析正式交付 `D:\实习工作\掌眼_交付包\2026-08-03-v1.0.0-teacher-handoff\SHA256SUMS.txt`：重算三个根 archive/bundle 与教师提交 ZIP 内五个成员的 SHA-256，以 hash set 对应清单八个非注释行，要求 `8/8`、零额外、零缺失。针对 capsule destination `D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\originals\PKG-BOOTSTRAP-01.zip`，解析其中唯一 `MANIFEST.md` 的 27 个表格行，对 ZIP 内除 manifest 自身外的 member relative path、bytes 与 SHA-256 逐项比较，要求 `27/27`。交付包副本仅比较其 bundle/source ZIP 与正式包 master 的 SHA-256 和重命名路径，不提升为第二 canonical。

- [ ] **Step 5: 运行静态契约并用真实 Chrome 离线打开三类 HTML**

  Working directory: `D:\实习工作\掌眼\.worktrees\v2-bootstrap\掌眼_Codex启动包_v2\掌眼_Codex启动包_v2\prototype`

  ```powershell
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/v1-release-contract.test.mjs tests/standalone-html.test.mjs tests/numeric-lab.test.mjs tests/hifi-html.test.mjs
  ```

  这些测试只读现存文件。记录退出码和测试数；不得补跑会生成文件的 npm/build 命令。静态测试后，再用已安装的 `C:\Program Files\Google\Chrome\Application\chrome.exe` 和 staging 内全新 profile 从真实 `file://` URI 打开 canonical、低保真与数值实验台。不得截图；只捕获内存中的 rendered DOM/进程输出，并检查退出码、HTML title 与一个页面特征标记：

  ```powershell
  $chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
  $chromeProfile = 'D:\实习工作\掌眼_作品集证据保全\.qa-staging-2026-08-04-v1-baseline\chrome-html-open'
  if (Test-Path -LiteralPath $chromeProfile) { throw "Chrome QA profile must not pre-exist" }
  New-Item -ItemType Directory -Path $chromeProfile | Out-Null
  $htmlCases = @(
    @{ Id='HTML-CANONICAL-01'; Path='D:\实习工作\掌眼\.worktrees\v2-bootstrap\掌眼_Codex启动包_v2\掌眼_Codex启动包_v2\prototype\public\掌眼_高保真教师演示.html'; ExpectedTitle='掌眼｜高保真教师演示'; ExpectedMarker='DEVELOPMENT VIEW' },
    @{ Id='HTML-LOFI-01'; Path='D:\实习工作\掌眼\.worktrees\v2-bootstrap\掌眼_Codex启动包_v2\掌眼_Codex启动包_v2\prototype\public\掌眼_低保真交互原型.html'; ExpectedTitle='掌眼｜民国漆木首饰盒低保真原型'; ExpectedMarker='共享行动循环原型' },
    @{ Id='HTML-NUMERIC-01'; Path='D:\实习工作\掌眼\.worktrees\v2-bootstrap\掌眼_Codex启动包_v2\掌眼_Codex启动包_v2\prototype\public\掌眼_数值实验台.html'; ExpectedTitle='掌眼｜规则与定价数值实验台'; ExpectedMarker='五档价值参数表' }
  )
  foreach ($case in $htmlCases) {
    $resolvedHtml = (Resolve-Path -LiteralPath $case.Path).Path
    $fileUri = [System.Uri]::new($resolvedHtml).AbsoluteUri
    $renderedOutput = (& $chrome '--headless=new' '--disable-gpu' '--no-first-run' '--no-default-browser-check' "--user-data-dir=$chromeProfile" '--virtual-time-budget=2000' '--dump-dom' $fileUri 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) { throw "$($case.Id) Chrome exit $LASTEXITCODE" }
    if ($renderedOutput -notmatch [regex]::Escape($case.ExpectedTitle)) { throw "$($case.Id) title missing" }
    if ($renderedOutput -notmatch [regex]::Escape($case.ExpectedMarker)) { throw "$($case.Id) marker missing" }
  }
  ```

  把三次实际 exit/title/marker 结果写入 `RUN-HTML-01`，并明确 plain open 只支持“真实浏览器可离线加载”；它不能替代完整交互复跑、真人体验或长期平衡证据。staging Chrome profile 属于 `rebuildable` QA 中间物，Task 6 Step 7 才能按精确路径清理。

- [ ] **Step 6: 写入恢复、Git、归档与 HTML run**

  写 `RUN-RECOVERY-01`、`RUN-GIT-01`、`RUN-ARCHIVE-01`、`RUN-HTML-01`，分别覆盖 `GATE-12.2.3`、`GATE-12.2.8` 与 `GATE-12.2.7` 的证据和盲点；`GATE-12.2.1`、`GATE-12.2.10`、`GATE-12.2.12` 留给 Task 6 的专用 cross-cutting runs。只有 `RUN-ARCHIVE-01` 为 `PASS` 后，才把 `PKG-BOOTSTRAP-01` 提升为 `private-master-copied`；若该 run 失败，则其 `storageStatus` 保持 `null`，失败 run 保留并阻止关闭。更新其余 master、duplicate、rebuildable 终态。任何失败都留在 ledger，不删项。

### Task 6: 独立 QA、冻结胶囊文本并关闭工作流

**Files:**

- Copy once outside repository: `D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\README.md`
- Copy once outside repository: `D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\assets.jsonl`
- Copy once outside repository: `D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\verification-runs.jsonl`
- Create outside repository: `D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\SHA256SUMS.txt`
- Create outside repository: `D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline\qa\close-report.json`
- Create: `docs/project/evidence/EXP-018-v1-portfolio-evidence-preservation.md`
- Modify: `docs/project/02-CURRENT-STATE.md`
- Modify: `docs/project/03-NEXT-ACTIONS.md`

**Interfaces:**

- Consumes: 完整 ledger、十二门 runs、15 个副本、独立 QA 结论。
- Produces: 一次冻结的轻量胶囊、准确完成声明、下一工作流交接。

- [ ] **Step 1: 由独立只读 QA 复核未冻结状态**

  QA 直接读取源、repo ledger、staging runs 和 capsule binaries，检查：15 项 allowlist/bytes/hash；所有第 7 节来源与 31 项覆盖；两类状态独立；四张成果图优先且中间材料未误升候选；图片/Draw.io/DOCX 人工记录真实；同盘声明；零产品改动；无隐藏截图/打包/发布。QA 不编辑 ledger，只返回 PASS/FAIL/UNKNOWN 与精确证据。

- [ ] **Step 2: 修正 QA 发现并先对 repo/staging 运行 close verifier**

  根据已有逐项 run 补齐 `RUN-REGISTER-01`、`RUN-PRIVACY-01`、`RUN-PRESERVE-01`、`RUN-PROJECT-CHECK-01` 和 `RUN-HONESTY-01`；其中 project check 是冻结前检查，Step 6 还要在项目 ledger 更新后重跑并把最终结果写入 `EXP-018`。历史失败 run 必须保留，close 只以每条合法 supersession 链的 active leaf 判定状态。只有独立 QA 无未解决 blocking issue，且 `--mode close` 对 repo `assets.jsonl` + staging `verification-runs.jsonl` + capsule binaries 返回 `unresolvedCount: 0`、`blockingFailureCount: 0`，才能继续。此时尚未把文本复制进 capsule，允许用 `apply_patch` 修正 repo/staging 文本；不得改源或复制白名单。

- [ ] **Step 3: 一次性冻结三份文本并生成 checksum**

  确认 capsule 根目录尚无 `README.md`、`assets.jsonl`、`verification-runs.jsonl` 后，分别从 repo README、repo assets 和 staging runs 非覆盖复制一次。随后生成 `SHA256SUMS.txt`，范围恰好是三个根文本文件、`originals/` 九项和 `screens/` 六项；按 capsule-relative path 排序，UTF-8，无自身哈希，不包含 rebuildable QA intermediates。

- [ ] **Step 4: 对冻结副本再跑 close verifier**

  以 capsule 中的 `assets.jsonl` 和 `verification-runs.jsonl` 为输入运行同一只读 validator；把 stdout JSON 保存为 `qa/close-report.json`。要求复制数为 15、复制 bytes 为 `6,604,677`、checksum 全匹配、两项计数均为 0。若失败，停止并报告；不得覆盖已冻结文本来“修好”。

- [ ] **Step 5: 写 `EXP-018` 与项目 ledger 交接**

  `EXP-018` 记录目的、基线、白名单、实际命令/时间/退出码、人工观察、独立 QA、完成声明、同盘残余风险和未进入最终 PDF 的材料。把 `02-CURRENT-STATE.md` 的工作流状态改为 Completed，把 `03-NEXT-ACTIONS.md` 的当前主线切换到已登记的 `V2-RESEARCH-001`；明确后者完成后才为“统一数值权威源”选择架构和实施计划。

- [ ] **Step 6: 运行最终仓库保持性门**

  ```powershell
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe' diff --check
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe' status --short
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe' diff --name-only 'v1.0.0-teacher-handoff^{}' -- '掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype' 'release' 'docs/teacher'
  & 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'C:\Users\ASUS\.agents\skills\project-co-leader-v2\scripts\check_project_memory.py' --root 'D:\实习工作\掌眼\.worktrees\v2-bootstrap'
  ```

  预期：`diff --check` 与项目记忆检查退出 0；产品表面 diff 无输出；status 只包含计划批准范围内的 docs/validator/test 变更和进入本轮前已有的相关治理记录。相对链接逐个打开检查。

- [ ] **Step 7: 安全移除只含可重建 QA 中间物的 staging**

  在确认 `verification-runs.jsonl` 已冻结、DOCX 每页记录已进入 ledger/EXP-018、overlay 结果已进入 run 后，使用 `GetFullPath` 再次要求 staging 路径精确等于 `D:\实习工作\掌眼_作品集证据保全\.qa-staging-2026-08-04-v1-baseline`。删除前必须枚举并确认其中只含本计划生成的 `verification-runs.jsonl` 草稿、`docx-renders/`、`overlay-verify/`、`chrome-html-open/` 与用户批准 LibreOffice 路径产生的 `libreoffice-install/`（含已校验 MSI、administrative image、隔离 profile 和安装/下载日志）；这些都是可重建私有 QA 中间物，不得写入 capsule checksum。满足白名单后才可 `Remove-Item -LiteralPath` 递归删除该精确目录。不得对 parent、glob 或其他目录执行删除；交接中说明这些中间物已删除且可从冻结源重建。

- [ ] **Step 8: 交接而不提交**

  返回 implemented/verified/withheld/未做四类结果、胶囊绝对路径、15 项/bytes/hash 摘要、同盘限制、独立 QA 与下一行动。不要 stage、commit、push、部署或启动 `V2-RESEARCH-001`，除非用户在交接后另行授权。

---

## Final Acceptance Meaning

完成本计划只能支持：

- V1 作品集语境、关键思想迭代、少量原件和成果图已建立可追溯的同盘私有保全；
- 既有恢复 master 在本轮得到复验，而不是被重复复制；
- 最终学校 PDF 有成果优先的候选入口，但尚未确定目标项目、页数、语言、公开许可或 Figma 页面。

它不能支持：异盘灾难恢复完成、最终作品集完成、所有历史切片都值得展示、玩法已经长期平衡、统一数值权威源已经实施。
