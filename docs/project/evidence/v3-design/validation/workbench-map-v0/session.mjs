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

export const BUDGET = 12; /* param slice.investigationBudget,见 docs/project/PARAMS.md */

function liveFixture(acquired, playerChoice) {
  return {
    id: "live", thresholds, expectedProfile, claimScopeRequirements,
    actionContracts, proofRoleContracts, unknownRegistry, playerChoice,
    events: acquired,
    orders: [acquired.map((e) => e.observationId)],
    expected: {},
  };
}

export function newSession() {
  return { acquired: [], log: [], spent: 0, stopped: false };
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
    affordable: s.log.length < BUDGET && !s.stopped,
  }));
}

export function take(s, actionId) {
  if (s.stopped) return { ok: false, why: "本局已经收手" };
  if (s.log.length >= BUDGET) return { ok: false, why: "调查机会已经用完" };
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
  s.spent += a.cost;
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
