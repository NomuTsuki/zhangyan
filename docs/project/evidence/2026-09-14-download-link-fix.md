# 公开游戏下载入口修复

## Implemented

中英文README主下载入口改为直连ZIP，新增docs/downloads/zhangyan-v3.zip；包内只有Zhangyan.html，内容与现有原型逐字节相同。另保留直接HTML原文件链接并说明Ctrl+S保存方式。未改游戏代码或内容。

## Executed

在未登录浏览器打开中文README并点击旧“单文件游戏”链接，实际复现用户截图中的“Error loading page”。替换后推送提交a0f5362，分别从公开中文、英文README点击新ZIP链接，均取得真实浏览器download事件；点击后README仍可读取，没有错误页。另通过无认证HTTP读取ZIP并比较本地字节，通过Python zipfile检查包内唯一文件及其字节身份。

## Scenarios covered

中文README站内点击旧链接的失败；修复后中英文实际点击下载；原型打包、远端ZIP读取、文件类型、完整性和压缩包内容。

## Observed result

旧blob路径附带?raw=1在直接HTTP请求时可以取得文件，但本次浏览器站内点击进入GitHub错误页面。故之前HTTP 200与哈希一致的检查不足以支持“用户点击下载通过”。未取得GitHub内部异常栈，不能断定其内部根因或归因于文件大小。

新ZIP直连绕过blob页面。两种语言的点击均触发下载。无认证请求：HTTP 200，Content-Type为application/zip，3,389,591字节，与本地包一致；ZIP SHA-256为169e384392d62ce517ce4a674607bd6a1efeefe9c8bb6955a8710ab51a04bac1。包内Zhangyan.html为原型5,267,301字节，SHA-256为4d6362a82d5788e9a26b904c80550b53281452bec294bb71a60a1c58a96569eb。

## Evidence provenance

用户截图、执行者复现截图、浏览器download事件、Node无认证请求和Python ZIP内容断言。浏览器复核使用waitForEvent('download')与真实README链接点击共同执行；测试的是真实公开入口，没有伪造下载事件。

## Not verified

未在用户自己的浏览器会话中复测；未重跑游戏玩法测试。没有把download事件当作用户已经保存或运行游戏的证据。远端包完整性由独立HTTP字节读取确认。

## Residual risks

若未来游戏文件更新，须同步重新打包ZIP；当前游戏已停止自动迭代。网络对raw.githubusercontent.com的访问条件仍取决于访客环境。

## Exact completion claim supported

原点击路径故障已复现；替代下载入口已发布，并通过中英文真实点击和压缩包完整性检查。未触碰核心规则、测试、基线或游戏文件；新增分发文件由ZIP内容、远端字节与浏览器点击检查覆盖。历史产品review required保留。
