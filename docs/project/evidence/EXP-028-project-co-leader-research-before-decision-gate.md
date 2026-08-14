# EXP-028：Project Co-leader V2 决策前调查门禁

日期：2026-08-13

状态：Completed；治理、兼容、边界与独立前向验证已完成，限制见下文

## 测试了什么

本记录检查 Project Co-leader V2 是否已经稳定要求“产品影响决定在建议、规格或编码前先调查现有方案”，以及怎样补齐这一门禁而不让普通 coding 变成研究仪式。

## 本地基线

- `2.3-human-readable-steering` 已要求能从文件、代码、测试、工具、研究或便宜实验获得的事实不得反问用户；
- 但它没有确定性规定：何时必须在产品决定前调查、最低需要哪些证据、如何输出采用／借鉴／拒绝／未知，以及 coding 中什么情况应重开门禁；
- 项目配置、AGENTS 托管块和检查器也没有 `decision_research_gate`，因此不同 Agent 可能偶发调研，也可能直接依赖灵感。

## 外部依据与采用方式

- Design Council 的 Double Diamond 先扩散理解问题，再收敛行动；Develop 阶段明确建议从外部寻找灵感，Deliver 阶段以小规模测试淘汰或改进方案。**Borrow：** 用于约束“先理解与比较，再决定”，不照搬完整设计流程。[Design Council Framework for Innovation](https://www.designcouncil.org.uk/resources/framework-for-innovation/)
- AWS 把 ADR 限定为影响结构、依赖、接口、框架／工具等架构重要决定，并记录语境、决定和后果；新认识通过新记录 supersede 旧决定。**Borrow：** 只为重大事件留长期记录，不为每次查阅制造文档。[AWS ADR process](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html)
- Google Cloud 建议在没有既有决策依据、方案未被团队记录或存在多个工程选项时使用 ADR，并强调轻量、靠近代码和保留变化原因。**Borrow：** 每次门禁在对话中给结论，只有改变重大决定、风险、下一行动或作品集叙事时才固化。[Google Cloud ADR overview](https://docs.cloud.google.com/architecture/architecture-decision-records)

结论不是 Adopt 某个外部流程，而是 **Borrow** 三条原则：先探索再收敛、重要决定保留原因、记录重量与决定影响成比例。

## 用户批准的门禁

```yaml
workflow_revision: "2.4-evidence-before-decision"

decision_research_gate:
  mode: "adaptive"
  trigger: "product-impact"
  minimum_evidence: "triangulated"
  stop_rule: "evidence-saturation"
  source_priority: "local-then-primary-then-practice"
  coding_boundary: "reopen-on-emergent-product-decision"
  durable_recording: "material-events-only"
```

### 何时触发

当新想法可能改变玩家／用户选择、规则因果、算法或平衡、系统／体验边界、生产依赖、文化／领域准确性或作品集创新主张时触发。

普通产品影响决定至少需要“三角证据包”：

1. 当前项目的本地现状；
2. 一个原始／第一方来源；
3. 一个真实实现或相邻实践。

核心架构、底层数值或经济、文化准确性、难逆依赖和复杂项目的基础阶段自动升级为 Deep；Agent 可以提高强度，不能静默低于项目最低值。

### 如何收口

每次都用 `Adopt / Borrow / Reject / Unknown` 给出项目适配结论。旧研究只有在来源、主张、时效、项目语境和当前问题仍匹配时才复用；否则只刷新失效部分。新增来源已经不太可能改变当前分类或下一行动时达到证据饱和，停止搜索并把相邻分支带触发条件停放。

证据冲突或不足时输出 `Unknown` 与最小验证实验，不以 Agent 或用户的直觉填空。

### Coding 边界

以下工作不自动重开调查：

- 直接执行已批准规格；
- 修复实现以恢复已经同意的行为；
- 机械重构与常规测试；
- 不改变行为的文案或布局调整。

如果 coding 中发现新的玩法规则、算法、依赖、系统边界或领域主张，只暂停相关分支，完成门禁后再继续；不阻塞无关的已批准实现。

## 实现表面

- 全局 Skill：核心触发规则、新的按需参考协议、项目配置／AGENTS 模板、UI metadata 和配置检查器；
- 掌眼：配置与 AGENTS 托管块采用三角证据最低强度；系统图与项目记录说明它不属于游戏运行时；
- `init_project.py` 不改逻辑：它已经动态复制模板并不覆盖已有项目配置；
- 旧项目缺少新 block 时只 warning；新 block 存在但重复、缺键、缩进错误或枚举无效时 error；未知附加键忽略，保留前向兼容。

## 修改前恢复点

- 备份：`C:\Users\ASUS\.codex\backups\project-co-leader-v2\pre-evidence-before-decision-20260813-111412`；
- 修改前源文件与备份逐文件比较为 `27/27` 一致、mismatch `0`；
- `SHA256SUMS.pre-upgrade.txt` 保存相对路径、文件数和 SHA-256；恢复时应只恢复清单中的 27 个源文件，不把 manifest 复制进 Skill。

## 验证结果

### 恢复、结构与配置

- 修改前备份的 27 个源文件与哈希清单再次核对，`27/27` 存在且 SHA-256 mismatch 为 `0`；
- 全局 Skill 相对备份只有 5 个既有文件改变、1 个调查协议新增、删除为 `0`，与批准表面一致；
- `SKILL.md` frontmatter、名称、14 个本地引用、223 行主文件、85 行调查协议、OpenAI metadata、配置模板与托管 AGENTS block 通过替代结构检查；
- `check_project_memory.py` 与 `init_project.py` 通过 Python AST 语法检查；当前掌眼配置检查为 `0 errors / 0 warnings`；
- 临时新项目 preview/apply 成功，第二次 apply 前后均为 19 个文件、内容变化 `0`、新增 `0`，已有 sentinel 和 AGENTS 前言保持不变；
- 旧项目缺少 `decision_research_gate` 时退出码为 `0` 并给出 1 个兼容 warning；错误枚举 `minimum_evidence: intuition-only` 时退出码为 `1` 并给出明确 error。

官方 Skill Creator 的 `quick_validate.py` 因当前 Python 环境缺少 `PyYAML`，在校验器启动前报 `ModuleNotFoundError: No module named 'yaml'`。本批按批准边界没有安装依赖，所以上述替代检查不能被表述为官方 Skill Creator 已通过。

### 四次独立只读前向运行，覆盖五个行为场景

其中“核心架构自动升级”和“证据饱和后停放旁支”来自同一次组合压力输入；它们是两个被观察到的行为面，不冒充两次彼此独立的运行。

| 场景 | 实际行为 | 结论 |
|---|---|---|
| 用 D20 让 NPC 可以说谎 | 先查本地因果、D&D 一手规则与真实调查玩法，再把 D20 分类为后置的模糊观察层 | PASS：触发调查，不把灵感直接写成玩法 |
| 已批准界面的普通错字修复 | 只建议聚焦改字与验证，没有启动外部研究或长期记录 | PASS：编码豁免保持轻量 |
| 重构中出现新的平分随机算法 | 继续无关机械重构，只暂停会改变候选排序与回放语义的分支 | PASS：只重开相关产品决定 |
| 整体替换确定性规则核 | 自动识别为难逆核心架构并使用 Deep 强度，本地基线与外部实现共同得出 Reject 整包替换 | PASS：核心问题自动升级 |
| 同时追加多人、云存档和玩家市场 | 在资料已经不能改变当前决定后停止扩展，分别带重开条件停放 | PASS：达到证据饱和后刹住旁支 |

这四次运行检查 Skill 是否能在五个代表性行为场景中表现出目标边界，不证明未来所有 Agent、所有上下文都不会漏触发或过度触发。

### 项目与 Git 边界

- 两段回答再次与本地 JSONL 的 `payload.message` 逐字符一致：`4347 / 9497 bytes / 753069…` 与 `1699 / 4103 bytes / ee04bf…`；
- 当前变更 Markdown 的 169 个本地链接、12 个 Mermaid 围栏和全部代码围栏通过静态检查；Mermaid 没有做渲染视觉验收；
- `git diff --check` 通过；暂存区为 `0`，现有 21 条脏路径中产品源码／HTML／案例数值为 `0`、冻结 V1 证据为 `0`；
- 独立只读 QA 在将“5 个独立场景”纠正为“四次运行覆盖五个行为面”后复核为 `Critical 0 / Important 0 / Minor 0`，verdict `pass`；
- 本批没有运行产品测试，因为产品字节没有改变；这不能证明玩法、数值、文化准确性、视觉质量或真人体验。

临时初始化样本仍位于 `C:\Users\ASUS\AppData\Local\Temp\codex-pclv2-gate-20260813-111412`。它只含本批生成的新／旧／坏配置验证项目，不在 Git 工作树；收口清理命令被当前执行策略拒绝，因此没有绕过策略强删。

## 对决定或假设的影响

- Project Co-leader V2 的工作流修订从 `2.3-human-readable-steering` 升级为 `2.4-evidence-before-decision`；2.3 的人话、阶段交接与刹车规则继续保留；
- 掌眼以后不能仅因《博德之门 3》体验、用户灵感或 Agent 灵感直接增加玩法；先检查本地因果，再对照原始资料和真实实践；
- 门禁不授权产品改动、依赖采用、外部写入、Git 操作或越过用户拥有的核心决定。

## 结论的局限

- 门禁能提高建议依据和可追溯性，不能保证找到的资料正确适配，也不能替代原型、数值模拟、真人试玩或文化专家；
- 三角证据包是最低调查结构，不是“三个链接就自动正确”；
- 本记录只证明 Skill 协议与验证场景，不证明未来每个 Agent 在所有上下文中都不会漏触发；真实使用中的漏触发或过度触发需要按证据继续修订。

## 下一步

本 workstream 到此关闭。停止，不开始“两部分游戏”的实际拆分，等待下一轮与用户共同收敛。
