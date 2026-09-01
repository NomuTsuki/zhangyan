## 项目事实

- 古董鉴定与交易的**认知策略游戏**:玩家在信息不对称下检查器物、询问来客、决定披露与报价。Web(H5),TypeScript/React,无需安装。
- **交付与用途**:本项目是用户在企业实习中独立负责的项目,导师最终要的交付物是一份**策划案**,不是手机尺寸原型或正式上线页面;同时本项目**首要服务作品集制作**(594×210mm 跨页)。项目不涉及隐私或保密协议,过程资产可自由留存、截图与展示。
- **视口政策(2026-08-24 决定,2026-08-28 由 DEC-033 转为阶段范围)**:V3 一切切片、草图、验证与**正式切片**只做电脑浏览器尺寸。手机端**不在本阶段范围**,且**不为其预留布局退路**——不做响应式断点、不做上下折叠变体、不做窄屏降级。手机竖屏是 V1/V2 的历史事实,其归档资产保持手机竖屏。2026-08-24 那条"先／暂"的临时豁免已被 DEC-033 取代,**上一版的提醒已于 2026-08-28 触发并由用户答复,不要再重复问同一个问题**。**新的提醒触发:产品定性被重新讨论(尤其"是否仍为微信端小游戏")、出现真实手机端交付要求、或桌面版通过真人测试并进入上线准备时,必须提醒用户重估移动端约束。**欠款已记在 DEC-033:若定性仍为微信端,欠一次完整竖屏信息架构设计,其中"决策面四类能否在竖屏同屏可比"可能与 DEC-032 的反派工保证冲突。
- 版本边界:V1(教师演示,冻结)/ V2(玩家试玩底座,冻结于 tag `v2.0.0-player-prototype-freeze`,不许改动)/ **V3(当前)**:物品真相拓扑与玩家知识地图,分支 `codex/v3-object-truth-topology`。
- V3 当前状态:知识地图语义已闭合(DEC-026 骨架 + DEC-028 地标汇合 + DEC-029 罗盘排序范围);DEC-032 的可玩实现 `workbench-map-v0` 已做出,**真人试玩两轮与两轮零背景盲测都没通过,开局即停手**。正式数值、产品代码开工均未批准。以 `docs/project/03-NEXT-ACTIONS.md` 为准。
- 设计核心(不可动摇):作者真相模型(隐藏、固定)与玩家知识图(渐进显影)严格分离;证据≠结论;意义可以延迟、证据只计一次;玩家手动停手;双轨结算(客观结果 + 判断质量)。
- 领域词义以根目录 `CONTEXT.md` 为准。项目记忆入口:`docs/project/00-PROJECT-COMPASS.md` → `02-CURRENT-STATE.md` → `03-NEXT-ACTIONS.md`,其余记录按任务需要读,不默认通读。
- V2 原型与测试位于 `掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/`(node 测试套件在其 `tests/`)。需 Node `>=22.13.0`(实测 v24 可用),全部命令在该目录下执行,首次先 `npm install`:
  - `npm run dev` 启动应用开发版(vinext + Cloudflare Workers,依赖 wrangler);`npm run dev:hifi` 启动高保真演示开发版(纯 vite,不依赖 wrangler)。
  - `npm run build` 构建玩家版与应用;`npm run build:hifi` 只生成高保真单文件;`npm run build:all` 三者全出。
  - `npm test` 是全量套件(先完整构建,再 `node --experimental-strip-types --test` 跑 `tests/`);`npm run test:hifi` 只跑高保真四项;两者都会先构建,不是纯单元测试。
  - `npm run lint` 走 eslint。离线环境下 `dev`、`build:app`、`start` 可能因 wrangler 受限,此时用 `dev:hifi` 与 `build:hifi`。

## 完成定义(强制)

- 任何"完成"声明之前,执行 `/evidence-before-done` 并附其报告:能运行的必须运行并贴出输出;改玩法或手感的,必须附一份给用户的试玩清单(`/playtest-protocol`);未验证项显式列出。
- 没有证据的完成不是完成。"implemented but unverified" 是合法且受欢迎的表述。
- 收尾汇报只用这一种格式,不再产出其他收尾仪式。
- **触发式审查门**:执行任务完成后自查五信号——①触碰计划范围外的文件 ②修改了任何测试、基线或容差(无条件送审)③执行中单方面解决了计划模糊点 ④触碰核心系统文件(规则核/求解器)⑤改动无测试覆盖。命中任一,在报告中声明 `review required` 并列出命中项;裁决权在用户转交的独立审查会话,执行者只举手不裁决。

## 必须问用户的事(其余自选可辩护默认值,标 Experimental,事后可纠偏)

- 核心循环的增删;三档结果(G1/G2/G3)语义的改变。
- 美术与叙事方向;器物题材的选择与更换。
- 范围削减;废弃或改动任何已冻结版本的内容。
- 数值从 Experimental 转正;真人测试的执行。
- Git push、发布、部署、一切外部写入。

## 行为内核(每条背后都有本项目的历史教训,删除前先读 docs/EPITAPH.md)

- **Windows 中文编码(已踩两次,机械照做):** 本仓库文档与代码大量含中文且一律 UTF-8,而本机 PowerShell 默认代码页是 936(GBK)。①**禁止用 PowerShell 读写这些文件** —— `Get-Content`/`Set-Content`/`Out-File`/`Tee-Object` 会按 GBK 往返并静默改坏整个文件(2026-08-31 曾把 `harness.mjs` 改成 93 行乱码,靠 `git checkout` 才救回);读写一律用编辑器工具(Read/StrReplace/Write)。②**要看含中文的命令输出,一律 `cmd /c "node x.mjs > out.txt 2>&1"` 落盘再用 Read 读**,它保留原始 UTF-8 字节;`chcp 65001` 只能修直接输出,命令一旦经过 PowerShell 管道(`Select-Object`/`Tee-Object`/`Out-File`)就会被重新解码成乱码,写出的文件还会被 git 当二进制。④PowerShell 5 不支持 `&&` 与三元 `? :`,分隔命令用 `;`。
- 文件、代码、测试、搜索能回答的事实,自己查,不问用户。
- 把计划当证据的滚动视图;优先做"证据价值不低于再讨论一轮"的最小安全动作。
- 一次只问一个问题,必须带推荐;结论给一个主推荐加至多一个有意义的替代。
- 用户以"比如/比方说/举例"标记的措辞只作说明;未经明确采纳,不得升格为事实、数值或决策。
- 证据与已批准决策冲突时开门见山,不许静默偏离;失败后不许静默重生成基线、放宽容差或只调到测试通过为止。
- 模拟不能证明好玩;涉及体验的结论一律标注"待真人验证"。
- 新会话、上下文压缩后或长间隔重入:先跑 `/reorient`(git status / diff / CURRENT-STATE),再动手;会话摘要只作导航,不作事实。
- 产品数值的改动走 `/tune-params`:登记旧值、新值、理由、回滚条件。

## 沟通偏好

- 人话优先:先说解决了什么问题、改了什么、对方向的影响;技术细节随后**完整**给出——不省略,也不考试(不需要理解力确认、阶段交接仪式、反思格式块)。
- 实质工作完成后,主动用 `/learning-handoff` 讲解关键概念与取舍(用户在持续学习中)。
- 输出语言:中文;代码与提交信息:英文。

## 治理边界(本文件是本项目唯一治理权威)

- 本文件不使用托管块,任何工具不得整段覆写它;规则变更只由人明确决定。
- 本项目自带 skill 在 `.cursor/skills/`:`reorient`、`playtest-protocol`、`tune-params`、`research-decision`、`portfolio-capture`、`blind-playtest`(零背景玩家,只碰仓库外成品 HTML)、`repo-audit`(只读通审,只举手不修)。`evidence-before-done` 与 `learning-handoff` 是全局 skill,不在仓库内,换机器会失效。Cursor 用 `/skill-name`;Codex 用 `$skill-name`,同一份 `SKILL.md`。
- 记法:Cursor 用 `/skill-name` 手动触发(不是 Codex 的 `$`);Cursor 同时读取 `.cursor/skills/`、`.agents/skills/`、`.claude/skills/`、`~/.codex/skills/`,所以旧体系仍会被看见,靠下一条停用清单约束而非删文件。
- 默认停用,只在用户当次点名时用一次:旧治理体系 `project-co-lead` / `project-co-leader-v2` / `project-agent-governance`、`superpowers:*`、`structured-handoff`(其收尾格式与上面的完成定义冲突)、`ui-task-flow-review`,以及仓库内 `.agents/skills/` 的 `frontend-design` 与 `product-design-and-ux`。后两个已加 `disable-model-invocation: true` 机械禁用;前面那些装在仓库外的用户目录里,只能靠本条文字约束。

## 元规则(防再度膨胀)

- 新增全局规则,需要同一失败出现两次以上;优先把修复写进本文件(项目知识),而不是全局 skill(通用流程)。
- 本文件超过 120 行时,先删后加。
