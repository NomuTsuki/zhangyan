# EXP-014：V1 定稿预检、恢复点与未提交内容分类

状态：已执行，独立 QA 通过（含已知风险）

执行日期：2026-08-03

## 目的与边界

在不修改游戏运行逻辑的条件下：

1. 保全仓库全部已命名历史、两个无分支历史提交和当前未提交文件；
2. 隔离导致 Git 全引用遍历失败的 Codex 内部坏引用；
3. 从最新评分修正版建立 V1 教师定稿工作树；
4. 分类原工作区的混合内容，防止自动合并或误删。

本次没有修复已知测试失败，没有提交、合并、移动 main、打标签、制作教师压缩包或启动 V2。

## 仓库外恢复点

恢复目录：

    D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight

| 产物 | 覆盖范围 | 恢复性检查 |
|---|---|---|
| git-admin-raw-before-ref-repair.zip | 修复前完整 .git 管理目录，含原坏引用 | 解包目录包含 .git/HEAD 与坏引用路径 |
| all-preserved-refs.bundle | 3 条项目分支、4 条有效 Codex tree 引用、2 条救援提交引用 | bundle verify 退出 0，list-heads 精确为 9 条 |
| named-branches.bundle | main、codex/hifi-teacher-demo、codex/judgment-quality-scoring | bundle verify 退出 0，并实际克隆验证 |
| tracked-working-tree.patch | 根工作区 3 个 tracked 修改，binary/full-index 格式 | 在 hifi 分支验证克隆中 apply --check 退出 0 |
| uncommitted-working-tree-overlay.zip | 3 个 tracked 工作副本与 28 个 untracked 文件 | 实际解包后 31/31 文件 SHA-256 与源文件一致 |
| uncommitted-files.sha256.json | 上述 31 个文件的路径、类别、长度和 SHA-256 | 与源文件逐项比对通过 |
| broken-ref-original.bin | 41 字节坏引用的独立副本 | SHA-256 与源文件一致 |

额外创建两个只作历史保全用途的引用：

- refs/backup/pre-v1/dangling-d938a51 → d938a51a3c9c1b9038bd620c318b55104e015753
- refs/backup/pre-v1/dangling-4f69259 → 4f6925980ea55116532953372d3ad957884bc38f

这两条提交此前不属于三条项目分支的祖先链。救援引用防止它们在未来垃圾回收中消失；恢复 bundle 也包含它们。

## 损坏引用处理

原坏引用位于：

    .git\refs\codex\turn-diffs\captures\1784703201187\f78c1703-0904-42ef-804c-2b1e9f575203\base

审计结果：

- 长度：41 字节；
- 内容：41 个 NUL 字节；
- SHA-256：9E1736C43D19118E6CE4302118AF337109491ECC52757DFB949BAD6A7940B0C2。

在原始 .git 冷备份和独立副本都验证后，该文件被按原字节移动到恢复目录的 quarantine 子目录。没有删除父目录，也没有清理任何 Git 对象。

隔离后门禁：

| 检查 | 结果 |
|---|---|
| git show-ref --head | 退出码 0 |
| git fsck --full --no-reflogs | 退出码 0；只有 dangling blob/tree 提示 |
| git log --all --oneline --decorate=short | 退出码 0 |
| main → hifi → scoring 祖先关系 | 两段均通过 |
| 三条项目分支 OID | 与修复前完全一致 |

## V1 教师定稿工作树

| 项目 | 值 |
|---|---|
| 工作树 | D:\实习工作\掌眼\.worktrees\v1-teacher-finalize |
| 分支 | codex/v1-teacher-finalize |
| 起点 | 34f97e250c4dcf139e1ae2d3d536af7a0e36786b |
| 起点含义 | 最新评分修正版 |
| 创建后状态 | clean |

基线复跑：

| 命令 | 实际结果 |
|---|---|
| npm.cmd ci | 退出码 0；安装 509 个包；npm 报告 18 项依赖公告 |
| npm.cmd test | 退出码 1；78 项中 77 通过，唯一失败仍是低保真 standalone-html 对 resolveBuyout 的旧静态断言 |
| npx.cmd tsc --noEmit | 退出码 0 |
| npm.cmd run lint | 退出码 0 |

这证明评分修正版基线与 EXP-013 的记录一致；不能表述为全套测试通过。

## 原工作区未提交内容分类

原工作区仍位于 codex/hifi-teacher-demo，HEAD 为 4fbf5056e87044156f29cb2a05b5da8bf662e730。预检时有 3 个 tracked 修改、28 个 untracked 文件、0 个 staged 文件。

| 组别 | 数量 | 分类结论 | V1 当前动作 |
|---|---:|---|---|
| globals.css、低保真 HTML、standalone/client.js | 3 | 历史低保真与调试实现的 tracked 工作副本；可能含有价值，但不能覆盖评分修正版的正式规则和高保真生成链 | 仅保全；不自动合并。进入 V1 前必须逐项说明缺陷、最小 diff 和验证 |
| 近期开发对齐 Markdown | 6 | 含用户填写的决定和数值/测试教学材料；部分状态已被后续 DEC-003、DEC-004、DEC-007 和评分修正版吸收，部分文字已过时 | 保全为决策来源；不整目录复制。有效决定写入项目记忆，旧状态后续归档 |
| 周报与模板 DOCX | 8 | 行政与过程证据，不属于游戏运行时 | 保全；是否纳入教师提交包由后续打包步骤决定 |
| .tmp/weekly-2026-08-02 | 13 | 周报生成、检查脚本和中间证据，其中 pyc 是可再生缓存 | 保全但不迁移到 V1；后续只挑选有复用价值的脚本，当前不删除 |
| public/掌眼_高保真演示.html | 1 | 旧短文件名副本，SHA-256 为 B9CAE490...；不是评分修正版的 canonical 教师演示 | 保全但不作为提交权威，不自动复制 |

当前迁移结论：原工作区的 31 个文件没有一个可以在未审阅的情况下直接进入 V1 定稿工作树。该结论不表示删除或否定内容，只表示保持来源和权威边界。

## 已批准但尚未实施

- V1 采用最小交付修正后封存的方案二；
- V2 启动时先由 Agent 审查仓库，随后主动提醒用户：统一数值权威源是已批准的第一项核心产品工程；
- V1 最小代码修正、项目说明、演示说明、冻结提交、标签和教师包仍未执行。

## 残余风险

- 完整测试仍有 1 条已知失败；
- 根工作区的历史低保真修改尚未做语义级逐行审查；
- 当前恢复点在本机磁盘之外于仓库，但仍未复制到第二块磁盘或远端；
- V1 尚未形成正式冻结提交或标签；
- 依赖公告尚未按离线单文件与未来公开 H5 两种威胁面分别处置。

## 独立 QA

一名全新上下文、只读权限的独立 QA 对恢复点、Git 拓扑、工作区保持性、文档边界和项目记忆执行了对抗式复核，结论为 pass-with-known-risk：

- artifacts-final.sha256.json 的 26 项产物重新计算后 0 项不一致；
- 根工作区清单与 overlay 中的 31 个文件分别重新计算后均为 0 项不一致；
- raw Git ZIP 确认包含修复前坏引用和完整对象目录；
- tracked 补丁再次通过 git apply --check；
- 两份 bundle、9 条保全引用、三个项目分支 OID 和两个救援引用全部通过；
- show-ref、fsck 与 log --all 再次退出 0；
- V1 工作树精确为 7 项未暂存 docs 变更、0 项 staged、0 项运行时代码变更；
- 项目记忆检查器、变更文档本地链接和标题空白检查均无问题；
- QA 独立复跑 TypeScript 与 ESLint，退出码均为 0。

QA 没有复跑完整 npm test，因为该命令包含构建写入，超出其只读权限。本次执行主体已经在新工作树中实际复跑并记录 77/78；两者的证据边界保持分开。
