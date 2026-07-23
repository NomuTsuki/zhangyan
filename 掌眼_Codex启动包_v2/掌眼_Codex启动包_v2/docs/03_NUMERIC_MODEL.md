# 数值与结算原型

> 当前实现基线：2026-07-23。以下是首案现行可运行参数与公式，不是最终平衡结论。

## 首案常量

| 项目 | 当前值 |
|---|---:|
| 初始行动点 | 6 |
| 卖家开价 | 80 |
| 界面固定折价报价 | 60 |
| NPC 认知档案底价 | 55 |
| 现代仿制品真实价值 | 20 |
| 旧胎重修真品真实价值 | 65 |
| 被低估的珍品真实价值 | 130 |
| 胶层专项检测成本 | 2 行动点 + 10 价值点 |
| 默认 seed | 20260723 |

## 通用约束

```text
clamp(x, a, b) = min(b, max(a, x))
四状态 after = clamp(before + delta, 0, 100)
```

同一初始状态、动作序列和 seed 必须得到完全相同的结果。

## 共享行动点

```text
观察 = 1
询问或对质 = 1
折价 = 1
胶层专项检测 = 2
购买 = 0
拒绝 = 0
查看页面或证据簿 = 0
```

所有有成本动作先校验剩余行动点；购买和拒绝不要求剩余点数。

## 观察与小概率线索

首次观察某位置固定得到该隐藏真相对应的一条基础物证：

```text
roll = seededUnit(seed, turn, targetId)
若 roll < bonusChance，则额外得到该位置的锚点证据
```

各位置的 `bonusChance` 当前约为 12%—20%。重复观察同一位置仍消耗 1 点，但不重复发证据，并记为低效行动。

## 询问与对质的状态 delta

### 映射参数

```json
{
  "tonePressure": {
    "gentle": 0.72,
    "professional": 1.0,
    "firm": 1.25
  },
  "evidencePower": {
    "none": 0.5,
    "weak": 0.7,
    "medium": 1.0,
    "strong": 1.3,
    "anchor": 1.6
  },
  "relevanceFactor": {
    "noEvidence": 1.0,
    "relevant": 1.0,
    "irrelevant": 0.45
  }
}
```

压力衰减：

```text
pressure <= 40        → decay = 1.00
40 < pressure <= 70   → decay = 0.75
pressure > 70         → decay = 0.50
```

设 `repeat` 为完全相同“问题 + 证据 + 态度”在此前出现的次数。

### 压力

```text
base = 引用证据 ? 10 : 3
context = 相关证据 ? +2 : 无关证据 ? -2 : 0

pressureRaw =
  base
  × tonePressure
  × evidencePower
  × relevanceFactor
  × pressureDecay
  + context
  + repeat

pressureDelta = clamp(round(pressureRaw), 0, 28)
```

### 信任

```text
toneBase = gentle:+6 / professional:+2 / firm:-7
openQuestionBonus = 无证据时 gentle:+2 / professional:+1 / firm:-2
irrelevantPenalty = 引用无关证据时 -3

trustDelta =
  clamp(
    toneBase
    + openQuestionBonus
    + irrelevantPenalty
    - repeat × 2,
    -15,
    10
  )
```

### 成交意愿

```text
toneBase = gentle:+1 / professional:-1 / firm:-4
evidenceCost = 有证据时 round(evidencePower × 2)，否则 0

dealIntentDelta =
  clamp(
    toneBase
    - evidenceCost
    - repeat × 2,
    -15,
    5
  )
```

### 控制感

```text
有证据：
  controlDelta =
    -clamp(
      round(10 × tonePressure × evidencePower × relevanceFactor)
      + repeat,
      0,
      24
    )

无证据：
  gentle:+2 / professional:-2 / firm:-4
```

这意味着重复同一行动不会“白白不变”：它会继续消耗行动点，并通过 `repeat` 改变压力、信任、成交意愿、控制感及候选行为分数。

## NPC 行为候选评分

对每个合法候选：

```text
baseScore = round1(Σ component)
jitter = round1((seededUnit(seed, turn, behaviorId) - 0.5) × 3)
finalScore = baseScore + jitter
selected = argmax(finalScore)
```

扰动范围是 `[-1.5, +1.5]`。不合法候选先被硬过滤，记为 `-999`，seed 不能把它重新选中。

当前对话候选的基础分为：

```text
补充说明 =
  10 + trust×0.35 + dealIntent×0.25 - pressure×0.15
  + (开放询问 ? 8 : 0) - repeat×12

模糊回应 =
  8 + control×0.35 + (100-pressure)×0.12
  + (弱证据 ? 6 : 0) + repeat×4

部分承认 =
  5 + pressure×0.28 + (100-control)×0.25
  + dealIntent×0.15 + evidencePower×12

反向质疑 =
  6 + pressure×0.25 + (100-trust)×0.22
  + control×0.18 + (强硬表达 ? 8 : 0)

拒绝回答 =
  4 + pressure×0.28 + (100-trust)×0.25 + repeat×20

离场 =
  pressure×0.30 + (100-trust)×0.30 + (100-dealIntent)×0.40
```

硬条件见 `02_NPC_STATE_MODEL.md`。

## 付费专项检测

NPC 同意分：

```text
consentScore =
  trust×0.35
  + dealIntent×0.45
  + (100-pressure)×0.15
  + (100-control)×0.05
```

只有 `consentScore >= 50`、行动点至少 2、该维度未检测且 NPC 未离场时才能执行。执行后：

```text
行动点 -2
累计检测费 +10
pressure +2
trust +1
dealIntent -6
control -4
```

检测只新增“胶层成分与大致时代”证据，不直接给出整件器物真伪或价格。

## 折价接受线与状态变化

```text
trustPremium =
  trust < 45 ? ceil((45-trust)×0.15) : 0

pressurePremium =
  pressure > 75 ? ceil((pressure-75)×0.20) : 0

intentDiscount =
  dealIntent > 75 ? min(5, round((dealIntent-75)×0.15)) : 0

acceptanceThreshold =
  reservationPrice + trustPremium + pressurePremium - intentDiscount

gap = acceptanceThreshold - offer
lowOffer = max(0, currentPrice - offer)
```

报价造成：

```text
pressureDelta = clamp(round(lowOffer ÷ 8), 2, 8)
trustDelta = gap > 8 ? -5 : gap > 0 ? -2 : +1
dealIntentDelta = gap > 8 ? -8 : gap > 0 ? -3 : +1
controlDelta = gap <= 0 ? -4 : -1
```

报价结果：

```text
gap <= 0       → 接受并成交
0 < gap <= 8  → 还价到 max(接受线, round((当前价+报价)÷2))
gap > 8        → 拒绝报价

若 gap > 15，且 trust < 40 或 dealIntent < 40 或 pressure > 75
               → 离场并立即结算
```

## 可见证据后验

三种真相先验当前相等，均为 `1/3`。对每个真相 `v`：

```text
weight(v) =
  1/3
  × Π 独立物证或检测的 likelihood(evidence | v)
  × Π 唯一陈述信号的 likelihood(statementSignal | v)

posterior(v) = weight(v) / Σ weight(all variants)
```

- NPC 陈述卡是展示层，不再作为物证重复相乘；
- 结构化陈述信号按唯一 `signalId` 去重，同源陈述不重复计权；
- 判断质量只读取玩家已见的物证、检测和陈述信号，不读取本局隐藏真相。

## 客观结果

设 `acquired` 表示最终买下器物：

```text
actualNet =
  (acquired ? trueValue - paidPrice : 0)
  - feesPaid
```

完全知情可达方案只比较玩家界面在本案实际允许的终局方案：

```text
开局直接拒绝：0
按开价80买下：trueValue - 80
若固定折价60在开局可被接受：trueValue - 60

oracleBestNet = max(可达方案净值)
regret = max(0, oracleBestNet - actualNet)
stakes = max(openingPrice, trueValue)
objectiveScore =
  clamp(round(100 - regret ÷ stakes × 100), 0, 100)
```

```text
objectiveScore >= 85 → 客观成功
70—84                → 基本成功
40—69                → 客观失手
< 40                 → 重大损失
```

客观胜利阈值为 `objectiveScore >= 70`。

## 判断质量

```text
expectedValue = Σ posterior(v) × trueValue(v)
buyExpectedNet = expectedValue - 当前实际决策所面对的价格
chosenExpectedNet = 买下 ? buyExpectedNet : 0
bestExpectedNet = max(0, buyExpectedNet)
utilityGap = max(0, bestExpectedNet - chosenExpectedNet)
```

惩罚项：

```text
uncertaintyPenalty =
  可见信号为0 ? 15
  : 最大后验概率 < 0.55 ? 8
  : 0

unsupportedRiskPenalty =
  买下且可见信号为0 ? 15 : 0

redundantPenalty = 重复或低效行动数 × 4
exitPenalty = 卖家离场 ? 15 : 0
```

最终：

```text
judgmentScore =
  clamp(
    round(
      100
      - utilityGap×3
      - uncertaintyPenalty
      - unsupportedRiskPenalty
      - redundantPenalty
      - exitPenalty
    ),
    0,
    100
  )
```

```text
judgmentScore >= 85 → 证据充分
70—84               → 判断合理
50—69               → 依据偏弱
< 50                → 判断失准
```

局末标题由客观胜利阈值 70 和判断质量阈值 70 组成四象限，详见 `01_GAMEPLAY_FLOW.md`。

## 局末调试复盘

每局结束后必须完整显示：

- 三种真相及本局真实价值；
- 实际净值、全部可达 oracle 方案、机会损失与客观分公式；
- 玩家可见证据、去重后的陈述信号、后验概率、期望价值与判断分公式；
- 每轮四状态变化图；
- 每轮输入、分项 delta、候选硬过滤、基础分、seed 扰动、最终分、Storylet 与 NPC 回应。

旧版“初始状态下温和/专业/强硬分别固定输出一组数值”的单次规则切片已经归档，不再是当前玩法或平衡基线。

## 仍需验证

当前数值已经通过规则自动测试和完整流程回放，但尚未经过足量真人试玩。下一轮平衡重点是：

- 6 点行动预算是否足以形成取舍但不过早截断证据链；
- 付费检测是否有明确适用场景而非支配策略；
- 重复行动惩罚是否可被玩家理解；
- 三种真相下是否存在稳定的唯一最优路线；
- 客观分与判断分的阈值是否符合玩家和指导老师对“成功”的直觉。
