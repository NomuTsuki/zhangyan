# 技术架构草案

本文件不规定具体框架，只规定模块边界。

## 已确认的载体决策

- 最终载体：H5（2026-07-22 确认）；
- 当前低保真原型使用 Web 技术验证交互，可直接作为 H5 方向的基线；
- “微信内 H5 网页”“微信小游戏”和“Unity Web 构建”不是同一个概念。Unity 可以构建 Web 内容，也可以借助转换工具生成微信小游戏工程，但不是 H5 的必经步骤；
- 正式框架仍未决定。先以当前 Web 原型明确玩法与状态边界，再用最小技术样片比较标准 Web/H5 与 Unity 路线的学习成本、包体、启动速度、手机适配和后续发布流程；
- 在技术样片完成前，不把可逆的浏览器原型工作等同于对最终引擎的承诺。

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

调试信息属于独立开发表面：桌面原型放在手机画布外的侧栏，正式手机玩家界面不承载 seed、公式明细、阈值检查或系统处理链。

## 可测试性

规则引擎应允许无 UI 运行：

```text
initialState + actionSequence + seed
→ finalState + eventLog
```

这也是后续 Agent 模拟和平衡测试的基础。

## 当前落地状态（2026-07-22）

- `prototype/game/types.ts` 已定义 `PlayerAction`、`NPCState`、`ActionResult` 与规则事件；
- `prototype/game/resolve-action.ts` 已实现首个无 UI 可运行规则切片；
- React 页面与单文件 HTML 均只读取规则输出显示 P5 数值和日志；
- 自动测试已覆盖固定输入可复现、Storylet 阈值结果、0—100 边界和错误输入；
- 该实现只证明规则接口与 H5 原型可协作，不等于已经完成引擎选型。
