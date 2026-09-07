import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildGraph } from "./graph.mjs";
import { newSession, take, solve, workbench } from "../workbench-map-focus-v1/session.mjs";
import { scenarios, eventsForOrder } from "../first-ceramic-author-scenarios-v0/fixtures.mjs";
import { solveFixture } from "../first-ceramic-author-scenarios-v0/solver.mjs";

let checks = 0;
const checked = (name) => { checks++; console.log(`PASS ${name}`); };
const run = (actions) => {
  const s = newSession();
  for (const action of actions) assert.equal(take(s, action).ok, true, action);
  return s;
};
const graph = (s) => buildGraph(solve(s), s);
const node = (g, id) => g.nodes.find((n) => n.id === id);
function integrity(g, solved) {
  const have = new Set(solved.evidence.observationIds);
  const ids = new Set(g.nodes.map((n) => n.id));
  assert.equal(ids.size, g.nodes.length, "node identity must be unique");
  assert.equal(new Set(g.edges.map((e) => e.id)).size, g.edges.length);
  assert.deepEqual(new Set(g.observations.map((o) => o.id)), have, "every acquired observation remains traceable");
  assert.equal(g.stage.key, solved.stage, "stage semantics must not change");
  for (const n of g.nodes) {
    assert.ok(n.sourceIds.length, n.id);
    n.sourceIds.forEach((id) => assert.ok(have.has(id), `unknown source ${id}`));
    if (n.kind === "evidence") assert.ok(have.has(n.id), `invented evidence ${n.id}`);
    if (n.kind === "claim" && n.state === "established") assert.equal(solved.claims[n.id.slice(6)]?.established, true, n.id);
  }
  for (const e of g.edges) {
    assert.ok(ids.has(e.from) && ids.has(e.to), `missing endpoint ${e.id}`);
    assert.ok(e.sourceIds.length && e.details.length && e.label.length, e.id);
    assert.ok(["context", "attribution", "corroboration", "support", "conflict"].includes(e.kind));
    e.sourceIds.forEach((id) => assert.ok(have.has(id), `unknown edge source ${id}`));
  }
  for (const o of g.observations) assert.ok(ids.has(o.id) || g.nodes.some((n) => n.sourceIds.includes(o.id)) || g.edges.some((e) => e.sourceIds.includes(o.id)), `lost observation ${o.id}`);
  for (const q of g.questions) {
    assert.ok(q.anchorIds.length, q.id);
    q.anchorIds.forEach((id) => assert.ok(ids.has(id), `unknown question anchor ${id}`));
  }
  const visible = [...g.nodes.flatMap((n) => [n.title, n.summary]), ...g.edges.flatMap((e) => [e.label, e.details]), ...g.questions.flatMap((q) => [q.title, q.explanation])].join("\n");
  assert.doesNotMatch(visible, /obs\.|PROOF\.|latent\.|posterior|expectedProfile|proofWitnesses|CLAIM\./, "internal identifiers leaked into copy");
}

const empty = graph(newSession());
assert.equal(empty.nodes.length, 0);
assert.equal(empty.edges.length, 0);
assert.equal(empty.questions.length, 0);
checked("开局没有预画答案、道路或未来问题");

const documented = run(["A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.COMPARE.CORPUS", "A.RESEARCH.ACCIDENT", "A.RELATE.ARCHIVE.T2_TO_OBJECT", "A.CORROBORATE.ARCHIVE.T2_CURRENT"]);
const dg = graph(documented);
integrity(dg, solve(documented));
assert.equal(dg.stage.key, "G2");
assert.equal(node(dg, "claim:identity").title, "晚 18 世纪外销瓷方向成立");
const bridge = dg.edges.find((e) => e.id === "archive:t2:object");
assert.ok(bridge.sourceIds.includes("obs.archive.t2.object-attribution"));
assert.ok(bridge.sourceIds.includes("obs.archive.t2.current-corroboration"));
assert.ok(!node(dg, "obs.archive.t2.object-attribution"));
assert.ok(!dg.questions.some((q) => q.id === "question:archive:t2"));
assert.ok(dg.questions.some((q) => q.id === "question:history" && q.anchorIds.includes("claim:majorReassembly")), "achieved reconstruction should expose its known temporal question");
const docProof = dg.edges.find((e) => e.id.endsWith(":documented"));
assert.ok(docProof.sourceIds.includes("obs.archive.t2.object-attribution"), "attribution missing from complete proof");
checked("六步档案路线达到原 G2，归属与对应连接可追溯，不重复提示已完成核验");

const continuityOnly = graph(run(["A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.VERIFY.OBJECT_CONTINUITY"]));
assert.equal(node(continuityOnly, "claim:identity").state, "established");
for (const id of ["obs.current.whole", "obs.current.base", "obs.object.continuity"]) {
  const link = continuityOnly.edges.find((e) => e.from === id && e.to === "claim:identity");
  assert.ok(link, `identity AND input incorrectly isolated: ${id}`);
  assert.match(link.details, /共同/);
  assert.ok(link.sourceIds.includes("obs.current.whole") && link.sourceIds.includes("obs.current.base"));
}
checked("仅对象连续性 OR 路线仍显示整体、底足与路径三项共同支撑，不留下假孤岛");

const early = run(["A.IMAGE.XRAY", "A.LOCATE.HISTORIC_IMAGE"]);
const before = graph(early);
assert.equal(node(before, "obs.structure.xray.early").state, "pending");
assert.equal(node(before, "obs.phase.t1").state, "pending");
assert.equal(before.questions.find((q) => q.id === "question:context").anchorIds.length, 2);
assert.ok(take(early, "A.OBSERVE.BASE").ok);
assert.ok(take(early, "A.VERIFY.OBJECT_CONTINUITY").ok);
const after = graph(early);
for (const id of ["obs.structure.xray.early", "obs.phase.t1"]) {
  assert.equal(node(after, id).state, "known");
  assert.ok(after.edges.some((e) => e.from === "obs.object.continuity" && e.to === id && e.kind === "context"));
  assert.equal(after.observations.find((o) => o.id === id).attempts, 1);
}
assert.ok(!after.questions.some((q) => q.id === "question:context"));
checked("先取得射线与影像、后补连续性：两份旧信息同时可解释且无需重复获取");

const relationFirst = run(["A.RELATE.ARCHIVE.T2_TO_OBJECT"]);
assert.equal(graph(relationFirst).nodes.length, 1);
assert.equal(graph(relationFirst).edges.length, 0);
take(relationFirst, "A.RESEARCH.ACCIDENT");
assert.ok(node(graph(relationFirst), "obs.archive.t2.object-attribution"));
take(relationFirst, "A.OBSERVE.WHOLE");
const rg = graph(relationFirst);
assert.ok(!node(rg, "obs.archive.t2.object-attribution"));
assert.ok(rg.edges.some((e) => e.id === "archive:t2:object"));
checked("先核验关系时保留独立报告；档案与实物均已知才转成连接，绝不生造端点");

const repairOnly = graph(run(["A.OBSERVE.WHOLE"]));
assert.ok(!node(repairOnly, "claim:majorReassembly"));
assert.ok(repairOnly.questions.length >= 2, "known craft and intervention permit parallel questions");
assert.ok(!repairOnly.nodes.some((n) => n.kind === "finding"));
checked("可见修补不升格为重大重组；局部信息无需强制经过 Finding 层");

const full = newSession();
const allActions = new Set();
while (full.log.length < 22) {
  const next = workbench(full).find((row) => row.usable && !row.done);
  assert.ok(next, "all 22 unique actions must remain reachable");
  assert.ok(take(full, next.action.id).ok);
  allActions.add(next.action.id);
  integrity(graph(full), solve(full));
}
const fg = graph(full);
assert.equal(allActions.size, 22);
assert.equal(fg.observations.length, 22);
assert.equal(fg.stage.key, "G3");
assert.equal(node(fg, "obs.surface.no-signal.unresolved").state, "limited");
assert.ok(!node(fg, "obs.corpus.identity.repeat"));
assert.ok(node(fg, "obs.corpus.identity").sourceIds.includes("obs.corpus.identity.repeat"));
assert.ok(node(fg, "claim:coherentDecisionProfile").sourceIds.includes("obs.archive.t2.object-attribution"));
assert.ok(fg.edges.some((e) => e.from === "claim:identity" && e.to === "claim:coherentDecisionProfile"));
assert.ok(fg.edges.some((e) => e.from === "claim:threePhase" && e.to === "claim:coherentDecisionProfile"));
checked(`22 个动作逐步可追溯：满局 ${fg.nodes.length} 节点 / ${fg.edges.length} 边 / ${fg.observations.length} 原始记录`);

const repeated = run(["A.OBSERVE.WHOLE", "A.OBSERVE.WHOLE"]);
const repeatGraph = graph(repeated);
assert.equal(repeatGraph.nodes.length, 1);
assert.equal(repeatGraph.observations[0].attempts, 2);
assert.deepEqual(repeatGraph.observations[0].steps, [1, 2]);
checked("同一动作重复保留两次足迹，只显示一份信息身份");

let frozenOrders = 0;
for (const scenario of scenarios) {
  for (const order of scenario.orders) {
    const acquired = eventsForOrder(scenario, order);
    const solved = solveFixture(scenario, acquired);
    const g = buildGraph(solved, { acquired, log: acquired.map((e) => ({ observationId: e.observationId, actionId: e.acquisitionActionId })) });
    integrity(g, solved);
    if (scenario.id === "g2-alternate-physical") {
      assert.equal(g.stage.key, "G2");
      assert.ok(g.edges.some((e) => e.id.endsWith(":physical")));
      assert.ok(!g.edges.some((e) => e.id.endsWith(":documented")));
    }
    if (scenario.id === "g2-documented-cross-time-or") {
      assert.ok(g.edges.find((e) => e.id.endsWith(":documented")).sourceIds.includes("obs.structure.major.documented-cross-time"));
    }
    if (scenario.id === "archive-attribution-contested-not-promoted") {
      assert.ok(!node(g, "claim:majorReassembly"));
      assert.ok(g.questions.some((q) => q.id === "question:archive:t2"));
      assert.ok(g.edges.some((e) => e.kind === "conflict" && e.to === "obs.accident.major"));
    }
    if (scenario.id === "g2-hard-counter-downgrade" || scenario.id === "g2-logical-counter-downgrade") {
      assert.equal(node(g, "claim:majorReassembly").state, "contested");
      assert.ok(g.edges.some((e) => e.kind === "conflict"));
    }
    if (scenario.id === "g2-out-of-scope-counter-stable") assert.equal(node(g, "claim:majorReassembly").state, "established");
    if (scenario.id === "g3-with-allowed-unknowns") {
      assert.ok(g.questions.some((q) => q.id === "question:registered:exact-treatment-formula"));
      assert.ok(g.questions.some((q) => q.id === "question:registered:noncritical-region"));
    }
    if (scenario.id.includes("single-") && scenario.id.endsWith("-rejected")) assert.ok(!node(g, "claim:majorReassembly"));
    frozenOrders++;
  }
}
checked(`只读重放 ${scenarios.length} 个冻结场景 / ${frozenOrders} 个顺序，包含 OR 路线、反证、范围与单证据反例`);

const solved = solve(full);
const original = JSON.stringify(solved);
const sessionBefore = JSON.stringify(full);
buildGraph(solved, full);
assert.equal(JSON.stringify(solved), original);
assert.equal(JSON.stringify(full), sessionBefore);
const guarded = new Proxy(solved, { get(target, key) {
  if (["posterior", "supports", "marginals", "expectedProfile"].includes(key)) throw new Error(`hidden state read: ${key}`);
  return target[key];
} });
buildGraph(guarded, full);
const code = readFileSync(new URL("./graph.mjs", import.meta.url), "utf8");
assert.doesNotMatch(code, /\.acquisitionRequires|\.proofWitnesses|\.sharedLatentIds|\.factor\b|\.expectedProfile|\.posterior|\.supports|\.marginals/);
checked("投影不修改会话/求解结果，不读取隐藏后验、因子、获取前置或旧证明槽位");

console.log(`\n${checks}/${checks} 项投影检查通过。review required：本轮新增检查；新玩家命题与关系简化待独立审查。`);
console.log("未验证：真人理解、优雅程度、乐趣与长期推理体验。图形布局及浏览器交互由独立检查覆盖。");
