# EXP-021：V2 玩家试玩版、三案例与双轨评分验证

日期：2026-08-10

Workstream：`V2-PLAYER-TRIAL-001`
责任载体：Project Co-Leader（实现与验证；非独立 QA）

## 授权、变更与保留

- 已授权并实现：独立玩家单文件、漆器/瓷器/书画三案例、稳定局号、提交鉴定、玩家估值、公开接受概率、能力评级与客观结果双轨结算。
- 已保留：V1 canonical、V1 tag/worktree、历史 fixture、教师入口、作品集 capsule、原工作区和本工作树既有未提交记录；没有 stage、commit、push、merge、deploy 或新增生产依赖。
- 仓库规则增加 Superpowers opt-in：默认不调用 `superpowers:*`，只有用户明确点名或更高优先级平台指令要求时使用；插件未卸载。

## 自动验证

在 `prototype` 目录执行 `npm.cmd test`：exit 0，构建独立玩家版与应用入口后自动发现测试，`170/170 PASS`、0 fail。既有教师生成物未被默认构建覆盖；如需明确重建所有表面，保留独立的 `npm.cmd run build:all` 命令。

新增覆盖包括：

- 10,000 个局号：三个案例及各案例三种真相的条件分布均位于 33.3% ±2 个百分点；
- 27 组固定回放：三案例 × 三真相 × 买下/拒绝/议价路径，相同局号与行动深度相等；
- 14 个独立手算评分场景：Brier 校准、证据结构、过度自信、主观后悔、最小归一尺度、公开报价锚点、公开还价锚点、未议价和检测费用；
- 后验和误差 `≤1e-9`、`Q10 ≤ 期望 ≤ Q90`、分数 0—100；决策与议价分对额外注入的隐藏真相/隐藏底价保持不变；
- 玩家 HTML 为自包含单文件，无外部脚本或样式依赖；禁用教师/开发表面、四流程条、指定插画说明、Q20 与自动谨慎报价；报价输入初始为空；
- 旧 pre-refactor authority fixture 未重录。兼容投影排除新增 V2 字段后继续通过，新增字段由本轮测试单独保护。

`node --experimental-strip-types --test tests/player-v2-scoring-scenarios.test.mjs tests/player-v2-core.test.mjs tests/player-v2-html.test.mjs` 为 `28/28 PASS`；`npx.cmd tsc --noEmit` 在构建前已为 exit 0。

## 真实浏览器验证

使用本机临时 HTTP 服务读取刚生成的 `掌眼_V2_玩家试玩版.html`，服务随后停止。

- `375×812`：起始页视觉检查通过；`documentElement.scrollWidth = clientWidth = 375`；控制台 0 errors / 0 warnings；
- `1440×1000`：起始页视觉检查通过；`documentElement.scrollWidth = clientWidth = 1440`；控制台 0 errors / 0 warnings；
- 在 favicon 修复前已于 `375×812` 完整走通种子 42 的瓷器路径：双证据 → 75% 鉴定 → 交易 → 拒绝 → 能力/客观结果复盘；修复仅加入内联 favicon，随后重新构建并在两视口确认控制台归零。

浏览器证据属于本轮 implementation-owner verification，不是独立 QA，也不等于一般玩家审美或可用性验收。

## 已实现、已验证与仍未验证

- 已实现且规则一致性已验证：稳定局号、三案例、提交鉴定、估值区间、公开议价效用、双轨评分、历史基线兼容、玩家表面边界和目标视口无横向溢出。
- 未验证：文化准确性、长期数值平衡、等级与客观收益的合理关系、一般玩家理解/趣味、正式美术、微信/Safari/HTTPS。
- 后续 Critical：按 `03-NEXT-ACTIONS.md` 设计“实际客观收益与能力评分关系”验证；不得让客观结果直接回写能力分，也不得用本轮回归测试代替平衡证据。
