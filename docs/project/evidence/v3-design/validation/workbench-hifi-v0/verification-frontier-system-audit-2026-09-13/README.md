# Frontier continuity audit — failure evidence

These assets document reproducible defects in the current workbench. They are not acceptance captures or a repaired build.

受检页面 SHA-256：`370fc2c10025e8a5db358b2bcf1deaebd1a926c608220fe62c645b7545ebc842`。完整范围、逐类结论与验证边界见[整图审查](../../../2026-09-13-frontier-system-audit.md)。`manifest.json` 保存每份文件的原位置、大小与 SHA。

## 数据与复现

- [模型重放数据](sweep.json)：48 条顺序、1,056 次转换、980 次去重转换；16 个普通前沿 ID。35 种退场变体中 22 种零延迟，7 个几何方向候选；候选仍需语义判读，不能直接当作 7 条错误证明关系。
- [实际浏览器记录](browser-report.json)：9 组正常动效操作均执行完成并复现目标旧前沿过早退出。`oldOpacityAt350ms: null` 表示旧 DOM 已移除；`"0"` 表示仍在 DOM 中但透明度已为零。
- 两份 `.mjs.txt` 是诊断脚本的留存副本。原脚本位于仓库 `output/`；相对 import 依赖这个位置。浏览器脚本使用本机已安装的 Playwright 和 Edge，跨机器需先核对运行时路径。

在仓库根目录重放的命令：

```text
node --experimental-strip-types output/audit-map-frontiers-2026-09-13.mjs
node output/audit-frontier-browser-2026-09-13.mjs
```

脚本会写 `output/` 下的运行输出。若要保留本次原始运行，后续运行应先选择新输出目录。本目录证据已独立留存，不应覆盖。仅在归档副本保存前给脚本补了 `review required` 注释，未改变运行逻辑。

## 画面

所有浏览器画面：1440×1000 CSS viewport，DPR 2，原始 PNG 为 2880×2000。初始与最终状态都使用全览命令；节点的世界坐标固定，屏幕取景会随内容改变，因此不要用两图像素位置判断节点是否移动。

| 文件 | English caption / 中文说明 |
|---|---|
| [材料第一步](layers-before-material-before.png) | **A question extends away from its later answer location.** 先取得层序；旧线向左下伸出。 |
| [材料第二步](layers-before-material-after.png) | **The new reading arrives, but the earlier trail disappears.** 基底后来取得；两份材料保留，未留下接续关系。 |
| [档案反向过程](record-before-verification-connect.png) | **The source link grows while the original question has already faded.** 原记录先到、归属核验后到，缺少整器观察。 |
| [紫外与区域范围](uv-to-regional-synthesis-after.png) | **Regional synthesis does not explain the disappearance of the UV question.** 原阴性材料保留，其问题却没有接续说明。 |
| [外观与试窗](appearance-to-window-after.png) | **A new surface question appears without a visible handover from the old one.** 新问题在新节点生长，旧方向断开。 |
| [成像与比较过程](xray-to-comparison-connect.png) | **Evidence paths are still growing after the earlier question has vanished.** 问题退场早于支持关系接通。 |
| [用户原始反馈](user-material-order-feedback.png) | **Player-reported action order.** 原截图仅显示材料弹窗及第1／第2次调查记录；地图故障由上列独立浏览器运行复现。 |

全部 27 张运行原图另保留在仓库 `output/playwright/frontier-system-audit-2026-09-13/browser/`。新增诊断检查 `review required`；真人对修复效果的评价尚不存在，因为本轮未修改页面。
