# 第一陶瓷切片 G2 稳定性与场景范围重分类 v0

Status: Independent scope Pass / Pre-product only

日期：2026-08-23

## 目的

本记录落实 [DEC-027](../../decisions/DEC-027-v3-first-ceramic-stable-g2-and-post-g2-fallback.md)：首案正常后段以“G3 未形成，带着更多成果和成本停在 G2”为回退语义；永久 `G2 → G1` 只保留为通用系统防御、未来案件能力和对抗性测试。

它只重分类既有确定性场景的适用范围，不修改首案客观真相、冻结作者规格、求解器算法、场景输入、黄金预言机、既有断言或历史 Pass。

## 冻结基线

以下六文件是 2026-08-21 独立 `40/40` Pass 的冻结合同，本次不得改字节：

| 文件 | SHA-256 |
|---|---|
| `solver.mjs` | `E217CAF56A9961EA7C46151E1CA6B0546A6C408CCC8ECDDB21E4B9DA66EE72D1` |
| `fixtures.mjs` | `B3ED4F357B8FB84EAAB4F14CAF4629E62BF11F9C44BEFA5AAD6730C3393E0FDD` |
| `golden.mjs` | `6814029A5C85B17719D1F8761C1F86DED5A5E2606F618F353F08F7AB798422BB` |
| `contract.test.mjs` | `F5E9550DC5FA6BF7FA7DB875F67BE32EFA5B465F747F931EA65C021E887B83FB` |
| `README.md` | `D4FFE289765B3F2E0D4CDC243E4F2FD2F03A89523052C877B2E4BD926DB3CE08` |
| `manifest.json` | `66C8A51637BE14460AAE3EBA2E28DEBB9CD1CA7DB5B8AC7A53D180ACEFEDBBCB` |

## 追加式分类覆盖层

- [scenario-scope-classification.mjs](validation/first-ceramic-content-scope-v0/scenario-scope-classification.mjs) 把 24 个既有场景互斥、穷尽地分为四类；
- [scenario-scope-classification.test.mjs](validation/first-ceramic-content-scope-v0/scenario-scope-classification.test.mjs) 检查旧六哈希、分类互斥／穷尽、每项预期阶段、永久 G2 降级只存在于通用防御类、纯物证 G2 遇到七种后段档案／时间关系冲突仍保持 G2，以及六类决策关键未知只阻断 G3；
- 两个新文件不被写入旧 manifest，也不冒充 2026-08-21 的独立 Pass 输入。它们是 DEC-027 之后追加的范围解释层。

| 分类 | 含义 | 场景数 |
|---|---|---:|
| 首案真相一致的路线例 | 可以成为首案正常内容或路线表达；不表示每个场景都已被选为最终玩家内容 | 11 |
| 首案真相一致的防越权探针 | 检查范围错误、微弱反证、能力不足等不得击穿 G2 | 5 |
| 通用防御／未来案件专用 | 检查真正冲突输入会令静态求解器退出 G2；不得作为首案正常可达内容 | 3 |
| 纯结构对抗测试 | 检查边际拼接与单项答案键；不是玩家路线 | 5 |

三个被重分类的永久降级场景是：

- `g2-hard-counter-downgrade`；
- `g2-logical-counter-downgrade`；
- `g2-identity-hard-counter-downgrade`。

旧场景名中的 `g2` 描述的是其注入前的静态输入，`downgrade` 描述当前无历史求解器的输出；两者都不再携带“首案应当作者化这条路线”的产品含义。

## 验证合同

### Routine：旧合同不回归

在 `validation/first-ceramic-author-scenarios-v0/` 执行：

```powershell
node --test .\contract.test.mjs
```

预期：`40/40` 通过，旧六哈希保持逐项一致。

### Routine：新范围覆盖层

在 `validation/first-ceramic-content-scope-v0/` 执行：

```powershell
node --test .\scenario-scope-classification.test.mjs
```

预期：

- 冻结六文件哈希 `6/6`；
- 24 个场景恰好分类一次；
- 每个分类项与冻结 fixture 的预期阶段一致；
- 三个永久 G2 降级场景只属于通用防御／未来案件类；
- 纯物证 G2 分别追加 T2／T3 六种关系冲突和三阶段时间冲突后，身份与显著重组仍成立，最高阶段保持 G2；新增调查写入账本、增加 attempt 且系统不自动结束；
- 六类决策关键未知分别阻断 G3，但保留身份、显著重组和 G2，系统仍不自动结束。

## 当前结果

负责人在 Node `v24.15.0` 下执行并观察：

- 新增两文件 `2/2 node --check`；
- 新范围合同 `6 tests / 6 pass / 0 fail`；
- 冻结六文件哈希 `6/6`；
- 24 个既有场景互斥、穷尽且各自预期阶段匹配；
- 三个永久 G2 降级场景只存在于通用防御／未来案件类；
- 纯物证 G2 分别追加七种后段档案／时间冲突后仍为 G2，新增观察保留在账本、attempt 增加且系统不自动结束；
- 六类决策关键未知分别阻断 G3，但保留身份、显著重组和 G2，系统不自动结束；
- 旧合同另行重跑仍为 `40 tests / 40 pass / 0 fail`。

### 保留的负责人失败史

第一次运行新范围合同为 `3/4`：覆盖层手抄的 `manifest.json` 期望哈希漏了四个字符，实际冻结文件哈希始终正确；修正覆盖层字符串后为 `4/4`。随后把两个新增文件从旧六文件目录迁到独立相邻目录时，第一次语法检查发现 import 行机械重复；修正后重新运行，并在补入七种局部冲突与六类关键未知后取得最终 `6/6`。这些失败没有修改旧六文件。

同一范围覆盖层随后交给临时只读独立复核者。复核者确认此前唯一阻断——本记录中 `manifest.json` 哈希少四个字符——已经修正；完整 64 位值与实际冻结文件一致，修正没有引入额外文件或越界改动。Findings：None；Verdict：**Independent Pass**。

该 Pass 只证明范围覆盖层与冻结场景清单自洽、旧合同字节未漂移且当前声明的首案后段探针保持 G2；不能证明有历史状态的争议／降级／恢复生命周期、首案玩家体验、地图表达、实际成本张力、领域真实性、数值或产品代码成立。

## 重新讨论触发

- 旧六文件任一哈希漂移；
- 24 个场景出现漏分、重分或预期阶段变化；
- 首案正常内容重新引用三个通用防御场景作为永久 G2→G1 路线；
- 通用求解器准备进入产品实现，需要从静态重算升级为有历史状态的生命周期模型。
