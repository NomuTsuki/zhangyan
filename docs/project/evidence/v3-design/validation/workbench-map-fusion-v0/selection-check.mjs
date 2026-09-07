import assert from "node:assert/strict";
import { buildGraph } from "./graph.mjs";
import { judgmentOverview, judgmentFacets, resolveSelection } from "./selection.mjs";
import { newSession, take, solve, workbench } from "../workbench-map-focus-v1/session.mjs";
import { ACTIONS } from "../knowledge-map-slice-v0/case.mjs";
import { eventsForOrder, scenarios } from "../first-ceramic-author-scenarios-v0/fixtures.mjs";
import { solveFixture } from "../first-ceramic-author-scenarios-v0/solver.mjs";

let count = 0;
function check(name, body) { body(); count++; console.log(`PASS ${name}`); }
function run(ids) {
  const session = newSession();
  for (const id of ids) assert.equal(take(session, id).ok, true, id);
  return session;
}
function snapshot(session) {
  const solved = solve(session);
  return { solved, graph: buildGraph(solved, session), rows: workbench(session) };
}
function focus(session, selection) {
  const { solved, graph, rows } = snapshot(session);
  return resolveSelection(selection, graph, solved, session, rows);
}
const WHOLE = "A.OBSERVE.WHOLE";
const BASE = "A.OBSERVE.BASE";
const CONTINUITY = "A.VERIFY.OBJECT_CONTINUITY";
const SIXTEEN = [WHOLE, BASE, CONTINUITY, "A.RESEARCH.ACCIDENT", "A.RELATE.ARCHIVE.T2_TO_OBJECT",
  "A.CORROBORATE.ARCHIVE.T2_CURRENT", "A.LOCATE.HISTORIC_IMAGE", "A.RESEARCH.LATE_TREATMENT",
  "A.RELATE.ARCHIVE.T3_TO_OBJECT", "A.CORROBORATE.ARCHIVE.T3_CURRENT", "A.ANALYZE.MATERIAL.SUBSTRATE",
  "A.INSPECT.MATERIAL.LAYER_SEQUENCE", "A.INSPECT.WINDOWS", "A.SYNTHESIZE.SURFACE_REGIONS",
  "A.ASSESS.TREATED_AND_UNTREATED", "A.TRACE.PROVENANCE_CHAIN"];

check("Empty or stale selection has no focus and no future information", () => {
  const session = newSession();
  for (const selection of [null, { kind: "evidence", id: "obs.accident.major" }, { kind: "gap", id: "unknown" }, { kind: "action", id: "unknown" }]) {
    const value = focus(session, selection);
    assert.equal(value.active, false);
    assert.equal(value.related, false);
    for (const key of ["nodeIds", "edgeIds", "frontierIds", "sourceIds", "actionIds", "placeIds", "claimIds"]) assert.deepEqual(value[key], []);
  }
  const noRelation = focus(session, { kind: "action", id: "A.ANALYZE.MATERIAL.SUBSTRATE" });
  assert.equal(noRelation.active, true);
  assert.equal(noRelation.related, false);
  assert.deepEqual(noRelation.nodeIds, []);
  assert.deepEqual(noRelation.sourceIds, []);
});

check("Four judgment summaries are neutral and read actual claims, including identity before G1", () => {
  const empty = snapshot(newSession());
  const overview = judgmentOverview(empty.solved, empty.graph);
  assert.deepEqual(overview.map((row) => row.title), ["年代与类别", "重大修复", "修复顺序", "连贯说明"]);
  assert.ok(overview.every((row) => row.status === "unseen" && !row.established));
  const session = run([WHOLE, BASE, CONTINUITY]);
  const { solved, graph } = snapshot(session);
  const original = JSON.stringify(solved);
  const withFalseG1 = { ...solved, claims: { ...solved.claims, g1: { established: false } } };
  assert.equal(judgmentOverview(withFalseG1, graph)[0].established, true);
  assert.equal(JSON.stringify(solved), original);
  assert.equal(judgmentOverview(solved, graph)[1].established, false);
});

check("Unavailable corpus selection references acquired prerequisites without inventing result", () => {
  const session = run([WHOLE]);
  const selection = focus(session, { kind: "action", id: "A.COMPARE.CORPUS" });
  assert.equal(selection.subject.usable, false);
  assert.ok(selection.subject.why);
  assert.ok(selection.nodeIds.includes("obs.current.whole"));
  assert.ok(!selection.nodeIds.includes("obs.corpus.identity"));
  assert.ok(!selection.nodeIds.includes("obs.current.base"));
  assert.deepEqual(selection.sourceIds, ["obs.current.whole"]);
});

check("One-hop graph focus does not flood a second edge, source family, or distant claim", () => {
  const session = run([WHOLE, BASE, CONTINUITY]);
  const solved = solve(session);
  const ids = ["obs.current.whole", "obs.current.base", "obs.object.continuity"];
  const graph = {
    nodes: ids.map((id) => ({ id, kind: "evidence", sourceIds: [id] })),
    observations: ids.map((id, i) => ({ id, nodeId: id, actionId: [WHOLE, BASE, CONTINUITY][i] })),
    edges: [{ id: "ab", from: ids[0], to: ids[1], kind: "context", sourceIds: [ids[0], ids[1]] },
      { id: "bc", from: ids[1], to: ids[2], kind: "context", sourceIds: [ids[1], ids[2]] }],
    frontiers: [{ id: "fa", anchorIds: [ids[0]], sourceIds: [ids[0]], actionIds: [] },
      { id: "fb", anchorIds: [ids[1]], sourceIds: [ids[1]], actionIds: [] }],
  };
  const value = resolveSelection({ kind: "evidence", id: ids[0] }, graph, solved, session, workbench(session));
  assert.deepEqual(value.nodeIds, ids.slice(0, 2));
  assert.deepEqual(value.edgeIds, ["ab"]);
  assert.deepEqual(value.frontierIds, ["fa"]);
  assert.deepEqual(value.sourceIds, [ids[0]]);
  assert.deepEqual(value.actionIds, [WHOLE]);
});

check("Evidence and place selection reverse-link exact acquisition action and bowl location", () => {
  const session = run([WHOLE, BASE]);
  const byEvidence = focus(session, { kind: "evidence", id: "obs.current.base" });
  assert.deepEqual(byEvidence.actionIds, [BASE]);
  assert.deepEqual(byEvidence.placeIds, ["OBJ_F"]);
  const byPlace = focus(session, { kind: "place", id: "OBJ_F" });
  assert.ok(byPlace.primaryNodeIds.includes("obs.current.base"));
  assert.ok(!byPlace.nodeIds.includes("obs.object.continuity"));
});

check("Pending readings share a known gap; all candidate methods survive their usability", () => {
  const session = run(["A.IMAGE.XRAY", "A.LOCATE.HISTORIC_IMAGE"]);
  const value = focus(session, { kind: "gap", id: "question:context" });
  assert.equal(value.active, true);
  assert.deepEqual(new Set(value.primaryNodeIds), new Set(["obs.structure.xray.early", "obs.phase.t1"]));
  assert.ok(value.actionIds.includes(CONTINUITY));
  assert.equal(workbench(session).find((row) => row.action.id === CONTINUITY).usable, false);
  assert.ok(!value.nodeIds.includes("obs.object.continuity"));
  assert.equal(value.edgeIds.length, 0);
  const pending = focus(session, { kind: "evidence", id: "obs.structure.xray.early" });
  assert.ok(pending.frontierIds.includes("question:context"));
  assert.ok(!pending.nodeIds.includes("obs.phase.t1"), "shared question must not imply evidence supports its other anchor");
});

check("Relation roads preserve attribution and corroboration sources separately", () => {
  const session = run([WHOLE, "A.RESEARCH.ACCIDENT", "A.RELATE.ARCHIVE.T2_TO_OBJECT"]);
  const partial = focus(session, { kind: "edge", id: "archive:t2:object" });
  assert.deepEqual(partial.primaryEdgeIds, ["archive:t2:object"]);
  assert.ok(partial.sourceIds.includes("obs.archive.t2.object-attribution"));
  assert.ok(!partial.sourceIds.includes("obs.archive.t2.current-corroboration"));
  assert.ok(partial.actionIds.includes("A.RELATE.ARCHIVE.T2_TO_OBJECT"));
  assert.ok(partial.placeIds.includes("T2"));
  take(session, "A.CORROBORATE.ARCHIVE.T2_CURRENT");
  const complete = focus(session, { kind: "edge", id: "archive:t2:object" });
  assert.ok(complete.sourceIds.includes("obs.archive.t2.current-corroboration"));
  const folded = focus(session, { kind: "evidence", id: "obs.archive.t2.object-attribution" });
  assert.ok(folded.primaryEdgeIds.includes("archive:t2:object"));
  assert.ok(folded.sources.some((source) => source.id === "obs.archive.t2.object-attribution"));
});

check("Relation report acquired before endpoints remains independently selectable", () => {
  const session = run(["A.RELATE.ARCHIVE.T2_TO_OBJECT"]);
  const value = focus(session, { kind: "evidence", id: "obs.archive.t2.object-attribution" });
  assert.deepEqual(value.primaryNodeIds, ["obs.archive.t2.object-attribution"]);
  assert.deepEqual(value.edgeIds, []);
  assert.ok(!value.nodeIds.includes("obs.accident.major"));
  assert.ok(!value.nodeIds.includes("obs.current.whole"));
});

check("Established claim follows complete graph witnesses, including hidden relation sources", () => {
  const session = run(SIXTEEN.slice(0, 6));
  const value = focus(session, { kind: "claim", id: "majorReassembly" });
  assert.ok(value.primaryNodeIds.includes("claim:majorReassembly"));
  assert.ok(value.sourceIds.includes("obs.archive.t2.object-attribution"));
  assert.ok(value.sourceIds.includes("obs.archive.t2.current-corroboration"));
  assert.ok(value.actionIds.includes("A.RELATE.ARCHIVE.T2_TO_OBJECT"));
  assert.ok(!value.actionIds.includes("A.IMAGE.XRAY"));
  assert.ok(!value.sourceIds.includes("obs.structure.xray.early"));
});

check("Sixteen-action result supplies all four claims and coherent profile traces real foundations", () => {
  const session = run(SIXTEEN);
  const { solved, graph, rows } = snapshot(session);
  assert.equal(solved.stage, "G3");
  assert.ok(judgmentOverview(solved, graph).every((row) => row.established));
  const value = resolveSelection({ kind: "claim", id: "claim:coherentDecisionProfile" }, graph, solved, session, rows);
  for (const id of ["obs.current.whole", "obs.object.continuity", "obs.phase.t1", "obs.archive.t2.object-attribution", "obs.surface.point-layering", "obs.documentation.resolved"]) {
    assert.ok(value.sourceIds.includes(id), `lost coherent witness ${id}`);
  }
  assert.ok(judgmentFacets(solved, rows).every((facet) => facet.state === "resolved"));
  assert.equal(value.actionIds.length, 16);
});

check("All 22 actions and all present selection kinds preserve state and acquired-only references", () => {
  const session = newSession();
  while (session.log.length < 22) {
    const row = workbench(session).find((entry) => entry.usable && !entry.done);
    assert.ok(row); assert.equal(take(session, row.action.id).ok, true);
  }
  const { solved, graph, rows } = snapshot(session);
  const before = JSON.stringify({ session, solved, graph, rows });
  const selections = [null, ...ACTIONS.map((action) => ({ kind: "action", id: action.id })),
    ...ACTIONS.map((action) => ({ kind: "place", id: action.place })),
    ...graph.observations.map((observation) => ({ kind: "evidence", id: observation.id })),
    ...graph.edges.map((edge) => ({ kind: "edge", id: edge.id })),
    ...graph.frontiers.map((frontier) => ({ kind: "gap", id: frontier.id })),
    ...judgmentOverview(solved, graph).map((row) => ({ kind: "claim", id: row.id }))];
  const known = new Set(solved.evidence.observationIds);
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  for (const selection of selections) {
    const value = resolveSelection(selection, graph, solved, session, rows);
    for (const id of value.sourceIds) assert.ok(known.has(id));
    for (const id of value.nodeIds) assert.ok(nodeIds.has(id));
  }
  assert.equal(JSON.stringify({ session, solved, graph, rows }), before);
});

check("Frozen counterevidence scenarios preserve contested/refuted overview and usable selection", () => {
  let checked = 0;
  for (const scenario of scenarios) {
    for (const order of scenario.orders) {
      const acquired = eventsForOrder(scenario, order);
      const solved = solveFixture(scenario, acquired);
      const session = { acquired, log: acquired.map((event) => ({ observationId: event.observationId, actionId: event.acquisitionActionId })) };
      const graph = buildGraph(solved, session);
      for (const row of judgmentOverview(solved, graph)) {
        const claim = solved.claims[row.claimId];
        if (claim?.logicallyRefuted) assert.equal(row.status, "refuted");
        else if (claim?.contested) assert.equal(row.status, "contested");
        else assert.equal(row.established, claim?.established === true);
        const selection = resolveSelection({ kind: "claim", id: row.id }, graph, solved, session);
        selection.sourceIds.forEach((id) => assert.ok(solved.evidence.observationIds.includes(id)));
      }
      checked++;
    }
  }
  assert.ok(checked > 0);
});

console.log(`\n${count}/${count} selection checks passed. review required: new presentation tests.`);
console.log("Not verified here: rendered focus styles, keyboard interaction, or human understanding.");
