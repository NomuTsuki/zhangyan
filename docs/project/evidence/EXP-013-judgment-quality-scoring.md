# EXP-013：判断质量评分修正验证

状态：已执行，浏览器复核受工具协议限制未完成
执行日期：2026-08-03
规格原始日期：2026-07-31

## 目的

验证判断质量 `D / C / R / J` 分解、证据上限政策和高保真教师演示生成物，并在真实 Chrome 中复核终局路径与还价滚动回归。只记录本次实际执行的结果。

## 自动化门禁

工作目录：`掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype`。

| 命令 | 实际结果 |
|---|---|
| `npm.cmd test` | 退出码 `1`；共 `78` 项，`77` 通过、`1` 失败。唯一失败为 `tests/standalone-html.test.mjs` 的 `standalone teacher demo contains the integrated loop and stays self-contained`，静态断言仍期待 `/function resolveBuyout\(/`。这是开工前已记录、已批准不导入低保真脏改动的基线偏差，不是本轮修复对象。构建阶段生成高保真 HTML 并完成应用构建；`vinext` 同时输出其静态路由分类的 informational note。 |
| `node --experimental-strip-types --test tests/rendered-html.test.mjs tests/judgment-quality.test.mjs tests/rules.test.mjs tests/numeric-lab.test.mjs tests/hifi-html.test.mjs tests/hifi-flow.test.mjs tests/hifi-presentation.test.mjs tests/hifi-accessibility.test.mjs` | 退出码 `0`；共 `77` 项，`77` 通过、`0` 失败。该列表仅排除上述 `standalone-html.test.mjs`，证明未出现第二个失败。 |
| `npx.cmd tsc --noEmit` | 退出码 `0`；无 TypeScript 诊断。 |
| `npm.cmd run lint` | 退出码 `0`；ESLint 无诊断。 |

## 生成物一致性

执行：

```powershell
Get-FileHash -Algorithm SHA256 public/掌眼_高保真教师演示.html
Get-FileHash -Algorithm SHA256 dist/client/掌眼_高保真教师演示.html
```

两者实际 SHA-256 均为：

```text
8B46D415627A2BDAA6D90C68C61189496DEAACCC1D3F1213ADC45A794464925B
```

## 真实浏览器复核

预定的两条路径为：

1. `1440 × 1000`：开始本局 → 检查底款得到“后刻底款” → 不取得第二条证据 → 交易并拒绝 → 玩家复盘 → 展开开发栏。
2. `390 × 844`：同一条路径；并在两种视口执行“现代胶痕 → 公开证据 → 交易 → 报价 50 → NPC 还价 58”的滚动回归，检查“按当前要价买下”和“拒绝交易”的可见、可点与底部 `16px` 余量。

实际使用的系统 Chrome 命令为：

```powershell
npx.cmd --yes --package @playwright/cli playwright-cli -s=judgment-task4-desktop open --browser chrome --headed <canonical-file-url>
npx.cmd --yes --package @playwright/cli playwright-cli -s=judgment-task4-desktop resize 1440 1000
npx.cmd --yes --package @playwright/cli playwright-cli -s=judgment-task4-desktop goto <canonical-file-url>
```

会话启动后页面保持 `about:blank`。对 canonical URL 执行 `goto` 的实际错误为：

```text
Error: Access to "file:" protocol is blocked.
Attempted URL: "file:///D:/.../public/掌眼_高保真教师演示.html"
```

随后尝试以 `python -m http.server 8765 --bind 127.0.0.1` 在 `public/` 下启动本地静态服务器，作为明确不等同于 `file://` 的补充渲染检查；该后台启动命令在执行前被环境策略拒绝，未启动服务器或加载页面。因而也没有以 HTTP 观察来替代 `file://` 验收。

因此本次没有加载页面，也没有可诚实记录的点击、阶段转换、开发栏、控制台、横向溢出、底部余量或移动端可访问树观察。已记录的唯一会话级观察是空白页在 `1440 × 1000` 时 `scrollWidth = clientWidth = bodyScrollWidth = 1440`，它不能证明高保真页面没有溢出。`console warning` 对空白页报告 `0 errors / 0 warnings`，同样不能证明目标页面控制台干净。

## 证据来源与结论

- 本记录的自动化、构建、哈希与协议错误均来自 2026-08-03 在隔离工作树的实际终端执行。
- `tests/judgment-quality.test.mjs` 的通过项覆盖单条证据上限、非决定性强证据封顶、局部/决定性证据、交叉来源、同源去重、隐藏真相隔离及 D/C/R/J 相关回归。
- `tests/hifi-*.test.mjs` 的通过项覆盖自包含生成、`dist/client` 精确复制、玩家/开发信息边界、开发栏初始状态、结算投影和静态可访问性约束。
- 上述结构与自动化证据不替代真实浏览器观察。

## 未验证面与残余风险

- `file://` 协议被 Playwright CLI 阻止，故 1440×1000 与 390×844 的终局路径、现代胶痕公开、`50 → 58` 还价滚动、真实渲染、控制台、横向溢出、点击可达性、移动端开发栏隔离及底部 `16px` 余量均未在本轮验证。
- 本地 HTTP 补充检查亦未运行：环境策略拒绝后台静态服务器启动。
- 完整测试套件仍不是全绿：保留唯一已批准的低保真 `resolveBuyout` 静态断言失败；本记录不能称“全套通过”。
- `docs/03_NUMERIC_MODEL.md` 的既有 `objectiveScore` / 客观胜利阈值及未成交 `actualNet` 示例可能陈旧。这是 Task 2 审查标记的 deferred minor，不在本任务授权修改范围内，留待最终独立审查裁决。
- 真实教师无讲解试玩、HTTPS/微信内置浏览器、Safari、极窄屏、软键盘和真实设备 safe-area 仍未验证。

## 后续建议

在能允许 canonical `file://` 导航的真实 Chrome 自动化或人工受控 Chrome 环境中，逐项重跑以上两条视口路径；将实际截图、点击结果、控制台和滚动余量追加为新证据。不要用当前空白页的会话结果替代该复核。
