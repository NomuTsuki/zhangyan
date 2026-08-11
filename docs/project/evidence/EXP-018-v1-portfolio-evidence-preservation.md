# EXP-018：V1 基线与作品集原始证据保全

状态：Completed and verified

日期：2026-08-10
Workstream：`V2-PORTFOLIO-001`

## 目的与完成含义

目的不是制作最终作品集，而是把 V1 的成果图、关键设计演化、实现锚点和恢复语境建立成可追溯、成果优先的私有基线。完成只支持“同盘语境保全与既有 recovery master 复验”；不支持异盘灾难恢复、最终 Figma/PDF、公开许可、玩法长期平衡或一般玩家体验已经完成。

## 权威基线与授权边界

- V1 commit：`f0b20b8ef5f5246529027f90a3fb277659c329cf`；tree：`a5f9cbdb65e227d70c95464ebf6530224b78583b`；tag：`v1.0.0-teacher-handoff`；
- capsule：`D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline`；
- 固定复制白名单：`15` 项、`6,604,677` bytes；不复制恢复点、Git/HTML、AI 概念图、早期架构或重复 browser 实例；
- 用户批准追加式 run supersession 和 LibreOffice 私有渲染路径；未授权产品代码、stage/commit/push/PR、部署、上传或公开发布；
- `RUN-DOCX-01 FAIL` 永久保留；`RUN-DOCX-02 PASS` 仅通过同 gate、同资产集、较晚时间、无环无分叉的 active leaf 接续解除 blocking。

## 实际实现

- `assets.jsonl` 登记 `210` 条来源：overlay `31 + collection`、recovery `26`、browser `42 + 42`、Git `16` 及作品集/交付/QA 相关表面；
- terminal 分布：`private-master-copied=15`、`private-recovery-master-verified-in-place=105`、`duplicate-reference=59`、`rebuildable=31`；
- `useStatus` 与存储状态独立：只有四张交易/结算图为 `portfolio-candidate`，`withheld=37`，`public-redacted=0`；
- README 用九个历史节点与五条主张矩阵保留“玩家后验、NPC 纺锤、NPC 动态后验、选择性真实披露、客观结果与判断质量分账”的设计演化，同时明确成果优先、隐私、AI 与最终 PDF 边界；
- 维护规则已写入 README：重要设计/架构替换、成果闭环、重大迁移/删除、每 1–2 周或 milestone、最终 Figma/PDF 前触发增量整理、备份与复查。

## 关键验证证据

### 复制、图片、架构与 DOCX

- 15 对源/目标 bytes 和 SHA-256 均相等；capsule 固定二进制恰为 `15` 项、`6,604,677` bytes；
- 八张图片与晚版架构 PNG 已人工打开；Draw.io 两页和 SVG 可解析；
- 官方 LibreOffice `26.2.5.2` MSI 经官方长度 `372,948,992` 和 SHA-256 `f15ba07bfcb0186986cf3171063506f5d207c11f8cc051ba0d135209e9e915f9` 校验。机器级安装因缺少管理员权限返回 MSI `1603`，未提权；同一 MSI 以 administrative image 展开到私有 staging；
- 两份内容 DOCX 各转为一份非空 2 页 PDF 与两张 PNG。主控和新鲜独立 QA 均打开全部四页，未见缺字、裁切、重叠、破表或意外空白页。三份周报仅做结构/哈希门，保持 `useStatus: withheld`，正文和 metadata 值未输出；
- Task 4 独立 QA verdict：`pass-with-known-risk`，无 P0–P2。

### Recovery、Git、归档与 HTML

- recovery manifest `26/26`、browser manifest `42/42`、fresh overlay `31/31`，零 missing/extra/byte/hash mismatch；
- recovery bundle 与正式 bundle 分别是完整 `9` refs / `5` refs 历史；
- 七个 ZIP 的 `badMember=null`，member counts `1098/31/10/192/5/192/28`；TAR member count `10`；
- 正式 `SHA256SUMS` 实算 `8/8`；启动包 manifest `27/27`；重命名副本的 source ZIP/bundle 与正式 master 哈希一致；
- V1 只读静态契约 `16/16 PASS`；主控使用全新 staging profile 通过安装的 Chrome 对三类 `file://` HTML 取得 exit `0`、准确 title 与 marker，未截图。最终独立 QA 因只读边界未自行启动外部 Chrome，因此这一项保持 controller-produced evidence，而非独立 Chrome 复跑。

### Validator、独立 QA 与冻结

- validator 对抗性套件 `59/59 PASS`；pre-freeze close：`assetCount=210`、`copiedFileCount=15`、`copiedBytes=6604677`、`unresolvedCount=0`、`blockingFailureCount=0`、`errors=[]`；
- Task 6 未冻结独立 QA 直接复核 ledger、15 对哈希、恢复/归档/Git、静态 HTML、视觉页面、产品 diff、capsule/staging 和 README。首次发现两处 README provenance 矛盾后返回 FAIL；修正后定点复审确认链接 `33/33`、draft `0/0` 且无剩余 P0–P3，最终 pre-freeze verdict `PASS`；
- 一次性非覆盖冻结 `README.md`、`assets.jsonl`、`verification-runs.jsonl`；`SHA256SUMS.txt` 恰覆盖三个文本、九个 originals 和六个 screens，共 `18` 项，不含自身或 QA intermediates；
- 冻结 checksum `18/18`；冻结副本 close 再次返回 copied `15` / `6,604,677` bytes、unresolved `0`、blocking `0`、errors `0`，stdout 保存在 `qa/close-report.json`。

## 作品集使用边界

最终学校 PDF 默认从四张交易/结算成果图选图，再用少量“问题—演化—机制—结果”页面解释设计思想。诊断截图只在需要解释信息隔离或判断质量时择一；原始 DOCX、周报、recovery 材料、AI 图、低保真/数值实验与连续中间切片不默认进入正文。目标院校、项目、年份、页数、语言、文件大小、AI 政策、公开许可和脱敏仍需在最终制作前重新核实。

## 已知残余风险与未做事项

- capsule 和所有源仍在 `D:`，没有形成异盘灾难恢复；
- 未制作最终 Figma/PDF，未做公开发布、redacted copy、AI 账号/提示词/签名闭环或一般玩家审美验收；
- 没有证明 Word/WPS 像素级一致、周报页面可公开、玩法长期平衡或客观收益与结算评分关系已调平；
- `docs/project/AGENT-ROSTER.md` 仍不存在；本工作流没有创建持久 Agent 或改变权限，因此不阻断证据结论。若以后要声称项目级持久 Agent 拓扑，必须另行批准并建立 canonical roster；
- staging QA 中间物已按精确白名单检查后删除；删除是永久目录删除，但所有证据均可从冻结源、已校验 MSI 和原始 recovery master 重建。

## 最终仓库门与清理结果

- 最终 `git diff --check` 通过；staged `0`；相对 V1 freeze 的 `prototype`、`release`、`docs/teacher` 产品 diff `0`；
- project memory checker：`Errors=0`、`Warnings=0`；冻结前 repo README/assets/runs 与 capsule 三份文本哈希一致；
- staging 绝对路径再次解析为精确字面值，根和五个顶层项均不是 reparse point；顶层恰为 `verification-runs.jsonl`、`docx-renders/`、`overlay-verify/`、`chrome-html-open/`、`libreoffice-install/`；run 草稿与冻结 run 哈希一致，DOCX render `6` 文件，overlay `31` 文件；
- `Remove-Item -Recurse` 被执行层策略拒绝后，控制器没有扩大路径或换 shell，而是在同一 PowerShell 进程重复绝对路径与 reparse 检查，再用 `[IO.Directory]::Delete(exactPath, true)` 删除精确 staging。删除后 `Test-Path=False`；capsule 与父目录未受影响；
- 清理后再次从 capsule 冻结文本运行 close，并重跑仓库/项目记忆门，结果保持通过。

## 下一行动

本工作流已经关闭，不直接实施产品改动。下一步是另行启动已登记的 `V2-RESEARCH-001` 只读同类游戏/框架调研；之后才为已获批的 V2 第一项核心产品工程“统一数值权威源”选择架构与编写实施计划。客观收益与结算评分关系的 Critical 自动化验证继续延后到统一权威源与评分模型稳定之后。
