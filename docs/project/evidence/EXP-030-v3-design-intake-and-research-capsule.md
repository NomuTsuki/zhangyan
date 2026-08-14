# EXP-030：V3 设计原话、研究与过程资产迁入

日期：2026-08-14

状态：Pre-commit verification completed；首次提交与 post-commit clean 状态须在本记录所在 tree 形成后从 Git 现场核对

## 目的

把 V3 创建前暂存在仓库外的关键原话、研究、候选作品集过程资产和批注图片完整迁入版本控制，同时不把它们升级成已批准规格或已实现成果。

## 版本来源

- V2 annotated tag：`v2.0.0-player-prototype-freeze`；
- V2 冻结提交：`32db763e2fcdcfcb5f090b38405498105d904e19`；
- V3 分支：`codex/v3-object-truth-topology`；
- V3 worktree：`D:\实习工作\掌眼\.worktrees\v3-object-truth-topology`；
- 创建后 V3 HEAD 与 V2 tag 目标一致，创建时工作树干净。

## 来源与逐字节结果

源目录：`D:\实习工作\掌眼_V3_设计暂存`

| 文件 | bytes | SHA-256 | 身份 |
|---|---:|---|---|
| `2026-08-13-object-truth-topology-intake.md` | 22,416 | `EABFE66028FFBCD370C5E4FC58B9E3AE83A86F40ADB7CC52D65C2D337EB14F41` | 用户原话与讨论导航 |
| `2026-08-13-object-truth-topology-research.md` | 20,639 | `B6FCFA25EA94159B834BBF320DC739F6D86F0EE4D9378832448ABE11C076C922` | 外部研究与概念澄清 |
| `2026-08-13-player-guidance-and-cognitive-scaffolding-research.md` | 19,011 | `AB857A3B763BE2CA2C05C0FF7FE74DDC31FC1261F924FD78C6872B89FC004A95` | 玩家引导研究 |
| `2026-08-14-quantitative-truth-value-of-information-and-stopping-research.md` | 8,996 | `A5E4A6A218ACF8A9B3B4F2499F4A38DA32C3B861B66F3784C5D5C709297CF960` | 定量真相、调查价值与收手研究 |
| `2026-08-13-object-truth-topology-portfolio-process-asset.md` | 8,169 | `1AFB6B151CC1E6D640C6D490A3291A7EEE7B766476334B1C29A9457AC0E759C5` | 重点过程资产候选 |
| `assets/2026-08-14-ron-gilbert-topology-user-annotated.png` | 101,361；`1343×300` | `ADD6D0B2302C5F2ABE60B2B654E340AAACC46E49993240B7E66069971454BDFB` | 用户批注私有研究图 |

复制后六项源／目标 SHA-256 均一致。正式相对路径与哈希见 [V3 证据包](v3-design/README.md) 和 [SHA256SUMS](v3-design/SHA256SUMS.txt)。

## 证据身份边界

- `intake` 的逐字原话是来源证据，不是当前用户授权清单；其中写明“当时不授权 Git 写操作”的句子保留历史语境，不覆盖用户在 2026-08-14 对本批次的新授权；
- 三份研究提供 Adopt／Borrow／Reject／Unknown 候选，不证明实际玩家体验；
- 过程资产卡最多是最终作品集中的一个转折节点候选，必须与完成后的 UI、拓扑、自动化和无答案玩家验证配对；
- 批注 PNG 只作私有研究参考。公开作品集使用前应重绘，不直接复用原博客图，并核对引用与权利边界。

## 验证契约

### 通过条件

- 六个原始文件源／目标 SHA-256 全部一致；
- V3 项目记忆、相对链接、代码围栏和 Mermaid 静态结构通过；作者新增文档通过 whitespace 检查，逐字节迁入的原始证据若保留源文件既有格式例外则须逐项记录；
- 相对 V2 冻结标签的产品路径差异为 `0`；
- V3 项目文档把当前状态写为 Design，把未决方案写为 Unknown／Draft；
- 首次提交后 V3 工作树干净，分支祖先包含 V2 冻结提交。

### 通过含义与盲区

通过只代表来源完整、版本身份清楚、文档边界一致和产品未被改写。它不证明节点语义、经济终局、概率模型、UI、五种拓扑、艺术资产、进度估算或玩家体验已经批准、实现或验证。

## 结果

- `SHA256SUMS.txt` 六项逐条重算：源、目标与清单哈希 `6/6` 一致，错误 `0`；
- Project Co-leader V2 项目记忆检查：`0 errors / 0 warnings`；
- 22 份本批 Markdown、91 个本地链接、21 个 Mermaid 代码块（含反引号与波浪号两种合法围栏）通过相对路径、代码围栏与 Mermaid 静态结构检查，错误 `0`；Mermaid 未做渲染视觉验收；
- 作者新增文档的 staged whitespace 检查通过；完整 staged `git diff --check` 只报告四份逐字节迁入原稿中原本存在的 8 处行尾空格。为维持六项 SHA-256 与外部源一致，本批不清理这些原稿格式，且不把该预期例外误报为全量通过；提交前范围为 24 份文件（13 tracked modifications＋11 untracked），冲突 `0`；
- 相对 `v2.0.0-player-prototype-freeze` 的产品路径 diff 为 `0`；V2 worktree 保持干净；
- 权威页面、DEC-016 和 overview 均把当前状态写为 Design，并把节点、终局、玩家图、五种拓扑、排期与产品实现写为 Unknown／未批准。

commit SHA 与 post-commit clean 状态无法写入产生它们的同一提交，必须在提交后从 Git 现场核对。任一身份／清洁检查失败则不报告 V3 启动完成。

## 相关决定

- [DEC-016：V3 从设计阶段启动](../decisions/DEC-016-v3-design-stage-bootstrap.md)
