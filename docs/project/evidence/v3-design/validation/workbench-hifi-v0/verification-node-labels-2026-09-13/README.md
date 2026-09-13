# 节点名称修正运行证据

当前构建4d6362a8；报告见上一级VERIFICATION-NODE-LABELS-2026-09-13.md。所有文件是命令执行或真实浏览器输出的副本，SHA-256见manifest.json。

- before-results.json：原11ea710e，首次93项断言中34项失败。
- first / second / third-results.json：英文标签仍远离的迭代，失败保留。
- delivery-results.json：新增SVG独立检查忽略遮罩导致的脚本误报；产品未为此改动。
- verified-results.json：DPR1，134/134断言通过。
- before-matched / matched-results.json：DPR2同尺寸画面重放；原版117项中34项失败，修订版134/134通过。旧版无报告短名，所以无法执行新增短名的16项交互检查；没有伪记通过。
- matched上段截图固定相机原点(24,16)，先缩至20%再放大9次，缩放比例完全相同；3840×2160原生截图，非放大旧图。
- 原检查点HTML与4份呈现源码保留在仓库output/playwright/node-label-repair-2026-09-13/before-*。
- 规则7、旧布局8、生命周期5、前沿14；来源浏览器7；58顺序1069状态409条文案，具体范围见各命令输出。

新增测试与具体呈现默认值：review required。执行者自检，不是独立审查或真人体验通过。
