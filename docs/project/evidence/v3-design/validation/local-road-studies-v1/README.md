# 两段推理道路 · 可点击示意 v1

2026-09-08 · Experimental / implemented / 待用户评价

入口：[prototype.html](prototype.html)。单文件、无外部依赖，可直接在桌面浏览器打开。当前会话的本机预览也可用 `http://127.0.0.1:62590/`；预览服务停止后请用 HTML 文件。

用户批准从[局部修订提案](../../2026-09-07-xray-photo-local-revision-proposal-v1.md)挑选几个关系做成可点击示意。只选两例：

1. **旧照片接入历史**：照片与现器对应观察可先后任选；两份材料都有才能演示核验。相符报告使照片中的旧锔痕成为本器历史的依据。今日 X 射线始终独立保留当前观察。
2. **差异何时成为变化**：预先给定两个时点的区域记录。比较与对象核验可任意先后；差异报告和成功归属共同支持本器变化，原报告的取得次序不变。

两例支持重置、各自状态保留、材料／报告回查、键盘选择与清除，以及未确认、不相符、无差异、不可比的结果演示。节点坐标固定，接通有一次短反馈，减少动态效果时直接展示最终状态。页面没有逻辑运算符文字。

## 内容与规则边界

第一例照片内容来自既有作者设定；没有制作真实照片、测量值或匹配任务。核验结果明确是演示。第二例的材料、时间与报告是声明式条件示意，没有虚构某张真实照片的区域差异。这里不计算整局费用或阶段，也不接入现有 22 动作会话、冻结求解器或旧地图。

这是落实候选的独立页面，不能用它更新原游戏状态。本轮不修改整图；用户评价示意后，再按其“如果没问题，下一步更新低保真地图布局逻辑”的安排推进。

## 构建与验证

在仓库根目录运行：

```text
node docs/project/evidence/v3-design/validation/local-road-studies-v1/build.mjs
node --test docs/project/evidence/v3-design/validation/local-road-studies-v1/model.test.mjs
node docs/project/evidence/v3-design/validation/local-road-studies-v1/browser-check.mjs <已安装的playwright模块目录> <本机预览URL>
```

`model.mjs` 是纯候选状态模型；`template.html` 负责渲染与点击；`build.mjs` 将模型内嵌成单 HTML。浏览器检查用现成 Playwright + Edge，不安装依赖，不更改旧测试。具体结果见 [VERIFICATION.md](VERIFICATION.md) 和 [browser-results.json](browser-results.json)。新增模型与呈现检查均标 **review required**。

给用户的简短尝试路径见 [PLAYTEST.md](PLAYTEST.md)；过程资产见[截图与短录像](../../../../../portfolio/2026-09-08-local-road-studies/README.md)。
