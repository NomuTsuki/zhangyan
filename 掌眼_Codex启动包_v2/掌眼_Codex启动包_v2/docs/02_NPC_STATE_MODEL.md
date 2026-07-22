# NPC 状态模型

## 固定层

- knowledge：知道、未知、误解、怀疑；
- goal：主要目的；
- traits：抗压、自尊、贪婪、急迫、欺骗能力；
- strategy：初始应对策略；
- reservationPrice：底线价格。

## 动态层

```ts
type NPCState = {
  pressure: number;
  trust: number;
  dealIntent: number;
  control: number;
  phase: "relaxed" | "cautious" | "pressured" | "negotiating" | "exited";
}
```

## 历史层

必须记录：

- statementsMade；
- factsAdmitted；
- factsDenied；
- topicsRefused；
- contradictionsExposed；
- offersMade；
- conditionsAccepted；
- storyletsTriggered。

## 行为选择

```text
候选行为过滤
→ 计算效用分
→ 排除逻辑不一致行为
→ 在最高分附近合理行为中轻微随机
→ 选择表现模板
```

随机只决定合理表现差异，不决定真相。
