# EXP-023：首个手机“人与物同屏”玩家切片

日期：2026-08-11

## 测试了什么

在不改变现行器物后验、NPC 决策、议价数值、评分、seed、replay 或三案真相的前提下，验证 DEC-014 的第一批玩家界面能否成立：

- 漆器 `390×844` 首屏同时保留器物、NPC 半身占位立绘和锚定人物气泡；
- `细看／询问`是否成为两个行动模式，案卷是否保持只读且独立，形成判断是否仍是单独提交；
- 检查、询问和议价后 NPC 是否持续留在场景中；
- 卖家拒绝、还价、接受和玩家离场是否先显示人物回复，再由玩家主动进入复盘；
- 玩家界面是否停止渲染事实化人物摘要和实时接受概率。

## 方法

### 实现范围

- 在 `player/PlayerApp.tsx` 增加共享 `EncounterScene`、CSS 中性人物占位、人物气泡、行动模式、只读案卷抽屉和终局回复停留；
- 在 `player/styles.css` 建立手机场景、触控尺寸、案卷抽屉与桌面安全回退；
- 增加 `tests/player-v2-ui.test.mjs`，扩展生成 HTML 边界测试；
- 重新生成独立 `public/掌眼_V2_玩家试玩版.html`；
- 没有增加依赖，没有修改 V1／教师入口，没有 stage、commit、push、merge 或部署。

展示层不再导入或显示 `visibleAcceptanceProbability`，但现行局末议价评分接口和相关规则测试按本批授权保持不变；这不是 DEC-014 后续议价规则迁移。

### 自动验证

- `npx.cmd tsc --noEmit --incremental false`：PASS；
- `npm.cmd test`：`176/176 PASS`，命令先重建玩家单文件和应用再全发现运行测试；
- `npm.cmd run lint`：`0 errors / 20 warnings`。warnings 位于既有 `app/page.tsx`、`hifi/HighFidelityApp.tsx` 和 `tests/helpers/authority-scenarios.mjs`，本批玩家文件没有 lint finding；
- 聚焦玩家测试：`34/34 PASS`，其中新增界面合同 `5/5 PASS`。

### 真实浏览器状态链

使用 Chrome、固定局号 `2`、viewport `390×844` 覆盖：默认调查 → 漆面细看 → 询问回复 → 案卷开关 → 提交 55% 判断 → 初始交易 → `55` 点还价 → `60` 点接受；另一路覆盖 `40` 点拒绝和玩家离场。案卷支持 Tab／Shift+Tab 焦点环、Escape 关闭，并在关闭后把焦点归还案卷按钮。

浏览器测量：

- `390×844`：`documentElement.scrollWidth = 390`，器物、NPC、气泡均与 viewport 相交，气泡正文计算字号 `17px`；
- `1440×1000`：`scrollWidth = 1440`，共享场景宽 `720px`；
- console：`0 errors / 0 warnings`。

截图：

| 状态 | 文件 | SHA-256 |
|---|---|---|
| 默认调查 | [lacquer-investigation-default-390x844.png](../../../output/playwright/EXP-023/lacquer-investigation-default-390x844.png) | `C594D84AADEF208E4D2758228930A991B8232E3A73F8AFC1B9F0F99F2E1EF11C` |
| 细看聚焦 | [lacquer-inspection-focus-390x844.png](../../../output/playwright/EXP-023/lacquer-inspection-focus-390x844.png) | `CCAB5FD64FF688CEAE703CA6222B279069E1AE217722E5C0B14839F195F7C961` |
| 询问回复 | [lacquer-inquiry-reply-390x844.png](../../../output/playwright/EXP-023/lacquer-inquiry-reply-390x844.png) | `39E7096D166147B4669BDE142A6A98BDB62E1ADA79665FEDCB56FEE07F7F3A3E` |
| 只读案卷 | [lacquer-dossier-evidence-390x844.png](../../../output/playwright/EXP-023/lacquer-dossier-evidence-390x844.png) | `DABD4B5F05B3EF37EC0B46F2F11B59B3769AABF85CD3432C9EED4DC39F659426` |
| 交易入口 | [lacquer-trade-initial-390x844.png](../../../output/playwright/EXP-023/lacquer-trade-initial-390x844.png) | `407239858DE4EBD11F054F4737F6180E13BF470E22E9B0CC05F58CD8E8DB5DF5` |
| 卖家还价 | [lacquer-trade-counter-390x844.png](../../../output/playwright/EXP-023/lacquer-trade-counter-390x844.png) | `3129767DBB59508092C18EA8D783CE1409DA2A4A7508341E55AE687211282270` |
| 卖家接受 | [lacquer-trade-accepted-390x844.png](../../../output/playwright/EXP-023/lacquer-trade-accepted-390x844.png) | `C2A47CFDD451A37168AB7A7D4C6120E79BBE44C054401C8EF4EE3AD87FCBEEFA` |
| 卖家拒绝 | [lacquer-trade-rejected-390x844.png](../../../output/playwright/EXP-023/lacquer-trade-rejected-390x844.png) | `9E2F7CB408FE46CAC184C959D776BFD893166F458C6A516B7478B08F7E5605C4` |
| 玩家离场 | [lacquer-trade-player-walkaway-390x844.png](../../../output/playwright/EXP-023/lacquer-trade-player-walkaway-390x844.png) | `3F9DEEF371AA2B330BE6EB924AC4193F7DA700F7D5DA754BE5BC4ED579129751` |

最终玩家单文件为 `317,224` bytes，SHA-256 `0A19A22F013AF714CBA407F147CA8243D1C83655D211609C7B80EF515AC8CC31`。

### 保留面复核

实施前后逐项比较三案内容、目录／案例工厂以及 `ability-scoring`、`belief`、`npc-decision`、`negotiation`、`random`、`reducer`、`replay`、`resolve-action`、`ruleset`、`settlement`、`types` 共 16 个文件，SHA-256 全部一致。V1 canonical 教师 HTML 仍为 `8B46D415627A2BDAA6D90C68C61189496DEAACCC1D3F1213ADC45A794464925B`。

### 独立只读 QA

独立审查者在冻结面直接重跑玩家聚焦回归 `34/34 PASS`、TypeScript、聚焦 ESLint、16 文件保留哈希、玩家 `public`／`dist/client` 一致性、九张截图尺寸／哈希、V1 canonical 哈希和项目记忆检查；结论为 `pass-with-known-risk`，`0 Critical / 0 Important / 0 Minor`。审查中先后发现并促成修正了询问模式残留细看状态、案卷焦点环、案卷对话计数和证据记录漂移。

独立审查者没有另行启动浏览器操作状态链；它直接检查了代码、生成物和九张真实 Chrome 截图，并把完整 `176/176` 与 Chrome 两视口状态链明确归为实现负责人证据。该结论只支持把切片提交给用户逐页视觉确认。

## 观察结果

- 第一屏已经从“器物文字卡＋人物事实标签”转为器物、人物和人物语言同屏；人物气泡正文不再是 11px 通用 notice；
- `细看／询问`只切换展示层表单，不调用规则；案卷是组外只读入口，形成判断保持独立；
- 从“细看”切到“询问”后，器物聚焦高亮和“正在细看”标签不再残留；案卷对话计数包含初次陈述与后续回复；
- 检查结果仍进入行动记录，不被伪装成 NPC 台词；询问气泡读取现行 `statement.text`；
- 议价结果使用公开结果生成占位人物台词，不读取隐藏真相、NPC 四状态、隐藏底价或开发 trace；
- 终局不再立即跳过人物回应。玩家点击“查看本局复盘”后才进入结算页；
- 玩家源码不再读取 `seller.summary`、`npcProfile.publicTraits` 或 `visibleAcceptanceProbability`。

## 对决定或假设的影响

- DEC-014 的检查点 2 已实现，并通过实现者验证与独立只读 QA 的 `pass-with-known-risk`；“手机同屏人物场景、正确任务层级和只读案卷可以在不动规则层的情况下先行验证”得到支持；
- 该结果只支持共享展示外壳和漆器视觉竖切，不代表瓷器／书画视觉内容完成；
- 下一步仍必须等待用户逐页确认，不能据自动通过提前进入证据图、8 AP、连续对话、D20、受控误导或察人分。

## 结论的局限

- 人物和器物均是 CSS 中性占位，不是最终美术或人物表演；议价台词也是展示层占位，不是完整 `NpcUtterance / PerformanceCue` 内容系统；
- 浏览器操作状态链由实现负责人产生；独立 QA 只读复核了冻结截图和生成物，没有独立重跑浏览器，也没有真实手机、微信内浏览器或真人试玩；
- 自动测试证明规则回归、构建边界和可复现状态成立，不证明布局、美术、节奏或趣味得到用户认可；
- 本批没有改变现行 6 AP、证据平铺、NPC 后验、局末议价评分或文化内容。

## 下一步

由用户查看本记录中的 `390×844` 关键状态截图并逐页指出布局、信息密度、人物／器物比例和气泡表现问题。只有用户确认本切片后，才进入漆器证据图、8 AP 和检查热点的下一批工程。
