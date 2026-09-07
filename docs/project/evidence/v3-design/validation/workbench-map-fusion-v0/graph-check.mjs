import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildGraph, diffGraphs } from "./graph.mjs";
import { ACTIONS, ACTION_BY_ID } from "../knowledge-map-slice-v0/case.mjs";
import { newSession, take, solve, workbench } from "../workbench-map-v0/session.mjs";
import { scenarios, eventsForOrder } from "../first-ceramic-author-scenarios-v0/fixtures.mjs";
import { solveFixture } from "../first-ceramic-author-scenarios-v0/solver.mjs";

let checks = 0;
const checked = (name) => { checks++; console.log(`PASS ${name}`); };
const graph = (session) => buildGraph(solve(session), session);
const node = (g, id) => g.nodes.find((item) => item.id === id);
const frontier = (g, id) => g.frontiers.find((item) => item.id === id);
const act = (session, action) => assert.equal(take(session, action).ok, true, action);
const run = (actions) => {
  const session = newSession();
  for (const action of actions) act(session, action);
  return session;
};
function integrity(g, solved) {
  const known = new Set(solved.evidence.observationIds);
  const nodes = new Set(g.nodes.map((item) => item.id));
  const edges = new Set(g.edges.map((item) => item.id));
  assert.equal(nodes.size, g.nodes.length);
  assert.equal(edges.size, g.edges.length);
  assert.equal(new Set(g.frontiers.map((item) => item.id)).size, g.frontiers.length);
  assert.strictEqual(g.questions, g.frontiers);
  assert.equal(g.stage.key, solved.stage);
  assert.deepEqual(new Set(g.observations.map((item) => item.id)), known);
  for (const n of g.nodes) {
    assert.ok(n.sourceIds.length);
    for (const id of n.sourceIds) assert.ok(known.has(id), `unknown node source ${id}`);
    if (n.kind === "evidence") assert.ok(known.has(n.id), `invented node ${n.id}`);
    if (n.kind === "claim" && n.state === "established") assert.equal(solved.claims[n.id.slice(6)].established, true);
  }
  for (const e of g.edges) {
    assert.ok(nodes.has(e.from) && nodes.has(e.to));
    assert.ok(e.sourceIds.length);
    for (const id of e.sourceIds) assert.ok(known.has(id));
  }
  for (const q of g.frontiers) {
    assert.ok(q.anchorIds.length && q.sourceIds.length && q.title && q.explanation);
    assert.ok(["stub", "shared", "gap", "conflict", "boundary"].includes(q.kind));
    for (const id of q.anchorIds) assert.ok(nodes.has(id), `unknown anchor ${id}`);
    for (const id of q.sourceIds) assert.ok(known.has(id), `unknown frontier source ${id}`);
    for (const id of q.actionIds) assert.ok(ACTION_BY_ID.has(id));
    assert.ok(Array.isArray(q.continuation.nodeIds) && Array.isArray(q.continuation.edgeIds));
    if (q.kind === "gap") assert.equal(q.anchorIds.length, 2, "a gap needs two acquired endpoints");
  }
  for (const group of g.supportGroups) {
    assert.equal(group.kind, "all");
    assert.ok(nodes.has(group.targetId));
    assert.equal(solved.claims[group.targetId.slice(6)].established, true);
    assert.ok(group.sourceIds.length && group.edgeIds.length);
    for (const id of group.sourceIds) assert.ok(known.has(id));
    for (const id of group.memberNodeIds) assert.ok(nodes.has(id));
    for (const id of group.edgeIds) assert.ok(edges.has(id));
  }
  for (const observation of g.observations) {
    assert.ok(nodes.has(observation.id) || g.nodes.some((n) => n.sourceIds.includes(observation.id)) || g.edges.some((e) => e.sourceIds.includes(observation.id)), `lost report ${observation.id}`);
  }
  const visible = [...g.nodes.flatMap((item) => [item.title, item.summary]),
    ...g.edges.flatMap((item) => [item.label, item.details]),
    ...g.frontiers.flatMap((item) => [item.title, item.explanation])].join("\n");
  assert.doesNotMatch(visible, /obs\.|PROOF\.|CLAIM\.|expectedProfile|posterior|latent\./);
}

const empty = graph(newSession());
assert.deepEqual([empty.nodes.length, empty.edges.length, empty.frontiers.length, empty.supportGroups.length], [0, 0, 0, 0]);
checked("开局不预画答案、道路、缺口或证明路线");

const early = run(["A.IMAGE.XRAY", "A.LOCATE.HISTORIC_IMAGE"]);
const beforeEarly = graph(early);
const context = frontier(beforeEarly, "question:context");
assert.equal(context.kind, "shared");
assert.deepEqual(new Set(context.anchorIds), new Set(["obs.structure.xray.early", "obs.phase.t1"]));
assert.ok(!node(beforeEarly, "obs.object.continuity"));
assert.equal(beforeEarly.edges.length, 0, "early observations do not prove one another");
act(early, "A.OBSERVE.BASE");
act(early, "A.VERIFY.OBJECT_CONTINUITY");
const afterEarly = graph(early);
const earlyChange = diffGraphs(beforeEarly, afterEarly);
assert.deepEqual(new Set(earlyChange.activatedNodeIds), new Set(context.anchorIds));
assert.ok(earlyChange.resolvedFrontierIds.includes("question:context"));
for (const id of context.anchorIds) {
  assert.ok(!earlyChange.addedNodeIds.includes(id), "activation must not be counted as reacquisition");
  assert.equal(afterEarly.observations.find((item) => item.id === id).attempts, 1);
  assert.ok(afterEarly.edges.some((edge) => edge.from === "obs.object.continuity" && edge.to === id));
}
assert.equal(afterEarly.stage.key, solve(early).stage);
assert.ok(afterEarly.stage.key !== "G3");
checked("早拿后懂：共享前沿消失，两份旧材料激活，不重复取得或误报完整判断");

const archive = run(["A.OBSERVE.WHOLE", "A.RESEARCH.ACCIDENT"]);
const beforeArchive = graph(archive);
assert.equal(frontier(beforeArchive, "question:archive:t2:attribution").kind, "gap");
assert.equal(frontier(beforeArchive, "question:archive:t2:corroboration").kind, "gap");
assert.ok(!frontier(beforeArchive, "question:archive:t2:record"));
assert.ok(!beforeArchive.edges.some((edge) => edge.id === "archive:t2:object"));
act(archive, "A.RELATE.ARCHIVE.T2_TO_OBJECT");
const attributed = graph(archive);
assert.ok(!frontier(attributed, "question:archive:t2:attribution"));
assert.ok(frontier(attributed, "question:archive:t2:corroboration"));
assert.ok(frontier(attributed, "question:archive:t2:corroboration").actionIds.includes("A.MAP.REGION_CONTINUITY"));
assert.equal(attributed.edges.find((edge) => edge.id === "archive:t2:object").kind, "attribution");
act(archive, "A.CORROBORATE.ARCHIVE.T2_CURRENT");
const corroborated = graph(archive);
const change = diffGraphs(attributed, corroborated);
assert.ok(change.changedEdgeIds.includes("archive:t2:object"));
assert.ok(!change.addedEdgeIds.includes("archive:t2:object"));
assert.ok(!frontier(corroborated, "question:archive:t2:corroboration"));
const archiveEdge = corroborated.edges.find((edge) => edge.id === "archive:t2:object");
assert.equal(archiveEdge.kind, "corroboration");
assert.ok(archiveEdge.sourceIds.includes("obs.archive.t2.object-attribution"));
assert.ok(archiveEdge.sourceIds.includes("obs.archive.t2.current-corroboration"));
assert.equal(node(corroborated, "obs.accident.major").relations.filter((item) => item.status === "established").length, 3);
checked("两端缺口按归属、事件印证分两次接通，并检测同 ID 道路增强");

const xrayBranch = run(["A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.VERIFY.OBJECT_CONTINUITY", "A.RESEARCH.ACCIDENT", "A.RELATE.ARCHIVE.T2_TO_OBJECT", "A.IMAGE.XRAY"]);
assert.ok(!frontier(graph(xrayBranch), "question:archive:t2:corroboration").actionIds.includes("A.MAP.REGION_CONTINUITY"));
act(xrayBranch, "A.MAP.REGION_CONTINUITY");
assert.ok(frontier(graph(xrayBranch), "question:archive:t2:corroboration"), "physical comparison cannot close archive corroboration gap");
checked("跨时点手段按当前分支列出：物证结果不冒充档案印证");

for (const key of ["T2", "T3"]) {
  const recordId = key === "T2" ? "obs.accident.major" : "obs.phase.t3";
  const read = key === "T2" ? "A.RESEARCH.ACCIDENT" : "A.RESEARCH.LATE_TREATMENT";
  const reportId = `obs.archive.${key.toLowerCase()}.object-attribution`;
  const first = run([`A.RELATE.ARCHIVE.${key}_TO_OBJECT`]);
  const reportOnly = graph(first);
  assert.equal(reportOnly.nodes.length, 1);
  assert.equal(reportOnly.edges.length, 0);
  assert.ok(frontier(reportOnly, `question:archive:${key.toLowerCase()}:source`));
  assert.ok(!node(reportOnly, recordId) && !node(reportOnly, "obs.current.whole"));
  act(first, read);
  assert.ok(node(graph(first), reportId));
  act(first, "A.OBSERVE.WHOLE");
  const connected = graph(first);
  assert.ok(!node(connected, reportId));
  assert.ok(connected.observations.find((item) => item.id === reportId).edgeIds.includes(`archive:${key.toLowerCase()}:object`));
  integrity(connected, solve(first));
}
checked("核验先于端点：两组档案都保留报告，端点取得后压入道路且可回查来源");

const surface = run(["A.INSPECT.WINDOWS"]);
const beforeSurface = graph(surface);
assert.ok(frontier(beforeSurface, "question:surface").continuation.nodeIds.includes("obs.surface.resolved"));
assert.ok(!node(beforeSurface, "obs.surface.resolved"));
act(surface, "A.SYNTHESIZE.SURFACE_REGIONS");
const afterSurface = graph(surface);
assert.ok(!frontier(afterSurface, "question:surface"));
assert.ok(afterSurface.edges.some((edge) => edge.from === "obs.surface.point-layering" && edge.to === "obs.surface.resolved"));
assert.ok(diffGraphs(beforeSurface, afterSurface).resolvedFrontierIds.includes("question:surface"));
for (const actions of [["A.ANALYZE.MATERIAL.SUBSTRATE", "A.INSPECT.MATERIAL.LAYER_SEQUENCE"], ["A.INSPECT.MATERIAL.LAYER_SEQUENCE", "A.ANALYZE.MATERIAL.SUBSTRATE"]]) {
  const materials = run([actions[0]]);
  assert.ok(graph(materials).frontiers.some((q) => q.id.startsWith("question:material-")));
  act(materials, actions[1]);
  const mg = graph(materials);
  assert.ok(!mg.frontiers.some((q) => q.id.startsWith("question:material-")));
  assert.equal(mg.edges.length, 0, "material composition and layer sequence must not prove each other");
}
checked("前沿接续试窗到区域；材料与层序相互补足问题但不制造相互证明边");

const full = newSession();
const actionsDone = new Set();
while (full.log.length < 22) {
  const next = workbench(full).find((row) => row.usable && !row.done);
  assert.ok(next);
  act(full, next.action.id);
  actionsDone.add(next.action.id);
  integrity(graph(full), solve(full));
}
assert.equal(actionsDone.size, ACTIONS.length);
assert.equal(actionsDone.size, 22);
assert.equal(graph(full).stage.key, "G3");
assert.equal(full.billed.reduce((sum, count) => sum + count, 0), 22);
assert.equal(take(full, "A.OBSERVE.WHOLE").ok, false);
full.stopped = true;
assert.equal(solve(full).stage, "G3");
checked("22 个动作逐步完整可达；计费、预算耗尽与收手保持现有会话规则");

const shortest = ["A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.VERIFY.OBJECT_CONTINUITY", "A.RESEARCH.ACCIDENT", "A.RELATE.ARCHIVE.T2_TO_OBJECT", "A.CORROBORATE.ARCHIVE.T2_CURRENT", "A.LOCATE.HISTORIC_IMAGE", "A.RESEARCH.LATE_TREATMENT", "A.RELATE.ARCHIVE.T3_TO_OBJECT", "A.CORROBORATE.ARCHIVE.T3_CURRENT", "A.ANALYZE.MATERIAL.SUBSTRATE", "A.INSPECT.MATERIAL.LAYER_SEQUENCE", "A.INSPECT.WINDOWS", "A.SYNTHESIZE.SURFACE_REGIONS", "A.ASSESS.TREATED_AND_UNTREATED", "A.TRACE.PROVENANCE_CHAIN"];
for (const alternative of [false, true]) {
  const route = [...shortest];
  if (alternative) route[5] = "A.MAP.REGION_CONTINUITY";
  const session = run(route);
  assert.equal(session.log.length, 16);
  assert.equal(solve(session).stage, "G3");
  for (const claim of ["identity", "majorReassembly", "threePhase", "coherentDecisionProfile"]) {
    assert.equal(node(graph(session), "claim:" + claim).state, "established");
  }
  integrity(graph(session), solve(session));
}
const repeated = graph(run(["A.OBSERVE.WHOLE", "A.OBSERVE.WHOLE"]));
assert.equal(repeated.nodes.length, 1);
assert.deepEqual(repeated.observations[0].steps, [1, 2]);
checked("16 步现器／跨时点两条路线仍建立四项；重复调查保留次数不复制信息");

let frozenOrders = 0;
for (const scenario of scenarios) for (const order of scenario.orders) {
  const acquired = eventsForOrder(scenario, order);
  const solved = solveFixture(scenario, acquired);
  const session = { acquired, log: acquired.map((event) => ({ observationId: event.observationId, actionId: event.acquisitionActionId })) };
  const g = buildGraph(solved, session);
  integrity(g, solved);
  if (scenario.id === "archive-attribution-contested-not-promoted") {
    const q = frontier(g, "question:archive:t2:attribution");
    assert.equal(q.kind, "conflict");
    assert.deepEqual(q.actionIds, []);
    const counterIds = (solved.coverage.factWitnesses.t2ArchiveObjectAttributionContested ?? []).map((witness) => witness.observationId);
    assert.ok(counterIds.length);
    assert.ok(counterIds.every((id) => q.sourceIds.includes(id) && q.anchorIds.includes(id)), "conflict frontier must expose the acquired counter-report");
    assert.ok(!node(g, "claim:majorReassembly"));
  }
  if (scenario.id === "g3-with-allowed-unknowns") {
    assert.equal(g.stage.key, "G3");
    for (const key of ["exact-treatment-formula", "noncritical-region"]) {
      const q = frontier(g, "question:registered:" + key);
      assert.equal(q.kind, "boundary");
      assert.deepEqual(q.actionIds, []);
    }
  }
  if (scenario.id === "g2-alternate-physical") {
    assert.ok(g.supportGroups.some((group) => group.id === "proof-group:major:physical"));
    assert.ok(!g.supportGroups.some((group) => group.id.startsWith("proof-group:major:documented")));
  }
  frozenOrders++;
}
checked(`${scenarios.length} 个冻结场景 / ${frozenOrders} 个顺序：冲突、边界与替代证明路线保留`);

const fg = graph(full);
const identityGroups = fg.supportGroups.filter((group) => group.targetId === "claim:identity");
assert.equal(identityGroups.length, 2);
assert.equal(new Set(identityGroups.map((group) => group.alternativeSet)).size, 1);
assert.ok(identityGroups.every((group) => group.sourceIds.includes("obs.current.whole") && group.sourceIds.includes("obs.current.base")));
assert.ok(identityGroups.some((group) => group.sourceIds.includes("obs.object.continuity") && !group.sourceIds.includes("obs.corpus.identity")));
assert.ok(identityGroups.some((group) => group.sourceIds.includes("obs.corpus.identity") && !group.sourceIds.includes("obs.object.continuity")));
const documented = fg.supportGroups.filter((group) => group.id.startsWith("proof-group:major:documented"));
assert.ok(documented.length);
assert.ok(documented.every((group) => group.sourceIds.includes("obs.archive.t2.object-attribution")));
assert.ok(fg.supportGroups.find((group) => group.targetId === "claim:coherentDecisionProfile").sourceIds.includes("obs.surface.point-layering"));
checked("共同条件汇流、替代路径分组，档案归属与试窗等真实必要来源不丢失");

const stateBefore = JSON.stringify(full);
const solved = solve(full);
const solvedBefore = JSON.stringify(solved);
const guarded = new Proxy(solved, { get(target, key) {
  if (["posterior", "supports", "marginals", "expectedProfile"].includes(key)) throw new Error("hidden state read: " + key);
  return target[key];
} });
buildGraph(guarded, full);
assert.equal(JSON.stringify(solved), solvedBefore);
assert.equal(JSON.stringify(full), stateBefore);
assert.ok(Object.values(diffGraphs(fg, graph(full))).every((ids) => ids.length === 0));
const code = readFileSync(new URL("./graph.mjs", import.meta.url), "utf8");
assert.doesNotMatch(code, /\.proofWitnesses|\.sharedLatentIds|\.factor\b|\.expectedProfile|\.posterior|\.supports|\.marginals/);
checked("投影与差分不修改会话／求解结果，不读取隐藏后验；相同图无变化报告");

console.log(`\n${checks}/${checks} fusion graph checks passed. review required: new presentation checks and semantic projection.`);
console.log("未验证：真人理解、图形布局、浏览器联动与游玩体验。此检查只证明投影与冻结规则一致。");
