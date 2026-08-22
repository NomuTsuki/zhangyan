# 掌眼 V3：UI／UX Skill 候选核验（2026-08-21）

## 研究问题与边界

本轮只回答一个问题：为了重新讨论“移动端、从黑暗／混沌逐步显影的知识地图、关系路径和探索前沿”，哪些 GitHub Skill 值得安装进 Codex，与本机已有的 `ui-task-flow-review` 等能力协作？

只核验候选仓库自己的 `SKILL.md`、许可证、安装配置、代码和提交／发布记录。不以 Star 数或二手榜单作为采用理由；本轮没有安装、运行候选脚本或修改原型。

Codex 兼容性的检查口径来自 OpenAI 的 Skill 结构说明：Skill 目录必须有带 `name`、`description` frontmatter 的 `SKILL.md`，脚本、references、assets 是可选的同目录资源；Codex 的安装器可以从指定 GitHub repo/path 下载一个 Skill 目录。来源：[OpenAI skill-creator：Anatomy of a Skill](https://github.com/openai/skills/blob/main/skills/.system/skill-creator/SKILL.md#anatomy-of-a-skill)。

## 第一轮阶段性结论（已被文末补充核验取代）

| 候选 | 结论 | 在本项目中的角色 | 现在是否适合直接安装 |
|---|---|---|---|
| `nextlevelbuilder/ui-ux-pro-max-skill` | **Adopt（有安装条件）** | UI／UX、移动端、可访问性、视觉系统和交互检查的主外部知识层 | **不能把仓库里的 Claude 目录直接交给 Codex 安装器**；应先批准其 Codex CLI 的多 Skill 写入范围，或做一次受控的单 Skill 适配 |
| `anthropics/skills/skills/frontend-design` | **Borrow** | 审美与视觉表达层，专门压制通用仪表盘／AI 套模板感 | **可以**，目录自包含，安装结构最干净；但它不是完整 UX／HCI Skill，不能单独承担本项目 |
| `openai/plugins/.../node-link-and-diagram-layout` | **Borrow（暂不单独安装）** | 关系图布局、移动端图阅读、稳定显影和焦点邻域的拓扑专项 | Skill 本体可被识别，但关键 references 在 Skill 目录外；单目录安装会不完整 |

我的项目判断是：**若只选择一个新的 UI／UX Skill，应选原版 `ui-ux-pro-max`，但必须先处理安装边界；不能因为名字或热度直接安装。** 它需要与本机已有的任务流／HCI 复核能力协作，而不是替代它。`frontend-design` 适合作为第二层审美制衡；`node-link-and-diagram-layout` 的原则值得借用到知识地图，但不应以残缺的单目录形式安装。

---

## 候选一：UI/UX Pro Max（原版）

### 精确来源

- 仓库：[`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- 实际 Skill：[`/.claude/skills/ui-ux-pro-max/SKILL.md`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md)
- Codex 平台配置：[`/cli/assets/templates/platforms/codex.json`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/cli/assets/templates/platforms/codex.json)
- 安装生成逻辑：[`/cli/src/utils/template.ts`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/cli/src/utils/template.ts)
- CLI 包定义：[`/cli/package.json`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/cli/package.json)
- 许可证：[`/LICENSE`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/LICENSE)

### 来源事实

- 这是完整 Skill，不是提示词清单：目录含 `SKILL.md`、本地 CSV 数据、Python 搜索／设计系统脚本和 references。Skill 声明覆盖样式、产品调色板、字体配对、UX 规则、图标、动效、图表和多种前端／移动端技术栈。[Skill 源文件](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md)
- Skill 把可访问性、触控交互、响应式布局、排版颜色、动效、反馈和导航作为分层检查内容；同时要求把数据库结果当作建议，不得覆盖用户和仓库规则。[Skill 工作流与优先级](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md#rule-categories-by-priority)
- 搜索脚本使用 Python 3；当前核心 Python 文件的 import 主要是标准库，未发现 `subprocess`、`requests`、`eval` 等直接执行或联网入口。仓库另有 Python 测试、语义校验和数据 smoke workflow。[Python 源目录](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/main/src/ui-ux-pro-max/scripts)、[Actions](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/actions)
- 根许可证是 MIT。[LICENSE](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/LICENSE)
- 仓库为 Codex 提供专门平台配置：写入 `.agents/skills/ui-ux-pro-max`，并生成指向该目录下搜索脚本的路径。[codex.json](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/cli/assets/templates/platforms/codex.json)
- 当前生成器不只复制这一个 Skill：`generatePlatformFiles` 还会把 `banner-design`、`brand`、`design-system`、`design`、`slides`、`ui-styling` 等 sibling skills 一并复制；已有文件只有传 `--force` 才覆盖。[template.ts：copySubSkills／generatePlatformFiles](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/cli/src/utils/template.ts)
- 仓库内现成的 `.claude/.../SKILL.md` 使用 `${CLAUDE_PLUGIN_ROOT}` 调用脚本；直接把这个 Claude 目录交给 Codex 通用安装器，并不会经过 Codex 模板重写，因此脚本路径不可靠。Codex 适配实际发生在仓库自己的 CLI 模板中。[Claude Skill 调用路径](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md#running-the-search-tool)、[模板路径重写](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/cli/src/utils/template.ts#L91-L127)
- 2026-08-20 的仓库最新提交仍在维护资产同步；同一提交的 tests 和 smoke data workflow 成功。仓库当前 release 页可见 `v2.15.0`，而 `cli/package.json` 的 CLI 版本为 `2.5.0`，两套版本号不应混读。[提交](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/commit/bc826e2267a36d98a2dcf5231e16c30ff546770f)、[发布](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/releases/tag/v2.15.0)、[CLI package](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/cli/package.json)

### 项目推断

- **为什么 Adopt：** 三个候选中，它最完整地覆盖移动端触控、信息层级、视觉系统、可访问性和交互反馈，能补上上一版原型只做“信息归档”、没有做“视觉引导和空间认知”的缺口。
- **不能替代什么：** 它的 searchable catalog 主要是作者整理的数据和启发式规则；`data-provenance.json` 中可见不少记录的来源只是仓库内其他 CSV 的 `derived` 引用和自报置信度，不能当成人因学原始研究，也不会自动理解掌眼的渐进真相语义。[data-provenance.json](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/src/ui-ux-pro-max/data/data-provenance.json)
- **过度模板化风险：** 它很擅长“给产品类型配样式／配色／字体”，但若不先冻结掌眼的地图隐喻、注意力主线和信息披露规则，可能把项目带回另一种更漂亮的模板 UI。
- **写入风险：** Skill 内含 `--persist`、`--force` 的设计系统写入能力；项目使用时必须继续服从本仓库授权边界，未批准不得持久化或强制覆盖。
- **安装建议：** 不直接安装 `.claude/skills/ui-ux-pro-max`。更安全的两个方案是：（A）用户明确接受仓库 CLI 将七个 Skill 写入 `.agents/skills` 后，再运行其 Codex 安装；（B）先在隔离临时目录生成 Codex 版本，安全审查后只迁入 `ui-ux-pro-max` 所需文件。方案 B 最符合本项目的最小权限习惯，但属于“适配安装”，需单独授权。

---

## 候选二：Anthropic Frontend Design

### 精确来源

- 仓库：[`anthropics/skills`](https://github.com/anthropics/skills)
- Skill 目录：[`/skills/frontend-design`](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
- 实际 Skill：[`/skills/frontend-design/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)
- 许可证：[`/skills/frontend-design/LICENSE.txt`](https://github.com/anthropics/skills/blob/main/skills/frontend-design/LICENSE.txt)

### 来源事实

- 这是自包含的标准 Skill：目录只有带正确 frontmatter 的 `SKILL.md` 与 `LICENSE.txt`，无安装脚本、运行依赖或外部工具要求。[目录](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
- 它专注于视觉观点、排版、配色、动效、空间构图和背景材质，明确反对千篇一律的卡片网格、常见 AI 渐变和缺乏语境的通用界面。[SKILL.md](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)
- 许可证是 Apache-2.0。[LICENSE.txt](https://github.com/anthropics/skills/blob/main/skills/frontend-design/LICENSE.txt)
- Skill 最近一次文件提交为 2026-06-09。[提交](https://github.com/anthropics/skills/commit/2235be7c60b551f5de82ade908fd3816455afcda)

### 项目推断

- **为什么 Borrow：** 它能强迫我们给知识地图建立真正的视觉隐喻、节奏、空间层级和动效语言，正面修复“把 TODO list 美化一下”的惯性。
- **为什么不是主 Skill：** 它几乎不处理玩家心智模型、信息寻路、认知负荷、错误恢复和证据披露。它甚至鼓励不对称、出格构图和高影响动效；若脱离地图可读性约束，会把“有审美”误写成“有装饰”。
- **兼容性：** 该目录可以直接由 Codex GitHub Skill 安装器安装，文件完整，安装风险最低。它应作为审美执行／批评层，与本机 `ui-task-flow-review` 和项目语义约束共同使用，而不是单独决定界面。

---

## 候选三：OpenAI Node-Link and Diagram Layout

### 精确来源

- 仓库：[`openai/plugins`](https://github.com/openai/plugins)
- Skill：[`/plugins/build-web-data-visualization/skills/node-link-and-diagram-layout/SKILL.md`](https://github.com/openai/plugins/blob/main/plugins/build-web-data-visualization/skills/node-link-and-diagram-layout/SKILL.md)
- 所属插件清单／许可：[`/plugins/build-web-data-visualization/.codex-plugin/plugin.json`](https://github.com/openai/plugins/blob/main/plugins/build-web-data-visualization/.codex-plugin/plugin.json)

### 来源事实

- 这是标准 `SKILL.md`，专门处理连通图的阅读任务、布局家族、边路由、重叠、标签、稳定性和移动端图阅读。[SKILL.md](https://github.com/openai/plugins/blob/main/plugins/build-web-data-visualization/skills/node-link-and-diagram-layout/SKILL.md)
- 它明确区分树、DAG、有向循环图、无向探索图、径向图和复合图；要求先确定玩家的阅读任务，再选择布局，而不是默认 force-directed。它也要求移动端使用焦点视图、放大点击区、step-through／搜索以及明确 pan／zoom 手势归属。[Core Workflow 与 Mobile 条目](https://github.com/openai/plugins/blob/main/plugins/build-web-data-visualization/skills/node-link-and-diagram-layout/SKILL.md#core-workflow)
- 所属 OpenAI 插件清单声明版本 `0.1.21`、许可证 MIT。[plugin.json](https://github.com/openai/plugins/blob/main/plugins/build-web-data-visualization/.codex-plugin/plugin.json)
- Skill 文件最近一次提交为 2026-05-26。[提交](https://github.com/openai/plugins/commit/28dd42ad75ab6e2087797dd394a0b0e493206a1d)
- Skill 多次要求读取 `../../references/...`；这些 references 位于 `plugins/build-web-data-visualization/references/`，不在该 Skill 自己的目录中。[Skill references](https://github.com/openai/plugins/blob/main/plugins/build-web-data-visualization/skills/node-link-and-diagram-layout/SKILL.md#reference-guide)、[插件 references](https://github.com/openai/plugins/tree/main/plugins/build-web-data-visualization/references)

### 项目推断

- **为什么 Borrow：** 它直接命中“黑图逐步显影、路径可追踪、探索前沿、移动端不能把整张大图缩成邮票”的空间组织问题，也能约束节点布局在新证据加入后不要大幅漂移。
- **为什么不是 UI／UX 主 Skill：** 它不负责游戏节奏、证据语义、视觉风格或玩家判断责任，只负责把连通结构变成可读图。
- **安装完整性：** Codex 可以识别这个单目录 Skill，但通用 Skill 安装器只会复制指定目录，导致外部 references 缺失；因此本轮不建议单独安装。应在未来能安装完整 OpenAI visualization plugin 时再 Adopt，或只把其已核验的布局原则作为项目研究输入。

---

## 对 `ui-ux-pro-max` 同名 Skill 的专门结论

GitHub 上存在大量同名复制版和聚合库版本，例如 [`sidiangongyuan/codex-skills-library/skills/ui-ux-pro-max`](https://github.com/sidiangongyuan/codex-skills-library/tree/main/skills/ui-ux-pro-max) 与 [`TerminalSkills/skills/skills/ui-ux-pro-max`](https://github.com/TerminalSkills/skills/tree/main/skills/ui-ux-pro-max)。本轮不推荐这些版本：原版仓库已经提供 Codex 平台模板、脚本、数据、测试和 MIT 许可，复制版没有为掌眼提供可验证的额外价值，反而增加来源漂移与被二次改写的风险。**同名和热度均不构成信任证据。**

另一个看似很强的 HCI 候选 [`rastian/interaction-design-skills`](https://github.com/rastian/interaction-design-skills) 确实有真实 `SKILL.md`，覆盖 mental model、affordance、feedback、progressive disclosure 和 interaction states；但仓库没有 `LICENSE`，2026-03-15 的提交还明确写着“移除版权敏感的来源归属”。在许可证和来源边界解决前，结论为 **Reject（不安装）**。[Skill](https://github.com/rastian/interaction-design-skills/blob/main/SKILL.md)、[相关提交](https://github.com/rastian/interaction-design-skills/commit/b2483e9ec7258bc033c0bdecad4b60148c2257fb)

## 建议的实际组合

这不是让多个 Skill 轮流“美化界面”，而是给它们分开责任：

1. **项目语义先行：** 掌眼作者侧规则与我们接下来重新对齐的玩家地图隐喻，决定“什么被揭示、何时被揭示、未知怎样存在”。
2. **本机 `ui-task-flow-review`：** 检查玩家是否看得懂自己走过的路、当前状态、下一步选择和反馈，承担主要 HCI／可用性闸门。
3. **`ui-ux-pro-max`（条件安装）：** 查移动端、触控、可访问性、视觉系统和交互反馈；搜索结果只作候选证据，不自动形成设计决定。
4. **`frontend-design`（可选安装）：** 对审美、构图、材质、排版和动效提出有明确观点的表达分支，防止再次退化成卡片／列表工作台。
5. **node-link 原则（暂借用、不残缺安装）：** 为渐进知识地图选择稳定布局、焦点邻域、边路由和移动端阅读策略。

## 安装前仍需用户选择的唯一边界

- 若选择 `ui-ux-pro-max`：是否授权 **先在隔离目录生成并审查，再只迁入主 Skill**（推荐），而不是直接运行会写入七个 sibling skills 的全量 CLI。
- 若同时选择 `frontend-design`：它仅获得“提出审美方案与检查视觉质量”的角色，不得覆盖知识披露、玩法因果和玩家责任。

在这两个边界确认以前，不应安装任何候选，也不应继续制作新版界面。

---

## 补充核验：UX/HCI 主导层与审美层（最终推荐）

> 本节补查两个指定候选，并**取代上文“若只选一个就选 `ui-ux-pro-max`”的阶段性推荐**。早先三个候选的事实核验仍有效，但最终组合发生了变化。

### 候选四：Magnus Product Design and UX

#### 精确来源

- 仓库：[`magnus919/agent-skills`](https://github.com/magnus919/agent-skills)
- Skill 目录：[`/product-design-and-ux`](https://github.com/magnus919/agent-skills/tree/main/product-design-and-ux)
- 实际 Skill：[`/product-design-and-ux/SKILL.md`](https://github.com/magnus919/agent-skills/blob/main/product-design-and-ux/SKILL.md)
- 来源索引：[`/product-design-and-ux/references/source-index.md`](https://github.com/magnus919/agent-skills/blob/main/product-design-and-ux/references/source-index.md)
- 仓库许可证：[`/LICENSE.md`](https://github.com/magnus919/agent-skills/blob/main/LICENSE.md)

#### 来源事实

- 这是完整的 Agent Skill，不是提示词列表。`SKILL.md` 有标准 frontmatter，目录内同时包含信息架构、认知负荷、任务流和状态模型、交互模式选择、响应式接口合同、可用性测试、工程交接等 references，以及对应模板和 eval fixtures。[目录结构](https://github.com/magnus919/agent-skills/tree/main/product-design-and-ux)
- Skill 明确不负责品牌、像素、CSS 或视觉实现；它把工作定义为从获批范围和证据出发，形成信息架构、任务／恢复路径、可观察状态、响应式交互合同和可验证的可用性计划。[SKILL.md](https://github.com/magnus919/agent-skills/blob/main/product-design-and-ux/SKILL.md)
- 其“认知需求复核”直接检查记忆、选择与比较、上下文切换、中断、错误理解和注意力压力；同时警告 progressive disclosure 不能隐藏当前决策所需的后果、状态或恢复信息。[content-and-cognitive-demand.md](https://github.com/magnus919/agent-skills/blob/main/product-design-and-ux/references/content-and-cognitive-demand.md)
- 它把交互模式视作“可被证伪的假设”，要求比较用户目标、频率、可逆性、不确定性、比较负担、权限、网络、中断和可访问性，而不是把设计系统示例当成正确答案。[interaction-pattern-selection.md](https://github.com/magnus919/agent-skills/blob/main/product-design-and-ux/references/interaction-pattern-selection.md)
- 来源索引区分规范、指导、示例和作者综合，列出 ISO 9241-210:2019、WCAG 2.2、W3C COGA、GOV.UK 与 USWDS，并写明各自“能支持什么／不能推出什么”。来源状态标记为 2026-07-13 核对。[source-index.md](https://github.com/magnus919/agent-skills/blob/main/product-design-and-ux/references/source-index.md)
- 仓库根许可证是 MIT；Skill frontmatter 同样声明 MIT。[LICENSE.md](https://github.com/magnus919/agent-skills/blob/main/LICENSE.md)、[SKILL.md frontmatter](https://github.com/magnus919/agent-skills/blob/main/product-design-and-ux/SKILL.md)
- 该 Skill 于 2026-07-13 加入；2026-08-03 又补充／修订了 eval manifest。仓库在 2026-08-21 仍有推送，未归档。[加入提交](https://github.com/magnus919/agent-skills/commit/ef600024fcda93b77a301ddd80ed62f631a885be)、[eval 提交](https://github.com/magnus919/agent-skills/commit/d68c1b3552360af931311b8aa56674bdb0125263)

#### 自包含安装判断

- **功能上基本自包含：** 核心 references、templates 和 evals 都位于 `product-design-and-ux/` 内，不依赖设计软件、前端框架、MCP 或可执行脚本。通用 Codex GitHub Skill 安装器复制该目录后，可以读取核心工作流。
- **法律文件不完全自包含：** 完整 MIT 文本只在仓库根 `LICENSE.md`，不在 Skill 目录内。直接按单目录安装会漏掉许可证正文；受控安装时应把根许可证一并保留到安装目录，不能只依赖 frontmatter 的 `license: MIT`。
- `SKILL.md` 还会把深度 WCAG、产品发现和正式规格工作路由到仓库其他 sibling Skills；这些外部路由在单 Skill 安装后不可用，但不会破坏本 Skill 内部的信息架构、认知需求、任务流、状态模型和可用性计划能力。使用时应由本机已有 Skill 承接对应路由。

#### 项目推断

- **它比 `ui-ux-pro-max` 更适合做掌眼的 UX/HCI 主导层。** 当前失败不是缺少配色、字体或常见组件规则，而是我把“玩家理解自己走过的路径、未知如何显影、下一步为何自然出现”错误地降维成信息清单。这个 Skill 直接处理认知需求、空间／信息架构、路径、状态、恢复、重新进入和可用性证据；`ui-ux-pro-max` 的强项则是庞大的样式／规则搜索库。
- 它与本项目“先把语义和体验讨论清楚，再实现”也更一致：不会在缺少获批目标和证据时直接生成界面。
- 风险是它可能把工作推向厚重的合同和模板。项目使用时应只加载当前问题需要的 references，不为低保真讨论制造全套交付物；并继续由项目共同负责人判断哪些记录值得持久化。

### 候选五：PracticalSwan Frontend Design

#### 精确来源

- 仓库：[`PracticalSwan/agent-skills`](https://github.com/PracticalSwan/agent-skills)
- Skill 目录：[`/frontend-design`](https://github.com/PracticalSwan/agent-skills/tree/main/frontend-design)
- 实际 Skill：[`/frontend-design/SKILL.md`](https://github.com/PracticalSwan/agent-skills/blob/main/frontend-design/SKILL.md)
- 第三方来源说明：[`/frontend-design/THIRD_PARTY_NOTICES.md`](https://github.com/PracticalSwan/agent-skills/blob/main/frontend-design/THIRD_PARTY_NOTICES.md)
- 许可证：[`LICENSE.txt`](https://github.com/PracticalSwan/agent-skills/blob/main/frontend-design/LICENSE.txt)、[`LICENSE-APACHE-2.0.txt`](https://github.com/PracticalSwan/agent-skills/blob/main/frontend-design/LICENSE-APACHE-2.0.txt)、[`LICENSE-GITHUB-MIT.txt`](https://github.com/PracticalSwan/agent-skills/blob/main/frontend-design/LICENSE-GITHUB-MIT.txt)

#### 来源事实

- 这是 Codex 可识别的标准 Skill，frontmatter 标记版本 `2.0`、更新时间 `2026-08-14`、许可证 `MIT AND Apache-2.0`；Skill 明确写有 Codex 安装路径 `$CODEX_HOME/skills/frontend-design`，且无 MCP 硬依赖。[SKILL.md](https://github.com/PracticalSwan/agent-skills/blob/main/frontend-design/SKILL.md)
- 它不是只追求“漂亮”。流程先识别用户、任务、内容、产品类别、平台和输入方式，再选择 Product／Marketing／Data／Editorial／Commerce／Immersive 之一；Accessibility、正确性、响应式和完整状态是不可由视觉得分抵消的硬门。[Design Mode Router](https://github.com/PracticalSwan/agent-skills/blob/main/frontend-design/SKILL.md#design-mode-router)
- 它明确反对通用卡片拼盘、无理由的高级特效和装饰性 UI；在 Immersive 模式中也要求 progressive enhancement、reduced motion、移动端／触控／键盘回退。[Universal Quality Rules](https://github.com/PracticalSwan/agent-skills/blob/main/frontend-design/SKILL.md#universal-quality-rules)
- Skill 目录完整包含 `SKILL.md`、Codex metadata、可访问性 checklist、本地对比度脚本、三份许可证和第三方 notices。对比度脚本只导入 Python 标准库，没有网络或包管理依赖。[目录](https://github.com/PracticalSwan/agent-skills/tree/main/frontend-design)、[contrast-checker.py](https://github.com/PracticalSwan/agent-skills/blob/main/frontend-design/scripts/contrast-checker.py)
- 第三方说明表明这是一次修改合并：保留作者原有 MIT 内容，改写过 OpenAI 历史 `frontend-skill` 的 Apache-2.0 艺术指导概念，并审阅过 GitHub `premium-frontend-ui`；相应许可文本和修改说明均留在目录内。[THIRD_PARTY_NOTICES.md](https://github.com/PracticalSwan/agent-skills/blob/main/frontend-design/THIRD_PARTY_NOTICES.md)
- `frontend-design` 在 2026-08-02 完成合并，2026-08-14 做过目录更新；仓库在 2026-08-20 仍有推送，未归档。[合并提交](https://github.com/PracticalSwan/agent-skills/commit/2e1968d32aea3a1a3b915bb9dbdad4876a95a9ac)、[更新提交](https://github.com/PracticalSwan/agent-skills/commit/300310f916d78de8910afa6abf658f7497d933e6)

#### 自包含安装判断

- **完整：** 直接让 Codex Skill 安装器复制 `frontend-design/`，即可保留主 Skill、内部 reference、脚本、metadata、许可证和第三方 notices；核心工作不依赖仓库外文件或 MCP。
- Related Skills 位于仓库其他目录，但都是框架实现或后续 QA 的可选路由，不影响本 Skill 本身制定视觉论点、信息计划、状态、响应式、可访问性和验证要求。

#### 项目推断

- **它比 Anthropic `frontend-design` 更适合作为掌眼当前的审美／界面表达层。** Anthropic 版本的优势是大胆、鲜明和反通用审美，但也主动鼓励意外布局、强动效与“不要收敛”；PracticalSwan 版本仍要求视觉论点和适度独特性，却把任务、信息架构、可访问性、移动端、状态完整和真实渲染设为硬门，更适合承载一张需要长期阅读和操作的知识地图。
- 它也比 `ui-ux-pro-max` 更不容易把掌眼变成“根据产品类型检索一个设计系统”。它先要求写出本项目自己的视觉／交互论点，外部规则只用于检查。
- 风险一是 Skill 给出带百分比权重的 Operational Decision Rubric。文件自己说明这些权重不是普遍数学标准；项目不能把 20%／15% 当作真实研究结论或自动评分器。
- 风险二是它覆盖设计与实现。本轮只能授权它参与讨论、表达分支和可丢弃原型；不得因为 Skill 支持实现就提前进入正式产品代码。

## 五个候选的最终取舍

| 责任层 | 最终选择 | 相对优势 | 安装结论 |
|---|---|---|---|
| UX／HCI 主导 | **Magnus `product-design-and-ux` — Adopt（受控）** | 最直接处理认知需求、信息架构、任务路径、状态／恢复、交互假设和可用性证据 | 功能自包含；安装时额外保留仓库根 MIT 许可证 |
| 审美与界面表达 | **PracticalSwan `frontend-design` — Adopt** | 有视觉论点与审美要求，同时把任务、可访问性、移动端和状态完整设为硬门 | Skill 目录完全自包含，可直接按 GitHub path 安装 |
| 独立可用性复核 | **本机 `ui-task-flow-review` — 保留** | 从玩家目标、操作、反馈和恢复审查实际体验，不由设计者自己给自己通过 | 已安装，无新增权限 |
| 拓扑专项 | OpenAI `node-link-and-diagram-layout` — Borrow | 提供稳定布局、焦点邻域、边路由和移动端图阅读原则 | 暂不残缺安装 |
| UI 数据库 | `ui-ux-pro-max` — Park | 可在以后查询特定触控、字体、配色或组件问题 | 当前与新组合重叠，且安装范围复杂，不作为主导层 |
| 更激进的艺术指导 | Anthropic `frontend-design` — Park | 可在视觉方向过于保守时提供反例和更大胆分支 | 当前不安装，避免两个同名 Skill 路由冲突 |

## 最终推荐组合与顺序

1. 用户若批准安装，先受控安装 **Magnus `product-design-and-ux`**，并把仓库根 MIT 文本一并保存；它只负责重新建立玩家知识地图的心智模型、信息架构、路径／状态和测试问题。
2. 再直接安装 **PracticalSwan `frontend-design`**；它只负责把已经对齐的地图体验变成有审美、有层级、可访问、移动端成立的表达方案。
3. 讨论阶段由两者提出同一内容的不同地图隐喻／交互分支；本机 `ui-task-flow-review` 独立检查玩家是否看得见自己走过什么、当前推断指向哪里、哪里仍黑、下一步为何值得探索。
4. OpenAI node-link 原则只做拓扑专项输入；`ui-ux-pro-max` 与 Anthropic `frontend-design` 暂不安装，避免重叠触发、模板化和相互冲突的艺术指导。

这个组合比原推荐更符合当前问题：**先由 UX/HCI Skill 定义“地图怎样成为玩家的思考空间”，再由 Frontend Design Skill 决定“这个空间怎样有审美地显影”，最后由本机独立复核检查它是否真的可理解。**
