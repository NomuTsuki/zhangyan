# Zhangyan V1 Teacher Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 把评分修正版整理成自动化全绿、老师可直接理解和运行、同时具备源码与教师演示双包的 V1 冻结版本。

**Architecture:** canonical 高保真 HTML 保持唯一正式运行主体；低保真降级为 legacy smoke，数值实验台保持实验工具。教师材料从仓库文档生成并按严格白名单打包，源码包和演示包都从同一 annotated tag 导出。

**Tech Stack:** TypeScript、Node.js test runner、Vite、Vinext、ESLint、静态 HTML/CSS、Git archive、PowerShell。

## Global Constraints

- 工作分支必须是 codex/v1-teacher-finalize。
- 不修改高保真运行逻辑、NPC 规则、数值公式或评分公式。
- 不读取或合并根工作区 31 个未提交文件。
- 不移动 main，不启动 V2，不推送或部署。
- 教师演示包只含五个白名单文件；完整源码包单独提供。
- 冻结标签固定为 v1.0.0-teacher-handoff。

---

### Task 1: 提交预检、决定、规格与计划

**Files:**
- Create: docs/superpowers/specs/2026-08-03-v1-teacher-handoff-design.md
- Create: docs/superpowers/plans/2026-08-03-v1-teacher-handoff.md
- Include: 当前 7 项 V1 预检和项目记忆变更

**Interfaces:**
- Consumes: DEC-010、DEC-011、EXP-014 与三个只读审计结论。
- Produces: 后续实现不可跨越的 V1 权威、包内容和验证边界。

- [x] **Step 1: 检查工作树只含 9 项预期文档变更**

      git status --short

- [x] **Step 2: 运行文档与项目记忆门禁**

      git diff --check
      python C:\Users\ASUS\.codex\skills\project-co-lead\scripts\check_project_memory.py --root <worktree>

- [x] **Step 3: 只暂存预期文档并检查 staged 清单**

      git add <nine-explicit-doc-paths>
      git diff --cached --name-only
      git diff --cached --check

- [x] **Step 4: 提交规格检查点**

      git commit -m "docs(project): 记录 V1 教师交付收口边界"

### Task 2: 用红灯—绿灯修正 legacy 低保真测试契约

**Files:**
- Modify: 掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/standalone-html.test.mjs
- Modify: 掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/README.md
- Create: 掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/v1-release-contract.test.mjs
- Modify: 掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/package.json
- Create: release/v1-teacher-handoff.json

**Interfaces:**
- Consumes: committed legacy HTML/client、current page.tsx 与 rules.test.mjs 的买断行为契约。
- Produces: 不伪装成现行规则、仍受基础完整性保护的 legacy 快照。

- [x] **Step 1: 新增机器可读发布权威边界测试**

测试必须要求：

    canonicalRuntime 精确指向高保真教师演示
    低保真与数值实验台都位于 excludedRuntimeArtifacts
    canonical 与排除项没有重叠
    包内目标文件名唯一

- [x] **Step 2: 单独运行新测试，确认因发布清单缺失而失败**

      node --experimental-strip-types --test tests/v1-release-contract.test.mjs

预期：FAIL，且失败原因是 release/v1-teacher-handoff.json 不存在。

- [x] **Step 3: 创建发布清单并使权威边界测试通过**

- [x] **Step 4: 最小修改 prototype/README.md 说明 canonical、legacy 与实验工具边界**

- [x] **Step 5: 将原 standalone 正则测试重写为 legacy smoke**

保留：

    doctype、lang、title、基础入口、debug-root
    window.__ZHANGYAN_CASE__ 与 window.__ZHANGYAN_DEBUG__
    单一内联脚本
    client 源完整嵌入 HTML
    new Function 语法检查
    无外部 script 与 stylesheet

删除 61ef25d 加入的 15 条错误规则静态期望；保留 page.tsx 当前契约检查。

- [x] **Step 6: 运行发布清单、standalone、rules 与 hifi 专项测试**

      node --experimental-strip-types --test tests/v1-release-contract.test.mjs tests/standalone-html.test.mjs tests/rules.test.mjs tests/hifi-html.test.mjs tests/hifi-flow.test.mjs

预期：全部通过。

- [ ] **Step 7: 提交测试契约修正**

      git add <release-config> <release-test> <package-json> <standalone-test> <prototype-readme>
      git diff --cached --check
      git commit -m "test(lofi): 明确历史快照与正式规则边界"

### Task 3: 测试先行创建教师项目说明与演示说明

**Files:**
- Create: README.md
- Create: docs/teacher/00_请先看.txt
- Create: docs/teacher/01_掌眼_V1_项目说明.html
- Create: docs/teacher/02_掌眼_V1_演示说明.html
- Modify: release/v1-teacher-handoff.json
- Modify: 掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/prototype/tests/v1-release-contract.test.mjs
- Modify: 掌眼_Codex启动包_v2/掌眼_Codex启动包_v2/README.md
- Modify: docs/project/01-SYSTEM-MAP.md

**Interfaces:**
- Consumes: 项目 Compass、current state、active decisions、canonical 高保真路径和已验证演示路线。
- Produces: 老师可独立阅读的完整项目说明、演示步骤和仓库权威地图。

- [ ] **Step 1: 扩展 release-contract 测试，验证教师包源文件**

测试至少断言：

    发布清单中的所有源文件存在
    两个 HTML 文档为合法自包含 HTML
    不包含外部 script、stylesheet、字体或图片依赖
    不包含本机绝对路径
    canonical 高保真文件存在

项目内容完整性和易懂程度使用人工逐节清单与独立 QA，不用文案正则。

- [ ] **Step 2: 运行 release-contract 专项并确认因教师源文件缺失而失败**

      node --experimental-strip-types --test tests/v1-release-contract.test.mjs

- [ ] **Step 3: 创建根 README 与三份教师文档**

- [ ] **Step 4: 为历史启动包 README 增加醒目入口声明**

旧启动材料仍保留为历史来源，但不能继续自称当前项目入口。

- [ ] **Step 5: 将 SYSTEM-MAP 从高保真待制作和 34/34 旧状态更新为评分修正版事实**

- [ ] **Step 6: 运行 release-contract 测试并确认通过**

      node --experimental-strip-types --test tests/v1-release-contract.test.mjs

### Task 4: 完整构建、自动化与真实浏览器验证

**Files:**
- Modify: docs/project/evidence/EXP-015-v1-teacher-handoff.md
- Modify: docs/project/02-CURRENT-STATE.md
- Modify: docs/project/03-NEXT-ACTIONS.md

**Interfaces:**
- Consumes: 代码、文档和 canonical 构建产物。
- Produces: 冻结前的新鲜证据与项目状态。

- [ ] **Step 1: 运行完整门禁**

      npm.cmd test
      npx.cmd tsc --noEmit
      npm.cmd run lint

预期：全部退出 0；测试 0 失败。

- [ ] **Step 2: 比较 canonical 与 dist/client SHA-256**

- [ ] **Step 3: 在 1440 × 1000 和 390 × 844 复跑正式演示路径**

- [ ] **Step 4: 在真实浏览器检查两份教师 HTML 的布局、可读性和控制台**

- [ ] **Step 5: 写入 EXP-015，并把 CURRENT-STATE 与 NEXT-ACTIONS 更新到冻结语义**

- [ ] **Step 6: 运行项目记忆检查、链接检查与 git diff --check**

### Task 5: 独立 QA、最终提交和冻结标签

**Files:**
- Include: Task 3 与 Task 4 的全部教师交付和项目记忆文件
- Create outside repository: D:\实习工作\掌眼_交付包

**Interfaces:**
- Consumes: cleanly staged V1 交付内容和全套验证证据。
- Produces: 最终 commit、annotated tag、教师演示包、完整源码包和冻结 bundle。

- [ ] **Step 1: 显式暂存交付文件并提交**

      git commit -m "docs(handoff): 完成 V1 教师提交材料"

- [ ] **Step 2: 在最终提交上重新运行完整自动化和 Git 健康检查**

- [ ] **Step 3: 由独立 QA 只读复核范围、结果、教师文档和权威边界**

- [ ] **Step 4: 创建 annotated tag**

      git tag -a v1.0.0-teacher-handoff -m "掌眼 V1 教师提交版"

- [ ] **Step 5: 从标签导出严格白名单教师包和完整源码包**

- [ ] **Step 6: 生成 04_版本与校验.txt、逐文件 SHA-256、ZIP SHA-256 和最终 Git bundle**

- [ ] **Step 7: 解包复验五文件 allowlist、HTML 哈希、源码归属和绝对路径扫描**

- [ ] **Step 8: 独立 QA 复核最终仓库外包；根工作区 31 项再次逐文件验哈希**
