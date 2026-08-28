# 2026-08-26 · V3 第一个能动手玩的东西,以及它为什么失败

候选跨页槽位:**process**(过程),兼作 before／after 里的 **before**。

叙事价值:这是整个 V3 阶段第一个**能被真人玩**的制品——规则不是画的,是由已冻结的作者求解器实算的。它在 2026-08-27 的真人试玩中失败,结论是"没玩明白",随后提出八条具体问题,全部成立。

**这一组的价值在于失败可见。** 两张图不需要文字就能看出病根:第一张里局部结论散在无法解释的位置、三簇互不相连;第二张右侧那块"从这个路口通出去的路"是四个加粗动作、各带目的地与费用、常驻在决策面上——**那就是一份待办清单**。而项目词汇表早已把"任务清单"列为玩家知识图应避免的事项。技术上每一条都符合规格,体验上却把玩家从决策者变成了执行者。

诊断与重建见 [DEC-032](../../project/decisions/DEC-032-v3-workbench-map-separation-and-guidance-division.md)。**after 一侧尚不存在**,待左右分区的呈现变体做出来后补进这个目录的姊妹目录,取景必须与本组一致。

## 资产

| 文件 | Caption (EN) |
|---|---|
| `2026-08-26-zy-slice-map-after-nine-actions.png` | The player knowledge map after nine of twelve investigations, driven live by the frozen author solver · hard part was that every rule here is real — the map is wrong on purpose only in where things sit, not in what they mean · the scattered, unconnected clusters are the complaint "the positions mean nothing" made visible in one frame |
| `2026-08-26-zy-slice-full-interface-action-wall.png` | The whole interface at the same moment: nine of twelve chances spent, and the system still reports no formed judgement · hard part was the panel on the right, which enumerates four priced actions in the always-on layer · standing actions turned out to be standing dispatch, and this is the image that made the diagnosis obvious |

## 技术事实(这一组唯一可以声称的东西)

- 单文件离线 HTML,双击可玩,零外部依赖,桌面尺寸;
- 规则全部由已冻结的作者求解器实算,只读内联并把 SHA-256 写进构建戳(图上可见 `规则核 sha256 E217CAF56A99…`);
- 无界面自检 15 项全过;冻结契约测试重放 40/40;
- 费用以免费／低／中／高四档**定性**档位呈现,调查机会暂定 12 次,两者登记在 [`PARAMS.md`](../../project/PARAMS.md) 为 `experimental-default`。**图上的数字不是平衡过的数值**,不得据此声称数值设计已完成。

## 可重新导出

由 `../../project/evidence/v3-design/validation/knowledge-map-slice-v0/slice.html` 渲染,内容为 SVG 加 DOM,**可重新导出**;复现方式是从空局按序执行:看整体形制与胎釉 → 看底足与修足 → 逐区看纹饰与色差 → 检索事故记录组 → 核对事故记录的对象归属 → 拿事故记录对现器物证 → 找早期影像 → 逐区跨时点对照 → X 射线多角度逐区成像。

两张均为约 1.5—1.8:1,做 594×210mm 跨页时需重新取景或拼版。渲染视口 1520×900、`deviceScaleFactor: 2`。

## 边界

- **不代表美术方向**,也不是产品界面;
- 不构成关于趣味或可玩性的正面证据——它的真人试玩结论是失败;
- 图上不显示 `supports`／`marginals`(夹具声明其为 fixture-only technical values),也没有"当前最优调查"排序(所需数值未获批准);
- 玩家侧结构已被 DEC-032 推翻,此后本组是历史状态,**不得作为当前设计展示**。
