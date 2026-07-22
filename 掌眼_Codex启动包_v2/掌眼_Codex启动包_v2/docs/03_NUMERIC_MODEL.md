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

## 设计验证

模拟器至少统计：

- 各策略平均得分；
- 各态度选择率；
- NPC 退出率；
- 平均调查轮数；
- 是否存在支配策略；
- 不同 NPC 类型是否需要不同打法。
