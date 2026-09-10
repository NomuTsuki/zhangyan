# 2026-09-10 固定地图高保真整合验证

## Implemented

已将用户审阅通过的固定地图骨架接入现有高保真页面，并完成本轮授权的调查交互、圈足与材料回看修复。范围与用户原话见 [接入记录](../../2026-09-10-hifi-fixed-map-integration.md)。

最终入口为 [prototype.html](prototype.html)，5,085,383 bytes，SHA256：

```text
98f640e5341d575d003e38b695851bf54f6ffecf275f0e5b308a9a7d0aafae1f
```

地图位置及道路由固定空间骨架提供；本局调查只决定哪些内容已经显露、哪段关系成立。文字与镜头不重排地图。核验关系按真实状态分段，材料输入从常驻线条转到来源回查，圈足法线及外引部位标签已修正。同一调查免费回看，另一组材料首次比较保留。

## Executed

在本目录运行：

```text
npm.cmd run build
npm.cmd run check
node src/fixed-map-layout-check.mjs
node --experimental-strip-types scripts/check-material-records.mjs
node scripts/check-integration-2026-09-10.mjs --tag=final-camera
node scripts/check-browser.mjs --offline --suite=main --tag=2026-09-10-final
```

器物专项由其执行代理运行：

```text
node scripts/check-bowl.mjs --tag=final-labels
node scripts/check-bowl-compact.mjs --tag=compact-final-labels
node scripts/check-bowl-integrated.mjs
```

另外执行独立地图顺序／实际文字复核、档案半路动画／原生点击复核，以及最终版本原生 UI 录屏。根目录 `git diff --check` 退出码0；冻结求解器、旧原型与旧检查来源路径相对 `68f9283` 无差异。

## Scenarios covered

| 范围 | 结果与证据 |
| --- | --- |
| 既有规则合同 | [7/7](verification-contract.json)：22动作、预算与首次计费、历史、早取后懂、已核实16步路线的四项判断仍成立。合同中的旧 `engine.take` 重复计费检查验证历史底座未变；新页面另由执行入口拦截重复，二者不混淆。 |
| 固定几何 | [布局检查](src/fixed-map-layout-check.mjs)8/8；3条22步合法顺序共66状态，既有节点移动0；前沿与最终路形一致，先核验后端点也保留真实记录；实际曲线对24节点／40路做1200次路线—实体比较，未见碰撞。 |
| 材料内容 | [语义检查](scripts/check-material-records.mjs)6/6；C=P+B，D=P+W+X，DA=事故记录+W；材料输入不等于证明；归属与印证分别成立；两条完整路线的已得材料均可回查。 |
| 最终整合 UI | [7/7](verification-integration-2026-09-10/final-camera/report.json)：碗上／碗外飞线真实起点、近旁弹窗、拖动无选字、免费重复回看与新比较、判断上下文、原路动画、旧资料不重取、历史／重开／收手取消，以及右侧问题打开背向部位后转到可见再执行。 |
| 最终三尺寸完整流程 | [3/3](verification-browser-2026-09-10-final-main.json)：1280／1440／1920均从新局经17步G3到22种动作，计费相符、四项成立、机会耗尽不自动收手，之后可人工收手。 |
| 圈足与入口 | [默认9状态](verification-bowl-2026-09-10/final-labels/report.json)、[短舞台12状态](verification-bowl-2026-09-10/compact-final-labels/report.json)均0失败／0页面异常；外壁／底面法线、真实底面射线命中、水平末段引线、标签不越界／重叠、热点拖动不误选及锚点回传。 |
| 独立布局 UI | [独立记录](../../../../../../output/playwright/hifi-fixed-map-integration-2026-09-10/layout-cross-review/report.json)：两条5步不同顺序最终节点／道路／前沿一致；另一条不同顺序到G3；中段与G3各三宽实际文字之间、文字与可见路段碰撞均0。 |
| 独立半路动画与命中 | [独立审阅](../../../../../../output/playwright/hifi-fixed-map-integration-2026-09-10/motion-cross-review/review-2026-09-10.md)：旧菱形／旧归属短标常驻；新半段500ms与900ms已逐渐显现；25%实线点击选关系，75%未核半段点击选缺口，0页面异常。 |

## Observed result

最终构建输出：

```text
✓ 45 modules transformed.
Offline prototype built: 5085383 bytes
{"passed":true,"passedChecks":7,"total":7}
{"passed":true,"checks":7,"out":".../verification-integration-2026-09-10/final-camera"}
{"passed":true,"passedScenarios":3,"total":3,"failures":[]}
```

最终照片核验检查中，原路与此前虚线 `d` 完全相同；接通开始与中段的进度不同，历史用途开始晚于归属核验完成；旧照片及X射线都只取得一次。新增身份判断及早期历史解释的实际文字边界均留在自动拉远后的视口内。

中途失败原样保留：

- 初始 `RoadInk` 访问旧道路不存在的 timing，connect崩溃；修复后无页面异常。
- 旧菱形与旧核验短标在新调查中误隐藏；现只延迟本次新增对象。
- 新半段曾先扫描已成立旧半段，出现空等；现对新增区间自身播放完整时长。
- SVG遮罩不能可靠限制命中；现由实际裁切路径接收点击，绘制墨线不参与命中。
- 短舞台曾丢失外引标签，已补留白与按词义分行；原 `compact-first` 失败保留。
- 首轮重复比较检查缺少当前X射线前提，准备路线已补齐；没有放宽可用性条件。系统减少动态效果与页面设置曾不一致，现由页面已选设置统一控制，系统偏好仅提供初始值。
- 录屏显示0.68最低拉远比例会裁掉远处新解释；现镜头始终纳入本次新增／重新解释内容，最终边界检查及原速录屏均验证此点。

## Evidence provenance

根代理实现整体接线并运行最终构建、合同、7项整合 UI 与三尺寸主流程，实际查看最后自动镜头画面及判断回看首屏。三个工作代理分别实施布局、器物、材料模块，并进行模块自测；布局和器物执行代理随后交叉检查不由自己编写的整合层。

独立全局布局检查发生于较早整合构建；之后没有变更固定几何，修复限于动效、命中、入口及相机。半路命中的独立最终复验来源为 `8b66500f…`，其后没有改动裁切命中逻辑。最终七项整合、三尺寸主流程与正式资产均明确使用上方最终 SHA，不用较早截图冒称最终结果。

[最终2倍画面和22秒原速短片](../../../../../portfolio/2026-09-10-fixed-hifi-integration/README.md)附完整来源SHA、动作日志、镜头与媒体读回。旧截图／旧短片保留为过程资产；零碰撞和录像不代替用户体验结论。

## Not verified

- 本轮三栏高保真是否易懂、镜头节奏是否合适、器物大小与外引文字是否合意，待用户试玩。
- 没有穷举所有22动作的合法排列、全部连续旋转角度或所有桌面高度。
- 最密集“全览”约24%时文字很小，适合看位置关系；细读仍需放大或右栏回查。零重叠不等于低缩放可读。
- 现有器物学特征值、真实旧照片与专业检测内容仍不完整。本轮改进可核对的说明结构与已有状态，没有虚构缺失的专业证据。
- 未做手机布局、正式数值校准、交易结算、发布或部署。

## Residual risks

**review required**：②新增与迭代日期化检查；③为满图审阅未覆盖的“核验先到、端点后到”临时报告补齐固定空间，以及选择可回退的动效／取景默认值。执行者记录信号，未替独立审查会话裁决。冻结核心系统与旧测试没有被修改，参数保持Experimental。

本轮修改尚未提交；`68f9283` 仍是可回退的高保真检查点。此前仓库未跟踪的其他原型截图与输出原样保留，没有清理、暂存、推送或部署。

## Exact completion claim supported

授权的固定地图与八项高保真交互修复已接入可运行页面；最终构建、规则合同、有限顺序、三种桌面流程、材料与动画恢复均取得机器证据，过程资产已保存。下一步直接试玩 [当前页面](prototype.html)，使用 [短清单](PLAYTEST.md)反馈问题；真人体验尚未被宣布通过。

核心取舍是将“已知内容如何成立”与“地图位置在哪里”分开：会话负责真实调查结果，固定骨架负责空间记忆，动画只呈现变化。这样换调查顺序不会重新排地图，打断动画也不会丢失已经取得的结果。
