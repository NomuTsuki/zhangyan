/* 一局的状态机。只读冻结求解器与夹具,复用切片的动作投影 case.mjs。

   为什么这里又有一份而不是 import 切片的 harness.mjs:
   那个文件在模块顶层就跑自检并调用 process.exit,没法当库导入;它是一个通过中的
   测试文件(15/15),而且属于已被 DEC-032 推翻的切片,基本是存档。改它要按项目规矩
   无条件送审,收益却只是省下这四十行。所以这里重抄一份,往后以本文件为准。
   两份若出现分歧,以本文件为准,切片那份不再跟随。 */
import { events, thresholds, expectedProfile, claimScopeRequirements,
         actionContracts, proofRoleContracts, unknownRegistry } from
  "../first-ceramic-author-scenarios-v0/fixtures.mjs";
import { solveFixture, assertLegalAcquisitionOrder } from
  "../first-ceramic-author-scenarios-v0/solver.mjs";
import { ACTION_BY_ID, availability } from "../knowledge-map-slice-v0/case.mjs";

/* param slice.investigationBudget,见 docs/project/PARAMS.md
   开局前可调,范围 [BUDGET_MIN, BUDGET_MAX]。下界 12 是原先的固定值,来自冻结场景的
   路线长度反推;上界由 ceiling.mjs 从冻结拓扑跑出,等于"互异动作各做一次"的步数,
   超过它每一步都只能是重复。默认取上界 —— 先慷慨,压力靠玩家自己收手而不是靠预算卡。 */
export const BUDGET_MIN = 12;
export const BUDGET_MAX = 22;
export const BUDGET_DEFAULT = BUDGET_MAX;

export function clampBudget(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return BUDGET_DEFAULT;
  return Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, v));
}

function liveFixture(acquired, playerChoice) {
  return {
    id: "live", thresholds, expectedProfile, claimScopeRequirements,
    actionContracts, proofRoleContracts, unknownRegistry, playerChoice,
    events: acquired,
    orders: [acquired.map((e) => e.observationId)],
    expected: {},
  };
}

/* 两种货币,只有一种约束(2026-08-31 用户决定):
   —— 步数是唯一硬约束,每个动作恰好扣 1 步,不分档;
   —— 钱只累加、局末告知,本阶段不设预算、不订数值。

   `billed` 按档计数而**不求和**。求和(旧的 `spent += a.cost`)等于断言中档花的钱
   是低档的两倍,而档位只是序数,那个倍数从未被批准。等钱的数值系统定下来,
   把这四个计数乘上单价即可,不必回头拆一个已经混在一起的和。 */
export function newSession(budget = BUDGET_DEFAULT) {
  return { acquired: [], log: [], billed: [0, 0, 0, 0], stopped: false,
           budget: clampBudget(budget) };
}

/* 预算只在开局前可改:一步都还没走时改是调难度,走过之后改是作弊。 */
export function setBudget(s, n) {
  if (s.log.length) return { ok: false, why: "已经动过手了,本局预算不能再改" };
  s.budget = clampBudget(n);
  return { ok: true, budget: s.budget };
}

export function solve(s) {
  return solveFixture(liveFixture(s.acquired, s.stopped ? "STOP" : "CONTINUE"), s.acquired);
}

export function factsOf(s) {
  if (!s.acquired.length) return new Set();
  return new Set(solve(s).coverage.facts);
}

/* 左侧工作台的可用性。器物侧不受解锁约束,门槛只来自前置事实与机会预算
   —— DEC-032 第三节。 */
export function workbench(s) {
  const facts = factsOf(s);
  const done = s.log.map((l) => l.actionId);
  return availability(facts, done).map((x) => ({
    ...x,
    done: done.includes(x.action.id),
    affordable: s.log.length < s.budget && !s.stopped,
  }));
}

export function take(s, actionId) {
  if (s.stopped) return { ok: false, why: "本局已经收手" };
  if (s.log.length >= s.budget) return { ok: false, why: "行动点数已经用完" };
  const a = ACTION_BY_ID.get(actionId);
  if (!a) return { ok: false, why: `没有这个动作:${actionId}` };
  const facts = factsOf(s);
  const av = availability(facts, s.log.map((l) => l.actionId))
    .find((x) => x.action.id === actionId);
  if (!av.usable) return { ok: false, why: av.why };

  const eventKey = a.outcome(facts);
  const ev = events[eventKey];
  const next = [...s.acquired, ev];
  try {
    assertLegalAcquisitionOrder(next);
  } catch (err) {
    return { ok: false, why: `顺序非法:${err.message}` };
  }
  const before = solve(s);
  s.acquired = next;
  s.billed[a.cost] += 1;
  s.log.push({ actionId, eventKey, observationId: ev.observationId, cost: a.cost });
  const after = solve(s);

  /* 足迹分类:只看求解器输出的差,不看作者真相。 */
  const gainedFacts = after.coverage.facts.filter((f) => !before.coverage.facts.includes(f));
  const newInfo = gainedFacts.filter((f) => f !== "repeatObservation");
  const kind =
    gainedFacts.includes("repeatObservation") ? "repeat"
    : after.evidence.unresolvedNegativeIds.includes(ev.observationId) ? "negative"
    : after.evidence.inactiveObservationIds.includes(ev.observationId) ? "suspended"
    : newInfo.length === 0 ? "deadend"
    : "progress";
  return {
    ok: true, kind, gainedFacts, observationId: ev.observationId,
    stageMoved: before.stage !== after.stage, from: before.stage, to: after.stage,
    before, after,
  };
}
