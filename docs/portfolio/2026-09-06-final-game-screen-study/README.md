# 掌眼最终游戏画面讨论：器物旋转与信息层级

2026-09-06 · AI 生成的桌面游戏视觉提案及修改过程，候选作品集位置：concept / process。

## 状态

- `2026-09-06-zy-screen-discussion-baseline.png`：用户明确采纳为讨论基底；不是最终美术定稿或已实现界面。
- `2026-09-06-zy-screen-floating-object-revision.png`：用户已确认“暂时就先按照这一版来做”，作为当前高保真推进基底；不是最终参数／规则定稿或可操作界面。完整范围见[方向与下一切片记录](../../project/evidence/v3-design/2026-09-06-v3-hifi-direction-and-next-slice.md)。
- 两张均为 GPT Image 生成图，不是产品截图；原始分辨率均为 1586 × 992，未经裁切、放大或重采样。可作为 594 × 210 mm 跨页中的并列过程图，尚未做正式排版。

## 用户反馈与本轮呈现

1. 左侧眼前之物和器物之外占幅偏大，适当收窄。
2. 器物悬空，玩家通过鼠标拖动自由旋转；相应部位朝向玩家时显示调查手段。本图展示底足朝向玩家的一帧，未实现交互。
3. 器物之外展示更全的手段，使用文字按钮，不使用图片卡片。本图按送检、查档、比对、现状组织十个入口。
4. 中间地图保留路径与探索感，字体和线条更严肃、清楚。
5. 右侧判断信息密度增加。
6. 收手按钮移到查看委托左边，调查机会也移到同一顶部行。

交互建议：可见部位进入足够宽的朝向范围时，稳定显示手段，避免要求精确角度；这是呈现条件，不新增调查解锁。具体角度、显隐时机与反馈尚未设计和测试。图像比例与调查机会刻度仅作排版示意，不是正式产品数值。

## English captions

- Baseline: A complete appraisal-game visual proposal · Balancing the artifact, accumulated evidence and unresolved judgments · Adopted by the user as a discussion baseline.
- Revision: A floating artifact with part-facing actions and compact investigation controls · Making manipulation readable while keeping the knowledge map supportive · Adopted as the current visual direction; rotation and action visibility remain unimplemented.

## 保留的限制

- 本图无法证明拖动旋转、朝向显隐、缩放、点击或阅读体验；待后续交互原型及真人验证。
- 图像生成中的汉字与具体连线没有逐条对齐正式语义，例如查档按钮“经手记录”发生了字形偏差。它们不能反向成为规则、文案或证据关系的权威。
- 器物造型遵循现有虚构外销瓷大碗题材，绘画与修复细部是美术表达，未作实物或领域真实性验证。
- 图示没有完整规定全部机会与费用状态，后续界面实现仍需对齐项目规则。

## 初次留存核对（历史报告，采纳状态已由上方更新）

- Implemented：新增本目录的两张过程图、提示词、来源及哈希清单；没有修改产品代码。
- Executed：以 Node fs.copyFile 的 COPYFILE_EXCL 复制图片，读取原图与副本计算 SHA-256，读取 PNG IHDR 核对分辨率。
- Scenarios covered：讨论基底与本轮修订两份图像留存。
- Observed result：copiesVerified=2，两个副本与各自原图的 SHA-256 一致，均为 1586 × 992。
- Evidence provenance：GPT Image 生成；主 Agent 查看并做文件核对；用户只采纳基底，修订尚待评价。
- Not verified：真实交互、渲染实现、玩家体验、语义逐条一致性、最终美术认可。
- Residual risks：生成图中的文字与连线存在示意或字形偏差，不能直接作为实现规格。
- Exact completion claim supported：两份视觉过程资产已原样留存；本轮交互未实现。

来源与 SHA-256 见 [manifest.json](manifest.json)，完整提示词见 [PROMPTS.md](PROMPTS.md)。
