# 《掌眼》V1 私有证据索引

本索引把 `210` 条 V1 证据登记整理成可读入口，服务于后续筛选与追溯；它不是最终作品集。权威输入是 [资产登记表](./assets.jsonl)、[已批准的 V1 证据保全规格](../../superpowers/specs/2026-08-04-v1-portfolio-evidence-preservation-design.md) 与 [EXP-017 成果/过程取舍核实](../../project/evidence/EXP-017-portfolio-curation-guidance-review.md)。

## 1. 范围与权威层

这是**私有 V1 证据登记**。它不建立新的产品权威，不授予公开许可，不代表最终 Figma/PDF 已制作，也不代表已经形成异盘灾难恢复。

权威顺序必须保持清楚：

1. V1 生产身份由 Git freeze `f0b20b8ef5f5246529027f90a3fb277659c329cf` 与 annotated tag `v1.0.0-teacher-handoff` 确定；
2. 设计决定、假设、实验和历史提交解释“为什么演化成这样”，不能冒充当前 V1 生产能力；
3. 恢复点、bundle、patch、overlay、浏览器副本和 QA 中间目录只承担恢复或验证语境，不能冒充产品 master、独立验证或当前视觉权威。

V2 治理起点只证明所登记的 `prototype`、`release`、`docs/teacher` 三个 V1 产品表面子树未改变；它不扩大 V1 的功能、验证或发布范围。本轮已重新取得正式交付 `8/8`、ZIP CRC、TAR 成员和两个 bundle 完整历史的只读验证证据；但这不等于做过 bundle restore，也不支持公开可用性、内容语义正确、审美接受或异盘恢复已经完成。

## 2. 同盘与异盘边界

已按批准计划建立 capsule `D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline`。它仍与项目位于同一 `D:` 盘，只能提供抗工作树变化的语境保全，不能称为异盘备份或灾难恢复。

截至本快照，capsule 中恰有固定白名单的 `15` 个物理副本、合计 `6,604,677` bytes；源/目标 bytes 与 SHA-256 已逐项相等，并已分别通过图片、架构、DOCX 或启动包完整性门，因此 `15` 项均取得 `private-master-copied` 终态。恢复点、浏览器证据、交付包、Git 身份、HTML 与 overlay 也已在原位置只读复验；它们没有被重复复制。Task 6 将本 README、ledger 和 runs 一次性冻结进 capsule，冻结后不得覆盖；若以后需要灾难恢复，仍必须另行批准独立存储位置并重新验证。

## 3. Fixed Copy Allowlist 与排除集

已执行的固定复制白名单恰好是以下 `15` 个 stable ID，合计 `6,604,677` bytes。`useStatus` 只描述未来策展资格，不等于已经取得存储终态。

| Stable ID | Bytes | 当前 useStatus | 边界 |
|---|---:|---|---|
| `DOC-PITCH-01` | 34,374 | `private-only` | 早期策划 DOCX 原件；需隐私与逐页核验 |
| `DOC-REPORT-01` | 15,125 | `private-only` | 早期汇报 DOCX 原件；需隐私与逐页核验 |
| `PKG-BOOTSTRAP-01` | 4,545,757 | `private-only` | 启动包原件；不是公开源码包 |
| `ARCH-LATE-01` | 47,314 | `private-only` | 后期 Draw.io 可编辑原件 |
| `ARCH-LATE-SVG-01` | 146,365 | `private-only` | 后期架构 SVG 导出 |
| `ARCH-LATE-PNG-01` | 664,582 | `private-only` | 后期架构 PNG 导出 |
| `DOC-WEEK1-DRAFT-01` | 17,191 | `withheld` | 周报草稿；姓名、metadata、半成品语境未清除 |
| `DOC-WEEK1-DRAFT-02` | 16,176 | `withheld` | 周报草稿；姓名、metadata、半成品语境未清除 |
| `DOC-WEEK1-DRAFT-03` | 13,032 | `withheld` | 周报草稿；姓名、metadata、半成品语境未清除 |
| `IMG-DIAG-DESKTOP-01` | 284,937 | `private-only` | 开发诊断图；只在需要解释评分或信息隔离时择一 |
| `IMG-DIAG-MOBILE-01` | 100,488 | `private-only` | 移动诊断图；不是默认正文成果图 |
| `IMG-TRADE-DESKTOP-01` | 234,371 | `portfolio-candidate` | 最终桌面交易状态候选 |
| `IMG-TRADE-MOBILE-01` | 97,754 | `portfolio-candidate` | 最终移动交易状态候选 |
| `IMG-RESULT-DESKTOP-01` | 286,861 | `portfolio-candidate` | 最终桌面结算候选 |
| `IMG-RESULT-MOBILE-01` | 100,350 | `portfolio-candidate` | 最终移动结算候选 |

白名单之外默认**不复制**：恢复点制品，bundle/patch/overlay，Git 代码与 HTML，AI 概念图，早期架构，重复 browser/`original-playwright-cli` 实例，以及 Chrome/cache/expanded QA 目录。本工作流不生成低保真截图、数值实验截图、Figma 文件或最终作品集/学校 PDF；两份私有 DOCX 的四页 PDF/PNG 只是在 staging 中生成并逐页检查的可重建 QA 中间物。

## 4. 九个历史节点

事件发生日与 Git 提交日是两个字段。下表只把已验证的 Git committer date 写入“Git 提交日”；没有独立事件记录时明确写“未单独确证”，不从提交日倒推事件日。

| 历史节点 | Commit 映射 | 事件日/语义日期 | Git 提交日 | 可支持的结果 | 不能越过的限制 |
|---|---|---|---|---|---|
| `HIST-V1-01-INITIAL-LOFI` | `60925ea` | 未单独确证 | `2026-07-22T10:52:09+08:00` | 从表情猜测转向证据、成本与承诺的初始低保真 | 边界尚未收敛到最终“不故意说谎” |
| `HIST-V1-02-RULE-SLICE` | `694eeeb` | 未单独确证 | `2026-07-22T14:48:56+08:00` | 确定性 action/result、固定 seed、玩家面与调试面分离 | 不是完整 NPC 纺锤或完整产品 |
| `HIST-V1-03-INTEGRATED-LOFI` | `4afd29a` | 未单独确证 | `2026-07-23T13:59:00+08:00` | 交叉调查、玩家离散后验、静态 NPC 认知隔离、纺锤与双层结算 | 低保真整合不等于最终视觉或真人验证 |
| `HIST-V1-04-NUMERIC-LAB` | `bdd777b` | 未单独确证 | `2026-07-23T23:47:40+08:00` | 重尾价值、稳健分位报价和有限议价实验 | 实验参数不等于最终生产三假设或长期平衡 |
| `HIST-V1-05-DUAL-BELIEF-DECISION` | `5fa3cab` | 未单独确证 | `2026-07-24T11:32:09+08:00` | 提出真相、玩家认知、NPC 认知、共享信息四层 | **该提交没有产品实现** |
| `HIST-V1-06-DUAL-POSTERIOR-LAB` | `f4e689d` | 未单独确证 | `2026-07-24T12:33:50+08:00` | 自动代理与 NPC 重估实验 | 实验通过不等于真人理解、统计校准或长期平衡 |
| `HIST-V1-07-HIFI-ALIGNMENT-RECORD` | `ad32cd8` | 记录所述事件可早于 Git 日；本索引不改写 | `2026-07-31T12:12:15+08:00` | 记录抽象 framing 不可读并推动设计收缩 | 后补记录不是“事件当日提交” |
| `HIST-V1-08-HIFI-PRODUCTION` | `61ef25d` + `318e4d6` | 未单独确证 | `2026-07-31T11:12:29+08:00`；`2026-07-31T12:11:31+08:00` | 双后验、共享具体证据、动态定价进入生产规则与高保真界面 | 两个提交必须作为同一节点的独立记录，不扩大为通用引擎 |
| `HIST-V1-09-JUDGMENT-TO-FREEZE` | `0fcbb89` → `f0b20b8` | 未单独确证 | `2026-08-03T09:40:11+08:00` → `2026-08-03T19:19:52+08:00` | D/C/R/J、证据结构上限，最终走到 V1 freeze/tag | `0fcbb89` 不是 freeze root；历史门禁不等于本轮重跑 |

## 5. 五条主张矩阵

| 主张 | 准确主张 | 设计锚点 | 生产/验证锚点 | 不能声称 |
|---|---|---|---|---|
| **PLAYER POSTERIOR** | 玩家在三个有限假设上，从各 `1/3` 先验出发，对去重物证似然与结构化陈述置信度做 Bayes-like 乘积归一；谨慎分位、期望值、报价、成本和安全垫只生成参考，最终调查、披露、交易或拒绝仍由玩家决定。 | [保全规格 §8.2](../../superpowers/specs/2026-08-04-v1-portfolio-evidence-preservation-design.md)、[DEC-007](../../project/decisions/DEC-007-dual-belief-and-strategic-disclosure.md) | [resolve-action.ts](../../../掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts)、[rules.test.mjs](../../../掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/rules.test.mjs) | 真实古玩样本校准、完整贝叶斯网络、统计外部效度或长期平衡 |
| **NPC SPINDLE** | 丰富输入先归并为 `pressure / trust / dealIntent / control` 四状态，再形成有限候选，经硬过滤、分项评分和可复现的近分扰动，最后收敛为回应、一次性 Storylet 与结构化陈述。 | [保全规格 §8.3](../../superpowers/specs/2026-08-04-v1-portfolio-evidence-preservation-design.md)、[产品状态模型](../../../掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/docs/02_NPC_STATE_MODEL.md) | [resolve-action.ts](../../../掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts)、[EXP-005](../../project/evidence/EXP-005-integrated-loop-and-debug-report.md) | 通用数据驱动 Storylet 引擎或生成式 AI NPC |
| **NPC DYNAMIC POSTERIOR** | 隐藏真相、玩家私有认知与 NPC 已共享认知分层；NPC 从私有信号和首次共享的具体证据更新后验，再影响估值、立场与回应，重复披露不重复计权。 | [保全规格 §8.4—8.5](../../superpowers/specs/2026-08-04-v1-portfolio-evidence-preservation-design.md)、[DEC-005](../../project/decisions/DEC-005-separate-object-truth-and-npc-belief.md)、[DEC-007](../../project/decisions/DEC-007-dual-belief-and-strategic-disclosure.md)、[HYP-004](../../project/hypotheses/HYP-004-dual-posterior-disclosure.md) | [EXP-007](../../project/evidence/EXP-007-dual-posterior-disclosure-lab.md)、[EXP-008](../../project/evidence/EXP-008-dual-posterior-player-loop.md)、[rules.test.mjs](../../../掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/rules.test.mjs) | 多 NPC 外推、所有人格参数已全面生效或后验已经统计校准 |
| **TRUTHFUL DISCLOSURE** | 玩家只能从已经发现的真实具体证据中选择披露；首次公开写入共享账本并影响 NPC 后验、关系与价格，未公开证据保持私有。最终 V1 不保留抽象 framing。 | [保全规格 §8.6](../../superpowers/specs/2026-08-04-v1-portfolio-evidence-preservation-design.md)、[CH-002](../../project/challenges/resolved/CH-002-settlement-bargaining-and-disclosure-alignment.md)、[EXP-009](../../project/evidence/EXP-009-first-player-alignment-review.md) | [EXP-012](../../project/evidence/EXP-012-high-fidelity-teacher-demo.md)、[resolve-action.ts](../../../掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/resolve-action.ts)、[rules.test.mjs](../../../掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/rules.test.mjs)、[hifi-flow.test.mjs](../../../掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/hifi-flow.test.mjs) | V1 仍有抽象 framing、已实现开放式说谎，或已有通用自然语言事实核查 |
| **OUTCOME vs JUDGMENT** | 客观净结果读取隐藏真相、真实价值、价格与成本；判断质量只读取当时可见后验和证据结构。两者分账，但综合等级组合 `D/C/R/J` 等分项，不等于单一利润标签。 | [保全规格 §8.7](../../superpowers/specs/2026-08-04-v1-portfolio-evidence-preservation-design.md)、[DEC-004](../../project/decisions/DEC-004-objective-outcome-and-judgment.md)、[判断质量规格](../../superpowers/specs/2026-07-31-judgment-quality-scoring-design.md) | [judgment-quality.ts](../../../掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/game/judgment-quality.ts)、[EXP-013](../../project/evidence/EXP-013-judgment-quality-scoring.md)、[EXP-015](../../project/evidence/EXP-015-v1-teacher-handoff.md)、[judgment-quality.test.mjs](../../../掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/judgment-quality.test.mjs) | 两者统计独立、权重已长期调平，或“等级 = 利润” |

用户后续要求的“实际客观收益—结算评分”Critical 相关性验证尚未执行，也不在近期本工作流。开始该验证前仍需确认收益定义、随机种子范围、评分字段、相关/失配阈值与通过含义；当前不得预设系数、权重或阈值。

## 6. 成果优先的 PDF 边界

默认直接候选只有四张最终高保真成果图：`IMG-TRADE-DESKTOP-01`、`IMG-TRADE-MOBILE-01`、`IMG-RESULT-DESKTOP-01`、`IMG-RESULT-MOBILE-01`。两张诊断图只在确需解释判断质量模型或玩家/开发信息隔离时择一。

AI 概念图、原始 DOCX、周报、recovery 材料、低保真与数值实验截图不默认进入正文。过程材料只以少量高信息密度的框架、设计演化或实现机制支撑最终成果，避免把连续切片和半成品堆成开发日志。当前不制作最终 Figma 作品集或学校 PDF；用于 DOCX 可读性验证的 staging PDF 不属于作品集成果。最终页数、语言、文件大小和项目数量必须在目标院校、项目与年份明确后重新核实。

## 7. 许可、隐私与 AI

- 仓库根没有足够覆盖公开再分发的 `LICENSE`、`NOTICE`、`CREDITS` 或第三方资产表；文件在个人磁盘或 Git 中存在，不构成公开许可。
- DOCX 已知可能包含姓名、author/modified-by 与 WPS custom metadata。原件和三份周报保持私有，其中三份周报为 `withheld`；只有另建脱敏副本并逐页渲染核验后，才可能重新评估。
- AI 图只能称为“AI 辅助视觉方向探索”，不能称为本人手绘、真实照片、实现 UI 或文化真实性验证。生成账号、提示词、目标学校 AI 政策与发布许可仍未闭合。
- 当前 `public-redacted = 0`。任何未来提升都必须同时完成来源、许可、隐私、脱敏 diff 与视觉/逐页复核。

## 8. Validator：Task 6 冻结候选已通过 close 前门

从仓库根运行：

```powershell
& 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts/portfolio-evidence/verify-register.mjs --register docs/portfolio/v1-evidence/assets.jsonl --runs 'D:\实习工作\掌眼_作品集证据保全\.qa-staging-2026-08-04-v1-baseline\verification-runs.jsonl' --capsule 'D:\实习工作\掌眼_作品集证据保全\2026-08-04-v1-baseline' --mode draft
```

当前准确快照：`assetCount=210`、`copiedFileCount=15`、`copiedBytes=6604677`、`unresolvedCount=0`、`blockingFailureCount=0`、`errors=[]`。`210` 项终态分布为：`private-master-copied=15`、`private-recovery-master-verified-in-place=105`、`duplicate-reference=59`、`rebuildable=31`。`RUN-DOCX-01 FAIL` 仍作为真实历史保留；合法的同 gate、同资产集、较晚 `RUN-DOCX-02 PASS` 是唯一 active leaf，所以旧失败不再阻断，但没有被删除或改写。

`81/81` 是 [EXP-015](../../project/evidence/EXP-015-v1-teacher-handoff.md) 记录的历史冻结门禁，本轮没有重跑，不能写成当前保全测试结果。本轮新鲜证据包括保全 validator `59/59`、V1 只读静态契约 `16/16`、恢复/归档/Chrome/DOCX 人工门、Task 4 独立 QA 和 Task 6 未冻结独立 QA。五个 cross-cutting runs 已补齐；repo ledger + staging runs 的 pre-freeze `close` 已返回 `unresolvedCount=0`、`blockingFailureCount=0`、`errors=[]`。本 README、ledger 与 runs 仍需按计划一次性复制进 capsule，并对冻结副本重跑 close 与 checksum；这些完成前不声明工作流关闭。

## 9. 怎么使用与何时维护

日常找素材时，先看本 README 的“成果优先”与“五条主张矩阵”，再用 `assets.jsonl` 的稳定 `assetId` 追到原件、来源、用途限制和验证 run。最终学校 PDF 默认从四张 `portfolio-candidate` 成果图开始；设计思想用五条主张和九个历史节点压缩成少量“问题—演化—机制—结果”页面。原始 DOCX、周报、恢复包、AI 概念图和 QA 切片只作为私有追溯材料，不直接拖进 Figma；要公开使用，必须另建脱敏副本并重新检查许可、隐私和页面渲染。

后续开发改为增量维护，不再重做这次的全量考古。Project Co-leader 应在以下触发点主动提醒：

- 一个重要玩法、数值权威、NPC 判断或信息披露架构被批准或替换时：当天补一条“旧方案—新方案—原因—实现锚点”；
- 一个可展示的界面、交互闭环、实验或里程碑完成时：保存一份成果图/短录屏、对应 commit 和验证结论；
- 大重构、迁移、删除旧目录、切换权威源或发布前：先做一次增量备份与恢复性检查；
- 活跃开发期间每 `1–2` 周或每个 milestone：检查新资产是否登记、候选成果是否仍能打开、哈希/路径/隐私状态是否漂移；
- 进入最终 Figma/PDF 制作前：再做一次成果筛选、脱敏、许可、院校 AI 政策、链接可打开性和异盘备份检查。

这里的“提醒”是项目工作流触发规则，不是后台定时任务；当后续对话触及上述节点时，Co-leader 应主动提出整理/备份/复查。
