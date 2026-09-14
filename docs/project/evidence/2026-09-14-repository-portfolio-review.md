# 仓库展示整理与作品集提案核验

> 本文记录9月14日较早的本地整理与私有仓库盘点。随后作者已自行公开仓库并授权GitHub整理，最新执行记录见[GitHub展示更新](2026-09-14-github-presentation-update.md)。下文状态仅对应当时。

2026-09-14。用户决定作品开发到此结束，并要求整理GitHub仓库、判断视频与可玩链接的展示方式。本轮执行者完成本地说明与导航整理，保留外部发布和媒介制作选择为待采纳提案。

## Implemented

根README改为当前V3的英文作品介绍；新增README.zh-CN.md、docs/REPOSITORY-GUIDE.md、docs/portfolio/README.md和PRESENTATION-PLAN.md。现状、下一步与本地交付说明记录作者收尾决定。旧README可由3fe5704回查；未移动V1/V2、原型、图片、视频或历史目录。

英文文案、三段作品集内容、约90–120秒短片及公开展示包均为提案。本轮没有制作新游戏画面或视频，没有创建新仓库、部署、提交／推送、改默认分支、改隐私、删除分支、创建Release或新增许可证。

## Executed

- `git status --short -uno`、`git log -4 --oneline`：开工时跟踪文件干净，HEAD为3fe5704。
- `git ls-remote --symref origin HEAD`及`git ls-remote --heads origin`：默认main=db09da0；最新V3分支=3fe5704；远端分支9条。
- `gh repo view NomuTsuki/zhangyan --json nameWithOwner,description,visibility,defaultBranchRef,homepageUrl,url,isArchived`及`gh api repos/NomuTsuki/zhangyan`的限定字段：PRIVATE，description/homepage为空，has_pages=false，isArchived=false，本机认证具有admin权限。
- `gh release list --repo NomuTsuki/zhangyan --limit 10`：无Release返回。Pages端点返回404，同时仓库元数据明确has_pages=false。
- Node统计当前Git跟踪文件：1,252个，文件大小合计约527MB；这是工作树文件大小，不是Git传输包大小。
- ffprobe读取三份代表片段：试窗片18.56秒、材料片16.60秒、最终版本来源回归片15.56秒。均是1440×1000的局部操作片；不作为已经完成的整片。
- 查看实际英文最终地图与中文试窗截图，阅读各自来源说明；GPT Image贴图来源从src/assets/README.md核对。
- 对8份本轮说明文件进行一次性UTF-8和本地链接核对：302个本地链接，失效0、替换字符0。没有为文档修改新增产品测试。
- `git diff --check`通过；对当前prototype.html与HEAD原字节求SHA-256，两者相同，为4d6362a82d5788e9a26b904c80550b53281452bec294bb71a60a1c58a96569eb。

检查输出保存在仓库本机`output/portfolio-organisation-check-2026-09-14.json`。GitHub connector的get_repo返回404后，使用本机认证gh取得实际信息；没有把connector的404当成仓库不存在。

## Scenarios covered

当前／历史版本入口、实际GitHub可见性与默认分支、现有素材及版本归属、当前V3本地启动命令、作者与AI辅助的表达、拟发布内容范围，以及本轮文档链接与游戏未改变的检查。

## Observed result

当前私有仓库默认首页仍描述旧迁移冻结，且没有公开试玩站点，因此不能把原仓库地址作为外部作品集试玩链接。本地首页现以V3作品为中心，历史和技术证据通过第二层导航查阅。短片为主、试玩为补充是根据本项目认知门槛与动态表现作出的编辑建议，尚不是作者确认的最终呈现方式。

## Evidence provenance

执行者读取本机Git及认证GitHub CLI结果，检查真实已有截图、媒体元数据与来源记录。托管能力参照GitHub一手文档：[Pages的静态托管范围](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)及[发布来源配置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。现有记录仅用于支持本轮具体事实，未把旧构建画面重标为当前版本。

## Not verified

没有上线站点，没有核验外部观看者的实际访问／网络体验，没有录制或验收最终英文短片，没有排版正式作品集跨页，也没有研究某校本年度申请提交细则。媒体时长与内容主线尚待作者评价。

## Residual risks

本地README整理尚未同步GitHub，因此远端默认首页仍保持旧状态；公开仓库、Pages和主页URL均需明确发布范围后执行。新的作品集介绍是编辑草稿，作者署名、英文岗位称谓与最终措辞仍可修订。原产品验证报告中的review required与体验边界保留。本轮未改测试、核心逻辑或冻结内容，文档机械检查不等于作品集效果验收。

## Exact completion claim supported

本地仓库说明与作品集素材入口已整理，视频／可玩链接的比较与具体制作提案已形成，游戏产物保持原字节。GitHub远端设置与公开展示尚未改变。
