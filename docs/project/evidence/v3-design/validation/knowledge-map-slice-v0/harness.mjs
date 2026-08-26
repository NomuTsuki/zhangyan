/* 无界面跑通:结局表 + 可用性 + 求解器 + 玩家读数。
   目的是在写任何 UI 之前把设计风险最高的一层验掉。跑法:node harness.mjs */
import { events, thresholds, expectedProfile, claimScopeRequirements,
         actionContracts, proofRoleContracts, unknownRegistry } from
  "../first-ceramic-author-scenarios-v0/fixtures.mjs";
import { solveFixture, assertLegalAcquisitionOrder } from
  "../first-ceramic-author-scenarios-v0/solver.mjs";
import { ACTIONS, ACTION_BY_ID, COST_LABEL, availability, playerView } from "./case.mjs";

export const BUDGET = 12; /* param slice.investigationBudget,见 PARAMS.md */

function liveFixture(acquired, playerChoice) {
  return {
    id: "live", thresholds, expectedProfile, claimScopeRequirements,
    actionContracts, proofRoleContracts, unknownRegistry, playerChoice,
    events: acquired,
    orders: [acquired.map((e) => e.observationId)],
    expected: {},
  };
}

/* 一局的完整状态机。UI 以后只是它的一层皮。 */
export function newSession() {
  return { acquired: [], log: [], spent: 0, stopped: false };
}

export function factsOf(s) {
  if (!s.acquired.length) return new Set();
  return new Set(solveFixture(liveFixture(s.acquired, "CONTINUE"), s.acquired).coverage.facts);
}

export function solve(s) {
  return solveFixture(liveFixture(s.acquired, s.stopped ? "STOP" : "CONTINUE"), s.acquired);
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

  const ev = events[a.outcome(facts)];
  const next = [...s.acquired, ev];
  try {
    assertLegalAcquisitionOrder(next);
  } catch (err) {
    return { ok: false, why: `顺序非法:${err.message}` };
  }
  const before = solve(s);
  s.acquired = next;
  s.spent += a.cost;
  s.log.push({ actionId, eventKey: a.outcome(facts), cost: a.cost });
  const after = solve(s);

  /* 足迹分类。全部只看求解器输出的差,不看作者真相。 */
  const gainedFacts = after.coverage.facts.filter((f) => !before.coverage.facts.includes(f));
  const newInfo = gainedFacts.filter((f) => f !== "repeatObservation");
  const stageMoved = before.stage !== after.stage;
  const kind =
    gainedFacts.includes("repeatObservation") ? "repeat"
    : after.evidence.unresolvedNegativeIds.includes(ev.observationId) ? "negative"
    : newInfo.length === 0 ? "deadend"
    : "progress";
  return { ok: true, kind, gainedFacts, stageMoved, from: before.stage, to: after.stage };
}

/* ---------- 以下是自检 ---------- */
const line = (s) => console.log(s);
let fails = 0;
function check(label, cond, detail = "") {
  if (!cond) { fails++; line(`  FAIL  ${label} ${detail}`); }
  else line(`  ok    ${label} ${detail}`);
}

function play(label, actionIds, { stop = false } = {}) {
  line(`\n=== ${label} ===`);
  const s = newSession();
  for (const id of actionIds) {
    const r = take(s, id);
    const a = ACTION_BY_ID.get(id);
    if (!r.ok) { line(`  x ${a?.name ?? id} — ${r.why}`); continue; }
    const mark = { progress: "推进", repeat: "重复", negative: "阴性", deadend: "无新信息" }[r.kind];
    line(`  ${String(s.log.length).padStart(2)}. ${a.name.padEnd(14)} 费用${COST_LABEL[a.cost]}` +
      `  [${mark}]${r.stageMoved ? `  ${r.from}→${r.to}` : ""}`);
  }
  if (stop) s.stopped = true;
  const v = playerView(solve(s));
  line(`  ---- 局面 ----`);
  line(`  阶段 ${v.stage} · 用掉机会 ${s.log.length}/${BUDGET} · 费用档合计 ${s.spent}`);
  line(`  能主张:${v.can.length ? v.can.join(" / ") : "(还什么都不能主张)"}`);
  line(`  G2 两条路线:档案=${v.routes.documented} 物证=${v.routes.physical}`);
  for (const g of v.archive) {
    line(`  ${g.group} 三关系:记录内部=${g.recordCoherence} 记录—现器=${g.objectAttribution} 事件—物证=${g.eventCorroboration}`);
  }
  if (v.pending.length) line(`  挂起未激活:${v.pending.join(", ")}`);
  if (v.activated.length) line(`  后来被激活:${v.activated.join(", ")}`);
  if (v.negativeUnresolved.length) line(`  阴性未过能力门:${v.negativeUnresolved.join(", ")}`);
  if (v.blocking.length) line(`  阻断 G3 的未知:${v.blocking.join(", ")}`);
  return { s, v };
}

line("### 1. 空局:每个动作可不可用,理由讲不讲得清");
{
  const av = availability(new Set(), []);
  for (const x of av) {
    line(`  ${x.usable ? "可用" : "不可用"}  ${x.action.name.padEnd(14)} ${x.why ?? ""}`);
  }
  const unusable = av.filter((x) => !x.usable);
  check("每个不可用动作都带人话理由", unusable.every((x) => x.why && x.why.length > 0));
  check("空局就有可用动作(不需要预置开局)", av.some((x) => x.usable));
}

const r1 = play("2. 档案路线到 G2", [
  "A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.COMPARE.CORPUS",
  "A.RESEARCH.ACCIDENT", "A.RELATE.ARCHIVE.T2_TO_OBJECT",
  "A.CORROBORATE.ARCHIVE.T2_CURRENT",
]);
check("档案六步到 G2", r1.v.stage === "G2", `实际 ${r1.v.stage}`);
check("档案路线成立", r1.v.routes.documented === true);
check("物证路线未成立", r1.v.routes.physical === false);

const r2 = play("3. 物证路线到 G2", [
  "A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.VERIFY.OBJECT_CONTINUITY",
  "A.OBSERVE.REGION_DECOR", "A.IMAGE.XRAY", "A.MAP.REGION_CONTINUITY",
]);
check("物证六步到 G2", r2.v.stage === "G2", `实际 ${r2.v.stage}`);
check("物证路线成立", r2.v.routes.physical === true);

const r3 = play("4. 早拿后懂:X 射线先行", [
  "A.IMAGE.XRAY", "A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.VERIFY.OBJECT_CONTINUITY",
]);
check("X 射线先行时读数先挂起", r3.s.log.length === 4);
check("补上对象连续后被激活", r3.v.activated.includes("obs.structure.xray.early"),
  `activated=${r3.v.activated.join(",")}`);
check("激活后结构事实才出现", r3.v.facts.includes("currentStructureReadoutByRegion"));

const r4 = play("5. 重复调查", [
  "A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.COMPARE.CORPUS", "A.COMPARE.CORPUS.RECHECK",
]);
check("重复被认成 repeat", r4.s.log.at(-1).actionId === "A.COMPARE.CORPUS.RECHECK");
check("重复不推进阶段", r4.v.stage === "G1", `实际 ${r4.v.stage}`);

const r5 = play("6. 阴性:紫外能力不足", [
  "A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.COMPARE.CORPUS", "A.SCREEN.UV",
]);
check("阴性挂在未过能力门", r5.v.negativeUnresolved.length === 1,
  `实际 ${r5.v.negativeUnresolved.join(",")}`);
check("阴性不推进阶段", r5.v.stage === "G1", `实际 ${r5.v.stage}`);

line("\n### 7. 跨时点对照在没有第二时点时不可用,而且说得出为什么");
{
  const s = newSession();
  take(s, "A.OBSERVE.WHOLE"); take(s, "A.OBSERVE.BASE");
  const r = take(s, "A.MAP.REGION_CONTINUITY");
  line(`  ${r.ok ? "居然可用" : "不可用"} — ${r.why ?? ""}`);
  check("被正确挡住", r.ok === false);
  check("理由是人话不是 fact id", !!r.why && !r.why.includes("_") && r.why.length > 10);
}

const r6 = play("8. 手动停手:G2 冻结", [
  "A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.COMPARE.CORPUS",
  "A.RESEARCH.ACCIDENT", "A.RELATE.ARCHIVE.T2_TO_OBJECT",
  "A.CORROBORATE.ARCHIVE.T2_CURRENT",
], { stop: true });
check("停手后阶段被冻结", solve(r6.s).stopping.frozenStage === "G2",
  `实际 ${JSON.stringify(solve(r6.s).stopping)}`);
check("停手不是系统自动结束", solve(r6.s).stopping.systemAutoEnded === false);

line("\n### 9. 机会预算真的会用完");
{
  const s = newSession();
  const order = ["A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.COMPARE.CORPUS",
    "A.RESEARCH.ACCIDENT", "A.RELATE.ARCHIVE.T2_TO_OBJECT",
    "A.CORROBORATE.ARCHIVE.T2_CURRENT", "A.VERIFY.OBJECT_CONTINUITY",
    "A.LOCATE.HISTORIC_IMAGE", "A.RESEARCH.LATE_TREATMENT",
    "A.RELATE.ARCHIVE.T3_TO_OBJECT", "A.CORROBORATE.ARCHIVE.T3_CURRENT",
    "A.ANALYZE.MATERIAL.SUBSTRATE", "A.INSPECT.MATERIAL.LAYER_SEQUENCE",
    "A.INSPECT.WINDOWS", "A.SYNTHESIZE.SURFACE_REGIONS",
    "A.ASSESS.TREATED_AND_UNTREATED", "A.TRACE.PROVENANCE_CHAIN"];
  let refused = 0;
  for (const id of order) { const r = take(s, id); if (!r.ok) refused++; }
  line(`  用掉 ${s.log.length}/${BUDGET},被拒 ${refused} 次`);
  const v = playerView(solve(s));
  line(`  阶段 ${v.stage},G3 需要 17 步,预算 ${BUDGET} 步`);
  check("预算确实会用完", s.log.length === BUDGET);
  check("G3 在一局内到不了(DEC-027:首案以 G2 收手)", v.stage !== "G3", `实际 ${v.stage}`);
}

line(`\n${fails === 0 ? "全部通过" : `${fails} 项失败`}`);
process.exit(fails === 0 ? 0 : 1);
