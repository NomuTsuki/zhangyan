# EXP-025：自然语言仓库解释工具只读调研

日期：2026-08-11

状态：官方资料只读比较；未安装、未运行、未上传仓库，也未验证本机兼容性

## 用户真正需要的不是“代码搜索”

本次目标是让不阅读代码的项目负责人能够：

1. 用中文提问“这个数值为什么会这样变化”；
2. 看见案件、后验、NPC 状态、价格、评分与结算之间的关系；
3. 让 Agent 给出自然语言解释，同时能追溯到当前本地文件；
4. 不把历史 HTML、测试样例或旧实验公式误当成生产规则；
5. 当前仓库未提交／未跟踪内容不被漏掉，也不在未批准时上传到第三方。

这最后一条是当前选型的决定性边界：掌眼的最新玩家版和若干关键数值文件仍在 dirty／untracked 本地工作树中。只读取 GitHub 远端的工具现在必然解释不完整。

## 候选比较

| 工具 | 非程序员能否用自然语言 | 能否覆盖当前本地工作树 | 成本与风险 | 对掌眼的判断 |
|---|---|---|---|---|
| **现有 Codex + 项目自然语言地图** | 可以直接中文问答，并由 Agent 把代码翻成业务语言 | **可以**，当前就能读取本地 dirty／untracked 文件 | 不新增安装、索引或上传面；缺点是没有持久交互图谱，需要继续维护项目文档 | **当前首选** |
| **Understand Anything** | **可以。** 节点有通俗摘要、关系、引导游览、业务域视图；支持 `/understand-chat`、`/understand-explain`、`/understand-onboard`、`/understand-domain`，并支持 `--language zh` | 按官方说明扫描本地项目，也可限定子目录；理论上适合当前工作树，但本机尚未试跑 | 首次全库多 Agent 分析可能消耗大量 token；Windows 安装脚本会克隆仓库并创建链接；项目内写入 `.ua/`，可选 auto-update 还会加 Git hook。模型／代码数据去向必须先确认 | **最值得做限定试点，但不应现在直接全库安装运行** |
| **Repomix** | 本体主要把仓库打包成给 LLM 阅读的 XML／Markdown／JSON，不是面向人的知识图谱；自然语言解释仍由另一个 Agent 完成 | CLI 可针对本地目录、限定目录和 include／ignore 模式；是否完整纳入掌眼所有未跟踪文件仍应在试点中验证 | 可用 `npx` 或安装；会生成打包文件。支持 token 统计、Tree-sitter 压缩、ignore 和 Secretlint 检查，但输出文件本身仍可能包含大量项目内容，不能随意外发 | **轻量、适合给 Agent 喂上下文，但用户体验增益有限**；Codex 已能直接读本地仓库，当前边际价值较低 |
| **GitHub Copilot 网页仓库探索** | 可以概括仓库、文件夹、文件和指定代码行，并继续追问 | **不适合当前状态。** 网页只看到 GitHub 上已有内容，看不到本地未提交／未跟踪真相 | 需要 GitHub Copilot 权限；若先上传当前仓库又会跨越 Git 与外部发布边界 | 可用于以后稳定、已推送的公开／私有仓库，不是当前主工具 |
| **Sourcegraph Cody** | 可以在编辑器或网页中对整个仓库、文件和符号做上下文问答，并说明读取了哪些文件 | 编辑器形态可以消费本地上下文，但完整能力依赖 Sourcegraph 账户与索引／搜索环境 | 当前官方文档要求启用 Cody 的 Sourcegraph Enterprise 账户和受支持客户端；部署、账户、数据边界与运维均更重 | 对当前单人小型项目过重，不推荐为第一选择 |

## Understand Anything 到底会不会太硬核

**阅读结果并不硬核，安装和首次分析才偏重。**

对用户有用的部分包括：

- 中文节点描述、中文 Dashboard 按钮与中文引导游览；
- 点击文件／函数节点看通俗解释和上下游关系；
- 用自然语言问“交易为什么拒绝”“这个分数从哪里来”；
- 业务域视图可以把代码结构重新组织成“调查—后验—议价—结算”这样的项目语言；
- 第一次生成图谱后，官方本地 viewer 可以只读打开 `.ua/knowledge-graph.json`，不再调用 LLM；官方称该 viewer 从本地磁盘读取且不把数据发出机器。

真正需要谨慎的部分是：

- 官方 Windows 一行安装使用远程 PowerShell 脚本，脚本会克隆项目并建立平台链接；不能未经审查直接管道执行；
- 初次 `/understand` 会扫描整库并运行多 Agent 管线，官方明确提示大仓库可能消耗显著 token；
- `.ua/` 会成为新的持久生成物；官方甚至支持提交图谱和启用 post-commit 自动更新，但这两项都不适合掌眼当前尚未收口的脏工作树；
- 结构边由 Tree-sitter 静态解析，意图、业务域和通俗摘要仍由 LLM 生成，所以它是“高质量导航与解释助手”，不是数值正确性的证明；
- 官方提供 Ollama 等本地模型方向，但本项目尚未验证中文质量、硬件成本或安装复杂度。

因此，不应把它理解成“只有程序员才能用的代码图”。它非常接近用户所说的自然语言解释工具；只是首次接入必须由 Agent 负责技术设置和边界控制，用户负责阅读图谱、追问与判断解释是否符合设计意图。

## 推荐方案

### 现在：不安装

先使用现有 Codex 和 [EXP-026](EXP-026-current-numeric-system-atlas.md) 作为自然语言入口。它们已经直接读取当前本地工作树，并暴露了四个可重复的现行缺口；立刻安装第三方工具不会让这些事实更真实。

### 用户需要持久图谱时：限定 Understand Anything 试点

若用户之后明确批准，先提交一份只读试点契约，再执行：

- 只索引 `prototype/content/`、`prototype/game/`、关键数值测试与项目数值文档；
- 排除 `public/`、`dist/`、`output/`、作品集素材、V1 HTML 和无关依赖；
- 使用中文输出；
- 关闭 auto-update，不建立 Git hook；
- `.ua/` 仅作本地临时生成物，不加入 Git；
- 安装前逐行审查 Windows 安装脚本，明确其写入位置、卸载方式与链接目标；
- 运行前明确所用模型、token／费用上限、代码是否离开本机以及失败时如何清理；
- 用 EXP-026 列出的 15 个自然语言问题验收，而不是只看图是否漂亮。

只有该限定试点能稳定回答跨文件数值问题、引用正确现行文件并且不把测试／旧 HTML 当权威，才考虑扩展范围。

## 为什么 Repomix 不是首选

Repomix 很适合把选定目录压缩成一个 Agent 友好的上下文文件，也能统计 token、遵循 ignore、做凭据格式检查。它解决的是“怎样把代码交给模型”，不是“怎样让不写代码的人持续浏览和理解系统”。当前 Codex 已能直接访问同一工作区，因此它更像备用的上下文压缩／移交工具，而不是用户的主要学习界面。

## 官方来源

- Understand Anything 官方仓库与说明：<https://github.com/Egonex-AI/Understand-Anything>
- Repomix 官方仓库与说明：<https://github.com/yamadashy/repomix>
- GitHub 官方 Copilot 仓库探索指南：<https://docs.github.com/en/get-started/exploring-projects-on-github/using-github-copilot-to-explore-projects>
- Sourcegraph Cody Chat 官方文档：<https://sourcegraph.com/docs/cody/capabilities/chat>
- Sourcegraph Cody Context 官方文档：<https://sourcegraph.com/docs/cody/core-concepts/context>

## 证据边界

本轮只核实了官方项目页和官方文档，没有安装或运行任何候选，也没有验证 Windows、中文质量、索引完整性、费用、性能或本项目隐私配置。因此以上支持“是否值得试点”的决策，不构成兼容性、安全性或效果验收。
