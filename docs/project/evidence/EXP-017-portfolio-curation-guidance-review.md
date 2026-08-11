# EXP-017：学校作品集成果/过程取舍核实

日期：2026-08-04

状态：Executed（只读官方资料核实；未制作或修改作品集）

## 要回答的问题

用户担心：V1 证据保全是否会演变成过重的素材库，并把大量中间开发切片机械放入最终由 Figma 导出的学校申请 PDF，导致项目看起来像半成品。需要核实学校官方要求是否支持“成果优先、过程精选、框架/思路/实现变化只保留关键节点”的做法。

本轮未确认最终申请院校、项目和入学年份。基于此前上下文，优先检查 PolyU Design 当前 BA 与 2027 MDes 官方要求，并用 UAL 与 RISD 官方建议交叉核对一般性策展原则。院校特定页数、文件大小和内容结构不能跨项目套用。

## 当前官方证据

### PolyU BA Design 2026/27

[国际申请人官方 Portfolio Guidelines PDF](https://www.sd.polyu.edu.hk/admission/Non-JEEPortfolioguidelines_2026-27.pdf) 要求：

- 英文 A3 PDF，20—30 页，不超过 20 MB；
- 展示 5—10 个 **best projects**；
- 只明确要求至少一个项目包含 development work；
- 每个项目有标题与一句话/短段说明。

这直接支持“最佳项目与成果优先，不需要每个项目铺满全部过程”。过程仍有价值，但官方没有要求把所有开发切片塞入最终 PDF。

### PolyU MDes 2027

[PolyU MDes 2027 官方 eProspectus](https://www.polyu.edu.hk/study/pg/tpg/2027/73035-ibd-ibp-isd-isp-ssd-ssp-ted-tep) 要求作品集突出最先进的设计工作，同时强调 concept development；提交必须体现成熟度、专业组织和与专修方向的适配。

其 IBD 要求特别明确：三个最有代表性的项目，每项说明 problem definition、concept development、final solution 与 validation；SSD 也要求清楚表达 problem framing、concept development 和 final solution。

这不是“只放漂亮终稿”，也不是“按 Git 时间线展示所有中间物”，而是以成熟最终方案为锚点，选择能证明问题定义、概念演化、实现和验证的最少过程证据。

### UAL 官方通用建议

[UAL Portfolio Advice](https://www.arts.ac.uk/study-at-ual/apply/portfolio-advice) 建议选择 3—5 个项目，按项目形成 narrative，展示 research、process、outcome；同时明确避免页面拥挤、保持注释简短，并用最强作品开场和收尾。

这支持“叙事完整但页面稀疏”：过程不是越多越好，必须服务于一个可以读完的项目故事。

### RISD 官方交叉证据

[RISD First-year Portfolio Guidance](https://www.risd.edu/admissions/first-year/apply-risd) 明确建议大多数作品是 finished pieces；研究或准备材料最多放入三个 upload/slide，并强调编辑与策展的重要性。它还要求 AI 辅助作品说明过程和所用工具。

RISD 不是当前已确认目标院校，因此其数量不能成为掌眼 PDF 的硬要求；但“多数完成成果 + 少量关键过程 + AI 透明披露”可以作为通用风险控制参考。

## 结论

用户的担心成立，且得到官方材料支持：

1. **证据保全库不等于最终学校 PDF。** 私有保全回答“以后还能否追溯”，最终 PDF 回答“评审在有限页数内应看到什么”；
2. **最终 PDF 应成果导向。** 首先展示完成后的高保真核心循环、关键交易状态、结算与验证结果；
3. **过程只保留高信息密度节点。** 对掌眼而言，优先是问题定义、NPC 纺锤、静态认知→双后验、抽象 framing 被否定→具体证据披露、判断质量与客观结果分离；
4. **原始 debug 与连续中间切片默认不进正文。** 只有当某张切片能够证明一次关键设计判断、失败后的收敛或个人实现能力时才进入；其余留在私有索引；
5. **不额外制造低保真/数值实验台截图作为保全完成条件。** 冻结源码、commit 与实验记录足以保存其历史身份；只有未来具体 PDF 页面确实需要对照时，才另行批准生成衍生截图；
6. **Figma 是排版与制作工具，不是内容边界。** 最终 PDF 的页数、体积、语言和项目数量必须以目标院校/项目当年官方要求为准。

## 对保全实施计划的影响

- 仓库内保存轻量文本索引、证据主张矩阵与策展候选；
- 仓库外胶囊只复制唯一、不可重建且高价值的原件，以及少量最终成果/验证截图；
- 已有 Git bundle、恢复点、正式交付包和重复截图以 `verified-in-place` 或 `duplicate-reference` 登记，不重复复制；
- 31 项原工作区材料逐项取得存储终态，但绝大多数不自动提升为 `portfolio-candidate`；
- 最终 PDF 的建议结构是“成果锚点 → 问题与个人角色 → 一张系统演化图 → 2—3 个关键设计/实现决定 → 最终验证 → 反思”，不是完整开发日志。

## 局限与重开触发

- 当前没有确认目标院校、具体项目、入学年份或 PDF 页数预算；因此本结论只确定策展原则，不批准最终页面结构；
- PolyU BA 与 MDes 的要求不同，不能共用固定模板；
- 官方要求可能更新。开始最终 Figma PDF 前必须重新核实目标项目当年页面；
- 本轮没有制作 Figma、PDF、截图或公开材料，也没有验证招生评审对掌眼具体内容的反应。
