# 技术架构草案

本文件不规定具体框架，只规定模块边界。

## 已确认的载体决策

- 最终载体：H5（2026-07-22 确认）；
- 当前低保真原型使用 Web 技术验证交互，可直接作为 H5 方向的基线；
- H5 不自动要求使用 Unity。Unity Web 构建是可选实现路径，是否采用仍取决于课程要求、性能需求、团队经验和发布约束；
- 在老师未要求 Unity、项目仍以 2D 界面和状态驱动玩法为主时，优先评估标准 Web/H5 技术栈。

## 模块

```text
src/
  app/
  ui/
  input/
  game/
    actions/
    evidence/
    npc/
    rules/
    storylets/
    outcomes/
  content/
  services/
  debug/
```

## 运行链路

```text
UI / Natural Language
→ Action Builder
→ Action Validator
→ Rule Resolver
→ State Reducer
→ NPC Behavior Resolver
→ Storylet Resolver
→ Presentation Model
→ UI
```

## 调试工具

必须支持：

- 查看当前 CaseState；
- 手动修改四项数值；
- 查看每次 delta 计算明细；
- 固定随机 seed；
- 强制触发 Storylet；
- 查看陈述历史；
- 一键重新开始案件；
- 导出完整回放日志。

## 可测试性

规则引擎应允许无 UI 运行：

```text
initialState + actionSequence + seed
→ finalState + eventLog
```

这也是后续 Agent 模拟和平衡测试的基础。
