# Frontier continuity verification evidence

完整结论与构建对应见[验证报告](../VERIFICATION-FRONTIER-CONTINUITY-2026-09-13.md)。当前交付 SHA 为 `11ea710e`；每份原始浏览器／矩阵 JSON 保留其实际构建 SHA，不统一改写。

- `model-before.json`：原11项反例全部失败；`model-final.json`：扩为14项后通过。
- `matrix.json`：48条真实会话顺序，32种退场变体；零延迟0、缺少接续对象退场0。方向探针的3个候选保留，由报告解释替代入路与共同汇流的区别。
- `browser-15.json`：12类正常状态＋3类交接中断，全部实际执行并断言通过。
- `browser-history-delivery.json` / `browser-material-delivery.json`：当前交付页的真实来源回看与正常接通。
- `english-*`：409项文案与6组浏览器检查；`source-*`：原来源机制的有界回归。
- `contract.log` / `layout.log` / `reveal.log` / `build.log`：对应命令输出；构建初次失败另存。
- `.mjs.txt`：根目录 `output/` 中实际运行脚本的副本；原相对 import 路径依赖该位置。本目录副本只作留存。
- `manifest.json`：原文件位置、大小及校验值；`video-probe.json`：原速16.60秒、1440×1000 H.264。

新增检查 `review required`。主 Agent 的实现者自测不等于独立验收；未执行本轮真人测试。所有原失败与中间运行在 `output/` 或上一审查证据目录继续保留。
