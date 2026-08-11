# EXP-022：玩家试玩版“人与物”体验、数值与证据结构审查

日期：2026-08-11

## 测试了什么

在不修改产品代码的前提下，审查当前 V2 玩家试玩版是否已经形成“同时面对器物与 NPC”的手机体验，并复核以下问题：

- NPC 是否通过表现而非事实标签被玩家理解；
- 检查与询问在数值上是否已经分化为“鉴定／压价”；
- 现有证据是否构成真正的串并联推理链；
- 当前 NPC 陈述、后验和议价评分是否存在不合理耦合；
- D20 洞察、受控误导与多路径调查应采用什么边界；
- 当前页面和源码基线能否被稳定留存，供后续逐批比较。

## 方法

### 仓库与代码只读审查

- 检查 `player/PlayerApp.tsx`、`player/styles.css`、`game/belief.ts`、`game/ability-scoring.ts`、`game/types.ts`、`game/reducer.ts`、`game/npc-decision.ts` 与三案内容配置；
- 跟踪检查、询问、证据公开、NPC 状态、重新定价、器物后验、证据结构和议价评分的数据流；
- 穷举当前三案九个真相的最短证据结构路径；
- 由临时只读审查者运行相关规则／披露／V2 核心测试，结果 `40/40 PASS`。该结果只证明当前实现按现行测试运行，不证明设计合理。

### 浏览器基线

- 以当前自包含 `掌眼_V2_玩家试玩版.html` 启动本地临时 HTTP 服务；
- 使用真实 Chrome，在 `390×844` 依次进入调查页、无证据提交 55% 判断、进入交易页；
- 保存两张 viewport 截图并检查浏览器 console；console 为 `0 errors / 0 warnings`；
- 临时 HTTP 服务和浏览器会话已关闭；没有增加项目依赖。

基线文件：

| 文件 | SHA-256 | 尺寸／字节 |
|---|---|---|
| `player/PlayerApp.tsx` | `8966FC7777497017C451D5D871C660FD0DF96ED3AFB243813B74ABC6DA97FA90` | 17,329 bytes |
| `player/styles.css` | `CA67542915BD78BE8E0FA01A798400C664C11EACE926D0DDF4BDD445B03D6453` | 14,703 bytes |
| `game/belief.ts` | `1BAE28D45557BB1D2BE15125F8AFDB9BAE5812B4BACF0200D4BDBC90751C41BC` | 5,145 bytes |
| `game/ability-scoring.ts` | `113BFDF28F4445DAE1C30E45892AAE64F89E875E2BC4240540B3236DF3F3367A` | 10,060 bytes |
| `content/create-player-case.ts` | `BA56B9300C16E50D6B7B61AEA1DE3F8F76158C005D5F3283C1CDCF145937D09D` | 8,298 bytes |
| `public/掌眼_V2_玩家试玩版.html` | `E9440288B279F9F9B7A8BFEF45CAA2260C1FA399FB3D89502A0783D2DF0E92DF` | 302,192 bytes |

截图：

- [当前调查页 390×844](../../../output/playwright/EXP-022/current-investigation-390x844.png)，SHA-256 `3CF9C21431803730D521F4B0C9D9BEB1C8172367E056C7BB79B4D3D79FAB0ED8`；
- [当前交易页 390×844](../../../output/playwright/EXP-022/current-trade-390x844.png)，SHA-256 `B48C33626442EDA9CC2D69EAF4CE846C0C45CE2DD10E2211C8F01C53573A28E3`。

### 外部资料核实

- D&D 2024 将 d20 检定用于结果具有不确定性且失败有意义的情境，Insight 用于辨识心境／意图；Sage Advice 明确能力检定自然 1／20 不自动失败或成功：
  - <https://www.dndbeyond.com/sources/dnd/br-2024/playing-the-game/>
  - <https://www.dndbeyond.com/sources/dnd/sac/sage-advice-compendium>
- Larian 曾降低会锁死整段对话的苛刻检定，并提供对话历史与正常／强制成功／强制失败调试能力：
  - <https://baldursgate3.game/news/community-update-11-inspiration-freedom-pacifism_17>
  - <https://baldursgate3.game/news/community-update-22-wield-the-power-of-a-mind-flayer_75>
  - <https://docs.baldursgate3.game/index.php?title=DebugDialogSkillCheck>
- GUMSHOE 把推动调查所必需的核心线索从随机失败中移出；Heaven’s Vault 使用少瓶颈、多顺序和自动测试维持非线性调查：
  - <https://pelgranepress.com/gumshoe/files/GUMSHOE%20SRD%20OGL%20version.pdf>
  - <https://www.gdcvault.com/play/1025149/-Heaven-s-Vault-Creating>
- 判谎研究不支持用单一动作稳定识别谎言；贝叶斯证据研究支持把假设、证据依赖和证人可靠性分开表示：
  - <https://pubmed.ncbi.nlm.nih.gov/16859438/>
  - <https://doi.org/10.1177/1529100610390861>
  - <https://doi.org/10.1080/19462166.2012.682656>

这些资料只作为设计边界输入，不代表已经验证《掌眼》的具体数值或趣味。

## 观察结果

### 1. 当前手机页面没有形成持续“面对 NPC”的体验

- 调查页使用器物文字圆标、卖家姓名、事实化摘要和一块静态引语，没有半身立绘、姿态／表情投影或行动后气泡；
- `PlayerApp.tsx` 把行动反馈写入通用 `notice`，`styles.css` 的 `.notice` 为 11px；
- 议价页完全没有 NPC 人物、台词或表现，只显示估值区间、报价框、买下与拒绝按钮；
- 浏览器基线页在 `390×844` 没有横向溢出或 console 错误，但调查内容需要长纵向滚动；这不能证明任务层级或信息布局合理。

### 2. 人物事实已被直接泄露，且规则解析显示文案

- 三案 `npcProfile.publicTraits` 和卖家摘要直接写出急售、谨慎、相信来源等人物事实；
- `visibleAcceptanceProbability` 在 `game/ability-scoring.ts:131—169` 通过查找中文字符串中的“急／谨慎／戒备／坚持”改变概率；
- 这使表现文案同时成为规则参数，人物描述无法保持多义，也不利于本地化、审计和公平评分。

### 3. 检查与询问的功能不对称是真实存在的

代表性漆器“旧胎重修”场景：

- 初始要价 80、实际接受线 60；
- 只检查接口：玩家后验由约 `33/33/33` 变为 `40/58/2`，证据结构为 50、最高 A；NPC 状态、后验、要价和接受线不变；
- 无证据温和询问：NPC 状态由 `26/58/72/68` 变为 `27/66/73/70`，要价 `80→75`，实际接受线仍为 60，证据结构仍为 0；
- 先检查接口再专业出示证据：NPC 主观期望约 `83.8→52.0`，要价 `80→65`，实际接受线 `60→55`；玩家后验约 `29.3/70.0/0.7`，但器物证据结构仍只有 50。

因此当前检查主要负责器物证据和评级上限；询问同时承担弱陈述信号、NPC 四状态、证据公开、重新估价和压价准备。用户感到“检查补证据、询问压价”有数值基础，但询问并非完全没有信息作用。

### 4. 当前证据是平铺覆盖表，不是证据链

- `ObservationTarget` 只有位置结果和可选幸运证据，没有 `requires / unlocks`、AND／OR、串行前提或中间结论；所有位置开局可点，第一次点击必得真相相关证据；
- 证据结构只统计独立 `sourceGroup` 和覆盖 `dimensions`；
- 三案九个真相都能在两次检查后达到结构 90；瓷器和书画可用“专项检测＋一个位置”，总计 3 AP，达到结构 100／SSS 所需条件；
- 漆器有 5 个位置、瓷器和书画各 3 个位置，后两案明显不足以承载长证据链；
- 当前内容还把书画“印章题签”映射为全局 `bottom`、“笔墨结构”映射为 `joint`，说明案例本地证据语义尚未真正解耦。

### 5. 询问内容存在案例语义错位

瓷器和书画通用对话只把来源经历、品相变化和专项检测列为相关话题；其普通物证却属于胎釉／款识／工艺或纸墨／印章／笔墨结构。系统允许公开这些证据并更新 NPC 后验，却可能把它们标为“不相关”。现有测试未覆盖该语义不一致。

### 6. NPC 反应与器物后验存在错误因果捷径

- NPC 行为选择只读取四状态、语气、证据和历史，不读取隐藏真相，这是正确边界；
- 但行为回复携带作者配置的真相似然，`belief.ts:65—96` 随后把该陈述信号直接乘入玩家器物后验；
- `create-player-case.ts:79—172` 的泛化模板会人为让多种 NPC 行为偏向某一真相；
- 当前没有结构化命题知识账本，也没有先推断 NPC 可信度／披露意图。

因此系统可能把“NPC 作出某类反应”当成器物证据，却缺少统计或因果依据。洞察检定不能直接叠加在该链上，必须先分离器物证据、NPC 主张、可观察表现和洞察观察。

### 7. 当前没有可实现受控说谎与洞察的模型

- `StatementRecord.sourceKind` 只有 `memory / judgment / refusal`；没有命题立场、NPC 自身置信度或披露意图；
- 当前四状态存在于规则层，但玩家界面没有多义表现投影；
- 议价结果有接受、还价、拒绝和离场，但没有 `NpcUtterance` 或洞察挂点；
- 当前没有 D20、DC、洞察修正、优势、检定记录或调试覆盖。

## 对决定或假设的影响

- 触发并解决 [CH-005](../challenges/resolved/CH-005-human-object-dual-appraisal-boundary.md)；
- 形成 [DEC-014](../decisions/DEC-014-human-object-dual-appraisal.md)，局部取代 DEC-007 的绝对禁谎与 DEC-013 的事实标签／实时接受概率；
- 下一工程必须先做漆器手机同屏人物场景，再做证据图与连续对话；不能先把 D20 叠加到现有后验；
- 证据链正式拆为获取图、推理图和对话披露图；
- 新增 NPC 知识／披露判断和察人分 `P`，但首轮不改变 A／D／N 总评权重；
- “客观收益与能力评分关系”继续保留为后续 Critical 平衡验证，不与当前重构同时执行。

## 结论的局限

- 本批没有修改或运行新的产品实现；
- `40/40 PASS` 来自临时只读审查者，不是独立 QA，也没有重新执行完整 `170/170`；
- 两张截图只覆盖当前默认书画案例的调查与无证据交易入口，不覆盖所有案例和状态；
- 没有真人试玩、眼动／可用性研究、真实手机、微信内浏览器或长期平衡证据；
- 外部资料支持边界原则，不证明 `+2`、DC 10／12／14、8 AP 或任一评分阈值已经平衡；
- 三案文化与器物知识仍待专家校订。

## 下一步

先由用户复核 DEC-014、EXP-022 和两张基线截图。获得第一批产品实现授权后，仅制作漆器 `390×844` 同屏人物／器物场景、NPC 占位立绘、漫画气泡、行动层级和案卷外壳；在真实状态截图获得用户确认前，不进入证据图或 D20 实现。
