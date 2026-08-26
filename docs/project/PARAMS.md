# 产品数值登记表

本表登记**影响玩家体验**的数值：概率、成本、节奏、经济、阈值。
循环边界、内部容差与一次性夹具技术值**不登记**。

改动任何一条走 `/tune-params`：登记旧值、新值、理由、回滚条件，并在本表追加而不是覆写。

## 不属于本表的数值

- **冻结作者夹具里的 prior、相容权重与阈值**（`docs/project/evidence/v3-design/validation/first-ceramic-author-scenarios-v0/`）：
  其 `manifest.json` 声明它们是 *fixture-only technical values*，只为触发通过／拒绝分支存在，
  **不得**复制成似然、价格、阶段门或平衡参数。它们不是产品数值，因此不进本表。
- **DEC-018 表格里的 Experimental 数值**：由 DEC-018 自己承载，本表不重复登记，只在被改动时追加变更记录。

---

## slice.investigationBudget

```text
id:              slice.investigationBudget
value & unit:    12 次调查机会／局
identity:        experimental-default
why:             按冻结场景的实际路线长度反推,不是猜的。档案路线到 G2 需 6 步、
                 物证路线到 G2 需 6 步、完整 G3 路线需 17 步。取 12 使 G2 两条路线
                 都从容可达、留有试错与浪费的余量,同时让 G3 在一局内不可达 ——
                 这正是 DEC-027 所要的"首案以 G2 为稳定里程碑,后段以更丰富的 G2 收手"。
affects:         玩家一局能做多少次调查;是否必须在深挖与换方向之间取舍;
                 浪费一步是否真的有代价(DEC-030 的"剩余机会"一侧)。
does NOT affect: 系统对器物的估值与后验(DEC-030);阶段阈值;任何作者真相;
                 排序或醒目度(DEC-029 / DEC-031)。
status:          experimental
reopen when:     无答案真人测试显示玩家从未感到取舍压力(说明太宽松),
                 或玩家连一条 G2 路线都走不完就用尽机会(说明太紧);
                 或首案的目标阶段不再是 G2。
```

## slice.actionCostTiers

```text
id:              slice.actionCostTiers
value & unit:    四档定性档位 免费／低／中／高,不给货币数字
identity:        experimental-default
why:             DEC-018 没有批准任何单项检测费用,DEC-030 第 47 行明确"具体检测费用"
                 仍为 Experimental / Unknown;而 DEC-030 第 46 行要求切片必须让费用可见。
                 用定性档位同时满足两条:玩家看得见轻重,而切片不伪造一个
                 看起来经过平衡的货币数字。档位按动作性质分:
                 免费=肉眼观察;低=语料与档案检索类;中=紫外／试窗／综合／稳定性／
                 跨时点对照／锚点核对;高=X 射线与材料分析。
affects:         玩家对"这一步贵不贵"的感知;深挖与广搜的取舍。
does NOT affect: 后验与估值;阶段门;可用性(贵不等于被锁)。
status:          experimental
reopen when:     数值与经济场景模拟开工(03-NEXT-ACTIONS 第 18 条),
                 此时档位要么被真实费用替换,要么被证明定性档位就够用;
                 或真人测试显示玩家把档位误读为货币。
```
