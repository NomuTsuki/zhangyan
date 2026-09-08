# 两段推理道路 · 验证记录

2026-09-08 · `review required` · candidate UI only

## Implemented

独立单 HTML 两例：照片归属接通早期历史；比较／归属报告先后任选后接通范围限定变化。固定节点坐标，材料与报告保留，未确认／不符／无差异／不可比的结果演示，点击及键盘回查，切换与重置隔离，短接通反馈与减少动态效果。旧小示意、四版工作台、冻结动作及求解器不改。

## Executed

仓库根目录执行，均退出码 0：

```text
node docs/project/evidence/v3-design/validation/local-road-studies-v1/build.mjs
node --test docs/project/evidence/v3-design/validation/local-road-studies-v1/model.test.mjs
node docs/project/evidence/v3-design/validation/local-road-studies-v1/browser-check.mjs C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright http://127.0.0.1:62590/
git diff --check
```

模型输出：`tests 12 / pass 12 / fail 0`。浏览器输出：

```json
{"checks":5,"layoutStates":15,"pageErrors":0,"sha256":"ba41a4f58c5195a76615f83c10bfe341854839a641f2e878e36fd478dea7a783"}
```

另对冻结场景／求解器、动作会话、v0／focus／atlas／fusion 目录执行 `git diff --exit-code -- <这些目录>`，退出码 0、无输出。原有未提交内容继续保留。

## Scenarios covered

- 模型：两种材料先后、缺材料禁核验、X 射线不独自产生历史、9 种核验／比较结果组合的双向顺序、重复与非法动作、原状态不变异、重置。
- 浏览器：第一例取得材料与接通，照片几何位置及取得记录不变；报告点击／Enter／Escape，选择不改变会话；第二例双向顺序与原比较报告保留；阴性和不可比反馈；两例切换与重置隔离；接通中重置不出现延迟结果。
- 1280／1440／1920 × 1000：每个宽度检查第一例初始／待核验／接通与第二例待核验／接通，共 15 状态，无整页横向溢出、节点重叠或节点内文字越界。
- 减少动态效果时，接通后 `animationName = none`，最终关系仍在。
- 实现者查看了第一例待核验与接通的 1440 截图、第二例接通的 1280 截图。独立审查者查看了 1440 正向与 1280 失败／回查状态。

## Observed result

上述机器与浏览器检查通过。只有两份材料到手不生成相符核验；已有差异且归属未确认时不生成本器变化。后来的核验只增加既有报告的用途，不改变它的取得次数与位置。页面无逻辑运算符字样。

过程中的失败保留：

1. 独立浏览器发现第一例核验报告文字原来不可点击，执行者为整段关系增加鼠标／键盘回查；同一审查者重新加载后检查成功及未确认报告均通过。
2. 独立浏览器发现第二例“先取得无差异报告、后核验”仍提示尚需报告，执行者按已有比较结果拆分反馈；审查者重走无差异与不可比两条路径通过。
3. 新浏览器检查脚本首次对 SVG 调用 `innerText()` 被 Playwright 拒绝，改用 `textContent()` 读取同一断言目标；产品与断言含义未改，完整重跑通过。
4. CLI 的 `file:` 访问被工具配置阻止，改用只绑定 `127.0.0.1`、只提供此单页的本机预览服务；最初的 favicon 404 已由内嵌空图标消除。新检查浏览器无 `pageerror`。一个旧 snapshot ref 失效后重新取 snapshot，未把它记为页面故障。

## Evidence provenance

模型由独立负责的 worker 实现并直接运行测试；主执行者再次运行 12 项测试、CLI 操作、15 状态浏览器检查和截图检查。另一名只读 QA 使用自己的 Edge 页面实际重走正反路径与边界场景，并再次运行模型测试，最终核对与上方相同的 HTML SHA-256。

独立结论为 `pass-with-known-risk`，只覆盖这些示意的模型与浏览器行为；不是正式独立审查会话的裁决。截图和短录像在 [过程资产](../../../../../portfolio/2026-09-08-local-road-studies/README.md)，机器明细在 [browser-results.json](browser-results.json)。

## Not verified

真人能否看懂、真实照片和逐项特征核验、实际区域差异、整局 22 动作／费用／阶段／16 步路线、完整地图布局、其他浏览器与读屏器。第二例的预置材料是显式条件演示；不能据此认定实际鉴定内容已制作。

## Residual risks

两例使用不同的材料起点，第二例预置说明是否足够显眼待用户反馈。具体图像视角未来可能不足以支持核验或区域比较。局部候选改为正式地图时需要处理原全局连续性消费者与来源映射，本轮没有直接修改它们。

`review required`：新增 `model.test.mjs` 与 `browser-check.mjs`（测试新增）；实现中采用两例独立状态、第二例预置材料、结果选择后生成不可覆写报告等 Experimental 细节。执行者举手不裁决。用户反馈前，不把机器通过当作其“如果没问题”的体验前提已满足。

## Exact completion claim supported

两例可点击示意已实现，并在列出的状态与桌面宽度下核验。可以交用户评价；完整低保真地图尚未更新，也未宣称真人理解通过。
