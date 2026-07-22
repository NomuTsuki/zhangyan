# 数值原型

## 压力变化

```text
raw =
  actionBase
  × toneMultiplier
  × evidenceMultiplier
  × npcSensitivity
  × stateDecay

delta = clamp(round(raw + contextModifier), minDelta, maxDelta)
```

## 初始建议

```json
{
  "toneMultiplier": {
    "gentle": 0.75,
    "professional": 1.0,
    "firm": 1.25
  },
  "evidenceMultiplier": {
    "none": 0.5,
    "weak": 0.75,
    "medium": 1.0,
    "strong": 1.3,
    "anchor": 1.6
  },
  "pressureSensitivity": {
    "resistant": 0.8,
    "normal": 1.0,
    "sensitive": 1.2
  },
  "pressureDecay": [
    {"max": 40, "multiplier": 1.0},
    {"max": 70, "multiplier": 0.75},
    {"max": 100, "multiplier": 0.5}
  ]
}
```

## 态度副作用

- 温和：信任上升，压力效率降低，NPC 可能继续掌控叙事；
- 专业：证据收益稳定，信任风险较低，控场效果明确；
- 强硬：压力和控场效果高，信任下降、退出风险上升。

## 已接入的最小规则切片（2026-07-22）

当前只把“专业 + 指出修复历史矛盾 + 现代胶痕（strong）”接入原型。工作参数不是最终平衡：

```text
初始：压力 26、信任 58、成交意愿 72、控制感 68、阶段 relaxed
结果：压力 54、信任 61、成交意愿 66、控制感 42、阶段 cautious
delta：+28、+3、-6、-26
```

部分承认修复可能的 Storylet 触发条件为：

```text
现代胶痕反驳“从未修复”
且 pressure >= 50
且 control <= 45
且 dealIntent >= 60
```

所有状态值限制在 0—100；压力根据当前区间应用衰减。固定输入和 seed 必须复现相同结果，原因日志必须能解释每项 delta。

## 设计验证

模拟器至少统计：

- 各策略平均得分；
- 各态度选择率；
- NPC 退出率；
- 平均调查轮数；
- 是否存在支配策略；
- 不同 NPC 类型是否需要不同打法。
