# 作品集采集 · 2026-08-31 · 工作台与心智地图分离

**类别:** before/after 的 after 一半 ＋ 系统能力展示

这一组补上了 [2026-08-26 首个可玩切片](../2026-08-26-first-playable-slice/README.md) 那组
欠下的 after。取景刻意与那组保持一致(同为 1600×900 桌面全屏、同为一局中途、同样含地图与
面板),这样跨页上并排放才成立。

**它为什么值得放进作品集:** 08-26 那组是"第一个可玩物,而且真人试玩失败了";这一组是
**同一个病根被结构性改掉之后的样子**。两张放一起,讲的不是"我做了个界面",而是
"我拿真人反馈定位到病根,写下决定,然后按决定重做了一遍"。作品集里最值钱的是这条弧线,
不是任何单张截图。

差别一眼看得出:08-26 那张是一面动作按钮墙 ＋ 一张位置无意义的散点图;这三张里,
行动全部退到左侧并长在器物对应部位上,右侧只剩情报与系统免费连出来的逻辑。

## 资产

### `2026-08-31-zy-workbench-map-full-interface.png`

一局走到第 10 步(G2)的完整界面。左上是器物与长在其部位上的调查行动,左下是长不到器物上的
手段(仪器／档案／语料／状况评估),右侧是心智地图与决策面,顶栏一行读数报当前能主张到什么程度。

> **Caption (EN):** Actions live on the object; knowledge lives on the map. Ten investigations
> in, the player has ten pieces of intel, two system-derived findings, two collapsed axioms,
> and sixteen logical edges — none of the edges cost anything.

### `2026-08-31-zy-mental-map-after-ten-actions.png`

同一局同一时刻,只取心智地图。可以看清四种逻辑边的区别、橙色六边形的局部 Finding、
绿色方块的已坍缩公理,以及右下角两个还没连上主结构的孤岛。

> **Caption (EN):** The knowledge graph after ten actions. Hexagons are findings the system
> derived for free; green squares are settled axioms, pinned so the rest can rearrange around
> them; the two lone circles are intel that has not connected to anything yet.

### `2026-08-31-zy-history-replay-step-four.png`

历史回放拖到第 4 步:左边是当时的地图,右边是当时的决策面。回放两边而不只回放地图 ——
因为要回答的是"我当时为什么那么选",光看地图答不出来。

> **Caption (EN):** Replay of an earlier beat. Both the map and the decision surface are
> restored, because the question being answered is "why did I choose that then" — the map
> alone cannot answer it.

## 重新导出的办法

`docs/project/evidence/v3-design/validation/workbench-map-v0/prototype.html`,双击即可,
不用挂服务。浏览器 1600×900,依次做:整器 → 底足与修足 → 事故记录组 → 核对事故记录的对象归属
→ X 射线成像 → 稳定锚点 → 逐区跨时点对照 → 早期影像 → 拿事故记录对现器物证 → 后期处理记录组。
第三张按顶栏"历史回放",滑杆拖到 4。

## 边界

- **不是美术方向。** 配色、字号、图形一律临时;正式视觉语言尚未开工。
- **不是产品界面。** 顶栏那条警示带本身就是声明,截图时没有隐藏它,这是有意的诚实。
- 费用只有四档定性,没有货币数字 —— 数值未获批准。
- 只做电脑浏览器尺寸(DEC-033),移动端不在本阶段范围。
- **右侧结构尚未经真人试玩。** 试玩清单在 `workbench-map-v0/PLAYTEST.md`。
  若这一版又被判为没玩明白,这三张的定位会从"after"退回"第二次尝试",届时须改写本文件。
