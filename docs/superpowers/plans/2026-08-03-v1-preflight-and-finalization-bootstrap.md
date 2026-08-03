# V1 Teacher Handoff Preflight and V2 Guardrail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 在不改变游戏运行逻辑的前提下，完整保全现有工作、恢复 Git 引用健康，并从最新评分修正版建立可审计的 V1 教师定稿起点。

**Architecture:** 仓库外恢复点保存 Git 管理数据、全部有效引用和完整未提交文件；损坏的 Codex 内部引用按原字节移出引用命名空间。V1 定稿使用独立分支与工作树，项目记忆记录已批准的 V1 收口边界和 V2 启动触发器。

**Tech Stack:** Git bundle、Git worktree、PowerShell、Markdown、Node.js 22、TypeScript、ESLint。

## Global Constraints

- 教师正式提交候选必须从最新评分修正版 34f97e250c4dcf139e1ae2d3d536af7a0e36786b 开始。
- 原工作区的 3 个 tracked 修改与 28 个 untracked 文件必须逐文件保全，不得自动合并、覆盖或删除。
- 本计划不修改游戏运行代码，不修复已知的低保真 resolveBuyout 静态断言。
- 本计划不提交、不合并、不移动 main、不打冻结标签、不制作教师压缩包，也不启动 V2 实现。
- V2 首次启动时先由 Agent 只读审查仓库；审查后必须主动提醒用户：统一数值权威源已经获批，是 V2 第一项核心产品工程。

---

### Task 1: 建立仓库外可恢复快照

**Files:**
- Create outside repository: D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight
- Create: docs/project/evidence/EXP-014-v1-preflight-recovery-and-classification.md

**Interfaces:**
- Consumes: 三条项目分支、四条有效 Codex tree 引用、两条无分支历史提交、根工作区的未提交文件。
- Produces: 可验证 bundle、原始 .git 冷备份、tracked 补丁、完整文件 overlay 与 SHA-256 清单。

- [x] **Step 1: 记录分支、工作树、状态、坏引用和未提交文件清单**

      git -C D:\实习工作\掌眼 status --porcelain=v2 --branch -uall
      git -C D:\实习工作\掌眼 worktree list --porcelain

- [x] **Step 2: 创建仓库外恢复产物**

      git -C D:\实习工作\掌眼 bundle create <recovery>\all-preserved-refs.bundle <nine-explicit-refs>
      git -C D:\实习工作\掌眼 diff --binary --full-index HEAD --output=<recovery>\tracked-working-tree.patch

- [x] **Step 3: 真实执行恢复性检查**

      git -C D:\实习工作\掌眼 bundle verify <recovery>\all-preserved-refs.bundle
      git clone <recovery>\named-branches.bundle <recovery>\verify-hifi-clone
      git -C <recovery>\verify-hifi-clone apply --check <recovery>\tracked-working-tree.patch

预期并实得：9 条保全引用可列出；补丁可应用；overlay 解包后的 31 个文件与源文件 SHA-256 全部一致。

### Task 2: 修复 Git 引用健康而不丢失历史

**Files:**
- Move from Git namespace: .git/refs/codex/turn-diffs/captures/1784703201187/f78c1703-0904-42ef-804c-2b1e9f575203/base
- Preserve outside repository: D:\实习工作\掌眼_恢复点\2026-08-03-v1-preflight\quarantine\broken-codex-ref-1784703201187-f78c1703-base.bin

**Interfaces:**
- Consumes: 已验证的恢复点和 41 字节坏引用。
- Produces: 可正常遍历的 Git 引用图，以及两个防止历史提交被垃圾回收的救援引用。

- [x] **Step 1: 建立两个只作保全用途的救援引用**

      refs/backup/pre-v1/dangling-d938a51
      refs/backup/pre-v1/dangling-4f69259

- [x] **Step 2: 校验坏引用长度和 SHA-256 后移入恢复点**

预期并实得：长度 41 字节，SHA-256 为 9E1736C43D19118E6CE4302118AF337109491ECC52757DFB949BAD6A7940B0C2。

- [x] **Step 3: 运行引用和对象门禁**

      git -C D:\实习工作\掌眼 show-ref --head
      git -C D:\实习工作\掌眼 fsck --full --no-reflogs
      git -C D:\实习工作\掌眼 log --all --oneline --decorate=short

预期并实得：三项退出码均为 0；只保留可接受的 dangling blob/tree 提示，没有 fatal、error、missing、invalid 或 broken。

### Task 3: 建立 V1 教师定稿工作树并记录边界

**Files:**
- Create: docs/project/decisions/DEC-010-v1-minimal-fix-and-freeze.md
- Create: docs/project/decisions/DEC-011-v2-startup-audit-and-numeric-authority.md
- Modify: docs/project/decisions/index.md
- Modify: docs/project/02-CURRENT-STATE.md
- Modify: docs/project/03-NEXT-ACTIONS.md
- Create: docs/project/evidence/EXP-014-v1-preflight-recovery-and-classification.md

**Interfaces:**
- Consumes: 评分修正版提交 34f97e2、用户批准的方案二、V2 启动提醒决定和未提交文件清单。
- Produces: 分支 codex/v1-teacher-finalize、独立工作树、未提交内容分类、V1/V2 权威边界。

- [x] **Step 1: 从评分修正版创建独立工作树**

      git -C D:\实习工作\掌眼 worktree add D:\实习工作\掌眼\.worktrees\v1-teacher-finalize -b codex/v1-teacher-finalize 34f97e250c4dcf139e1ae2d3d536af7a0e36786b

- [x] **Step 2: 安装依赖并复跑基线门禁**

      npm.cmd ci
      npm.cmd test
      npx.cmd tsc --noEmit
      npm.cmd run lint

实得：npm test 为 77/78，只有已知低保真静态断言失败；TypeScript 与 ESLint 退出码均为 0。

- [x] **Step 3: 写入两条批准决定、当前状态、下一行动与分类证据**

- [x] **Step 4: 运行项目记忆检查器并确认没有游戏运行代码变更**

      python C:\Users\ASUS\.codex\skills\project-co-lead\scripts\check_project_memory.py --root D:\实习工作\掌眼\.worktrees\v1-teacher-finalize

- [x] **Step 5: 由独立 QA 复核恢复点、Git 拓扑、工作区保持性和执行边界**
