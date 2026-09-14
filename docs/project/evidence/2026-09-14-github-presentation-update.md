# GitHub展示更新

2026-09-14。用户已自行把NomuTsuki/zhangyan设为PUBLIC，并明确要求先完成GitHub侧的默认分支、README等整理，视频以后再做。

## Implemented

英文README介绍当前V3、实际截图、玩法、个人贡献、合成素材来源和验证边界；新增中文说明、源码／历史导航、作品集精选索引与媒介提案。当前方案使用已公开的原仓库，另建展示仓库的旧提案作废。游戏文件保持3fe5704检查点的原字节。

## Executed

通过本机认证gh核对仓库PUBLIC；执行仓库设置更新，将默认分支从main改为codex/xray-photo-local-study，Description改为“An antique appraisal game prototype exploring evidence, uncertainty and a growing knowledge map.”，添加browser-game、game-design、interaction-design、react、threejs、typescript六个主题。`git remote set-head origin -a`同步本地origin/HEAD。

README及相关10份文档已通过提交`ff8db4472550c9ef8ac968a3ca66ac0af49c45c4`推送到默认分支。随后执行无认证公开读取和未登录浏览器检查；原始核验输出保留在本机output/github-presentation-2026-09-14/。

## Scenarios covered

当前与历史版本入口、公开权限、默认分支、简介／主题、英文和中文说明互链、游戏下载与实际截图、源码和素材导航、原型字节身份。

## Observed result

GitHub API已返回public、新默认分支、正确简介与六个主题；has_pages仍为false，homepage为空。未登录浏览器显示Public标识、新默认分支、英文README、已加载的游戏截图、中文／素材／源码导航及新提交。

2026-09-14 17:34（UTC+8）无认证读取6个远端文件，均返回HTTP 200且与本地逐字节一致：英文README、中文说明、素材索引、源码导航、首页截图、游戏HTML。另直接请求README里的`?raw=1`游戏下载链接，重定向后HTTP 200，5,267,301字节，SHA-256为`4d6362a82d5788e9a26b904c80550b53281452bec294bb71a60a1c58a96569eb`，与封存游戏一致。

本地10份文档的305个文件链接检查无断链；UTF-8无替换字符；`git diff --cached --check`通过。未重新构建或修改游戏。

## Evidence provenance

执行者读取本机Git、认证GitHub CLI和无认证公开请求，并在未登录的浏览器查看GitHub真实渲染。具体命令包括`gh api repos/NomuTsuki/zhangyan`、`git remote set-head origin -a`、`git push origin HEAD:codex/xray-photo-local-study`及`node output/github-presentation-2026-09-14/verify-public.mjs`。后者不传认证头或Cookie，输出public-readback.json。以上是执行者核验，不冒充独立审查。

## Not verified

本轮不重新检验游戏玩法或拍摄视频，也不部署Pages。历史产品报告中的体验边界及review required保留。

## Residual risks

README中的项目截图包含后期调查状态，素材索引明确各自构建与用途。完整案例目前通过下载HTML运行；公开托管试玩页仍是后续工作。未删除或重命名历史分支，未改旧main与zhangyan_V2仓库，未新建仓库、Release或许可证。

## Exact completion claim supported

公开仓库的默认分支、简介、主题、英文首页与相关导航已更新并推送；公开首页渲染及核心文件下载已核验。视频与托管试玩页不计入本轮完成范围。本轮仅修改展示文档并执行已授权仓库设置，未修改测试、基线、容差或核心系统；以链接、远端读取与渲染检查覆盖文档变更。历史产品的review required不因本轮整理而解除。
