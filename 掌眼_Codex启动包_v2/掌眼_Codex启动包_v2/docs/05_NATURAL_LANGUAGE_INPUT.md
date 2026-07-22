# 自然语言输入层

## 架构

```text
玩家文本
→ LLM 语义解析
→ JSON Schema 校验
→ 权限校验
→ 玩家确认（低置信度时）
→ 规则引擎
```

## Action 枚举初稿

### target

- provenance
- era
- restoration_history
- ownership
- valuation
- expert_opinion
- document_authenticity
- hidden_part

### action

- ask_open
- ask_detail
- repeat_confirm
- request_inspection
- present_evidence
- challenge_contradiction
- propose_testing
- make_offer
- add_trade_condition
- withdraw

### tone

- gentle
- professional
- firm

## 回退

- 固定选项始终可用；
- API 不可用时不影响完整游玩；
- 低置信度展示“系统理解为：……”供玩家确认；
- 非法 evidenceId 自动删除并提示。
