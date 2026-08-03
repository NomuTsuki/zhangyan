# EXP-013：判断质量评分修正验证

状态：已执行，含真实 Chrome 浏览器复核
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

Playwright CLI 直接导航 canonical `file://` 页面的尝试为：

```powershell
npx.cmd --yes --package @playwright/cli playwright-cli -s=judgment-task4-desktop open --browser chrome --headed <canonical-file-url>
npx.cmd --yes --package @playwright/cli playwright-cli -s=judgment-task4-desktop resize 1440 1000
npx.cmd --yes --package @playwright/cli playwright-cli -s=judgment-task4-desktop goto <canonical-file-url>
```

该 CLI 会话停留于 `about:blank`。对 canonical URL 执行 `goto` 的实际错误为：

```text
Error: Access to "file:" protocol is blocked.
Attempted URL: "file:///D:/.../public/掌眼_高保真教师演示.html"
```

该直接 CLI 限制没有被当成浏览器结论：随后以本机 Chrome headless 直接启动同一 canonical `file://` 文件，并通过 CDP 附着执行真实页面交互与测量。以下观察来自已加载的 canonical 页面，而不是空白页或 HTTP 替代品。

### 单条强证据终局

`1440 × 1000` 路径为“底部 → 后刻底款 → 收集 → 进入交易 → 拒绝 → 复盘 → 展开开发栏”。玩家复盘显示判断质量 `A`、综合等级 `B`，且仅显示判断原因“方向合理，但目前只由单点证据支撑，仍缺独立佐证”；玩家 `main` 未出现 `D`、`C`、`R`、`J` 精确标签。展开的开发栏显示 `D=100`、`C=32`、`R=50`、`J=73`，`base A`、`cap S`、`final A`。页面无横向溢出，控制台为 `0 errors / 0 warnings`。截图：[桌面单证据复盘截图](../../../.superpowers/sdd/2026-07-31-judgment-quality-scoring/desktop-single-evidence-review.png)。

`390 × 844` 走同一路径，玩家复盘同为判断质量 `A`、综合等级 `B`，并显示同一条单点证据原因；`Developer Rail` 与其展开按钮均不存在于页面，页面无横向溢出，控制台为 `0 errors / 0 warnings`。截图：[移动端单证据复盘截图](../../../.superpowers/sdd/2026-07-31-judgment-quality-scoring/mobile-single-evidence-review.png)。

### 还价与滚动回归

两种视口均执行“接口现代胶痕 → 收进证据簿 → 询问并公开证据 → 要价 `80 → 65` → 进入交易 → 报价 `50` → NPC 还价 `58`”。

- `1440 × 1000`： “按当前要价买下”与“拒绝交易”均可见、启用且 trial-clickable；按钮底部余量为 `45.109px`，无横向溢出，控制台为 `0 errors / 0 warnings`。截图：[桌面还价 58 操作截图](../../../.superpowers/sdd/2026-07-31-judgment-quality-scoring/desktop-counter-58-actions.png)。
- `390 × 844`：两按钮同样可见、启用且 trial-clickable；按钮底部余量为 `16.109px`，`MAIN scrollTop=126 / clientHeight=716 / scrollHeight=843`，无横向溢出，控制台为 `0 errors / 0 warnings`。截图：[移动端还价 58 操作截图](../../../.superpowers/sdd/2026-07-31-judgment-quality-scoring/mobile-counter-58-actions.png)。

## 证据来源与结论

- 本记录的自动化、构建、哈希、CLI 协议错误与 CDP 浏览器观察均来自 2026-08-03 在隔离工作树的实际执行。
- `tests/judgment-quality.test.mjs` 的通过项覆盖单条证据上限、非决定性强证据封顶、局部/决定性证据、交叉来源、同源去重、隐藏真相隔离及 D/C/R/J 相关回归。
- `tests/hifi-*.test.mjs` 的通过项覆盖自包含生成、`dist/client` 精确复制、玩家/开发信息边界、开发栏初始状态、结算投影和静态可访问性约束。
- 截图、CDP 可见性/启用/试点检查、滚动测量、溢出测量与控制台读取构成本轮真实浏览器证据；它们不替代真实教师试玩或目标平台验证。

## 未验证面与残余风险

- Playwright CLI 直接 `goto file://` 仍受协议限制；本轮已用 Chrome headless + CDP 取得 canonical 文件的真实浏览器证据，但后续自动化应保留该附着方式或修复 CLI 协议配置。
- 完整测试套件仍不是全绿：保留唯一已批准的低保真 `resolveBuyout` 静态断言失败；本记录不能称“全套通过”。
- 数值模型文档已在本次收口中对齐现行结算：未成交净收益为 `0`、检测费调试单列，oracle 使用动态最低可达买断线，机会损失仅作调试参考，综合成果采用 `D—SSS` 多维等级；该文档残余风险已消除。
- 真实教师无讲解试玩、HTTPS/微信内置浏览器、Safari、极窄屏、软键盘和真实设备 safe-area 仍未验证。

## 后续建议

将 Chrome headless + CDP 附着流程固定为可复现浏览器门禁，并在真实教师试玩、HTTPS/微信内置浏览器、Safari、极窄屏、软键盘和真实设备 safe-area 上补充专项目证。
