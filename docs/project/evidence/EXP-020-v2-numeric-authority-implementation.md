# EXP-020：V2 统一数值权威源实现与最终验证

日期：2026-08-10
Workstream：`V2-NUMERIC-AUTHORITY-EXEC-001`
范围：批准的 15 任务迁移在 `codex/v2-bootstrap` 的 authority audit、验证、既有浏览器回归证据、最终复核 finding 修复与 handoff。

## 授权、变更与保留

- 已授权：按逐任务白名单实现内部确定性规则核、版本化回放、玩家/开发投影、V2 单文件 provenance，并创建本地 commits。
- 已实现：生产数值和结算经 `game/ruleset/` 的单一确定性入口计算；UI 通过安全玩家投影消费状态；开发复盘保留精确 trace；V2 生成物携带 ruleset、case、source commit/tree status provenance。
- 已保留：V1 canonical `public/掌眼_高保真教师演示.html`、V1 tag/worktree、旧低保真历史资产、十场景 baseline fixture、原工作区与既有未提交治理/作品集资产。没有 push、merge、deploy，也没有新增生产依赖。

## 运行链与 supersession

Task 1—14 的逐任务证据、失败/重试语义与提交链保留在 `.superpowers/sdd/2026-08-10-v2-numeric-authority/progress.md`。本次 Task 15 没有覆盖旧 PASS/FAIL；浏览器对 `file://` 的首次导航被浏览器 URL policy 阻止，随后以仅本机临时 HTTP 服务读取同一 V2 单文件完成回归，服务已停止。该策略失败不是产品失败，也未替换或删除先前记录。

控制器最终复核提出四项 Important finding，本修复波全部接受并以 RED→GREEN 收敛：持久化状态四字段身份在 public resolve facade 与 reducer 双边界 fail closed；高保真交易输入从 `PlayerView.reference.offer` 初始化并在行动/重开后同步；`EvidenceMiniCard` 改为只接收 `PlayerEvidenceView`；canonical `npm test` 改为构建后由 Node 跨平台发现全部 `.test.mjs`。修复提交为 `7949cf19bb32fe59e46b997bd54bd9a5b2deea3b`。这不是独立最终复核通过；精确修复 diff 仍等待控制器 re-review。

RED 证据保留为本轮命令输出：身份契约在 facade/reducer 两组四字段 mismatch 上共出现 10 个失败节点；投影测试因 `EvidenceMiniCard` 仍接收 `WorldState` 而失败；交易测试先证明状态参考报价由 `10 → 55`，再因缺少权威输入同步入口而失败；package 契约因显式列举 12 个测试文件而失败。GREEN 后，身份+replay `18/18`、投影 `7/7`、交易/呈现 `11/11`、package 契约 `3/3` 均通过，输入不变性与原 replay 行为得到回归覆盖。

## Authority audit 与验证

在 `prototype` 目录执行：

| 检查 | 结果 |
|---|---|
| `rg` 扫描 `seededUnit`、`gradeOrder`、`reservationPrice`、`Math.random(`、`Date.now(` | 仅允许的 `game/random.ts:seededUnit` 命中；未发现活动生产重复权威 |
| `rg` 扫描 boardgame.io、yuka、inkjs、open_spiel | 无候选依赖命中（`rg` exit 1 表示无匹配） |
| `npm.cmd test` | exit 0；先构建，再由 Node 自动发现全部测试；`142/142 PASS`，0 fail；含 V1 immutable、baseline、V2 provenance、身份与投影门 |
| `node --experimental-strip-types --test` | exit 0；独立执行同一全发现入口，`142/142 PASS`，0 fail |
| `npx.cmd tsc --noEmit` | exit 0 |
| `npm.cmd run lint` | exit 0；0 errors、17 warnings；warnings 位于本修复波改动的 `app/page.tsx` 与 `hifi/HighFidelityApp.tsx`，因此不标作“全部来自未改写表面”；本轮未把非阻塞 unused-import 清理扩成额外重构 |
| 指定 authority/replay/projection/boundary 测试 | exit 0；`14/14 PASS`，0 fail |
| V1 SHA-256 | `8B46D415627A2BDAA6D90C68C61189496DEAACCC1D3F1213ADC45A794464925B` |
| baseline fixture SHA-256 | `909075060FC994501D1D4B6505D203AB70A9B88F639488C803510523CAF0A522` |

修复实现提交后，在产品目录干净状态重新生成 V2 单文件，provenance 为 `sourceCommit=7949cf19bb32fe59e46b997bd54bd9a5b2deea3b / sourceTreeStatus=clean`。这是受控的生成物更新，位于本任务白名单内；不是第二数值实现或 V1 改动。

## 已有真实浏览器回归（implementation-owner evidence）

目标：本机 V2 单文件，桌面 `1440×1000` 与移动 `390×844`。下列 action chain 与截图来自 Task 15 implementation owner；本修复波没有独立重跑浏览器，因此它们是既有实现证据，不是本轮独立 re-review 证据。

已走通：检查接口 → 收录 `现代胶痕` → 公开该具体证据 → 卖家正式重估 `80→65` → 进入交易 → 正式报价 `50` → NPC 还价 `58` → 按 `58` 买下。

- 结算同时显示真实价值 `65`、成交价 `58`、净结果 `+7`，以及独立的物品品质、议价表现、判断质量和收益结果；未把客观收益伪装为判断质量。
- 桌面开发栏可展开并显示精确运行状态、判断拆解与最近规则结算；移动端开发栏不可见。
- 两视口 `document/body scrollWidth = clientWidth`（1440 与 390），无横向溢出；控制台 `0 errors / 0 warnings`。
- 截图：`browser-evidence/desktop-settlement-1440x1000.png`、`browser-evidence/mobile-settlement-390x844.png`。

## 实现、已验证与仍未验证

- 已实现且已由本修复波自动验证：单一规则权威入口、四字段状态身份双边界 fail closed、确定性/版本化 replay、玩家投影边界、交易建议/输入/行动同步、全测试发现、V2 provenance、V1 immutable 与批准基线语义。桌面/移动核心演示路径只有上述 implementation-owner 浏览器证据，本修复波未独立重跑。
- 未验证：数值平衡、一般玩家理解、真实微信/HTTPS/Safari 环境、第二案件与正式美术；这些不是本次回归可推出的结论。
- 独立复核 provenance：Task 1—14 已有其各自记录；控制器的首轮最终复核产生四项 Important finding，本修复波由 implementation owner 执行并自验。修复后的精确 diff 尚未由独立 reviewer re-review，故 workstream 状态仍为 `Controller Review Pending`，不得据此宣称独立最终 QA PASS。

## 残余与重开触发

- Minor：`docs/project/AGENT-ROSTER.md` 仍缺失；当前环境也未暴露 `project-agent-governance`，未擅自创建持久 Agent。
- Minor：`reducer.ts` 仍导出低层、未 versioned 的 `replayActions`；当前没有直接生产 UI 消费者，但测试/兼容消费者仍存在。公共回放门已使用版本化 facade；若新增生产消费者，先收敛该低层出口。
- Deferred Critical：在结算模型稳定且用户定义收益、评分版本、样本/种子、阈值与允许反例后，验证客观收益和结算评分关系；当前不得预设相关性或权重。
- 立即重开：任一 authority/browser/type/lint/full-suite 门失败，V1 或 fixture/provenance 哈希漂移，或控制器独立复核发现 load-bearing second authority、真相泄漏或不受支持的完成声明。
