# 高保真异步引擎与镜头取消：独立静态审查

审查日期：2026-09-10。范围仅为当前源码及 Git 差异；未执行引擎、未构建、未打开浏览器。独立于本轮实现者进行代码审阅，不将静态推演写成运行通过。对应文件哈希见 `source-hashes.json`。

## 结论

发现 1 个具体交互隔离缺口，已立即通知根线程和 `fusion_road_geometry`。最新代码回看确认修改已落盘；该项状态为 **静态已修，运行未验证**。在下述审查路径中没有再识别出明确的重复计费或跨局旧结果污染路径。并不据此宣称并发、性能或离线 Worker 已通过运行验收。

## Finding：pending 时取消选择仍会被调查响应覆盖

- 初读位置：`src/App.tsx:53` 的 `clear()` 仅清除选择、悬停和入口；原右侧按钮在第 228 行直接 `onClick={clear}`。
- 触发顺序：发出调查 → Worker 仍在处理 → 点击右侧“取消选择” → 调查响应抵达。
- 原因：`perform()` 保存了 `interactionVersion`，仅在交互版本相同的情况下重新选择结果并发布 investigation。原取消按钮没有调用 `cancelMotion()`，因此交互版本没有变化，响应仍能覆盖用户取消并启动镜头。
- 修订：最新 `src/App.tsx:229` 改为 `onClick={()=>{cancelMotion();clear();}}`。该入口现在会递增交互版本；程序内部的 `clear()` 保留原语义。
- 必需运行覆盖：故意保持调查请求未完成，点击该按钮，再放行响应；调查应该只计一次并纳入记录，选择保持为空，不出现新飞线或后来的相机移动。

## 已追踪的保护链（仅代码证据）

| 风险 | 当前保护 | 代码位置 |
| --- | --- | --- |
| 连续点击调查导致重复请求 | `pending.current` 在 `await` 之前同步置位；按钮同时受 busy/stopping 禁用 | `App.tsx:81–98`, `:206–207` |
| 新 ID 重复做已完成手段 | Worker 调用既有 `takeNewInvestigation()`，按 action 和 comparisonBasis 识别完成项 | `engine-runtime.mjs:38–44`, `action-state.mjs:14–24` |
| 相同请求 ID 重传扣两次 | Worker 缓存该 ID 首个响应；被淘汰的旧 ID 受 newestRequest 拒绝 | `engine.worker.ts:8–20` |
| 调查计算失败后出现半份新局 | take 在 session 副本上执行，derive 和 diff 都完成后才替换权威 session/model 并增加 revision | `engine-runtime.mjs:38–44` |
| 客户端用过期状态执行调查或改预算 | `expectedRevision` 与 Worker 当前 revision 比较，不相等返回 stale，不执行变更 | `engine-runtime.mjs:35–37` |
| pending 时进入历史，旧 take 抢回实时画面 | `viewRequest` 递增；take 仅在 viewVersion 相同时更新 view/model；仍可推进 live session 的 revision | `App.tsx:84–90`, `:107–111` |
| 连续历史请求的旧视图覆盖新视图 | generation 和 viewRequest 版本同时匹配才接收 view | `App.tsx:107–111` |
| pending 时重开，旧 Worker 写回新局 | reset 先 supersede，终止 Worker、拒绝旧 promises，启动新 generation；客户端 handler 和 App 回调各检查 generation | `engine-client.mjs:10–31`, `App.tsx:68–74`, `:89`, `:97–98` |
| pending 时手动缩放、拖图、全览后相机被调查响应抢回 | MapView 的 manualNavigation 通知 App 增加 interaction；响应仍提交数据，但不会发布 investigation | `MapView.tsx:114`, `:189–196`, `App.tsx:52`, `:93–95` |
| 旧镜头定时器在中断后恢复 | stopAnimation 增加 token、取消 RAF、清 timers；later 和 RAF 均检查 token | `MapView.tsx:113–119` |
| 收手时仍有一个已经发出的调查 | stopPending 同步阻止新 take；stop 消息排在此前 take 后由同步 Worker 处理 | `App.tsx:81`, `:101–105`, `engine.worker.ts:6–20` |

收手的实际代码语义是：**保留已经发出的调查结果，再收手**。它取消后续镜头，不取消此前已授权的调查；收手声明与试玩核验应采用这个语义。

## 前沿与最小缩放的静态范围

- 新前沿的 incoming 阶段添加不可见状态；transition 使用 prior/growth 区间分别呈现，疑问文字等到前沿生长结束才出现。`map-motion.mjs:17–37` 以实际锚点的出现时间安排前沿。
- 相机 RAF 改为更新 ref 和 DOM transform，主要结束点再发布比例状态；完整的已接通道路不再无条件套整张地图的 mask。`MapView.tsx:51`, `:104–119`。
- 手动缩放即使达到最小值仍会经过 `manualNavigation → App.cancelMotion`。该路径有父组件状态通知，因此仅凭 `setCamera` 的数值不变检查，不能证明最小值连续输入的主线程工作量已经消失。此项是交给性能实测的观察点，不是已复现卡顿结论。

## 离线与冻结边界

- `App.tsx:6` 使用 `engine.worker.ts?worker&inline`，源码选择的是内联 Worker 入口。未构建或检查本轮新产物，不能据此证明最终单文件真的没有外部 Worker 请求，也未证明 `file://` 创建成功。
- 本次运行 `git diff --name-only`，限定融合目录、旧知识切片目录和 V2 启动包目录，输出为空。没有修改冻结求解器的差异证据。
- 本审阅者仅在本报告目录写入文件，没有修改源码、测试基线或容差。

## 仍需运行证据

1. pending 期间分别取消选择、打开历史、手动缩放和重开，确认结果计一次、视图与相机不被旧响应接管。
2. take 尚未完成时确认收手，确认最终记录包含该调查、其后无法再调查。
3. 最终离线单文件从 `file://` 启动，确认 Worker 无外部依赖请求、不会停在“准备工作台”。
4. 初次调查、早拿后懂和最小缩放连续输入的真实长任务/帧时间，及前沿出现次序；静态代码不能替代这些指标。
