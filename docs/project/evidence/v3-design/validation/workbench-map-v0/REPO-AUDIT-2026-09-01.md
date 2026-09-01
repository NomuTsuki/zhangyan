# 仓库通审 · `workbench-map-v0`

日期：2026-09-01　　方法：`.cursor/skills/repo-audit/`　　审查员：独立只读 subagent（Grok）
活树：HEAD `c7479d6` + 未提交的文档／探针／两个 skill。`prototype.html` / `template.html` / `projection.mjs` 一行未改。

边界：LIVE = 本目录。冻结只查是否被碰：`first-ceramic-author-scenarios-v0/{solver,fixtures}.mjs`、整棵 `掌眼_Codex启动包_v2/`、tag `v2.0.0-player-prototype-freeze`。

下面是审查员终稿，照抄结构，不转述成更软的话。

---

## 五句摘要

最贵的缺陷类是 **semantics**：玩家看见的状态和解释它的文字由两套不同谓词算出，测试还专门验收引擎拒绝、不验收界面有没有说。灰按钮、名字撒谎、左上那行、免费／占 1 步、Finding 看起来像成果、力导向把所有边当同一种弹簧——是同一个类，不是六个 bug。三次「修好了」都只换词或调参数，分裂还在。最便宜的结构改动：一个 `playerGate(row) → {disabled, reason}` 供按钮和文案共用，再加一张「词必须先定义才能出现」的表进 harness；布局按数据轴钉死，不要弹簧。力导向对这张图是错的——证据在 `group-probe-out.txt`，不是手感。

---

## 七道扫描

### 1. 单一权威

Finding: 同一件玩家可见事实有两份以上定义，现在碰巧还接近，下一轮必漂。
Class: authority
Evidence: 费用：`case.mjs:40` `COST_LABEL=["免费","低","中","高"]` 仍画在左栏 `template.html:608`；弹窗写成「占 1 步 · 不花钱」。决策面档名：`KIND_LABEL` 抄在 `template.html` 和 `player-text-dump.mjs`。边图注：`projection.mjs EDGE_KINDS` + `template.html` 硬编码第四句。阶段：`STAGE_SEMANTICS`（G2 名仍含「重大重组」）vs `CLAIM_LABEL.majorReassembly`「这只碗被大改过」vs 委托卡「它像是被大改过」。预算：`PARAMS.md` + `session.mjs BUDGET_*`。可用性：`availability().usable` 与 `workbench().affordable` 两道门、一套解释。
Blast radius: 再转一轮人话仍会漏一层；测量工具会再撒谎。
Recommended owner: agent 可机械合并副本；产品词表 review required

Finding: `PARAMS.md` 同一条目里旧 why 仍写「取 12 使 G3 不可达——这正是 DEC-027 所要的」，更正段否认它。
Class: authority
Evidence: `PARAMS.md` 旧 why vs 更正段。DEC-027 第 41 行只说「G3 只在所需关系真正汇合时形成」。
Recommended owner: agent 可删旧 why；DEC-027 本身不用动

### 2. 冻结边界

Finding: 声明冻结的求解器、夹具、V2 树、tag **本轮未被碰**。
Class: frozen
Evidence: `solver.mjs`/`fixtures.mjs` 最后一笔是作者规格批准提交。`git diff v2.0.0-player-prototype-freeze -- 掌眼_Codex启动包_v2/` 空。名字撒谎的根在夹具缺 `acquisitionRequires`，字节没被改——洞是原装的。

### 3. 规格 vs 代码

Finding: DEC-032 左右分区、G 不进地图、三层经济、两拍动画、历史浮层、空图无位置，都有实现行。失败不在「没做 DEC-032」。
Class: spec-drift

Finding: DEC-032 没写的「地点」层被做进界面，且从未被告知。一点弹 1 或 3 张卡。委托卡只说「左边是你能用的手段」。
Class: spec-drift　　Recommended owner: review required（地点是结构还是该拆掉）

Finding: DEC-032 第五节「局部 Finding 指向 G」；实现里 Finding 对阶段的机械价值是零，只产 `latent` 边。六边形节点和公理一样大，冒充推理成果。
Class: spec-drift　　Recommended owner: review required

Finding: 投影层只用 `sharedLatentIds` 聚 Finding，档案三关系在求解器里有、图上不连。11/22 条情报属 0 个 Finding。半张图是散点。
Class: spec-drift　　Recommended owner: review required

Finding: `gap` 档、器物侧事实门、公理衰减未做——已记；G 读数被塞进五块表头里最不显眼的一块——未按 DEC-032「摆在别处、一行字」落地。DEC-032 重开条件已触发：「力导向重组导致玩家丢失空间记忆，而公理钉固不足以补救」。
Class: spec-drift　　Recommended owner: review required

Finding: DEC-026 罗盘／当前最优、DEC-028 地标进图——本切片故意没做。不是漂移。G2 读数仍含未定义的「重大重组」。

### 4. 语义 vs 执行

见下方专节。这是本审计的主类。

### 5. 测试完整性

Finding: harness 68 过，测的是引擎拒绝和字段，不是玩家看见的禁用理由。`take().why` 有「行动点数已经用完」，弹窗 `.no` 没有。没有「disabled ⇒ 解释非空」、没有「名字暗示顺序 ⇒ 有门」、没有「第一屏词 ⊆ 已定义集」。
Class: test　　Blast radius: 下一轮改完 harness 仍会全绿，玩家仍会在收手后停手。

Finding: 「逻辑边不是毛球」按一条 12 步路线验收（最大 21），满局 43 条会失败。毛球检查是假通过。
Class: test

Finding: 「12 个标签零压叠」是第 10 步 12 节点，不是满局 30 节点；不在 harness 里。
Class: test

Finding: `SLOT_FACTS` 抄自满局输出，A2 再和满局比——自证。
Class: test

### 6. 死脚手架

Finding: 「本局已经收手」是死代码；`needsActionIds` 算了从不做成链接；`scoped` 状态算了从不画。
Class: dead

Finding: `player-text-dump` 仍漏委托卡、地点名、区标题，费用打的是旧 `COST_LABEL`。再按 dump 盲测会再漏委托卡，并再把「免费」当界面原文。
Class: dead

Finding: 项目记忆自相矛盾：开篇「开局玩不下去」vs 后文「当前没有阻断项」「切片尚未开始」。`03` 第 17 条正文仍写「下一步是真人试玩」。
Class: dead　　（顶栏已于 2026-09-01 改判；后文残骸仍在。）

### 7. 无证据的声称

Finding: 「机器验过 / 68 项全过 / 转人话完成」被写成进度，真人标准未过。DEC-032 成功标准是玩家能说出「我认为这是 X，因为……」。两轮试玩、两轮盲测都没走到。
Class: claim

---

## 1. 布局

Finding: 力导向是这张图的错误原语；调参失败是因为能量函数和语义轴不是一回事。
Class: semantics
Evidence: 满局节点 30、边 43 = supports 23 + latent 12 + prereq 6 + caught 2。11/22 情报属 0 个 Finding。所有边同一弹簧；只钉公理且在 layout 之后才钉；Finding 和情报每步都动。两拍动画先把新点放在左边，520ms 后 layout() 丢掉归因位置。
Blast radius: 参数不可能让「23 条同权扇形 + 11 个孤立点 + 每步全图重算」变成空间记忆。
Recommended owner: review required

力导向对这张图是错的。它假设边表示「这两点该靠近」。这里占半的边是「这条情报支撑那条公理」（多对一），不是邻近。

若改确定性布局：
- X = 证据家族（胎釉工艺 / 表面 / 事故档案 T2 / 后期 T3 / 来源 / 材料／稳定）。11 个孤立点进档案列，不是缺陷。
- Y = 取得顺序或沉没度（观察在下，Finding 作区标题不进点，公理置顶带）。
- 点的位置 = `(家族, 取得序)`，由数据决定，不由弹簧。下一步旧点不动，新点出现在自家列下一格。

---

## 2. 谓词分裂

同一模式：外观用谓词 A，解释用谓词 B。

| 视觉 | 谓词 A | 谓词 B | 差集 |
|---|---|---|---|
| 「做这一步」disabled | `usable && affordable` | `.no` 仅 `!usable` | 收手／步数耗尽：17 灰、零字 |
| 兜底「本局已经收手」 | 写在 `!usable` 里 | `stopped` 从不把 `usable` 打 false | 死代码 |
| 左栏 `.blocked` | `rows.every(!usable)` | 无行内理由 | 收手后左栏不灰 |
| 碗上热点 | 仅 `allDone → spent` | 无 blocked／affordable | 收手后仍可点 |
| 决策面 `.mean.blocked` | `usable === false` | 不看 affordable | 收手后手段看起来还能点 |
| 地图 `.nd.on` | `type !== "obs"` | 钉死仅公理 | Finding 看起来「定了」但仍每步重排 |
| 左栏费用 | `COST_LABEL`「免费」 | 弹窗「占 1 步 · 不花钱」 | 「免费」仍在第一屏 |
| `#ro` 结账 | `frozenStage` | 委托卡「左上那行」 | `#ro` 是五块里左二 |
| 委托按钮 | 标「委托」 | 实际重看说明 | 误导 |

Finding: 禁用条件和解释条件不是同一个函数。这是灰按钮、收手无反馈、步数耗尽无反馈的类，不是三个 bug。
Class: semantics
Blast radius: 任何新门都会再静默灰一批按钮。

---

## 3. 名字 vs 门（22 个手段）

夹具里真正写了 `acquisitionRequires` 的正典事件只有四类。另加 `case.mjs` 一条 `needs()`：两个时候。其余 17 个开局可点。

名字承诺顺序、规则不拦：连成片、开小窗（平行而非先后）、换一批真品（不要求第一次）、看／拿事故记录、看／拿后期记录、查后来还有没有人动过。whyShort／whyLong 里还有「点位已有」「同一招做两次」「三道里的第 N 道」——开局就可点开，顺序是假的。

名字像随时可做、其实有门：比真品、核对特征、追经手、两个时候对比。门本身合理，措辞像解锁。

Finding: 玩家把界面当规则书。名字是一套规则，`acquisitionRequires`/`needs` 是另一套。同类至少 6 个名字，不是「连成片」一个。改名 vs 加门 vs 动冻结件：review required。加门 = 双权威。

---

## 4. 未解释术语

order-probe 的 23 词是低估：没扫委托卡、顶栏路线、地点名。委托卡里的「大改过」是「重大重组」的替换词，仍未定义。G2 读数仍含「重大重组」（`STAGE_SEMANTICS` 未改）。`player-text-dump` 已再漂：费用打「免费」、无委托卡、无地点。

---

## 5. DEC-032 漂移方向

实现相对决定：多做了一层（地点）、少做了半层（档案边／Finding→G）、读数放错了地方、布局按第十一节做了力导向而第十二节的钉死不够。已记录：`gap`、器物侧事实门、衰减未做。未记录：地点层、Finding 零机械价值、`#ro` 信息架构、半图孤立。方向是「投影层往作者词汇和作者图形状靠」，不是「往 DEC-032 成功标准（玩家能讲理由）靠」。DEC-032 重开条件已触发，没有新 DEC。

---

## 6. 架构

`prototype.html` ~5979 行 + 6 模块内联，不是缺陷复发的根；根是玩家契约没有单一源。改一句玩家可见的话最多动五个文件。无浏览器则验不了灰按钮解释、`#ro` 能否被看见、力导向是否稳。`projection.mjs` 无测试：未护边构造、决策面分类、标签表。这不是「该重写产品」。这是：在投影层继续修实例，类还会再长。

---

## review required（只举手）

1. 「连成片」一类：改名 / `availability()` 加门 / 动冻结夹具。同类至少 6 个名字。加门 = 双权威。
2. Finding：给机械作用，或降为分区标题。
3. 力导向 → 按家族×取得序钉死。用户已要过 ≥3 次。
4. 地点层：保留并解释，还是动作直接上工作台。
5. G1/G2/G3 语义仍「先不定」，但 `STAGE_SEMANTICS` 已在用「重大重组」。
6. 默认 22 点使 G3 可达。
7. `gap` 档（已记）。
8. 收手／耗尽要不要离开 `#ro` 小字。
9. 投影层无测试是否还继续「先加投影层试」。

执行者可以单方面做的（本审计不修）：并禁用／解释谓词、删死代码、dump 补委托卡／地点／真实费用句、改 CURRENT-STATE 自相矛盾句、harness 边阈值对满局。这些修了，类还在。
