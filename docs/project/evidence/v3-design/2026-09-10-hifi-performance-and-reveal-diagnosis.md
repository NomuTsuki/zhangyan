# 高保真卡顿与提前显露诊断

用户请求：先提交现状，再诊断卡顿／卡死以及节点尚未飞到、虚线和文字先出现的问题。本轮仅诊断，没有修复产品。

## 保存的版本

- 本地提交：`18dc40d` — `Integrate reviewed fixed map into high-fidelity workbench`。
- 分支：`codex/xray-photo-local-study`。未推送或部署。
- 被测离线页：`validation/workbench-hifi-v0/prototype.html`，5,085,383 bytes。
- SHA-256：`98f640e5341d575d003e38b695851bf54f6ffecf275f0e5b308a9a7d0aafae1f`。
- 提交前核对源／构建戳／最终 UI 报告一致，原验证的 `review required` 和待真人评价状态仍保留。

## 结论

### 1. 已复现：首次遇到某些依据组合，会阻塞界面主线程

实际 Edge 离线页、1440×1000，未减速 CPU。在新页面按既有路线执行 22 次调查，即使开启“减少动态效果”，仍出现：

| 本轮步骤 | 实际动作 | 点击到下一帧 | 浏览器长任务 |
|---|---|---:|---:|
| 16 | `A.ASSESS.TREATED_AND_UNTREATED` | 226.1 ms | 226 ms |
| 17 | `A.TRACE.PROVENANCE_CHAIN` | 1350.8 ms | 1350 ms |
| 20 | `A.COMPARE.CORPUS` | 1433.2 ms | 1433 ms |

这里的“下一帧”是点击捕获后浏览器下一次 requestAnimationFrame 的时间，不是动画全程时长。阻塞期间输入与动画都要等待，所以会产生暂时卡死的感觉。关闭动画不能消除这类停顿。

保留正常动画的另一轮第 17 次调查，点击到飞线开始为 1268.4 ms；带 CPU 采样复跑为 1369.6 ms。重复出现且均在飞线之前。

根因调用链已由 CPU profile 确认：

`App.perform → takeNewInvestigation → local-session.take → solveFixture → solveOrderIndependentFactors`。

冻结验证求解器的 [solveOrderIndependentFactors](validation/first-ceramic-author-scenarios-v0/solver.mjs) 在首次遇到新条件组合时，枚举各组因子的全部应用顺序，验证顺序无关性，并缓存结果。当前有 324 个候选状态；6 组因子有 720 种排列，每种需要 6 次因子应用，共 4320 次分布更新和排序。开发源码 profile 中该函数累计占用约 1316.6 ms，排序比较器约 706.9 ms；离线产物的相同调用栈也占据秒级长任务。

缓存键包含实际因子组、组内因子和先验，和“第几步”无关。即使组数还是 6，新增比对改变组内因子，也会再次计算。因此不同调查顺序会把停顿移到不同步骤。同页重开保留模块缓存，刷新页面才重新开始，这也解释了按同样顺序再次尝试有时会变快。

独立纯 Node 冷态复核也确认了这一点：基准路线第 17／20 步首次 take 为 1917／1991 ms，同一组合缓存后约 2 ms；另一条合法路线在第 15／17／19 步出现 1719／1731／1885 ms。Node 时间与浏览器时间分别报告，不混为同一环境的结果。最初仅测重复调用的基准漏掉了首次计算，纠正过程已保留。

证据：[完整 22 动作实机逐步耗时](../../../../output/playwright/hifi-performance-audit-2026-09-10/cold-route-browser/report.json)、[正常动画基线](../../../../output/playwright/hifi-performance-audit-2026-09-10/baseline/report.json)、[离线 CPU 采样轮](../../../../output/playwright/hifi-performance-audit-2026-09-10/profile/report.json)、[源码采样调用链](../../../../output/playwright/hifi-performance-audit-2026-09-10/analysis.json)、[Node 冷态基准路线](../../../../output/playwright/hifi-performance-audit-2026-09-10/static/cold-baseline.json)、[Node 替代路线](../../../../output/playwright/hifi-performance-audit-2026-09-10/static/cold-alternate.json)、[独立诊断与完整命令](../../../../output/playwright/hifi-performance-audit-2026-09-10/static/diagnosis-2026-09-10.md)。

### 2. 已复现：新虚线和问题文字早于新节点出现

新局直接做 X 射线。点击后约 536 ms 的截图中：飞线仍在途中；X 射线节点已经进入地图视口但 opacity 为 0；“结构从另一个时点到现在变了什么？”以及相应虚线已在视口中可见。

原因在 [MapView.tsx](validation/workbench-hifi-v0/src/MapView.tsx)：节点由 `incoming`／`appearance()` 按飞行和接通阶段隐藏（约 177–184、207–212 行），`layout.frontiers` 的路径和文字却直接使用调查后的图渲染（203、215 行），没有相同的出现条件。这是呈现时序遗漏，不是新调查真的提前获得了另一份材料。

照片调查也有同样的 DOM 时序。原问题被解决时，旧问题文字立即退出，而原虚线仍作为 retiring frontier 保留到接通过程结束；问题文字与道路没有完整共用生命周期。地图右侧和顶部记录也在会话落账后立即更新，早于地图动画；目前记录立即保存与地图分阶段呈现是两套机制。

证据：[节点未到、虚线文字已显示的实图](../../../../output/playwright/hifi-performance-audit-2026-09-10/timing-capture/01-first-xray-before-arrival.png)、[截图时刻／可见性读回](../../../../output/playwright/hifi-performance-audit-2026-09-10/timing-capture/report.json)、[第一步 X 射线逐帧间隔与 DOM 样本](../../../../output/playwright/hifi-performance-audit-2026-09-10/baseline/01-first-xray-raw.json)。截图轮与性能轮分开，截图开销不计入性能数字。

### 3. 已确认的次级开销：镜头移动仍重复处理固定道路

[MapView.tsx](validation/workbench-hifi-v0/src/MapView.tsx) 的 `moveCamera()` 每帧 setState，整棵地图 JSX 随之执行；`routeHitPath()` 每次为所有道路重新累计采样长度、生成命中路径字符串。固定道路几何本可复用。开发源码的一次调查 profile 中，该函数累计约 300 ms，分散在多个动画帧内，不能把这个累计量误称为一次 300 ms 卡死。

标签避路在布局生成、DOM 尺寸读回、动画前的旧布局生成中重复计算；密集图有全图候选搜索。纯 Node 已证实存在额外成本，但它不是上述第 17 步 1.3 秒停顿的主因。碗的 WebGL 在静止时也持续渲染，是持续负担；本轮没有证明它造成永久卡死，不将其冒称根因。

### 4. 未复现：无法恢复的永久卡死

本轮完成 22 次真实操作、正常动画的 5 个局部／后期场景、满图拖动与缩放，并检验快速连续调查、接通过程中打开设置和重开、历史回看与返回。没有页面异常，也没有无法恢复的状态。动画中打开设置约 22 ms，重开后等待 5.2 秒仍为空局 idle，没有旧回调重新污染页面。

后期一次完整飞入、镜头和多级接通过程可能持续约 10.3 秒，这是调度的动画总时长；页面在可响应阶段可被打断，和 1.3 秒主线程阻塞分别记录。两者叠加会放大“正在等系统”的感觉。

这里不能推断所有卡死都已解释：尚未覆盖用户当前浏览器配置、多个重型标签竞争、长时间内存／显卡资源增长和全部调查排列。Headless Edge 的帧率不代表用户屏幕实际帧率，本轮只使用长任务和单次帧间隔判断阻塞。

证据：[连续调查、历史与重开恢复](../../../../output/playwright/hifi-performance-audit-2026-09-10/targeted-dev/report.json)、[密集图交互](../../../../output/playwright/hifi-performance-audit-2026-09-10/baseline/report.json)。

## 建议修复顺序（未实施）

1. 在高保真应用侧建立后台计算边界，将原样求解器交给 Worker，界面线程负责输入和绘制；保留现有规则、校验和计费，以请求编号丢弃重开／回看之后的过期结果。所有求解入口（包括 derive、workbench、历史回放）必须进入同一后台边界，UI 消费结果；只搬 take 会因两个线程的缓存互不共享，让主线程再次计算新组合。求解缓存可以减少重复工作，但只加缓存不能解决首次组合阻塞。不通过删检查、改变推理规则或加快动画掩盖停顿。
2. 统一地图呈现时序：计算后的图先作为待展示结果；新材料到达再显节点，镜头拉回时才由可见锚点生长新前沿，问句与对应前沿同步出现。前提晚到的解释节点以及它衍生的前沿都等自己的接通过程。旧内容留在原位直到实际被替换；取消动画时一次性显示一致的最终图。
3. 缓存固定道路的命中路径和不变图层，减少镜头移动时的重算。标签排布按实际图和尺寸变化更新。若仍有持续掉帧，再单独测 WebGL 静止渲染和 SVG 绘制成本。

这三步是修复建议，未把本轮诊断请求扩大为产品修改授权。冻结求解器源文件、旧测试、地图拓扑和计费均未改。

## Evidence-before-done

- **Implemented:** 已保存检查点 `18dc40d`；本轮新增诊断脚本、CPU/长任务/DOM 样本、截图和报告。没有修改高保真产品。
- **Executed:** 从仓库根执行 `node output/playwright/hifi-performance-audit-2026-09-10/run-perf.mjs`；追加 `--profile --tag=profile`；执行 `targeted.mjs --dev`、`capture-timing.mjs`、`cold-route-browser.mjs`、`analyze.mjs`。独立静态/Node脚本及其命令保存在 `static/`。上述运行完成，失败症状按实保留，不将诊断脚本退出 0 解释为产品无问题。
- **Scenarios covered:** 正常动画的初始 X 射线、旧照片、核验、17 步来路、22 步比较；密集交互；整局首次组合；两条 Node 冷态顺序；历史/连做/重开；5 张时序图。
- **Observed result:** 复现 226–1433 ms 浏览器阻塞；新节点隐藏时前沿和问句已可见；秒级主因是首次组合的穷举验证；未复现永久卡死。
- **Evidence provenance:** 主执行者通过真实本地 Edge 操作和只读采样取得浏览器证据并实看截图；独立子代理复核未修改的求解器与真实会话，提交冷态/缓存后 Node 结果。开发服务器 profile 用于追源码名，主要耗时结论另由确切 SHA 离线页证实。
- **Not verified:** 用户设备上的长期卡死；全排列全覆盖；修复效果；真人舒适度；任何新上线状态。
- **Residual risks:** 已知阻塞和提前显露仍在提交的页面内。新增诊断检查触发 **review required**；执行者不自行裁决。
- **Exact completion claim supported:** 已提交并完成有界诊断；没有宣称已修复、性能通过或排除全部卡死。
