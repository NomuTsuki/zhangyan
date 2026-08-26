/* 可行性探针:确认"自由探索"能不能直接驱动已冻结的求解器。
   只读冻结源,不改一个字节。跑法:node probe.mjs */
import { events, thresholds, expectedProfile, claimScopeRequirements,
         actionContracts, proofRoleContracts, unknownRegistry, scenarios } from
  "../first-ceramic-author-scenarios-v0/fixtures.mjs";
import { solveFixture, assertLegalAcquisitionOrder, ModelConflict } from
  "../first-ceramic-author-scenarios-v0/solver.mjs";

/* 和冻结夹具里的 fixture() 同构,但 events/orders 由本局实际行动决定 */
function liveFixture(acquired, playerChoice = "CONTINUE") {
  return {
    id: "live", thresholds, expectedProfile, claimScopeRequirements,
    actionContracts, proofRoleContracts, unknownRegistry, playerChoice,
    events: acquired,
    orders: [acquired.map((e) => e.observationId)],
    expected: {},
  };
}

const E = events;
const line = (s) => console.log(s);

/* 一个 action 可以对应多个 event —— 它们是同一个动作的"不同结局"。
   这是作者侧的分支空间,切片必须决定本案每个动作到底给出哪一个。 */
const byAction = new Map();
for (const [k, e] of Object.entries(E)) {
  if (!byAction.has(e.acquisitionActionId)) byAction.set(e.acquisitionActionId, []);
  byAction.get(e.acquisitionActionId).push(k);
}
line(`事件 ${Object.keys(E).length} 个,分布在 ${byAction.size} 个动作上:`);
for (const [act, ks] of [...byAction].sort()) {
  line(`  ${act}`);
  for (const k of ks) {
    const e = E[k];
    const bits = [];
    if (e.acquisitionRequires.length) bits.push(`需前置事实[${e.acquisitionRequires.join(",")}]`);
    if (e.requiresContextFacts.length) bits.push(`需上下文[${e.requiresContextFacts.join(",")}]`);
    if (e.contextualFacts.length) bits.push(`延迟生效事实[${e.contextualFacts.join(",")}]`);
    if (e.negativeResult) bits.push("阴性");
    if (e.counterevidence) bits.push("反证");
    if (e.factor) bits.push("带边权");
    line(`      ${k.padEnd(32)} facts=[${e.facts.join(",")}]`);
    if (bits.length) line(`      ${"".padEnd(32)} ${bits.join(" · ")}`);
  }
}

function run(label, keys, choice) {
  const acquired = keys.map((k) => {
    if (!E[k]) throw new Error(`no such event: ${k}`);
    return E[k];
  });
  line(`\n=== ${label} ===`);
  line(`  序列: ${keys.join(" -> ")}`);
  try {
    assertLegalAcquisitionOrder(acquired);
  } catch (err) {
    line(`  顺序被拒: ${err.code ?? err.name} — ${err.message}`);
    return;
  }
  let r;
  try {
    r = solveFixture(liveFixture(acquired, choice), acquired);
  } catch (err) {
    line(`  求解抛错: ${err.code ?? err.name} — ${err.message}`);
    return;
  }
  line(`  stage      = ${r.stage}`);
  line(`  claims     = ${JSON.stringify(r.claims)}`);
  line(`  conflicts  = ${JSON.stringify(r.conflicts)}`);
  line(`  facts(${String(r.coverage.facts.length).padStart(2)}) = ${r.coverage.facts.join(", ")}`);
  line(`  depUnits   = ${r.evidence.activeDependencyUnits.map((u) => u.unitId).join(", ") || "(none)"}`);
  line(`  inactive   = ${r.evidence.inactiveObservationIds.join(", ") || "(none)"}`);
  line(`  unresolvedNeg = ${r.evidence.unresolvedNegativeIds.join(", ") || "(none)"}`);
  line(`  scopeLimited  = ${r.evidence.scopeLimitedObservationIds.join(", ") || "(none)"}`);
  line(`  contextualized= ${r.evidence.contextualizedObservationIds.join(", ") || "(none)"}`);
  line(`  marginals  = ${JSON.stringify(r.marginals)}`);
  line(`  supports   = ${JSON.stringify(r.supports)}`);
  line(`  stopping   = ${JSON.stringify(r.stopping)}`);
  line(`  g3Blocking = ${JSON.stringify(r.coverage.g3BlockingUnknowns)}`);
  line(`  majorProofPaths = ${JSON.stringify(r.coverage.majorProofPaths)}`);
  line(`  archiveRelations= ${JSON.stringify(r.coverage.archiveRelations)}`);
}

/* 冻结场景用了哪些事件 —— 本案"正典结局"应当从这里推,不能自己编。 */
const idOf = new Map(Object.entries(E).map(([k, e]) => [e.observationId, k]));
const usage = new Map();
line(`\n冻结场景 ${scenarios.length} 个:`);
for (const s of scenarios) {
  const ks = s.events.map((e) => idOf.get(e.observationId) ?? e.observationId);
  line(`  ${String(s.expected?.stage ?? "?").padEnd(4)} ${s.id}`);
  line(`       ${ks.join(", ")}`);
  for (const k of ks) usage.set(k, (usage.get(k) ?? 0) + 1);
}
line(`\n事件被场景引用次数(0 次的不属于本案正典路线):`);
for (const k of Object.keys(E)) {
  line(`  ${String(usage.get(k) ?? 0).padStart(3)}  ${k}`);
}

/* 1. 空局:玩家什么都没做 */
run("空局(0 个动作)", []);

/* 2. 只有一步,而且是最贵的一步(跳跃探索) */
run("单步跳跃:先上 X 射线", ["xrayEarly"]);

/* 3. 常规 G1 路线 */
run("G1 路线", ["whole", "base", "corpus"]);

/* 4. 换序:同样三步,顺序不同 */
run("G1 换序", ["base", "whole", "corpus"]);

/* 5. 非法顺序:corpus 需要前置事实 */
run("非法顺序:corpus 抢先", ["corpus", "whole", "base"]);

/* 6. 档案路线到 G2 */
run("G2 档案路线", ["whole", "base", "corpus", "accident",
  "t2Attribution", "documentedCurrentCorroboration"]);

/* 7. 物证路线到 G2(跨时点) */
run("G2 物证跨时点路线", ["whole", "base", "corpus", "identityContinuity",
  "xrayEarly", "t1", "repairContinuity"]);

/* 8. 早拿后懂:先 xray 再补上下文 */
run("早拿后懂:xray 先行,后补对象连续", ["xrayEarly", "whole", "base",
  "identityContinuity"]);

/* 9. 重复调查 */
run("重复调查", ["whole", "base", "corpus", "corpusDuplicate"]);

/* 10. 阴性 + 能力不足 */
run("阴性(紫外能力不足)", ["whole", "base", "corpus", "noSignalUnresolved"]);

/* 11. 争议归属:不许升格 */
run("争议归属", ["whole", "base", "corpus", "accident", "t2AttributionContested"]);

/* 12. 手动停手 */
run("手动停手(G2 冻结)", ["whole", "base", "corpus", "accident",
  "t2Attribution", "documentedCurrentCorroboration"], "STOP");
