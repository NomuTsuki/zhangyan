# 掌眼：调查入口、推理道路与跨栏联动 · fusion v0

2026-09-07 · Experimental · 桌面低保真 · 已实现，**用户报告的开局理解路径未通过**。

最新状态见[真人反馈](PLAYTEST-RESULT-2026-09-07.md)：用户先做 X 射线与早期影像后无法理解图形及说明。本版保留为失败对照；下一步是[一页局部逻辑候选](../../2026-09-07-xray-photo-local-logic-candidate.md)，先修正共同条件、缺口与输出的读法，并重审这处前置，再考虑扩展。下面机器核验记录保留，不代表真人理解通过。

双击 [prototype.html](prototype.html) 即可离线运行。当前本地服务入口为 `http://127.0.0.1:4180`；服务停止时离线文件仍可使用。

## 本轮改变

左侧保留 workbench-map-v0 的碗上 5 个入口、碗外 4 类共 10 个入口和全部 22 个调查手段。打开入口、选择内容、查看关联均免费，执行具体手段才消耗调查机会。布局为左栏 306px、右栏 356px，中栏使用剩余宽度，地图可缩放、滚动。

中间以 atlas 的信息与判断组织为基础，增加已知内容产生的道路前沿、两端待核对关系、共同解释条件和接通反馈。系统自动整理调查结果，没有手动连线。右侧固定四项判断概况，其下只呈现当前选中详情；未选中时列出当前显露的问题。材料、表面、稳定与来路状态收进连贯说明详情。

部位、手段、信息、判断、道路、缺口共用 `{ kind, id }` 选择。悬停临时提示；点击锁定；再次点击同项、地图空白或取消选择清除。Escape 先关闭浮层，再清除选择。聚焦不重排节点、不改变缩放、不移动视野，也不修改会话。

## 为什么“取得”与“理解”要分开

调查日志记录玩家拿到了什么，规则核决定这些内容现在能支持什么，地图只把两者的关系画出来。这三件事分别保存，后来的核对才可以改变旧信息的解释，而不会把旧信息再次发放或再次计权。

例如先做 X 射线和早期影像，两份材料均保留为实在的信息节点，共同指向对象连续性疑问；它们之间没有“互相证明”的线。补上连续性后，节点留在原位，解释关系接通。图的变化比较同时检查新道路、同一道路的关系增强和旧信息获得解释，不能只比较新增 ID。

事故档案的内部一致、归属核对和实物印证分别保存。两端已知时，归属与印证产生各自的缺口，先完成一项不会代替另一项。核验报告先到时以已取得报告保留，端点后到再并入对应道路，原报告仍可回查。

支持一个判断的共同条件在同一个菱形汇流口相遇；可替代的完整证明路线拥有不同汇流口。汇流口只组织已有真实证明，不是新的 Finding。缺口也不是预先摆放的隐藏答案节点；G3 不会触发“清空全部未知”的逻辑。

保持旧节点位置让玩家可以记住地图；代价是小视口、调查顺序较分散时需要滚动，已知布局不会为了临时聚焦而重新铺满屏幕。1280px 下多信息状态采用正常地图滚动，不设计手机降级。

## 构建与核验

全部命令在本目录执行。Node 24.15.0 已执行通过；运行产物不需要 Node 或网络。

```sh
node build.mjs
node graph-check.mjs
node selection-check.mjs
node layout-check.mjs
node --test ../first-ceramic-author-scenarios-v0/contract.test.mjs
node browser-check.mjs "<playwright package directory>" "<browser executable>"
node serve.mjs 4180
```

本机浏览器检查使用已有 Playwright 包与 Edge：

```sh
node browser-check.mjs "C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright" "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
```

`build.mjs` 按绝对源路径区分同名模块，将 12 个模块只读内联到单文件 HTML。`build-stamp.json` 记录模板和依赖指纹。`browser-check.mjs` 通过真实 UI 点击，使用 `file://` 验证离线成品；`fusionSnapshot()` 只返回结构化副本供检查，不提供游戏状态写入接口。

- `graph.mjs`：真实图投影、前沿、支持组、调查前后差异。
- `selection.mjs`：ID 映射、一跳联动、四项判断概况。
- `layout.mjs`：增量位置、前沿位置接续、绕行与汇流口。
- `ui.mjs` / `template.html`：操作、历史、反馈及低保真呈现。
- [VERIFICATION.md](VERIFICATION.md)：证据、失败与修复、验证边界。
- [PLAYTEST.md](PLAYTEST.md)：约三分钟的用户检查清单，尚未执行。
- [过程资产](../../../../../portfolio/2026-09-07-fusion-roads/README.md)：2x 截图、同视口前后对照及操作录像。

## 可重放的 16 步路线

这是一条用于回归的路线，不是界面给玩家的任务顺序。默认 22 步下走完剩 6 步，费用档计数为免费 2、低 8、中 4、高 2。每项都通过左侧原入口执行：

```text
01 A.OBSERVE.WHOLE
02 A.OBSERVE.BASE
03 A.VERIFY.OBJECT_CONTINUITY
04 A.RESEARCH.ACCIDENT
05 A.RELATE.ARCHIVE.T2_TO_OBJECT
06 A.CORROBORATE.ARCHIVE.T2_CURRENT
07 A.LOCATE.HISTORIC_IMAGE
08 A.RESEARCH.LATE_TREATMENT
09 A.RELATE.ARCHIVE.T3_TO_OBJECT
10 A.CORROBORATE.ARCHIVE.T3_CURRENT
11 A.ANALYZE.MATERIAL.SUBSTRATE
12 A.INSPECT.MATERIAL.LAYER_SEQUENCE
13 A.INSPECT.WINDOWS
14 A.SYNTHESIZE.SURFACE_REGIONS
15 A.ASSESS.TREATED_AND_UNTREATED
16 A.TRACE.PROVENANCE_CHAIN
```

## 范围与状态

三个旧原型及冻结规则的字节保留，既有暂存内容保留。本轮没有更改规则、正式数值或核心循环，没有提交、推送、部署。新呈现测试与投影细节需要 **review required**；独立 Agent 的针对性复核不替代用户转交的正式裁决，也不证明真人可读性。

下一步先验收融合低保真的信息结构、道路表达与联动，再应用已采纳的悬空器物高保真方向。自由旋转、朝向调查和正式美术留待此版评价之后。
