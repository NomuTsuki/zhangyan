# 第一器物确定性作者场景独立复核 v0

Status: Evidence / Deterministic Author Scenarios Independent Pass / Validation-only

日期：2026-08-20

## 结论

第一器物确定性作者场景夹具在冻结输入上取得独立只读复核 **Pass**。最终独立证据为：Node.js `v24.15.0`，四个 JavaScript 文件 `node --check` 为 `4/4`，`node --test .\contract.test.mjs` 为 `37 pass / 0 fail / exit 0`，测试报告时长 `2066.4975 ms`；22 个声明场景逐一覆盖 324 个联合状态，共 `22 × 324 = 7,128` 个场景—状态单元，并检查 34 条已声明合法顺序。manifest 四个来源哈希 `4/4` 与当前文件一致，既往只读探针均已关闭，最终 findings 为 `none`，Verdict 为 `Pass`。

这项 Pass 只关闭“冻结的作者合同能否在这套隔离参考实现、反例和黄金预言机中产生预期确定性结构后果”。它不把夹具升格为产品代码，不批准正式数值，也不证明领域正确、路线成本合理、玩法成立或玩家能够理解。

> 记录边界：本记录取得了最终文件、manifest、当前 Git 只读探针及任务交接中的运行／复核摘要。下文另行保存了负责人收口复验的逐字 stdout；独立复核者的逐字 stdout／逐字回复未保存，因此独立轮次、独立运行数字、findings 与 Verdict 仍只作为证据摘要引用，不冒充原始输出转录。文件内容与哈希则已在本地逐项复核。

## 目的与解锁边界

目的：把已经通过独立静态结构复核的 v0.2 作者合同冻结成可执行场景，检验 G1／G2／G3、证明路线、证据依赖、反证作用域、允许未知、收手冻结和换序不变量在确定性演算中是否自洽，并用独立于求解器运行时的黄金预言机阻止实现自证。

Pass 解锁：依照 DEC-023 的顺序，允许项目把“确定性作者场景”记为已通过，并把下一检查点交给限定领域复核。它不自动授权玩家微循环、真人测试、数值模拟、整局原型、产品代码、Git 提交／推送或发布。

## 冻结输入与来源合同

### manifest 登记的四个来源

以下路径、SHA-256 和角色按 `manifest.json` 原样读取；本地只读复核确认四项声明哈希均与当前文件字节一致。

| 来源 | SHA-256 | manifest 角色 | 使用边界 |
| --- | --- | --- | --- |
| `../../2026-08-15-first-ceramic-paper-evidence-topology-v0.md` | `DDCD4E6FDB89375D6A4EAEE0DD51CACA798C9EA9325D266A7CBA0540A9B4C41B` | `inherit-selected-sections-only` | 仅继承 manifest 白名单段落，禁止回流已废止表面 |
| `../../2026-08-17-first-ceramic-three-result-author-model-v0-2.md` | `073A10D52E8337361AE21DFBFB69256592CEDD2567EF5E188454E652DD023A00` | `authoritative-author-structure` | 12 包、G1／G2／G3、早拿后懂、负向／反证语义和结构不变量的作者结构权威 |
| `../../2026-08-20-first-ceramic-concrete-session-and-owner-structural-review-v0.md` | `D0A55CEDD5029E15AF6F640919E641740BBD6F145132A32BEA47BA5A954FA320` | `illustrative-route-and-OR-input` | 只提供示例路线与 OR 输入，不授权唯一顺序、产品数值或玩家 UI |
| `../../2026-08-20-first-ceramic-independent-structural-review-v0.md` | `898A138E432872F96004F24C9284DF90A5BCEB554D734FE414F714CF19983A03` | `independent-static-pass-and-required-scenario-inputs` | 提供静态 Pass 与必要场景输入，不证明已执行后验、玩法、领域或玩家理解 |

来源 ID、`role`、继承白名单和 coverage 都是作者在 manifest／夹具中的声明，不是仓库外部机构认证、领域专家确认或 Git provenance。

### 独立复核使用的六文件冻结快照

| 文件 | 独立复核快照 SHA-256 | 身份 |
| --- | --- | --- |
| `solver.mjs` | `621BD1540FA7D5BFB77B3BDD0A35712C05A53FC04839C9125BD16E51D46D2381` | 确定性参考求解器 |
| `fixtures.mjs` | `6580BD10454EB16280E944BDA6F07037003754E4A4323F1949BA90EED5F94250` | 场景与冻结技术夹具 |
| `golden.mjs` | `9817145B69BB5E05578C09A0C72A9E567005ED4F7C3816FA5A695344F1AE1A85` | 另行编写的 BigInt 有理数黄金预言机 |
| `contract.test.mjs` | `F71A0591DB024772AC1763AE204D12C25D2B73930261ACED37BD56FA39BC5FFC` | 合同、反例、换序与非法输入测试 |
| `README.md` | `DA3519F9A4AFCD78B1327278C9E7423C562B1CAF2352374D484598D98CFA6574` | 独立复核时的夹具说明快照 |
| `manifest.json` | `3D99FFE512B2A67B1725B0578CB1766DFE48BEE7E589ED66C992F7E4A609446C` | 来源、角色、继承与禁止导入清单 |

`golden.mjs` 只能称为 **separately written / runtime-isolated / independently reviewed**：它不导入求解器或夹具，不由求解器输出生成，也没有 accept／update 路径。现有文件和测试不能证明它在历史上先于实现编写，因此不得称为 pre-registered。

夹具 `README.md` 属于独立复核六文件冻结快照，为保留 `DA3519…` 字节身份，本次收口不在该文件中追加回链；夹具与本 Evidence 的双向导航由父级 `v3-design/README.md` 承担。六个冻结文件均未由本记录修改。

## 验证合同

### 边界与场景

- 运行时只使用 Node.js ESM 与内置模块，不导入或修改 `prototype/**`、V2 reducer／replay／random、V2 fixtures／content／numbers／stage semantics 或其他正式产品模块；
- 324 个联合状态固定为 `2 Identity × 3 RepairHistory × 2 KeyMaterial × 3 Surface × 3 Stability × 3 Documentation`；
- 22 个声明场景覆盖 G1／G2／G3 可达、G2 收手与继续调查、档案／物理证明路线、早拿后懂只计一次、依赖折叠与冲突、阴性能力门、反证作用域、G3 允许未知、答案键攻击和非法输入；
- 34 条已声明合法顺序逐一检查；不把未声明顺序默认为已经穷举。

### oracle、度量与 Pass 规则

- 每个声明场景及合法顺序逐一对照另行编写、运行时隔离的 BigInt 有理数黄金预言机；
- 对主张、冲突、事实分栏、事实来源见证、上下文激活见证、证明组、证明角色、重大证明路线、阶段和停止状态执行精确结构比较；对转换为 JavaScript `Number` 的后验单元、总质量、支持度与定向数值断言分别使用夹具内集中声明的 `5e-15`、`5e-13` 与 `1e-12` 绝对容差。黄金预言机自身仍用 BigInt 有理数保存质量与支持表达；
- 完整 `marginals` 与完整 `evidence` 元数据不由黄金预言机独立覆盖，而由换序全快照相等与定向断言补充；
- 非法 prior、阈值、factor、action／method／fact lane、counterevidence relation／target、dependency partition 和 scenario order 必须 fail-closed，并返回匹配失败原因；
- STOP 后继续追加证据必须返回 `RUN_FROZEN`；
- Pass 要求四个目标 JavaScript 文件语法检查全部通过，37 个 Node 测试全部通过、0 fail、退出码 0，manifest 四个来源哈希全部匹配，独立只读复核未留下 finding。

### 稳定性、输出与副作用

- 演算无随机种子、重试或统计容差；相同冻结字节与 Node 版本应产生可重现结果；
- 测试只向标准输出打印摘要，不生成或覆盖结果文件；
- 独立复核为只读任务；夹具目录当时为 untracked，`git ls-files` 命中 `0`，目标路径 Git 历史命中 `0`，因此没有可引用的提交／tag／blob provenance。

## 保留的失败史

失败没有被后续绿灯覆盖；以下按任务交接顺序保存为摘要。

1. **负责人初始运行：13/15。** 两项因浮点精确等式失败；改用正确的确定性比较后，负责人运行达到 `15/15`。
2. **独立第一轮：Fail。** 暴露依赖单位顺序、同源拆分、反证范围／G3 unknown、omnibus、非法输入、STOP 语义和 coverage 缺失。负责人修补后得到 `19/19`，但这是 false-green：自有测试全绿并未关闭独立发现。
3. **独立第二轮：Fail。** 暴露 out-of-scope factor、omnibus、G3 unknown、非法 prior／relation／fact／order、STOP／frozen 和缺少 oracle。修复后负责人运行 `29/29`。
4. **黄金预言机加强：31/31。** 加入运行时隔离、手写 BigInt 有理数黄金预言机；该状态仍不等于独立 Pass。
5. **只读探针：7 项。** 发现 negative X-ray raw-proof、STOP schema、lane overlap、prior reason ordering、coverage null、projection nonfinite／overflow 和 context provenance；修复后负责人运行 `32/32`。
6. **独立第三轮：Fail，尽管负责人为 32/32。** 暴露单 X-ray／单文档答案钥匙、empty source、schema、STOP 一致性、golden 措辞／覆盖，以及 D0 输入与 untracked 限制。修复后负责人运行 `34/34`。
7. **独立第四轮：Fail，尽管负责人为 34/34。** 求解器遗漏了 v0.2 档案路线的 `current map OR cross-time`：档案路线被静默收紧为必须存在现器具名修复图。
8. **最终修复：37/37。** 显式补齐 proof role／source／coverage，并覆盖档案跨时点正负分支；第五轮同一只读复核任务给出 Pass，既往探针全部关闭，findings 为 `none`。

这段历史说明：负责人 `19/19`、`32/32`、`34/34` 的绿灯都不能单独支持“独立通过”；最终结论依赖冻结字节、扩展后的反例／oracle、第五轮独立只读重放和无残留 findings 的组合。

## 最终执行摘要

运行目录：`docs/project/evidence/v3-design/validation/first-ceramic-author-scenarios-v0/`

```powershell
node --version
node --check .\solver.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node --check .\fixtures.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node --check .\golden.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node --check .\contract.test.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Output 'NODE_CHECK_4_OF_4_PASS'
node --test .\contract.test.mjs
exit $LASTEXITCODE
```

| 项目 | 观察结果 |
| --- | --- |
| Node.js | `v24.15.0` |
| 语法 | `4/4` pass |
| 测试 | `37/37` pass，`0` fail |
| 进程 | exit `0` |
| 报告时长 | `2066.4975 ms` |
| 场景—状态 | `22 × 324 = 7,128` cells |
| 声明合法顺序 | `34` |
| manifest 来源 | `4/4` hash match，含 `D0A55C…` |
| 既往探针 | 全部关闭 |
| 最终 findings | `none` |
| 独立 Verdict | `Pass` |

### 负责人收口复验的原始 stdout

以下是项目负责人在证据收口时、对同一组六文件冻结字节再次执行上述 PowerShell 包装命令所得的完整标准输出。其中 `v24.15.0` 来自 `node --version`，`NODE_CHECK_4_OF_4_PASS` 是四次 `node --check` 分别通过退出码检查后由包装命令输出的标记。它证明收口时仍为 `4/4` 语法检查与 `37/37` 测试通过；它不替代上表所引用的第五轮独立只读复核，也不是独立复核者 stdout。

```text
v24.15.0
NODE_CHECK_4_OF_4_PASS
✔ frozen manifest sources match exact SHA-256 inputs (6.0826ms)
✔ joint author state space contains exactly 324 unique states (0.6624ms)
V3_AUTHOR_SCENARIOS {"g1-oriented":"G1","g2-documented-stop":"G2","g2-documented-cross-time-or":"G2","g2-continue-no-progress":"G2","g2-alternate-physical":"G2","professional-evidence-early":"G2","g3-with-allowed-unknowns":"G3","g2-surface-bad-news-stable":"G2","g2-stability-bad-news-stable":"G2","g2-hard-counter-downgrade":"G1","g2-out-of-scope-counter-stable":"G2","g2-out-of-scope-factor-stable":"G2","g2-major-weakened-stable":"G2","g2-major-bounded-stable":"G2","g2-logical-counter-downgrade":"G1","g2-identity-hard-counter-downgrade":"G1","g2-insufficient-counter-unresolved":"G2","marginal-splice-rejected":"G1","single-test-answer-key-rejected":"NONE","near-complete-single-instrument-rejected":"G1","near-complete-single-glue-line-rejected":"G1","single-document-answer-key-rejected":"G1"}
✔ golden oracle has no runtime dependency or mutation path to solver modules (0.7337ms)
✔ every declared legal order matches the runtime-separated 324-cell rational golden (1886.2287ms)
✔ declared scenario matrix reaches or rejects the expected result (18.1024ms)
✔ every declared legal order produces the same complete state snapshot (27.252ms)
✔ G2 can stop, then non-progress still spends attempts and returns to G2 (2.4409ms)
✔ same dependency unit folds once while independent corroboration can move support (4.295ms)
✔ professional evidence can be acquired early and contextualized without recount (1.7754ms)
✔ surface-only bad news preserves the complete h marginal and does not break G2 (2.6358ms)
✔ stability-only bad news preserves the complete h marginal and does not break G2 (2.2831ms)
✔ capability-limited no-signal remains unresolved rather than absence-supported (0.8887ms)
✔ capability-insufficient counterevidence cannot create absence support or block G2 (0.9525ms)
✔ abstract scoped hard counterevidence downgrades G2 without erasing identity or G1 (0.8653ms)
✔ a capable negative result outside the necessary scope only bounds the claim (0.8973ms)
✔ an out-of-scope global factor is suppressed instead of silently downgrading G2 (1.6033ms)
✔ weakens and bounds/refines remain nonblocking while logical refutation blocks (3.1552ms)
✔ direct identity counterevidence downgrades G2 without erasing the G1 frame (0.716ms)
✔ high identity and major marginals cannot splice a false G2 (0.8556ms)
✔ one advanced test is not an answer key (0.6634ms)
✔ instrument, glue-line and document near-misses cannot supply omitted proof groups (2.7255ms)
✔ major proof eligibility is bound to source group, coverage and distinct role slots (5.0779ms)
✔ documented T2 accepts the declared cross-time OR without a current repair map (1.5203ms)
✔ documented cross-time proof fails closed on source, coverage, role or fact defects (1.4519ms)
✔ the documented OR does not relax the physical major route (0.8181ms)
✔ an omnibus instrument event is rejected by action, method and fact-axis authority (0.3409ms)
✔ G3 can establish while declared noncritical unknowns remain (0.8623ms)
✔ G3 rejects every registered decision-critical unknown class (5.7027ms)
✔ shared source or latent IDs cannot be hidden behind a second dependency unit (0.1891ms)
✔ noncommuting axis constraints fail closed regardless of dependency-unit ID order (4.6821ms)
✔ invalid priors, thresholds, factor weights and unknown IDs fail closed by reason (1.0496ms)
✔ derived numeric overflow and invalid public posterior projections fail closed (1.6629ms)
✔ nested action, proof-role and unknown policy schemas fail closed (0.3282ms)
✔ invalid counter relations, targets and negative fact lanes fail closed (0.6664ms)
✔ declared scenario orders must be complete exact permutations (0.1168ms)
✔ conflicting factors inside one dependency unit fail as MODEL_CONFLICT (0.2019ms)
✔ scenario summary (17.1089ms)
ℹ tests 37
ℹ suites 0
ℹ pass 37
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2080.1178
```

## Pass 的准确含义

可以声称：在上述六文件冻结快照、Node `v24.15.0` 和 manifest 登记的作者输入下，隔离参考求解器通过了已声明的确定性合同、反例和换序检查；黄金预言机是另行编写、运行时隔离并经过独立复核的比较层；第五轮同一只读任务未留下 finding。

不可以声称：黄金预言机已预注册；夹具是未来生产架构；所有可能调查顺序已经穷举；作者声明的来源 ID／角色／coverage 已获外部真实性认证；或这次 Pass 已验证产品、玩法、平衡、玩家、UI、领域结论与正式数值。

## 盲点与残余风险

- 未穷举 34 条声明合法顺序之外的未声明顺序；未声明并不等于非法，也不等于已验证；
- 未验证来源 ID、proof role、coverage 和 source grouping 的外部真实性；它们仅是作者输入合同；
- 未验证文物／修复／材料检测／档案学等限定领域的准确性；
- 未验证调查成本、路线非支配、信息价值、市场映射或其他产品数值；fixture prior、相容权重与阈值不得回流为正式似然、价格、阶段门或平衡参数；
- 未验证玩家微循环、趣味、节奏、可理解性、无答案玩家行为、完整一局或真人测试；
- 未验证玩家 UI、可访问性、视觉表达、交互反馈或移动端实现；
- 未验证正式产品代码、架构适配、V2 技术接缝、持久化、回放或部署；参考求解器没有生产权威；
- 黄金预言机不独立覆盖完整诊断 `marginals` 与完整 `evidence` 元数据，也没有历史先写／预注册证据；
- validation 目录未被 Git 跟踪且没有目标路径历史，六文件冻结快照只有当前文件哈希与交接证据，没有提交级 provenance；
- 本记录只保存了负责人收口复验的逐字 stdout；独立复核者的逐字 stdout／逐字回复未保存，独立运行轮次与 Verdict 只能作为摘要引用。

## 后续

按 DEC-023，下一步是限定领域复核。若后续修改 `solver.mjs`、`fixtures.mjs`、`golden.mjs`、`contract.test.mjs`、`manifest.json` 或作者来源输入，当前 Pass 不自动覆盖新字节；应重新冻结哈希、重跑合同并恢复独立复核。
