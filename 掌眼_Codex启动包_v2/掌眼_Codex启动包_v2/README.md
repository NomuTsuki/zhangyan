# 《掌眼》Codex 项目启动包 v2

> **历史材料提示（2026-08-03）**：本目录最初用于启动低保真开发，下文保留为项目形成记录，其中“尚无框架代码”“当前先做低保真”等表述已经过时。当前仓库总入口、V1 正式教师演示与权威边界请从仓库根目录 `README.md` 和 `release/v1-teacher-handoff.json` 开始；唯一正式演示是 `prototype/public/掌眼_高保真教师演示.html`。

## 以下为 2026-07-22 的历史启动说明（不再作为当前执行指令）

这在当时是一套可直接解压到新仓库根目录的项目启动资料，尚不包含具体框架代码。

## 开始方式

1. 解压本包到项目仓库根目录。
2. 让 Codex 先阅读：
   - `START_HERE.md`
   - `AGENTS.md`
   - `docs/00_PROJECT_KICKOFF.md`
   - `docs/06_UI_LOFI_TASK.md`
3. 将 `CODEX_START_PROMPT.md` 的内容粘贴到 Codex 主线程。
4. 当时不要直接开发完整游戏，先完成低保真 UI 原型。
5. 当时计划在低保真原型经老师确认后，再进入 Sprint 1 灰盒开发。

## 核心文件

| 文件 | 用途 |
|---|---|
| `START_HERE.md` | 最短启动入口 |
| `CODEX_START_PROMPT.md` | 可直接粘贴给 Codex 的首轮提示词 |
| `AGENTS.md` | 项目级工程与协作规则 |
| `docs/00_PROJECT_KICKOFF.md` | 完整项目总纲 |
| `docs/06_UI_LOFI_TASK.md` | 当时的低保真 UI 任务书 |
| `docs/09_SPRINT_PLAN.md` | 七周开发节奏 |
| `schemas/*.json` | Action、Case、Storylet 数据结构草案 |
| `examples/lacquer-box.case.json` | 首个灰盒案件示例 |
| `references/掌眼_完整游玩流程.drawio` | 流程图 |
| `MANIFEST.md` | 包内文件与校验信息 |

## 当时的唯一优先级

制作“民国漆木首饰盒”低保真竖屏可点击原型，打通观察、证据、询问、对质、交易和复盘。该阶段任务现已由 V1 高保真教师演示取代。
