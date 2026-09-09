# 高保真工作台 v0 · 验证记录

日期：2026-09-09。状态：Implemented；下述机器与浏览器范围 Verified；真人体验 Not verified。**review required**。

## Implemented

独立 React / Three.js 桌面页面：真实悬空旋转、朝向部位调查、22 个既有动作、纸墨三栏、道路优先与文字避让、稳定增量地图、四项判断、材料检视、共同选择、飞入—拉近—拉远接通、历史与手动收手。新目录引用融合版函数；没有改冻结规则或旧原型。

## Executed

在本目录运行：

```text
npm.cmd run build
  tsc --noEmit: exit 0
  Vite 8.2.2: 41 modules transformed
  Offline prototype built: 5056180 bytes

node scripts/check-contract.mjs
  passed: true; passedChecks: 7; total: 7; failures: []

node scripts/check-browser.mjs --offline --suite=all --tag=final-visual-polish
  passed: true; scenarios: 5/5; all browser error lists: []

node scripts/check-browser.mjs --offline --suite=motion --tag=label-bounds
  passed: true; scenarios: 1/1; browser errors: []

npm.cmd audit --json
  vulnerabilities: 0

git diff --check
  exit 0; no output
```

最终 HTML SHA-256：`40dfc7b133a602bf4a55b6dd1445fb69f9da05e6c42738dd1945a65c3b23d0b3`，见 [构建戳](build-stamp.json)。5/5 整局场景针对上一构建 `1db7f0e…`；其后只修正镜头取景遗漏文字范围的问题，最终版本执行下述取景专项与动效复验，没有把旧构建结果冒称为最终文件全量重跑。所有浏览器检查加载离线文件，没有依赖开发服务器 HMR，也没有注入或替换游戏状态。

提交前补充：上面的 `git diff --check` 当时只覆盖已跟踪文件；将新增页面暂存后，`git diff --cached --check` 对 `prototype.html` 的内嵌 Three.js GLSL 字符串报告空白格式问题，非零退出。已对照依赖源码确认这些空白来自上游着色器，原始输出保存在 [commit-whitespace-check.json](commit-whitespace-check.json)。排除这个生成页单独检查其余暂存文件通过；没有清洗生成页、改变 Git 空白规则或重写验证结果，已验证 HTML 的字节保持不变。此次只做本地存档，未重跑玩法套件。

## Scenarios covered

- 1280、1440、1920 各自从新局操作至 22 个不同动作全部执行；检查费用、余次、G3 四项成立、机会耗尽仍可手动收手，留初始／中段／多信息／结束截图。
- 16 步既有路线的两种档案证明走法仍使四项同时成立。重复调查沿用既有收费，不增加独立证据或支持。
- 当前 X 射线立即提供当前结构；先取得的旧照片与比较报告等待归属，再由核验解释。历史保留原来的比较基底和材料 ID；回放前期不会偷用后来取得的归属。
- 实际打开旧照片、核验两端与底部比较，检查三维画布已渲染；未取得材料不凭空生成。核验报告作为关系可回查，不额外生成报告信息节点。
- 实际观察到 `fly → focus → connect → idle`；照片核验落到 `photo:object`。重复不飞入；弹窗／Escape、拖地图、历史、重开与收手取消镜头，等待后没有迟到的镜头移动。
- 最终曲线的限定几何复核见 [geometry-review.md](geometry-review.md)：认可路线节点稳定，6 种随机完整调查顺序的 132 步及真实 SVG 曲线与实体形状采样。估算标签结果不冒充浏览器实际字形验证。
- [独立选择与镜头复核](selection-review.md)实际执行 12 项选择检查：信息、道路、缺口、判断、汇流、未做手段、来源、悬停、再次点击／空白／Escape 与会话不变；1920×1080 五步状态的真实 DOM 文字与道路无交叉。随后在最终构建的 1440×1000 正常动效下执行四步，不点全览或手动挪图，核对所有实际文字 Range 均在视口内。

## Observed result

最终构建、7 项合同检查和 5 个完整浏览器场景通过。[合同原始报告](verification-contract.json)记录 22 动作、两条 16 步路线与保护路径；[最终浏览器报告](verification-browser-final-visual-polish-all.json)记录每个场景与截图。保护范围内的旧原型、旧测试与冻结模块相对 `85c7419` 无暂存或未暂存差异。

实际四步画面曾在自动拉远后裁掉历史用途标题约 67.84px。`MapView` 的 `fit` 和“原视角是否足够”原先只检验节点范围；修复后合并已测量的标签边界，不移动节点或改道路。独立复核最终 68% 镜头中裁切数为 0，标题最右实际字形 1038.63px 位于地图右界 1055.53px 内。首次问题与修后结果都保存在 `selection-review.json`；旧截图保留。

[最终动效复验](verification-browser-label-bounds-motion.json)在新离线文件上再次通过飞入、拉近、接通、重复不飞入及所有打断场景，错误列表为空。此轮没有重跑未受镜头边界修复影响的三宽 22 动作整局检查。

最终 take3 资产以 1440×900 再核对实际文字范围，信息／判断／问题标签越界为空；根执行者查看最终 hero，历史用途标题完整可见。2 倍截图为 2880×1800，实际 UI 短片经 ffprobe 测得 24.68 秒，四次调查均记录到飞入、聚焦、接通过程。take2 裁字修复前资产及原 manifest 保留，当前作品集 README 指向 take3。

根执行者实际查看了最终 1440 中段截图：较长道路有可见的单次平缓弯度，信息标题与道路分离，器物外壁纹饰已进入初始可见侧。全览 60% 状态文字明显缩小；这一观察保留为体验限制，不能写成高保真视觉验收通过。

首次开发服务器检查的 404 / HMR 中途会话重置留在 [开发首轮报告](verification-browser-dev-first-run.json)；后续改用真实离线构建检查。此前通过的版本留在 [视觉调整前报告](verification-browser-before-visual-polish.json)。没有放宽断言、覆盖失败为成功或改旧测试基线。

## Evidence provenance

- 集成与素材：根执行者及分工实现 Agent。
- 合同与完整浏览器检查：执行团队编写新增脚本；根执行者跑合同，实现 Agent 从本机 Edge 真实 UI 跑浏览器场景。只读快照用于观察，不用于推进状态。
- 代码限定复核：另一只读 Agent 指出照片核验飞线误选证明入路、档案已核实后检视仍称待核验两项 P2；已修复并纳入最终行为检查。
- 实际 UI 限定复核：该只读 Agent 另执行 12 项共同选择检查，并独立重现和复查自动取景裁字。它是明确范围的独立复核，不代表完整正式审查已获裁决。
- 曲线与节点几何：地图实现 Agent 的专项检查；不是独立审查裁决。
- 过程截图／录屏：[作品集资产说明](../../../../../portfolio/2026-09-09-hifi-workbench/README.md)，注明真实 UI 路线与制作来源。玩家图不可由生成参考图反推边或结论。

## Not verified

用户尚未试玩本版。地图是否易懂、是否辅助长线推理、曲线气质与器物质感是否满意、镜头是否舒适，均待真人评价。未运行新的零背景盲测。未核验所有浏览器／显卡组合；未进行真实古董学、摄影或科学检测准确性验证。

## Residual risks

- 多信息全览是概览比例，字小；详细阅读需要缩放或右栏。少数极端调查顺序可能把标签放得离节点偏远。机器的碰撞检查不能替代空间可读性判断。
- 三维器物与历史材料为本案的合成表现；扫描视图为结构示意。它们不构成新增的作者真相或真实文物鉴定证据。
- 本轮镜头、旋转、曲线和画面比例仍是 Experimental；参数记录在项目 `PARAMS.md`。单文件约 5.06 MB，需要 WebGL；不支持 WebGL 时实际三维把玩不能成立。
- **审查门命中②：新增呈现／集成检查；命中③：执行中选择器物材质、呈现阈值和镜头曲线参数等默认值。** 没有改旧测试、容差或核心求解器。执行者仅举手，独立审查是否通过由用户转交的审查会话裁决。

## Exact completion claim supported

融合修订逻辑已接入独立、可离线运行的桌面高保真工作台；已通过上述合同、真实 UI 场景与限定几何检查。支持“可运行并可交互核验”，不支持“真人已理解／美术已认可／正式数值已批准／已发布”。本报告保留测试时的证据；用户随后批准本地检查点保存，没有推送或部署。
