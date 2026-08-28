# 2026-08-25 · 同一局的作者真相与玩家所见

候选跨页槽位:**system**(系统)。这是 V3 第一次把"作者侧固定真相"与"玩家侧渐进显影"并排画出来。

叙事价值:两张图画的是**同一局、同一件器物**,但玩家永远看不到第一张。作者图有方向(它画的是依赖:哪句结论需要哪些证据才敢说),玩家图没有方向(它是空间的、四面显影的)。设计核心"作者真相与玩家知识图严格分离"在这里第一次成为可看的东西,而不是一句原则。

## 资产

| 文件 | Caption (EN) |
|---|---|
| `2026-08-25-zy-author-g1g2-or-routes.png` | The author dependency graph's load-bearing structure: two independent routes to the same G2, joined by OR rather than AND · hard part was resisting the urge to make the archive route mandatory, which would have collapsed the game into one solvable order · the OR is what structurally guarantees the player is never told which path they are on |
| `2026-08-25-zy-player-map-late-beat.png` | The same session as the player sees it, most of the way through: lit places, roads that only exist once both ends are known, and large areas still dark · hard part was that every affordance which helps the player also risks leaking the author graph · the player map ended up with no direction at all, because direction was the leak |

## 可重新导出

两张图分别由 `../../project/evidence/v3-design/validation/knowledge-map-walkthrough-v0/` 下的
`author-map.html` 与 `player-session.html` 渲染,内容为 SVG,**可在任意分辨率重新导出**。

- 作者图那张为 2034×734(约 2.77:1),已经接近 594×210mm 跨页的 2.83:1,基本可直接用;
- 玩家图那张为 1490×960(约 1.55:1),做跨页时需要重新取景或与其他图拼版。**下半部的暗区不是截图留白,是地图本身尚未点亮的部分**,裁掉会改变含义。

渲染方式:本机静态服务打开 HTML,视口 1520×900、`deviceScaleFactor: 2`;玩家图推进到第 13 拍后按 SVG 元素截取。

## 边界

- 线框草图,**不代表美术方向**(美术方向须由用户批准);
- 不构成关于趣味、可玩性或玩家理解的任何证据;
- 玩家图那张的"路口／通出去的路"一层已由 [DEC-031](../../project/decisions/DEC-031-v3-exploration-rhythm-is-player-chosen-dead-ends-and-degree-are-the-lever.md) 定为**只作呈现**,醒目度不进入任何计算;
- 玩家侧的整体结构随后已被 [DEC-032](../../project/decisions/DEC-032-v3-workbench-map-separation-and-guidance-division.md) 推翻重建(行动面与认知面必须分到界面两侧)。**作者侧那张仍然有效**,玩家侧那张此后是历史状态。
