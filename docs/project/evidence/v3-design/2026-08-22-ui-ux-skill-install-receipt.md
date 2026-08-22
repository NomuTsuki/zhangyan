# UI／UX 项目级 Skill 安装回执

日期：2026-08-22
状态：`Installed / Source bytes verified / Behavior not yet evaluated`

## 授权与边界

用户在 Git 检查点提交 `12836c0` 完成后明确“授权安装”。本次把授权解释为：只将已经研究选定的两个 Skill 安装到当前 V3 仓库的项目级发现根 `.agents/skills/`；不做用户级全局安装，不修改 `AGENTS.md`、Project Co-Leader 配置、Agent 权限、MCP 或产品代码，不提交、不推送，也不开始制作新版界面。

上述边界描述安装动作本身。安装与独立只读复核完成后，用户于 2026-08-22 另行授权按既定下一步建立一个本地 Git 检查点并开始地图语义讨论；仍未授权推送、制作新版界面或修改正式产品代码。

Skill 的存在只增加后续任务可以调用的工作方法，不增加文件、Git、网络、部署或产品决策权限。Magnus Skill 负责 UX／HCI 与认知结构；PracticalSwan Skill 负责已对齐体验的审美和界面表达。二者都不能覆盖作者图／玩家图边界、玩法因果、DEC-025 玩家责任或正式产品开工门。

## 固定来源

| 项目 Skill | 固定来源 | 安装目录 | 本地文件 |
|---|---|---|---:|
| `product-design-and-ux` | [`magnus919/agent-skills@d68c1b3552360af931311b8aa56674bdb0125263`](https://github.com/magnus919/agent-skills/tree/d68c1b3552360af931311b8aa56674bdb0125263/product-design-and-ux) | `.agents/skills/product-design-and-ux/` | 20 |
| `frontend-design` | [`PracticalSwan/agent-skills@300310f916d78de8910afa6abf658f7497d933e6`](https://github.com/PracticalSwan/agent-skills/tree/300310f916d78de8910afa6abf658f7497d933e6/frontend-design) | `.agents/skills/frontend-design/` | 9 |

安装时两个上游 `main` 已分别前移到 `1291f9576e8c35451c440b06efab0ee9f70079aa` 与 `54787cf42fde4dd10e278fd68c75eed91e5e8240`；本项目没有浮动追随它们，而是使用候选核验时已经检查过的固定提交。未来升级必须重新审查差异并单独授权，不能静默覆盖。

Magnus 的 Skill 目录本身有 19 个文件，但仓库根 MIT 正文不在该目录内。本次把同一固定提交的根 `LICENSE.md` 额外保存为 `.agents/skills/product-design-and-ux/LICENSE.md`，因此本地共 20 个文件。PracticalSwan 的 9 个文件已经自带三份许可证、第三方说明、metadata、reference 与本地对比度脚本。

## 执行与核验

执行使用本机系统 `skill-installer`，两次均显式指定 `--dest <本仓库>/.agents/skills`、GitHub repo/path 与完整 commit；没有使用默认的用户级 `$CODEX_HOME/skills` 目标。

安装后通过 GitHub commit／tree API 取得两个固定快照的 blob SHA，再以 `git hash-object --no-filters` 逐文件比较：

- `product-design-and-ux`：期望 20、实际 20、缺失 0、额外 0、哈希不符 0，Pass；
- `frontend-design`：期望 9、实际 9、缺失 0、额外 0、哈希不符 0，Pass；
- 两个已安装 `SKILL.md` 的 frontmatter 名称分别为 `product-design-and-ux` 与 `frontend-design`；
- 系统 `skill-creator/scripts/quick_validate.py` 曾被调用，但当前 Python 缺少其校验器依赖 `PyYAML`，两次都在导入阶段以 `ModuleNotFoundError: No module named 'yaml'` 退出；本轮没有为校验擅自安装全局依赖。无依赖回退检查确认两份文件都有成对 frontmatter 围栏、`name` 与目录一致且存在 `description`，但这不冒充完整 YAML 解析器 Pass；
- `frontend-design/scripts/contrast-checker.py` 只用 Python AST 解析，结果 Pass；没有执行候选 Skill 的设计工作流或脚本功能；
- 对两个目录做危险命令关键词扫描，没有发现递归删除、外部下载、包安装、进程启动、Git 推送或动态 `eval`／`exec` 命中；这是启发式检查，不等于完整安全审计；
- 用户级 `C:\Users\ASUS\.codex\skills` 与 `C:\Users\ASUS\.agents\skills` 均没有这两个同名目录；没有形成全局副本。

临时只读复核者独立重放来源与安装字节检查后给出 Pass，并补充两项残余风险：Magnus 固定提交的签名有效，PracticalSwan 固定提交未签名；此外两个 Skill 被未来任务实际调用后都可能产出项目文件，`frontend-design` 还明确包含前端实现工作流。因此“安装完整”不等于“后续调用只读”，每次调用仍须服从当前项目的文件、产品代码和正式开工授权。

因此本次证据只支持：**两个项目级目录完整、来源固定、安装字节与指定上游一致，且没有观察到额外安装副作用。** 它不证明 Skill 的建议适合掌眼、不证明任何 UI 可用或好看，也不构成玩家微循环、真人测试或产品实现 Pass。

## 干净退出

- 临时禁用：把 `.agents/skills/product-design-and-ux/` 与 `.agents/skills/frontend-design/` 整目录移出 `.agents/skills/` 发现根，然后开启新任务或重启 Codex；
- 完全卸载：删除这两个精确目录。若安装文件已进入 Git，则使用一个明确的删除提交或回退安装提交；不要删除整个 `.agents/skills/`，因为未来可能还有其他项目 Skill；
- 安装器没有创建注册表项、后台进程、MCP、Agent 或卸载器，也没有修改全局 Skill；退出不需要清理其他系统位置；
- 当前任务开始时尚未加载新 Skill，它们按安装器合同从下一任务起可用。

## 下一检查点

安装门已经关闭。下一步仍不是画界面，而是先用项目语义、`product-design-and-ux` 与本机 `ui-task-flow-review` 逐项对齐：玩家知识地图的基本地理是什么、黑暗与显影各表示什么、证据怎样改变地图，以及系统怎样温和呈现探索前沿。待这些语义共享后，`frontend-design` 才参与同内容的审美表达分支。
