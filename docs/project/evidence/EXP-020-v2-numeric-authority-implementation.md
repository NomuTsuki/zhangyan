# EXP-020：V2 统一数值权威源实现与最终验证

日期：2026-08-10
Workstream：`V2-NUMERIC-AUTHORITY-EXEC-001`
范围：批准的 15 任务迁移在 `codex/v2-bootstrap` 的最终 authority audit、验证、浏览器回归与 handoff。

## 授权、变更与保留

- 已授权：按逐任务白名单实现内部确定性规则核、版本化回放、玩家/开发投影、V2 单文件 provenance，并创建本地 commits。
- 已实现：生产数值和结算经 `game/ruleset/` 的单一确定性入口计算；UI 通过安全玩家投影消费状态；开发复盘保留精确 trace；V2 生成物携带 ruleset、case、source commit/tree status provenance。
- 已保留：V1 canonical `public/掌眼_高保真教师演示.html`、V1 tag/worktree、旧低保真历史资产、十场景 baseline fixture、原工作区与既有未提交治理/作品集资产。没有 push、merge、deploy，也没有新增生产依赖。

## 运行链与 supersession

Task 1—14 的逐任务证据、失败/重试语义与提交链保留在 `.superpowers/sdd/2026-08-10-v2-numeric-authority/progress.md`。本次 Task 15 没有覆盖旧 PASS/FAIL；浏览器对 `file://` 的首次导航被浏览器 URL policy 阻止，随后以仅本机临时 HTTP 服务读取同一 V2 单文件完成回归，服务已停止。该策略失败不是产品失败，也未替换或删除先前记录。

## Authority audit 与验证

在 `prototype` 目录执行：

| 检查 | 结果 |
|---|---|
| `rg` 扫描 `seededUnit`、`gradeOrder`、`reservationPrice`、`Math.random(`、`Date.now(` | 仅允许的 `game/random.ts:seededUnit` 命中；未发现活动生产重复权威 |
| `rg` 扫描 boardgame.io、yuka、inkjs、open_spiel | 无候选依赖命中（`rg` exit 1 表示无匹配） |
| `npm.cmd test` | exit 0；Node TAP `88/88 PASS`，0 fail；含 V1 immutable、baseline、V2 provenance 与投影门 |
| `npx.cmd tsc --noEmit` | exit 0 |
| `npm.cmd run lint` | exit 0；0 errors、17 warnings（既有未使用符号，不在本任务改写） |
| 指定 authority/replay/projection/boundary 测试 | exit 0；`14/14 PASS`，0 fail |
| V1 SHA-256 | `8B46D415627A2BDAA6D90C68C61189496DEAACCC1D3F1213ADC45A794464925B` |
| baseline fixture SHA-256 | `909075060FC994501D1D4B6505D203AB70A9B88F639488C803510523CAF0A522` |

构建在完成测试后将 V2 单文件 provenance 从 `sourceCommit=a7f1b38… / sourceTreeStatus=dirty` 更新为 `sourceCommit=d3664764ce1083ef5178e5f50c946422bf5f43a0 / sourceTreeStatus=clean`。这是受控的生成物更新，位于本任务白名单内；不是第二数值实现或 V1 改动。

## 真实浏览器回归

目标：本机 V2 单文件，桌面 `1440×1000` 与移动 `390×844`。

已走通：检查接口 → 收录 `现代胶痕` → 公开该具体证据 → 卖家正式重估 `80→65` → 进入交易 → 正式报价 `50` → NPC 还价 `58` → 按 `58` 买下。

- 结算同时显示真实价值 `65`、成交价 `58`、净结果 `+7`，以及独立的物品品质、议价表现、判断质量和收益结果；未把客观收益伪装为判断质量。
- 桌面开发栏可展开并显示精确运行状态、判断拆解与最近规则结算；移动端开发栏不可见。
- 两视口 `document/body scrollWidth = clientWidth`（1440 与 390），无横向溢出；控制台 `0 errors / 0 warnings`。
- 截图：`browser-evidence/desktop-settlement-1440x1000.png`、`browser-evidence/mobile-settlement-390x844.png`。

## 实现、已验证与仍未验证

- 已实现且已验证：单一规则权威入口、确定性/版本化 replay、投影边界、V2 provenance、V1 immutable、批准基线语义、桌面/移动核心演示路径。
- 未验证：数值平衡、一般玩家理解、真实微信/HTTPS/Safari 环境、第二案件与正式美术；这些不是本次回归可推出的结论。
- 独立复核 provenance：Task 1—14 已有其各自记录；本 Task 15 agent 未执行新的独立 read-only review。控制器仍需安排该最终门，故 workstream 状态为 `Controller Review Pending`，不得据此宣称独立最终 QA PASS。

## 残余与重开触发

- Minor：`docs/project/AGENT-ROSTER.md` 仍缺失；当前环境也未暴露 `project-agent-governance`，未擅自创建持久 Agent。
- Minor：`reducer.ts` 仍导出低层、未 versioned 的 `replayActions`，仓库内无消费者；公共回放门已使用版本化 facade。若新增消费者，先收敛该低层出口。
- Deferred Critical：在结算模型稳定且用户定义收益、评分版本、样本/种子、阈值与允许反例后，验证客观收益和结算评分关系；当前不得预设相关性或权重。
- 立即重开：任一 authority/browser/type/lint/full-suite 门失败，V1 或 fixture/provenance 哈希漂移，或控制器独立复核发现 load-bearing second authority、真相泄漏或不受支持的完成声明。
