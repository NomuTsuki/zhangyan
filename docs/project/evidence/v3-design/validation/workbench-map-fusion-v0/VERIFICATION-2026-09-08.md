# 融合版局部逻辑接入：执行与验证

2026-09-08 · Experimental · **review required** · 已实现并实跑，本次整图可读性待用户评价。

## Implemented

用户认可两例可点击示意，要求沿用融合版原有图形、不带入示例矩形卡片，随后批准“提交后再将修正后的逻辑更新进融合版地图布局的逻辑”。先建立本地检查点 `14f9bee`（`Checkpoint approved local reasoning studies before fusion integration`，32 文件），再接入本轮修订。没有 push；接入后的文件保留在工作区，尚未第二次提交。

- 保留碗上 5 个入口、碗外 10 个入口、22 个手段、306/356px 两侧栏、缩放滚动及四项判断。普通信息与新的历史解释仍用原有圆点，支持汇合沿用小菱形；保留既有判断和选择边框，不导入局部示例的矩形卡片。
- X 射线直接提供当前结构信息。旧照先保留可见锔痕；缺现器对应特征时显示缺材料的前沿，两端齐备后显示待核验关系。核验并入两端道路，原报告可回查。
- 核验后旧照可说明本器早期修复史。历史解释只投影已有事实，不新增观察账目、因子、费用或计分判断。
- 比较时明确选择旧照或事故记录。比较报告与相应归属报告可换序取得，后来的核验只激活原报告历史用途。两个基底都可用时须显式选择，调查历史显示实际基底。
- 新道路接续原缺口，同路加强时保留路径，旧节点不因聚焦重排。判断、解释、原始报告、道路、缺口与左右栏按真实 ID 联动。

仅改连线会使地图与实际判断矛盾，因此在融合目录新增 `local-case.mjs` / `local-session.mjs` 适配必要条件，仍调用冻结 `solveFixture`。**不能宣称所有旧顺序与阶段时机完全相同**：照片必须在核验前取得，当前成像即时可用，比较须有选定材料及相应归属解释。原动作 ID、费用档、预算、重复计费、证据去重、手动收手和 G1/G2/G3 判定结构保持；冻结文件本身未改。

## Executed

命令从仓库根目录执行，`$F` 代表 `docs/project/evidence/v3-design/validation/workbench-map-fusion-v0`。Node v24.15.0，真实浏览器为 Playwright 驱动的 Edge。

| 命令 | 实际输出／结果 |
|---|---|
| `node $F/build.mjs` | `Built fusion prototype: 16 modules, 381496 bytes.` |
| `node $F/local-session-check.mjs` | `11/11 fusion-local session checks passed.` |
| `node $F/relation-projection-check.mjs` | `4/4 relation projection scenarios passed.` |
| `node $F/road-layout-check.mjs` | `RESULT 8/8 road geometry checks passed` |
| `node $F/actual-layout-check.mjs` | 18/18 实际增量路线通过 |
| `node $F/layout-check.mjs` | `RESULT 26/26 checks passed`，原通用几何合同 |
| `node --test docs/project/evidence/v3-design/validation/first-ceramic-author-scenarios-v0/contract.test.mjs` | tests 40 / pass 40 / fail 0，包含冻结 SHA 检查 |
| `node $F/local-browser-check.mjs C:/Users/ASUS/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright` | `RESULT 11/11 browser scenarios passed`，0 page errors |

先用 `node $F/serve.mjs 62591` 提供回环预览。浏览器通过真实点击／键盘执行，快照接口只读；结构化结果及页面 SHA 在 [local-browser-results.json](local-browser-results.json)。冻结合同通过只证明原规则仍完整，不冒充本地变体与旧版等价。

失败原样保留：原 `graph-check.mjs:75` 要求 X 射线与照片共用 `question:context`，新图已无此对象；原 `selection-check.mjs:106` 要求此共享缺口可选，因此失败。旧脚本未改，后续未执行的断言不追认为通过，本轮场景另由新检查覆盖。

新增浏览器检查第一次扩至 22 动作时，检查脚本把 API 的 `doneActionIds` 误传成 Set，导致检查器失败。只修正新脚本调用为数组并完整重跑，未改产品或放宽断言；原失败见 [local-browser-results-harness-failure.json](local-browser-results-harness-failure.json)。

## Scenarios covered

1. X 射线即时可用；照片与现器从缺材料到两端待核验；不可用手段不扣费、不造结果。核验后 P 和旧比较报告可获得历史用途，X 射线不被误报再次取得／再次解释。
2. 照片／事故两条比较路线，报告先到与归属先到，双基底显式选择。原材料、报告 ID、首次取得步骤与来源保持。
3. 三阶段和重大重组可回查照片核验；事故比较线表达处理与现物对应，不误写为旧照式差异。解释节点不计入观察数。
4. 22 个不同手段经 UI 执行；重复比较占一次机会和一次中档费用而不增加支持度；机会耗尽不自动收手。16 步两种档案证明路线均达四项成立／G3。
5. 试窗到区域综合接续原前沿；材料与层序无虚假互证边。逐类选择、锁定与悬停、Escape、回查、取消选择不修改会话或位置。
6. 历史保留当时状态与材料选择，回到本局恢复当前图；减少动态效果直接显示结果，接通时收手或重开清除旧动效。
7. 1280、1440、1920 × 1000 桌面实跑初始、中段、16 步状态及 22 动作。无节点／疑问框重叠、文字溢出或页面横向溢出；真实逐步几何核对无道路穿文字，旧节点移动量为 0。

16 步复现顺序：整器观察 → 底足观察 → 更早影像 → 照片核验 → 事故记录 → 事故归属 → 事故实物印证 → 后期记录 → 后期归属 → 后期实物印证 → 基底材料 → 关键层序 → 试窗点位 → 区域综合 → 陈列与稳定 → 经手记录。原路线中照片排在核验之后的顺序已不合法；此轮未再次证明全局最短路线。

## Observed result

融合页可离线运行，新逻辑、账目、判断和道路一致。当前信息先显示，核验后来接通其历史用途，材料仍认得出原位置。1280／1440 的多信息图需正常纵向滚动，1920 的本次 16 步图可完整显示。线路交叉仍存在，几何无碰撞不等于人能轻松读懂。

实际查看了初始、待核验、接通、比较报告和完整路线截图，保存 [2 倍同尺寸对照与 19.04 秒视频](../../../../../portfolio/2026-09-08-fusion-local-integration/README.md)。旧页从 `14f9bee` 的 Git blob 临时提供，未切换工作区；未用生成图代替真实渲染。

## Evidence provenance

主执行者完成接入、浏览器实跑和渲染查看。会话实现者独立重跑 11 项检查并复核 UI API；布局实现者运行 18 组真实逐步路线；另一个只读审查者运行两条来源与选择复核。

审查发现的两项问题已修复并同路径重验：三阶段／重大判断回查漏掉核验报告；档案现物对应误写为区域差异。复核结果含 `threePhaseReturnsC=true`、`majorReturnsC=true`、`activatedOldReport=true`、`selectionMutation=false`。这是同任务内定向复核，不代替正式独立审查。

[边界检查](local-boundary-results.json)确认相对 `14f9bee`，三份旧原型、冻结案件／规则入口、原四个检查脚本及 AGENTS 共 102 份受检追踪文件未变。

## Not verified

用户尚未试玩本次融合整图，先前“没问题”只记录为局部示意认可。新图可读性、推理感、长期记忆和自主选择体验仍待真人反馈；09-07 的旧版失败继续有效。

真实旧照、个体特征值和逐区 X 射线素材尚未制作。本次没有把示例的模拟阴性／不可比按钮搬进当前案件；没有据旧照未显露内部结构推断过去不存在。真实素材与作者案件扩充时需另行验证。高保真、3D 旋转及正式数值未实施。

## Residual risks

**review required**：新增会话、呈现、几何与浏览器检查（②）；为使批准逻辑与运行判断一致，细化了融合本地的取得／解释合同、比较基底和来源用途绑定（③）。没有改旧测试、冻结求解器或容差。执行者举手，正式裁决权保留给用户转交的独立审查会话。

## Exact completion claim supported

批准的检查点已本地提交；修订逻辑已接入可运行融合页，规则／来源／选择／几何与真实浏览器场景已核验。不能据此宣称地图已经优雅、真人体验通过、正式游戏完成或已发布。下一步从 [简短试玩说明](PLAYTEST-2026-09-08.md)收取实际反馈。
