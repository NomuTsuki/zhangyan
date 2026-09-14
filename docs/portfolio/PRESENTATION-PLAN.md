# 掌眼 · 作品集呈现方案

2026-09-14。**作品集与视频仍为提案；本轮先完成已获批准的GitHub仓库展示整理。** 作者已自行将`NomuTsuki/zhangyan`公开，并要求整理默认分支、README等内容，视频以后再做。游戏检查点仍为 `3fe5704`／HTML `4d6362a8`，尚未创建公开试玩站点。本文件保留内容与媒介草稿，产品事实仍以项目记录为准。

## 主建议：英文短片为主，桌面试玩为补充

用同一个英文展示页承接作品集外链：先看到一段90–120秒的真实游戏演示，下方提供 **Play the prototype — desktop**。如果本轮只制作一种，优先把视频做好。

这是根据本项目特点作出的编辑判断，不是声称掌握了招生评审的固定观看时间。掌眼需要理解材料、对应关系和判断的区别，随机试玩未必很快遇到最能说明设计的时刻。视频可以把“做了什么—看见什么—理解改变在哪里”安排清楚；可玩版则让愿意深入的人验证自由旋转、选择调查、回查依据与主动停手确实可操作。

| 媒介 | 在这个项目中负责什么 | 局限 |
|---|---|---|
| 英文短片 | 让观看者在一个完整的小故事里看懂调查、地图生长与判断 | 不能代替亲手选择路径；不能只拍漂亮飞线 |
| 可玩网页 | 展示真实交互、不同调查顺序、材料回查与收手权 | 需要读懂规则并投入时间；当前只支持电脑 |
| PDF中的静态页面 | 用结果图、局部三帧和文字，自足地说明核心设计贡献 | 无法完整展示时间顺序和镜头反馈，适合接短片作为延伸 |

作品集PDF中的项目页建议保留一个统一外链／二维码，落到未来展示页；展示页上再分观看视频和试玩。当前公开仓库可以展示作品介绍和源码，后续的托管网页提供直接游玩。

## 这件作品的核心论点

**把不完整的鉴定信息组织成可探索、可回查、仍允许玩家自行停手的推理空间。**

当前作品已经具备可拍摄的完整鉴定切片。继续增加案件、市场、NPC或细调地图不属于本次展示准备；保留作者已确定的收尾点。

以下是三个内容单元，尚不指定页数或跨页数量，沿用整本作品集已有的594×210mm规格：

| 单元 | 读者应理解的事 | 画面与文字安排 |
|---|---|---|
| 体验与角色 | 玩家拿到一件器物，在有限调查机会下决定自己知道得是否足够 | 当前游戏主画面；一句玩法介绍；个人职责与工具说明 |
| 推理如何显形 | 作者真相固定；玩家先取得材料，后来补足关系，已有信息获得新的用途 | 同一局的三帧局部：已有材料及疑问→补充核验→道路接通；旁边明确取得、解释、判断的区别 |
| 从反馈到设计决定 | 不同调查顺序和拥挤图形会破坏玩家的空间记忆；因此固定骨架、明确关系与视觉接续 | 一组有可比条件的旧／新地图；标出具体改变及其理由，附限定验证和作者取舍 |

V1/V2可压缩成一条历史说明：项目从鉴定与交易循环，逐步把本阶段重心集中到独立鉴定与玩家知识地图。只有当它解释V3为何这样收敛时，才为旧界面分配画面。周报、工具日志、每一次局部修复与大段测试数目留在证据库。

## 可直接讨论的英文文案

**Project title**

Zhangyan / 掌眼

**Descriptor**

An antique appraisal game about building an account from incomplete evidence.

**Introduction**

In Zhangyan, players investigate a porcelain bowl and decide when they know enough to make an assessment. I designed a knowledge map that grows from acquired evidence: observations retain their place, questions extend into unexplored areas, and later checks connect earlier material to a developing account of the object.

**Design contribution**

I focused on the relationship between investigation and interpretation. The map needed to preserve spatial memory while showing how new evidence changes the meaning of what is already known. I developed the interaction through successive prototypes, using play feedback to revise its layout, relation symbols and discovery sequence.

**Authorship / tools**

Individual internship project. Game systems, interaction design, visual direction and iterative prototyping. AI-assisted coding and visual exploration; bowl texture generated with GPT Image.

**Caption for a three-frame sequence**

An observation arrives before its role is clear. A later verification establishes the connection. The original material stays in place as the map extends.

这些是供作者修改的草稿。署名、岗位英文称谓和最终语气可在正式排版时统一；不声称所有代码和绘画均为手工完成，也不声称已经通过普遍玩家理解或文博专家验证。

## 视频提案：让一次调查改变理解

建议约105秒，可在90–120秒内调整。以最终构建录制英文界面；字幕承担解释，旁白不是必需条件。下面是镜头职能，不是已经完成的剪辑或固定解谜顺序。

| 时段 | 画面 | 要表达的内容 |
|---|---|---|
| 0–12s | 碗的旋转、可见调查入口、三栏工作台 | 建立玩家身份与目标：调查这件器物，形成自己的判断 |
| 12–30s | 取得一张旧照片，查看它留下的疑问 | 材料已经到手，仍需核实它与当前器物的关系 |
| 30–58s | 后来执行对应核验，完整保留飞线→拉近→拉远→接通 | 新行动使已有材料获得可用的关系；这是视频最重要的原速段落 |
| 58–82s | 跳到较完整调查状态，点一个判断并回查真实材料 | 判断依赖多项依据，地图可以被回查；用字幕说明这是后续调查阶段 |
| 82–102s | 看剩余机会与未决问题，然后手动收手 | 玩家保留何时停止调查的决定权 |
| 102–110s | 项目名、个人贡献与桌面试玩入口 | 给想进一步体验的人一个清楚去处 |

拍摄时使用真实操作，明确区分不同调查阶段的剪辑。核心接通动画保持原速；可剪去寻找入口和等待准备的空隙。不要把多个不同状态拼成一条并不存在的连续推理，也不必将全部16次完整路线塞进片中。用于录制的详细执行路线可参考[已有演示路线](../project/delivery/试玩与演示.md)，正式录制前再按选中的镜头核对。

现有18.56秒试窗片与16.60秒材料片是旧构建的局部过程证据；最终构建另有15.56秒来源收纳回归录像，仍是局部检查。它们可以帮助选镜头，不能直接改名为完整英文项目视频。原录像保持原状。

## 网页提案：小展示页与独立试玩文件

9月14日第一次盘点时，本仓库为私有，默认旧`main`，简介和主页为空，无Pages或Release。作者随后自行将它改成PUBLIC，并批准本轮更新默认分支、简介和README。最新游戏检查点仍为`3fe5704`；尚未部署Pages。第一次盘点的工作树有1,252个跟踪文件、文件大小合计约527MB，这是当时的文件总量，不等于Git克隆包大小。

**当前方案是直接使用已经公开的`NomuTsuki/zhangyan`，以后从中选择性发布一个小型展示包。** 不再另建`zhangyan-showcase`。完整开发记录留在仓库，站点只包含介绍和游玩所需文件；本轮先完成仓库展示，视频及网站部署留待后续指令。

拟发布的具体内容：

| 位置 | 内容 |
|---|---|
| `index.html` | 英文项目简介、实际画面、视频、贡献说明和桌面试玩按钮 |
| `play/index.html` | 当前 `prototype.html` 的原字节副本，SHA保持4d6362a8；按钮链接带`?lang=en` |
| `media/` | 一张当前主图、完成后的英文视频；只带实际使用的少量素材 |
| `.nojekyll`、README、构建来源记录 | 静态发布与追溯信息 |

现有游戏是约5.27MB的自包含HTML，脚本、样式、贴图和Worker均已内联。这与GitHub Pages的HTML/CSS/JavaScript静态托管方式匹配；部署后仍需实际检查HTTPS加载、Worker/WebGL、直接打开英文、无登录访问和常用操作，当前没有作线上运行声明。[GitHub Pages说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

后续可用Actions将上面的少量文件发布到Pages，明确选取发布产物，保留源码与过程目录原位。[发布来源说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 原GitHub仓库的整理范围

本轮已获授权整理并同步：英文首页、中文试玩说明、源码／历史导航、精选素材索引及本方案。游戏、冻结原型和原始素材保持原位。

本次GitHub整理的明确范围：

| 项目 | 当前 | 建议 |
|---|---|---|
| 默认分支 | 原为`main` | 改为已有V3分支 `codex/xray-photo-local-study`；保留旧main及历史分支 |
| Description | 空 | `An antique appraisal game prototype exploring evidence, uncertainty and a growing knowledge map.` |
| Visibility | 用户已改为PUBLIC | 使用当前公开仓库 |
| Homepage | 空 | 待展示页真实发布并验证后填入URL，不预填无效地址 |
| Release／标签 | 只有历史冻结标签，无Release | 本轮保留现状，README直接指向原字节游戏文件 |
| 分支与原目录 | 9条远端分支，历史证据分散 | 用导航区分当前／历史；不为整洁删除证据或重写Git历史 |

本次用户明确授权GitHub侧整理，包括默认分支、README等更新。网站部署、创建新仓库和视频制作不在本次操作范围。

## 下一步

先完成GitHub侧展示并核验公开访问，之后再按作者指令推进英文短片与托管试玩页。视频镜头和三段内容主线仍可继续讨论。游戏开发保持收尾状态，不自动重开功能迭代。
