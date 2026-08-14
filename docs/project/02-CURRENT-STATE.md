# Current State

> 只保存 V3 此刻的真实状态。V2 终态由 frozen tag 与对应项目记录保留。

更新时间：2026-08-14

## 一句话状态

V2 已冻结为可运行、可回放的玩家试玩底座；V3 已从该精确节点建立独立工作树并迁入物品真相拓扑设计证据。当前是 **Design**：尚未批准节点语义、经济终局或第一张拓扑，也没有修改产品代码。

## 已完成且已验证

- V2 annotated tag `v2.0.0-player-prototype-freeze` 为真实 `tag` 对象，解析到提交 `32db763e2fcdcfcb5f090b38405498105d904e19`；V2 工作树在创建 V3 前干净；
- V3 分支 `codex/v3-object-truth-topology` 从该提交建立，创建时 HEAD 与 tag 目标一致；
- 五份 Markdown 原始材料与一张 PNG 已从 `D:\实习工作\掌眼_V3_设计暂存` 迁入，六项源／目标 SHA-256 一致；
- V2 的实际终点和未实现边界已由 [DEC-015](decisions/DEC-015-v2-freeze-and-v3-bootstrap.md) 与 [EXP-029](evidence/EXP-029-v2-player-prototype-freeze.md) 固定。

## 已完成但尚未验证

- 物品真相拓扑、玩家引导、定量价值／信息价值／收手研究已经形成候选原则和 Unknown，但没有通过第一纸面切片或无答案玩家测试；
- 重点作品集过程卡已经保存，但只能作为一个候选转折节点，尚不能进入最终 PDF；
- “前中期较快下降、后期小步承担风险”已经澄清为叙事与决策节奏，不是另起连续检定玩法；尚未做成可玩节奏；
- `2026-08-26` 与 `2026-10-20` 是内部计划目标／候选，不是已经验证可达的排期或外部截止日。

## Active Work Ledger

- Workstream：`V3-DESIGN-BOOTSTRAP-001`；状态：Completed（项目内启动与 pre-commit 验证；commit／post-commit clean 结果不由本文件自证）；责任载体：Project Co-Leader（版本来源、证据迁入、V3 权威记录与验证负责人）+ 临时只读复核者；
- 当前检查点：V3 worktree、六项原始证据、DEC-016／EXP-030、领域语境和人话驾驶舱已经形成；六项哈希、项目记忆、22 份 Markdown／91 链接／21 Mermaid 静态结构、作者新增文档 whitespace 检查与产品 diff 门通过。四份逐字节迁入的原始 Markdown 保留源文件已有的 8 处行尾空格，因此完整 staged `diff --check` 会如实报告这些已知例外；首次提交与 post-commit clean 状态须从 Git 现场核对；
- 授权边界：允许建立 V3 分支／worktree，迁入设计证据，更新治理／设计／overview／轻量作品集记录并本地提交；不得修改产品代码、V1/V2 tag、外部源材料、推送、部署、公开发布或调用 Superpowers；
- changed surface：提交前共 24 份 V3 项目记录、领域语境、原始证据包与轻量作品集入口（13 tracked modifications＋11 untracked）；preserved surface：全部产品源码、案例数值、生成 HTML、V1/V2 frozen refs、V2 worktree、外部暂存源与原工作区；
- 验证状态：详细结果见 [EXP-030](evidence/EXP-030-v3-design-intake-and-research-capsule.md)。通过不代表产品设计、趣味、视觉、文化、平衡或进度可行性；
- Durable handoff：[DEC-016](decisions/DEC-016-v3-design-stage-bootstrap.md)、[EXP-030](evidence/EXP-030-v3-design-intake-and-research-capsule.md) 与 [V3 设计证据包](evidence/v3-design/README.md)；最后更新：2026-08-14；停止／重开触发：哈希漂移、产品路径出现差异、Draft 被写成已批准／实现、V3 不是从冻结 tag 建立，或下一步未经用户确认就写代码。

## 当前阻塞

没有技术阻塞。产品设计故意停在两个需要共同确认的用户拥有字段：

1. **中间节点是什么：** 研究推荐“可以被证据支持或反驳、并有粗细包含关系的鉴定主张”，尚未由用户最终确认；
2. **第一切片的经济终局是什么：** “玩家已经持有器物，在有限资源下决定继续鉴定或选择渠道出售”只是研究候选，尚未批准。

在这两个问题讲清并形成书面决定前，不画五种正式拓扑、不选择概率实现、不修改产品代码。

## 当前边界

- V3 当前只处理物品真相、证据拓扑、玩家知识图、玩家后验与调查／停止后果；
- NPC 深层认知、人物画像、连续对话、D20、受控误导和新议价全部停放；
- V2 代码可以被 V3 后续显式 Adopt／Borrow，但不能静默继承固定三真相、平铺似然或评分公式；
- 玩家图不得直接显示完整作者图、隐藏节点数量、真实边权或唯一最优动作；
- 作品集材料保持轻量，最终以完成成果、界面、自动化和玩家证据为主；
- 不 push、deploy、发布，不制作最终 PDF，不公开使用私有批注图。

## 关键记录

- [V2 冻结与 V3 启动边界](decisions/DEC-015-v2-freeze-and-v3-bootstrap.md)
- [V3 设计阶段启动决定](decisions/DEC-016-v3-design-stage-bootstrap.md)
- [V2 冻结证据](evidence/EXP-029-v2-player-prototype-freeze.md)
- [V3 设计证据迁入](evidence/EXP-030-v3-design-intake-and-research-capsule.md)
- [V3 原话／研究证据包](evidence/v3-design/README.md)
- [领域语境](../../CONTEXT.md)
- [宏观入口](overview/00-START-HERE.md)
