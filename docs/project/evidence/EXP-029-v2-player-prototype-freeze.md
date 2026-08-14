# EXP-029：V2 玩家试玩原型冻结

日期：2026-08-14

状态：Pre-tag verification completed；提交与 annotated tag 身份在本记录所在提交产生后立即复核

## 目的

把 V2 的真实终点固定为一个可重现的 Git 节点，并证明本次收口只改变治理、设计、证据与轻量作品集记录，没有修改产品代码、V1 冻结资产或 V2 玩家 HTML。

## 冻结身份

- 分支：`codex/v2-bootstrap`；
- 冻结标签：`v2.0.0-player-prototype-freeze`（annotated，本批验证后创建）；
- 冻结提交：由上述标签目标唯一解析；
- V1 起点：`v1.0.0-teacher-handoff^{}` = `f0b20b8ef5f5246529027f90a3fb277659c329cf`；
- 本批开始前 HEAD：`bfca0667500dce446932fcb4d40d079b1f350c0c`，提交信息“研究数值系统前的快照”。

## 进入验证前的现场

- 初始现场有 24 份实际文件待收口：16 份已跟踪修改、8 份未跟踪文件；新增本决定／证据并补充 DEC-013 终态消歧后，最终提交前范围变为 27 份（17 份已跟踪修改、10 份未跟踪文件）；
- staged `0`，冲突 `0`；
- 产品路径未提交差异 `0`；
- 当前变化来自三个已完成但尚未提交的工作流：人类可读沟通、双向认知澄清、决策前调查门。

## 验证契约

### 目的与场景

1. 完整规则回归仍通过；
2. TypeScript 编译与 lint 没有新错误，lint warning 不高于已知基线 `20`；
3. 项目记忆、相对链接、围栏和 Mermaid 静态结构成立；
4. V1 canonical 与 V2 玩家入口字节保持不变；
5. 最终暂存范围只含治理／文档／证据，提交后工作树干净；
6. annotated tag 精确指向冻结提交。

### 通过含义

通过只证明：V2 冻结点可复现，自动规则未发现回归，产品字节未被本批改写，文档边界与 Git 身份成立。

### 盲区

不证明数值平衡、文化准确性、真人趣味、视觉质量、移动端人工体验、微信内实机、长期经济或公开部署安全性。既有截图与浏览器证据不会因为本批文档提交自动变成新鲜视觉验收。

## 新鲜结果

### 产品与自动规则

- 为避免 `generate-player.mjs` 仅因提交 provenance 重写 tracked 玩家 HTML，完整产品回归在 detached 临时工作树 `v2-freeze-verify`、精确 HEAD `bfca0667500dce446932fcb4d40d079b1f350c0c` 运行；原 V2 冻结工作树未执行会写生成物的构建；
- `npm.cmd ci` 成功，随后 `npm.cmd test` 完整构建并自动发现 `176/176 PASS`；
- `npx.cmd tsc --noEmit` 通过；
- `npm.cmd run lint` 为 `0 errors / 20 warnings`，没有超过已知基线；warnings 位于既有 `app/page.tsx`、`hifi/HighFidelityApp.tsx` 与测试 helper；
- 作品集登记验证器单元测试 `59/59 PASS`；
- 原工作树产品 diff 为 `0`。V1 canonical 与 HEAD Git blob 一致，SHA-256 为 `8B46D415627A2BDAA6D90C68C61189496DEAACCC1D3F1213ADC45A794464925B`；V2 玩家 HTML 与 HEAD Git blob 一致，SHA-256 为 `0A19A22F013AF714CBA407F147CA8243D1C83655D211609C7B80EF515AC8CC31`。

临时构建生成的玩家 HTML 与 tracked public 文件会因 provenance 中的 `sourceCommit / dirty` 字段不同而出现不同 SHA-256；这不是玩法差异，也不能用重建文件覆盖本批禁止改动的产品基线。因此冻结证据分别使用“隔离回归通过”和“原工作树 tracked blob 不变”两项证明，不伪称 public／临时 dist 字节一致。

### 项目记录与静态结构

- Project Co-leader V2 项目记忆检查：`0 errors / 0 warnings`；
- 26 份本批 Markdown、164 个本地链接、16 个 Mermaid 代码块通过相对路径、代码围栏与 Mermaid 静态结构检查，错误 `0`；Mermaid 未做渲染视觉验收；
- `git diff --check` 通过；staged `0`、冲突 `0`、产品路径差异 `0`。

### 新鲜发布风险（不在本批修复）

`npm.cmd ci` 的全依赖审计输出为 21 项漏洞（1 low、4 moderate、16 high）；`npm.cmd audit --omit=dev --audit-level=high` 对生产依赖返回 4 项 high，涉及 `nanoid`、`next`、`postcss` 与 `sharp` 链。没有运行 `npm audit fix` 或 `--force`。这不阻断离线、自包含玩家 HTML 的历史冻结，但继续阻断未经升级与回归的服务端公开部署。

### 提交后身份门

Git commit 与 annotated tag 必须在本文件所在 tree 形成后才能检查，无法把自身未来 commit SHA 写入同一提交。执行者必须在创建标签后核对：工作树干净、标签类型为 `tag`、`v2.0.0-player-prototype-freeze^{}` 等于当前 V2 HEAD；实际 SHA 进入 V3 启动证据与最终交接报告。任一检查失败则停止，不创建 V3 工作树。

## V2 已实现与未实现

已实现：确定性规则核、单一数值权威、版本化 replay、三案例稳定局号、玩家后验估值、鉴定提交、A／D／N 能力与客观经济结果双轨、独立玩家 HTML，以及漆器第一批手机人物／器物同屏展示壳。

未实现：真正的证据拓扑、玩家知识图与中间判断、温和推理导航、NPC 人物知识账本与对玩家模型、连续人物回应、D20 洞察、受控误导、长期平衡、文化校订、真人盲测和发布。

## 相关决定

- [DEC-015：冻结 V2 并启动 V3 设计阶段](../decisions/DEC-015-v2-freeze-and-v3-bootstrap.md)
