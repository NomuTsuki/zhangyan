# 18dc40d 最小缩放只读基线复核

结论：在本轮受控浏览器中，未复现最小缩放导致的永久卡死、自发悬停闪烁、NaN 相机、整页空白或图形上下文丢失。这不是对用户首次试玩报告的否定。一次 14 秒动画等待超时原样保留，缺少当时的最终 phase，不能据此判断永久卡死；另一次有界复核中相同第 19 步正常完成。

唯一输入是从 `git show 18dc40d:docs/project/evidence/v3-design/validation/workbench-hifi-v0/prototype.html` 原字节提取的副本：5,085,383 bytes，SHA-256 `98f640e5341d575d003e38b695851bf54f6ffecf275f0e5b308a9a7d0aafae1f`。未运行正在修改的产品源码。

## 已执行

- 1440×1000、DPR1：0、5、17 份实际取得信息状态；每状态包含重复减号缩至 20%、Ctrl 滚轮、全览恢复、再次缩至 20%、地图拖动。5/17 信息状态还包含固定标签悬停。
- 1920×1000、DPR2：通过真实 UI 取得 22 份信息；为缩短准备，仅前 17 步使用 UI 的“减少动态效果”，第 18 步前恢复正常动效。最终覆盖 20% 静止、固定标签悬停、固定道路命中区悬停、12 组 Ctrl 滚轮往返、4 次全览/最小缩放循环与后段恢复。
- 动画中缩放取消：DPR1 的第 1/6/18 步，DPR2 的第 18/22 步均可返回 idle，相机保持有限值，后续调查可进行。

## 结果与环境

Edge **152.0.4191.66**，headless。CDP SystemInfo 与实际 WebGL 参数均表明使用 **ANGLE / NVIDIA GeForce RTX 4080 Laptop GPU / Direct3D11**，不是 SwiftShader；NVIDIA 驱动 `32.0.15.9649`。CDP 同时列出 Intel UHD 和 Microsoft Basic Render Driver，但当前 WebGL 的 unmasked renderer 指向 NVIDIA。`gpu_compositing`、`rasterization`、`webgl` 为 enabled。

- 22 信息、DPR2 的 8 个测量窗口：未记录到 Long Task 条目，RAF 时间戳最大间隔为 16.6ms；静止 20% 与固定标签/道路悬停各 3.5 秒期间，地图 DOM 变更、class 变更、pointerover/out 反复触发均为 **0**。
- 22 信息最终停在 `s=0.2`，22 个显示节点仍在 DOM，截图可见完整小比例地图；没有 NaN/Infinity。
- 22 信息静止图实际仍有 **34 个 SVG mask**，地图坐标范围为 **1104×2765**。
- 页面异常、renderer crash、`webglcontextlost`、`webglcontextrestored`：补测均为 **0**。只出现 Three.js shader 浮点精度警告。
- DPR1 第一动作的缩放取消窗口出现一次 **104.1ms RAF 间隔**，17 信息静止窗口出现一次 **62.4ms 间隔**，均未对应 Long Task 条目或持续失去响应。RAF 间隔是调度样本，不是“用户 FPS”或已定位的主线程卡顿。

首次脚本在第 19 步 `A.OBSERVE.REGION_DECOR` 后等待 idle 超过其 14 秒硬超时。该失败没有保留最后 phase，记录在 `audit-failure.json`，不删不改。DPR2 补测保留 phase/transition：第 19 步进入 fly，`transition.duration=3410ms`，再经过 focus，约 **6.687 秒**后为 idle；第 22 步比较的计划时长为 **7300ms**，在 fly 中缩放可中断。补测使用至少 35 秒等待；它说明操作可完成，不能解释首次单次超时的原因。

## 供修复参考的静态位置（18dc40d 行号）

- `MapView.tsx:23,47–52`：每条静态/动画道路 mask 都使用整张地图范围。完整道路免 mask、动画 mask 缩到实际道路边界，是明确可减少绘制负担的方向；本复核没有证明它就是用户永久卡死的根因。
- `MapView.tsx:89,94`：每个相机 RAF 经 `setCameraState` 重渲 MapView；`:202` 又在渲染中计算命中路径。把相机 transform 更新与静态图分离、缓存命中几何，可减少连续缩放/平移时的重复工作。
- `MapView.tsx:166–172`：缩放已夹在 0.2–1.8，常规输入没有产生数值溢出；到达边界后仍创建新的 camera 对象。可跳过无变化更新，但不应据此宣称已定位死循环。
- `MapView.tsx:202,207,211,215`：标签与道路 hover 会更新共同选择。固定光标的自发循环未复现；缩放移动内容经过光标时产生真实 enter/leave 仍可能让反馈看起来闪动，应与 GPU 绘制闪烁分开判定。

## 证据与边界

运行命令：

```text
node output/playwright/hifi-performance-fix-2026-09-10/minzoom-baseline/audit.cjs
node output/playwright/hifi-performance-fix-2026-09-10/minzoom-baseline/audit-highdpi.cjs
```

`audit-progress.json` / `audit-failure.json` 保留第一次运行，`audit-highdpi.json` 保留完整高 DPI 补测、GPU featureStatus 与所有测量值。`state-0-min20.png`、`state-5-min20.png`、`state-17-min20.png`、`highdpi-22-min20.png` 为捕图。捕图与性能计量窗口分开；只在检查点调用完整 game snapshot，没有逐帧克隆游戏图。

本机是独显硬件加速的 headless Edge；没有覆盖用户当时的前台浏览器窗口、其他进程/GPU占用、首次 shader/字体缓存组合或更长驻留。长期资源泄漏、偶发 driver stall 与首次 14 秒等待异常仍不能由本轮排除。这里只作只读基线，未改产品、原测试、构建或 Git；新增诊断脚本标记 **review required**。
