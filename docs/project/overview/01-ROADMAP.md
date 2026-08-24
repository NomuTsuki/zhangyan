# Roadmap

> 这是面向人的简化投影，不是新的项目权威或活动账本。若本摘要与权威项目记录或现场证据冲突，以权威记录和现场证据为准。

最后更新：2026-08-23

## 总路线

```mermaid
flowchart LR
    V2["V2 已冻结<br/>可运行试玩底座"] --> Intake["V3 证据迁入<br/>已完成"]
    Intake --> Node["阶段主张语义<br/>已决定"]
    Node --> Ending["手动停手与挂牌终局<br/>已决定"]
    Ending --> Policy["暂定数值政策<br/>已记录，未验证"]
    Policy --> Screen["跨品类家族筛选<br/>已完成"]
    Screen --> Direction["陶瓷 / 瓷器取向<br/>用户已选择"]
    Direction --> Cases["两件具体对象<br/>来源比较已完成"]
    Cases --> Choice["对象与核心争议<br/>用户已批准"]
    Choice --> Handoff["真相先于证据交接<br/>已完成"]
    Handoff --> Truth["固定手工真相包<br/>DEC-021 已完成"]
    Truth --> Paper["v0.1 证据分账底稿<br/>结构保留"]
    Paper --> Correct["三档方向纠偏<br/>DEC-022 已完成"]
    Correct --> Overlay["三档作者模型 v0.2<br/>历史已验证基线"]
    Overlay --> Domain["限定领域复核<br/>Conditional Pass"]
    Domain --> V03["v0.3 关系与能力修订<br/>独立 Pass"]
    V03 --> Author["用户批准作者规格<br/>DEC-024 已完成"]
    Author --> OldMicro["文字／面板原型<br/>已否决并删除"]
    OldMicro --> Skills["项目级 UI／UX Skills<br/>已安装并核验"]
    Skills --> MapCore["渐进地图核心语义<br/>DEC-026 已完成"]
    MapCore --> StableG2["稳定 G2 与范围分界<br/>DEC-027 已批准"]
    StableG2 --> Map["当前：补齐剩余地图语义"]
    Map --> Numeric["数值与经济模拟"]
    Numeric --> Full["整局原型<br/>与真人盲测"]
    Full --> Audit["V2 继承与<br/>正式技术审查"]
    Audit --> Build["用户批准后<br/>正式产品实现"]
    Build --> Scale["扩展手工案例<br/>自动校验与美术"]
    Scale -. "不同案例与玩家证据成立后" .-> PCG["受约束生成实验<br/>Unknown / 另行批准"]
```

## 当前阶段

当前位置是 **V3 Design / 玩家知识地图核心语义与首案稳定 G2 已批准，范围复核已通过，正在补齐剩余地图语义**。

不是在决定器物身世，也不是在写正式产品代码、正式界面或美术。DEC-021 已固定客观真相；DEC-022 已确认开放证据网汇合成三档结果；v0.3 旧六文件已独立 Pass，DEC-024 已批准其进入玩家微循环。DEC-025／026 固定玩家责任与地图语义；DEC-027 又规定首案建立 G2 后，局部路线可失败而 G2 地标保持，永久 G2 降级只属通用防御／未来案件。追加范围覆盖层已经独立 Pass；当前继续阶段地标语义，之后才进入低保真表达、粗概率和无答案测试。后续验证与代码开工门全部保持。

## 为什么仍不能直接画五种拓扑

语义与器物结构决定都不等于玩法成立。若未先固定客观真相，证据图就会反过来创造它想证明的答案；即使真相包固定，暂定阈值仍可能让阶段建立太早或太晚，多峰价值仍可能让玩家只追高值尾部。先用一件器物把这些问题逐层暴露出来，才能知道拓扑复杂度带来的是选择还是只有图面复杂度。

## 第一切片闭环

```mermaid
flowchart LR
    Truth["固定真相与价值"] --> Fact["可观察事实"]
    Fact --> Claim["鉴定主张与局部成果"]
    Claim --> Result["三档结果只读投影<br/>不锁行动"]
    Fact --> Value["本局证据估值<br/>独立读取证据分布"]
    Result --> Stop
    Value --> Stop{"继续或收手"}
    Stop -->|继续| Cost["调查机会 / 检测费用"]
    Cost --> Fact
    Stop -->|收手| Freeze["冻结推理快照"]
    Freeze --> Price["玩家一次挂牌"]
    Price --> Market["客观市场结果"]
    Truth --> Market
    Market --> Reveal["结果后揭示完整真相与拓扑"]
```

## 停放区

- 第二到第五种拓扑；
- 玩家知识图、迷雾／提示、面板与移动端交互的**正式执行**；旧微循环原型已经删除，项目级 Skill 安装门已关闭，当前只处理剩余地图语义和之后的隔离低保真验证；
- 程序化器物真相／证据语义／完整拓扑；只有不同手工案例和玩家证据出现后才可另批受约束实验；
- 正式美术、面向发布的文化／市场文案终校、最终 PDF；限定领域复核属于当前代码前主线，不在此停放；
- 公开托管、依赖安全升级和微信内实机。

## V3 外边界

- V2 的 NPC 认知、画像、关系状态、连续对话、D20、议价、人物评分和行为仲裁不进入 V3；
- V2 漆木盒内容、固定三真相、旧热点、似然、价格和卖家规则不作为第一器物默认。

权威来源：[当前状态](../02-CURRENT-STATE.md) · [下一行动](../03-NEXT-ACTIONS.md) · [DEC-017](../decisions/DEC-017-v3-stage-claims-stopping-and-fixed-price-listing.md) · [DEC-018](../decisions/DEC-018-v3-provisional-claim-thresholds-and-valuation-projection.md) · [DEC-019](../decisions/DEC-019-v3-evidence-rich-first-object-and-legacy-npc-exclusion.md) · [DEC-020](../decisions/DEC-020-v3-first-ceramic-object-and-core-dispute.md) · [DEC-021](../decisions/DEC-021-v3-first-ceramic-objective-truth-package-and-gameplay-first-authorship.md) · [DEC-022](../decisions/DEC-022-v3-first-ceramic-three-result-gates-over-branching-evidence.md) · [DEC-023](../decisions/DEC-023-v3-pre-product-validation-and-player-projection-boundary.md) · [DEC-024](../decisions/DEC-024-v3-first-ceramic-author-spec-approval-and-player-microcycle-entry.md) · [DEC-025](../decisions/DEC-025-v3-player-workbench-snapshots-focus-and-final-judgment.md) · [DEC-026](../decisions/DEC-026-v3-progressive-player-knowledge-map-and-current-best-hint.md) · [DEC-027](../decisions/DEC-027-v3-first-ceramic-stable-g2-and-post-g2-fallback.md) · [G2 范围重分类](../evidence/v3-design/2026-08-23-first-ceramic-g2-stability-and-scenario-scope-reclassification-v0.md) · [微循环三分支 v0](../evidence/v3-design/2026-08-21-player-knowledge-workbench-microcycle-branches-v0.md) · [三档作者模型 v0.3](../evidence/v3-design/2026-08-21-first-ceramic-three-result-author-model-v0-3.md) · [确定性演算 v1](../evidence/v3-design/2026-08-21-first-ceramic-deterministic-author-scenarios-v1.md)
