# 高保真卡顿与前沿提前出现：只读 CPU 诊断

日期：2026-09-10。执行者：`fusion_road_geometry`。基于已提交的 `18dc40d`，离线页 SHA-256 为 `98f640e5341d575d003e38b695851bf54f6ffecf275f0e5b308a9a7d0aafae1f`。开始时高保真 `src` 无未提交差异；本轮只写本目录的诊断 helper、JSON、CPU profile 与报告，没有修改产品、冻结核心或既有测试。

**已经确认的主要原因是首次因子组合求解在主线程做全排列校验，造成约一至两秒的同步阻塞。文字避让是另一项真实开销，但不能解释主线程已剖析的第 17 步秒级卡顿。** 最早的暖缓存基准没有覆盖新组合首次计算；据此排除求解器的初步判断不成立，以下冷态复现与主线程浏览器 profile 取代那一归因。

## 主要根因及调用链

`App.perform` 在更新 React 会话状态之前，同步调用 `takeNewInvestigation → local-session.take → solveFixture`。`solveFixture` 调用冻结验证求解器的 `solveOrderIndependentFactors`：

- `solver.mjs:1108–1125`：把独立证据单元按 `affectsAxes` 分组，同轴因素成为一个组的 components。
- `solver.mjs:1155–1186`：当前组合没有缓存时，先生成全部组顺序，然后逐个求解，检验结果是否与基准顺序一致。
- `solver.mjs:1128–1136`：实际构造 `n!` 个排列数组。
- `solver.mjs:1139–1144`：每个排列依次应用所有因子组。
- `solver.mjs:968–1014`：每次应用遍历状态分布、重新加权；末尾对状态 ID 做 `localeCompare` 排序。

当前实测分布有 **324 个状态**。第 17 步首次凑齐 Documentation、Identity、KeyMaterial、RepairHistory、Stability、Surface 共 **6 组**，触发 **720 个顺序 × 每个 6 次因子应用 = 4320 次状态分布处理及排序**。这就是浏览器 profile 中大量 `sort / applyAxisPreservingFactor / factorWeight` 的来源。上限常量 `MAX_FACTOR_GROUPS_FOR_EXHAUSTIVE_ORDER_CHECK = 7` 只是验证器的枚举上限，不是交互耗时保证。

缓存位于 `solver.mjs:36` 的模块级 `FACTOR_SOLUTION_CACHE`。`solver.mjs:1166–1171` 的 key 为稳定序列化的 `{factors: groups, prior: probabilities}`；它取决于轴组及各组 components 和先验概率，而不是动作步数。第 20 步加入同期比对后，组数依然为 6，但身份组 components 改变，所以需要重新做 720 个排列。UV 阴性、重复比对、最后的档案比较在本路线没有改变该组合，命中已有缓存。

应用内重开只创建新会话，并未清除模块级缓存；同页重试可能明显变快，刷新或重新打开页面后缓存才重新开始。这也说明只重复一次先前路径不能代表首次玩家体验。

主线程独立浏览器证据：[baseline/report.json](../baseline/report.json)、[targeted-dev profile](../targeted-dev/)；其 source profile 报告 `solveOrderIndependentFactors` inclusive 约 1316.599ms，调用链确实从 `perform` 进入 `take`，不是观察工具或文字布局引发的假象。

随后主线程完成[完整 22 步浏览器冷态测量](../cold-route-browser/report.json)：第 16 步 226.1ms、第 17 步 1350.8ms、第 20 步 1433.2ms，其他步骤不超过 61ms。与下述 Node 冷态峰值步骤一致，绝对时长仍分环境报告。

## 实际冷态／暖态对照

命令：`node output/playwright/hifi-performance-audit-2026-09-10/static/cold-solver.mjs baseline` 与 `... cold-solver.mjs alternate`。每条路线使用新的 Node 进程，因此没有继承上一条路线的模块缓存。每一步先真实执行一次，再从同一步之前的会话副本执行四次，测同组合缓存命中的成本。没有清理或替换核心缓存，没有改因子算法。

| 标准路线步骤 | 新组合情况 | 排列数量 | 第一次 take | 暖态 take 中位 |
| --- | --- | ---: | ---: | ---: |
| 15：材料层序 | 4 组 | 24 | 54.30ms | 2.69ms |
| 16：承力与陈列 | 5 组 | 120 | 294.49ms | 2.57ms |
| 17：经手记录 | 首次 6 组 | 720 | 1916.54ms | 2.16ms |
| 20：同期真品比对 | 仍 6 组，components 改变 | 720 | 1990.79ms | 2.28ms |
| 22：档案基底区域比较 | 组合已缓存 | 无新枚举 | 2.38ms | 2.72ms |

完整 22 步都已记录，而不只记录第 17 步。标准路线首轮 take 累计 **4343.80ms**。另一条固定优先级、每步只选当前合法动作的路线在第 15／17／19 步分别耗时 **1718.94／1730.73／1885.40ms**，首轮累计 **5757.25ms**。这证明调查顺序会改变昂贵新组合出现在哪一步，也可能增加整局累计等待；没有穷举所有调查顺序，不能声称该路线最差。

数据：[cold-baseline.json](cold-baseline.json)、[cold-alternate.json](cold-alternate.json)。每一步包含实际 action、轴组和 component factor IDs、组合 fingerprint、首次与暖态耗时。fingerprint 由真实输出的 active dependency units 与原始事件重建，用于解释缓存条件，不访问或修改求解器的私有缓存。

## 其他已量化成本：次级问题

暖态命令：`node output/playwright/hifi-performance-audit-2026-09-10/static/diagnose.mjs`。使用真实初始、5、17、22 步会话，每项先暖一次后测 20 次，表中为中位数。第 22 步使用照片基底；冷态标准路线为档案基底，不能混为同一最终图。

| 成本边界 | 初始 | 5 步 | 17 步 | 22 步 |
| --- | ---: | ---: | ---: | ---: |
| 缓存后的 solve | 0.76ms | 0.76ms | 0.69ms | 0.84ms |
| derive（包含 workbench 再次求解） | 0.78ms | 1.63ms | 1.83ms | 1.82ms |
| layoutMap（包含首次估算排字） | 0.004ms | 0.64ms | 3.53ms | 52.85ms |
| 已生成布局再次按估算尺寸排字 | 0.001ms | 0.51ms | 3.13ms | 11.31ms |
| 使用估算 bounds 代理 DOM 尺寸再排字 | 0.001ms | 0.52ms | 4.19ms | 7.78ms |
| 所有 routeHitPath 字符串重新生成 | 0ms | 0.09ms | 1.01ms | 1.14ms |
| structuredClone 整个 layout | 0.005ms | 0.37ms | 1.59ms | 2.32ms |

测量边界与影响：

- **文字避让重复计算。** `layoutMap:268` 自带一遍排字，`MapView:106–110` 在 layout effect 中再次按 DOM 尺寸排字，`MapView:135` 又重建 beforeGraph 的完整布局供动画使用。`placeMapLabels:300–302` 对每个候选遍历道路采样线段，失败后在 `311–340` 进入全图搜索或缩窄文字后的局部搜索。35 轮暖态完整图 layout + 排字 CPU profile 中，约 84% 样本在 `crosses` 和 `free`。这证实特定布局状态仍可能产生数十毫秒开销，但该 profile 是暖态、指定图的排字窗口，不能覆盖或否认求解器的冷态秒级成本。
- **相机动画触发整张 MapView 再渲染。** `MapView:89–95` 每个 RAF 更新 React camera state；`MapView:202` 随每次渲染调用 `routeHitPath`，`27–32` 每次重新计算道路采样长度并组装折线字符串。22 步图为 6479 个道路采样点、约 24.1 万个命中路径字符。这是可缓存的派生数据成本；本轮没有测 React reconciliation、浏览器 SVG 重绘或 GPU，因此只把它列为可能放大动态卡顿的次级因素。
- **重复求解的暖态成本较小。** `App:62–65` 前后求解，`take` 内还有获取 facts、before/after 求解，`derive:27` 与 `workbench` 又求解。缓存命中后，它们累积是几毫秒级；减少重复调用不能单独消除首次全排列的约两秒阻塞。
- **观测工具也有成本。** `hifiMapSnapshot` 克隆完整 layout，单次可约 2.3ms。它不是正常产品操作热路径，但逐帧调用会污染性能采样。主线程已避免用该方法每帧采样。

原始暖态数据与取样：[node-performance.json](node-performance.json)、[layout-labels.cpuprofile](layout-labels.cpuprofile)。其中 DOM 尺寸是当前估算 `labelWidth/labelHeight` 的代理；真实字体、DOM 自动换行与布局阶段由主线程浏览器证据负责。Node 与浏览器的绝对时长不能直接等同。

## 虚线文字在飞线落点前出现

这是与耗时独立的渲染状态问题。`MapView:207–212` 的新节点使用 `incoming` 和 `appearance` 做阶段显隐；但 `MapView:203` 的 live frontiers 与 `215` 的疑问文字直接渲染调查后的全部布局，没有等待本次飞线落点或来源节点显露。主线程 DOM 采样已看到新节点 opacity 为 0、同次产生的疑问文字 opacity 为 1。降低 CPU 耗时不会自动修正这个提前显露。

## 诊断后的优先级与边界

第一优先是处理昂贵的首次组合校验位于 UI 同步路径的问题，同时保留冻结数值与顺序无关性的保障。可讨论把现有求解／验证工作移出主线程，或为运行与离线校验建立清晰边界；本轮没有批准、实施或验证任何一种架构变更，也没有静默移除穷举校验。第二优先才是复用 beforeLayout、缓存固定派生路径与减少重复排字。前沿显露则需要单独接到调查阶段，而不是依赖一次重绘的偶然时机。

若采用 Worker，必须包括所有求解入口：`perform`、`derive`、`workbench` 与历史回放都应在一致的后台计算边界内。只把 `take` 放入 Worker、随后仍在界面线程调用 `derive → solve`，会因为两线程的模块缓存相互隔离，在 UI 线程再次触发首次组合校验。本项是对后续方案的代码约束提醒，不是已完成的设计或修复。

本报告依据：本代理真实冷／暖 Node 函数执行、Node CPU profile、当前源码；主线程浏览器 profile 作为独立浏览器证据。没有浏览器操作，没有声称已修好，也没有把两条有界顺序当作全顺序穷尽验证。新增诊断 helper 属过程证据，标记 **review required**。
