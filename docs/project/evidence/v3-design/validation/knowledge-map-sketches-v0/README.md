# 玩家知识地图表达草图 v0

Status: Validation-only / Wireframe / Isolated from product code

用途:为 DEC-026 未决的**地标汇合与重排语义**(NEXT-ACTIONS 第 15 条)提供可看的比较对象,替代在纸上争论。
2026-08-24 用户批准以"先做草图再定语义"取代"先定语义再做原型"。

## 这是什么,不是什么

- **是**:三种地标组织方式的静态线框比较,用同一份首案中局状态渲染;
- **不是**:视觉方向、美术、UI 规范、交互原型或产品代码。配色刻意保持中性灰加单一强调色,以免把美术方向偷偷定下来(美术方向须由用户批准);
- **不是**:对趣味、可玩性或玩家理解的证据。这些只能由无答案真人测试举证。

## 视口

按 2026-08-24 用户决定,**按电脑浏览器尺寸制作,不受手机竖屏约束**。
提醒:进入高保真原型或正式页面阶段时须重新决定移动端约束。

## 内容来源

状态取自已批准的作者规格可执行夹具
`../first-ceramic-author-scenarios-v0/fixtures.mjs`(`40/40` 于本仓库重放通过),不是新编内容:

- 隐藏真相:`Identity=LATE18_EXPORT`、`RepairHistory=THREE_PHASE`、`KeyMaterial=KEY_MATERIAL_PRESERVED`、`Surface=MIXED_CROSS_OVERPAINT`、`Stability=DISPLAYABLE_LOCAL_RISK`、`Documentation=COHERENT_PARTIAL`;
- 调查动作取自 `actionContracts` 的 23 个动作;
- 阻断 G3 的未知取自 `unknownRegistry` 中 `g3Allowed: false` 的六项;
- 证明角色取自 `PROOF_ROLES`。

所渲染的中局状态:物证路线已建立 G2(现器具名修复图 + 逐区结构读数 + 跨时点重大变化),
档案归属路线处于 `contested`,G3 被四项未知阻断,足迹含一次重复与一次能力不足阴性。

## 打开方式

直接用浏览器打开 `sketches.html`,无需构建或联网。

## 三个模型

| 模型 | 地标怎么放 | 押的是什么 |
|---|---|---|
| 一 | G 地标画在建立它的几条道路的**汇合路口**,位置由本局路线决定 | 空间可追溯性 |
| 二 | 地图上只有局部 Finding;G 是**图外读数** | 极简与反阶梯彻底性 |
| 三 | Finding 底图 + 可折叠**结论层**叠加 | 信息密度可控 |
