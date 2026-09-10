# 高保真性能、显露时序与最小缩放修复验证

## 来源与范围

用户在完成诊断后明确要求修复，并补充“第一次试玩把地图缩到最小时卡死，页面还有不明闪烁”。本轮接着 `18dc40d` 实施；此前诊断及失败证据保留。用户随后批准将修复及其证据保存为本次本地提交，未推送或部署。

最终离线页：`prototype.html`，**5,161,993 bytes**，SHA-256 **`10039aac47de84d8415c07db09c9d8d332c1ebc3fc42691565d845ec29730336`**，构建时间 `2026-09-10T07:06:30.612Z`。使用内联 Worker，可直接 `file://` 打开。后续只补检查、报告与资产，未再改变产品源码或 HTML。

## 改动及实际效果

1. **后台计算完整接入。** `engine-runtime.mjs` 在一个 Worker 内维护会话并执行调查、全部求解、手段状态、判断概况及历史回放。App 只接收快照，选择投影仍在本地。因子全排列校验和冻结规则原样保留。重开终止旧 Worker；迟到代次不能污染新局；重复请求只计一次；历史只显示最新请求；收手按已经接受的调查之后处理，保留结果和费用。
2. **出现顺序闭合。** 新信息先飞入，节点到达、镜头拉回后，新前沿沿原路用 900ms 生长，问句随后出现。新的解释和判断仍等真实支持道路。旧问题文字保留到对应核验接通；中断动画则立即显示一致的最终图。飞行/生长期间，尚不可见的新路段不会抢占点击。
3. **缩放绘制减负。** 相机逐帧只更新世界变换，不再推动整张 React 地图逐帧重算；命中路径按实际布局缓存。完整已成立道路直接绘制，部分道路才使用遮罩，动画遮罩缩到道路边界。相机拒绝非有限数，保持原 20%–180% 边界，并跳过无变化的变换写入。
4. **关闭两个迟到/闪现入口。** 后台等待中手动操作地图、明确取消选择等会阻止迟到镜头；重开等待初始化前即清空旧会话和地图，不再让新 Map 用旧图短暂初始化。

## 冷启动响应：同一路线对照

Edge 离线页，1440×1000；全新页面/Worker，22 次真实调查，减少动态效果仅用于隔离计算成本。输入后记录下一次 requestAnimationFrame；它不是调查计算完成时间，也不是用户屏幕 FPS。

| 动作 | 旧页点击至下一帧 | 修订页点击至下一帧 |
|---|---:|---:|
| 结构与陈列 | 226.1 ms | 2.3 ms |
| 经手记录 | 1350.8 ms | 1.4 ms |
| 同期真品比对 | 1433.2 ms | 2.4 ms |

修订页 22 次点击最长 **4.3ms**；全段主线程最长长任务 **66ms**，其余记录为 51/56ms，均不再是首次规则组合的秒级阻塞。Worker 中实际冷计算仍需时间，期间 UI 可操作，没有把耗时伪装成已经算完。

证据：[新冷路线原始事件](verification-performance-fix-2026-09-10/first/cold-route.json)、[旧冷路线](../../../../../../output/playwright/hifi-performance-audit-2026-09-10/cold-route-browser/report.json)。新回归门是单次输入至下一帧和主线程长任务分别小于 200ms；这是一项本机回归上界，不是产品动画时长，不是通用设备的性能承诺。

## 最小缩放专项

独立代理使用实际 Edge **152.0.4191.66**、ANGLE / NVIDIA RTX 4080 Laptop GPU / Direct3D11（非 SwiftShader），采用 headless 窗口。四种配置：1280×1000、1440×1000、1920×1000 的 DPR1，以及 1920×1000 的 DPR2。

- 每配置从空局走到 5、17、22 份信息，共 **16 个状态**；执行到 20% 后继续缩小、Ctrl滚轮往返、拖动、全览恢复和固定标签/道路悬停。
- **77 个**纯缩放、静止、悬停与拖动测量窗口：无长任务，最大 RAF 间隔 **12.5ms**。固定光标和静止窗口没有自发的 class/style 或 pointer enter/leave 循环。
- **16 次**调查动画中缩小：全部回到 idle，没有迟到镜头复活；其中第22步新图接入出现 **50/52/58ms** 三条长任务，最大 RAF 间隔 **62.5ms**。这和稳定在20%时的持续阻塞分开记录。
- 四局各完成真实 22 次调查；最后相机为 `s=0.2`，22个节点仍在显示图中；页面异常、renderer crash、WebGL context loss 均为 **0**。
- 满图静态 SVG mask 实际从旧页 **34 个降为 1 个**。已查看高 DPR 最小缩放截图。最小比例用于全图定位，小字需要放大，不以这张图声称正文可读性通过。

证据：[最小缩放独立报告](../../../../../../output/playwright/hifi-performance-fix-2026-09-10/minzoom-final/REPORT.md)、[完整数据与来源](../../../../../../output/playwright/hifi-performance-fix-2026-09-10/minzoom-final/audit.json)、[1920 DPR2 满图](../../../../../../output/playwright/hifi-performance-fix-2026-09-10/minzoom-final/1920-dpr2-state22-min20.png)、[旧页基线与保留的超时](../../../../../../output/playwright/hifi-performance-fix-2026-09-10/minzoom-baseline/REPORT.md)。捕图在性能计量窗口之外；不逐帧调用会克隆整张图的调试快照。

**关于用户的原始卡死/闪烁：** 旧页在有界最小缩放复核中也没有重现永久卡死，不能把减负措施冒称为已找到并消除这次偶发事件的唯一根因。旧页一次14秒等动画结束超时仍保留；因为未留当时最终 phase，无法归类为永久卡死。补测相同动作约6.7秒完成。前台窗口合成、其他进程/GPU竞争、长期资源增长与用户第一次的缓存组合未完全覆盖。

## 检查、失败与独立审阅

| 已执行命令（高保真目录） | 结果与证据 |
|---|---|
| `npm.cmd run build` | TypeScript + Vite，47 modules，离线页5,161,993 bytes；内联Worker实际启动通过 |
| `npm.cmd run check` | 原合同 **7/7**，含既有路线与条件，不修改原测试；[报告](verification-contract.json) |
| `node scripts/check-worker.mjs` | **7/7**；真实Node Worker的17步会话/图与原逻辑等价，冷计算约1562ms期间父线程101次计时事件、最大间隔23.7ms；[报告](verification-performance-fix-2026-09-10/worker-check.json) |
| `node scripts/check-reveal-lifecycle.mjs` | **5/5**；实际图的前沿、旧问题、晚解释与同路替换；[输出](verification-performance-fix-2026-09-10/reveal-lifecycle.log) |
| `node scripts/check-performance-reveal.mjs --tag=first` | **8/8**：三个真实显露/取消场景、22冷动作、等待中导航/历史/重开/收手；[报告](verification-performance-fix-2026-09-10/first/report.json) |
| `node scripts/check-performance-reveal.mjs --tag=cancel-with-selection --only=cancel-selection` | **1/1**补查：先明确选择手段，执行后等待中点击取消选择，结果到达后选择仍为空、无相机复活、只计一次；[报告](verification-performance-fix-2026-09-10/cancel-with-selection/report.json) |

最小缩放专项从仓库根执行 `node output/playwright/hifi-performance-fix-2026-09-10/minzoom-final/audit.cjs`，数据如上。全部脚本是新增检查，标记 `review required`；原浏览器测试及基线没有修改。

修复前对精确旧 HTML 运行同一显露检查，**2项失败、1项通过**：问句实际为opacity1而不是0，已解决的问题文字未保留。[原失败](verification-performance-fix-2026-09-10/baseline-red/report.json)与截图保存。最初新增纯逻辑检查假定历史解释会产生一个并不存在的前沿；读真实图后改为检查真实解释道路和保持不变的旧问题，没有改游戏图迎合测试。最初取消选择补测使用双击，第二击落到关闭浮层后的地图空白，已清除选择，因此找不到取消按钮；其失败保留在 [cancel](verification-performance-fix-2026-09-10/cancel/report.json)，后按实际操作路径先选手段、单击调查再取消，完成专门验证。

独立静态审查发现明确“取消选择”入口漏增交互代次，已修并完成上述浏览器补测。Worker原子性、代次隔离、历史/收手队列和Map呈现接口未再发现明确静态缺陷。[独立审查](../../../../../../output/playwright/hifi-performance-fix-2026-09-10/independent-review/report.md)不冒称独立浏览器验收或用户体验通过。

## 过程资产与体验复测

已保存[同尺寸修复前后图、真实四动作Hero与21.96秒原速短片](../../../../../portfolio/2026-09-10-responsive-map-reveal/README.md)，各自有准确来源SHA、动作序列、捕获时点与英文caption。前后图在实际进入fly约500ms时请求捕获；编码期间动画继续，不把它们说成精确同步帧，不用截图延迟作性能结论。主执行者另实看了飞行阶段与高DPR最小全图截图，捕获代理检查了新资产和视频抽帧；不冒称真人整段播放或体验接受。

直接使用[本轮短复测](PLAYTEST.md)，优先在用户上次发生卡死的前台浏览器与窗口大小复验。前述未知条件继续保留。

## Evidence-before-done

- **Implemented:** 完整后台计算、出现时序、固定绘制缓存、最小缩放变换保护、旧局清空与迟到选择/镜头防护。冻结核心、数值和固定拓扑未改；本轮按用户指令保存本地提交，未推送。
- **Executed:** 上表命令、离线原生UI、四配置最小缩放专项、独立静态审阅；产物SHA与build-stamp核对。
- **Scenarios covered:** 首次组合、22动作与计费/G3、两种比较基底、重复/旧请求、历史/收手/重开、等待中手动操作、前沿逐段显露、最小缩放/恢复/高DPR。
- **Observed result:** 原秒级界面阻塞已在同路线消失；新虚线/问句不再早于节点；最小缩放有界复验未见持续卡死/空白/上下文丢失；后台任务仍需实际计算时间。
- **Evidence provenance:** 主执行者机器浏览器与实图查看；后台实现者真实Worker等价性检查；独立代理四配置最小缩放浏览器复核；另一代理只读代码审查。均不替代真人体验。
- **Not verified:** 用户原始偶发卡死的唯一触发原因、前台浏览器/GPU竞争和长期驻留；未做全部调查顺序穷举；新节奏待用户反馈。
- **Residual risks:** 仍有50–66ms的新图呈现任务；最小全览文字小；新增检查触发 **review required**，执行者不自行裁决。
- **Exact completion claim supported:** 已完成已定位的阻塞和提前显露修复，并加固、复核最小缩放路径；不宣称排除了全部偶发卡死或视觉闪烁。
