import assert from "node:assert/strict";

import { ACTIONS } from "../knowledge-map-slice-v0/case.mjs";
import { SLOT_FACTS, TOPIC_SUMMARY, decisionSurface, mentalMap } from "./projection.mjs";
import { newSession, solve, take, workbench } from "./session.mjs";
import {
  ACTION_FOCUS,
  PLACE_FOCUS,
  Q5_FACETS,
  Q5_STATE_LABEL,
  QUESTIONS,
  actionMatchesFocus,
  decisionItemMatches,
  focusForAction,
  focusForActions,
  focusForFacet,
  focusForPlace,
  focusForQuestion,
  focusForTopic,
  q5FacetStates,
  relatedNodeIds,
  relatedTopicIds,
} from "./focus.mjs";

const stateOf = (states, id) => states.find((state) => state.id === id)?.state;
const expectTake = (session, actionId) => {
  const result = take(session, actionId);
  assert(result.ok, `${actionId}: ${result.why ?? "could not execute"}`);
  return result;
};

assert.deepEqual(
  QUESTIONS.map(({ id, label }) => ({ id, label })),
  [
    { id: "Q1", label: "它大概是什么？" },
    { id: "Q2", label: "这些证据说的是同一只吗？" },
    { id: "Q3", label: "它是不是被大修过？" },
    { id: "Q4", label: "它先后经历了什么？" },
    { id: "Q5", label: "接手还要看哪些方面？" },
  ],
  "the five player questions must keep the approved short wording",
);

const actionIds = ACTIONS.map((action) => action.id).sort();
assert.equal(actionIds.length, 22, "the current player workbench must still expose 22 actions");
assert.deepEqual(Object.keys(ACTION_FOCUS).sort(), actionIds, "each and only each player action needs focus metadata");
for (const [actionId, focus] of Object.entries(ACTION_FOCUS)) {
  assert(focus.primaryQuestionIds.length > 0, `${actionId} must directly answer at least one question`);
  assert(focus.questionIds.every((id) => QUESTIONS.some((question) => question.id === id)), `${actionId} uses a known question`);
  if (focus.facetId) assert(Q5_FACETS.some((facet) => facet.id === focus.facetId), `${actionId} uses a known Q5 facet`);
}

assert.deepEqual(
  Q5_FACETS.map(({ id, label }) => ({ id, label })),
  [
    { id: "material", label: "关键处由什么构成？" },
    { id: "surface", label: "表面改过多少？" },
    { id: "stability", label: "现在稳不稳？" },
    { id: "documentation", label: "来路边界清楚吗？" },
  ],
  "Q5 must be presented as four lighter subquestions",
);
assert.equal(Q5_STATE_LABEL.resolved, "已覆盖", "a resolved facet must not claim the whole handover is complete");
assert.deepEqual(
  Q5_FACETS.map(({ id, requiredFacts }) => [id, [...requiredFacts]]),
  [
    ["material", SLOT_FACTS.coherentDecisionProfile.keyMaterial],
    ["surface", SLOT_FACTS.coherentDecisionProfile.surface],
    ["stability", SLOT_FACTS.coherentDecisionProfile.stability],
    ["documentation", SLOT_FACTS.coherentDecisionProfile.documentation],
  ],
  "Q5 status must read the checked projection facts instead of maintaining a second rule table",
);

const uv = newSession();
expectTake(uv, "A.SCREEN.UV");
assert.equal(
  stateOf(q5FacetStates(solve(uv), workbench(uv)), "surface"),
  "clue",
  "the unresolved UV negative may create a clue but may not resolve surface",
);

const material = newSession();
expectTake(material, "A.ANALYZE.MATERIAL.SUBSTRATE");
assert.equal(stateOf(q5FacetStates(solve(material), workbench(material)), "material"), "clue", "one material reading is insufficient");
expectTake(material, "A.INSPECT.MATERIAL.LAYER_SEQUENCE");
assert.equal(stateOf(q5FacetStates(solve(material), workbench(material)), "material"), "resolved", "both material facts resolve the facet");

const provenance = newSession();
assert.equal(stateOf(q5FacetStates(solve(provenance), workbench(provenance)), "documentation"), "blocked", "provenance initially waits for object continuity");
expectTake(provenance, "A.OBSERVE.WHOLE");
expectTake(provenance, "A.OBSERVE.BASE");
expectTake(provenance, "A.VERIFY.OBJECT_CONTINUITY");
assert.equal(stateOf(q5FacetStates(solve(provenance), workbench(provenance)), "documentation"), "unseen", "provenance becomes available but is not yet known");
expectTake(provenance, "A.TRACE.PROVENANCE_CHAIN");
assert.equal(stateOf(q5FacetStates(solve(provenance), workbench(provenance)), "documentation"), "resolved", "provenance resolves only from its frozen facts");

const complete = newSession();
for (const actionId of [
  "A.OBSERVE.WHOLE",
  "A.OBSERVE.BASE",
  "A.VERIFY.OBJECT_CONTINUITY",
  "A.ANALYZE.MATERIAL.SUBSTRATE",
  "A.INSPECT.MATERIAL.LAYER_SEQUENCE",
  "A.INSPECT.WINDOWS",
  "A.SYNTHESIZE.SURFACE_REGIONS",
  "A.ASSESS.TREATED_AND_UNTREATED",
  "A.TRACE.PROVENANCE_CHAIN",
]) expectTake(complete, actionId);
assert.deepEqual(
  q5FacetStates(solve(complete), workbench(complete)).map(({ state }) => state),
  ["resolved", "resolved", "resolved", "resolved"],
  "all four Q5 facets can be presented as resolved without changing G3",
);

const uvFocus = focusForAction("A.SCREEN.UV");
assert.deepEqual(uvFocus.questionIds, ["Q5"]);
assert.equal(uvFocus.facetId, "surface");
assert(actionMatchesFocus("A.SCREEN.UV", uvFocus));
assert(!actionMatchesFocus("A.INSPECT.WINDOWS", uvFocus), "an exact action focus must not fan out to the whole facet");
assert(actionMatchesFocus("A.INSPECT.WINDOWS", focusForFacet("surface")), "a facet focus includes all of its actions");
assert(actionMatchesFocus("A.IMAGE.XRAY", focusForQuestion("Q3")), "a question focus includes its mapped actions");

const materialPlace = focusForPlace("MAT");
assert.deepEqual([...materialPlace.actionIds].sort(), [
  "A.ANALYZE.MATERIAL.SUBSTRATE",
  "A.INSPECT.MATERIAL.LAYER_SEQUENCE",
].sort());
assert.equal(materialPlace.facetId, "material");
assert.deepEqual([...PLACE_FOCUS.MAT], [...materialPlace.actionIds]);
assert.equal(focusForAction("A.NOT.REAL"), null);
assert.deepEqual(focusForActions(["A.IMAGE.XRAY", "A.RESEARCH.ACCIDENT"]).questionIds, ["Q3", "Q4"]);
assert.deepEqual(focusForAction("A.VERIFY.OBJECT_CONTINUITY").primaryQuestionIds, ["Q2"]);
assert.deepEqual(focusForAction("A.VERIFY.OBJECT_CONTINUITY").relatedQuestionIds, ["Q1", "Q3", "Q4", "Q5"]);
assert.deepEqual(
  focusForAction("A.MAP.REGION_CONTINUITY", "obs.structure.major.cross-time").questionIds,
  ["Q3"],
  "the physical branch must not pretend to advance the three-phase question",
);
assert.deepEqual(
  focusForAction("A.MAP.REGION_CONTINUITY", "obs.structure.major.documented-cross-time").questionIds,
  ["Q3", "Q4"],
  "the documented branch may additionally relate to the three-phase question",
);

const oneHop = relatedNodeIds({
  nodes: [{ id: "obs.a" }, { id: "obs.b" }, { id: "obs.c" }],
  topics: [],
  axioms: [],
  edges: [{ from: "obs.a", to: "obs.b" }, { from: "obs.b", to: "obs.c" }],
}, { observationIds: ["obs.a"], questionIds: [] });
assert(oneHop.has("obs.a") && oneHop.has("obs.b"));
assert(!oneHop.has("obs.c"), "one-hop focus may not spread through nodes added earlier in the same edge pass");

const topicOneHop = relatedNodeIds({
  nodes: [{ id: "obs.a" }, { id: "obs.b" }, { id: "obs.c" }],
  topics: [
    { id: "T:first", memberIds: ["obs.a", "obs.b"] },
    { id: "T:second", memberIds: ["obs.b", "obs.c"] },
  ],
  axioms: [],
  edges: [],
}, { observationIds: ["obs.a"], questionIds: [] });
assert(topicOneHop.has("obs.a") && topicOneHop.has("obs.b"));
assert(!topicOneHop.has("obs.c"), "a bridge observation may not fan one exact focus into a second topic");

const focusSession = newSession();
for (const actionId of ["A.OBSERVE.WHOLE", "A.OBSERVE.BASE", "A.COMPARE.CORPUS", "A.SCREEN.UV"]) expectTake(focusSession, actionId);
const focusSolved = solve(focusSession);
const graph = mentalMap(focusSolved);
assert(!Object.hasOwn(graph, "findings"), "the map must no longer expose Finding pseudo-conclusions");
assert(graph.edges.every((edge) => edge.kind !== "latent"), "topic membership must not become a visible latent edge");
assert(
  graph.edges.every((edge) => !edge.from.startsWith("F:") && !edge.to.startsWith("F:")),
  "no visible edge may target a legacy Finding id",
);
const craftTopic = graph.topics.find((topic) => topic.id === "T:latent.current-craft");
assert(craftTopic, "multiple current-craft observations should form a lightweight topic");
assert.deepEqual(
  Object.keys(craftTopic).sort(),
  ["id", "type", "latentId", "short", "summary", "memberIds"].sort(),
  "topic metadata must stay explicit: internal latent identity is not a player-visible conclusion",
);
assert.equal(craftTopic.short, "制作方式");
assert.equal(craftTopic.summary, TOPIC_SUMMARY);
assert.deepEqual(craftTopic.memberIds, ["obs.corpus.identity", "obs.current.base", "obs.current.whole"]);
const corpusRelated = relatedNodeIds(graph, focusForAction("A.COMPARE.CORPUS"));
assert(corpusRelated.has("obs.corpus.identity"), "the action's observation is related");
assert(corpusRelated.has("obs.current.whole"), "a direct prerequisite is related");
assert(corpusRelated.has("obs.current.base"), "all direct prerequisites are related");
assert(!corpusRelated.has(craftTopic.id), "a topic is grouping metadata, not another highlighted graph node");
assert.deepEqual([...relatedTopicIds(graph, focusForAction("A.COMPARE.CORPUS"))], [craftTopic.id]);
const craftFocus = focusForTopic(craftTopic.id, graph);
assert.equal(craftFocus.source, "topic");
assert.deepEqual(craftFocus.observationIds, craftTopic.memberIds);
assert.deepEqual(
  [...relatedNodeIds(graph, craftFocus)].sort(),
  ["AX:identity", ...craftTopic.memberIds].sort(),
  "topic focus may reach the directly supported established conclusion, but no second topic",
);
const uvRelated = relatedNodeIds(graph, uvFocus);
assert.deepEqual([...uvRelated], ["obs.surface.no-signal.unresolved"], "isolated UV focus does not dim the map by falsely adding unrelated Q5 nodes");

const surfaceSession = newSession();
expectTake(surfaceSession, "A.SCREEN.UV");
expectTake(surfaceSession, "A.INSPECT.WINDOWS");
const surfaceGraph = mentalMap(solve(surfaceSession));
const surfaceTopic = surfaceGraph.topics.find((topic) => topic.id === "T:latent.surface-map");
assert(surfaceTopic, "two acquired surface observations should form a topic even when one is suspended");
assert.deepEqual(surfaceTopic.memberIds, ["obs.surface.no-signal.unresolved", "obs.surface.point-layering"]);
assert.equal(surfaceGraph.nodes.find((node) => node.id === "obs.surface.no-signal.unresolved")?.state, "suspended");
assert(
  relatedNodeIds(surfaceGraph, focusForAction("A.SCREEN.UV")).has("obs.surface.point-layering"),
  "clicking UV should reveal its directly shared surface topic without asserting a conclusion",
);

const decision = decisionSurface(focusSolved, workbench(focusSession));
const negative = decision.items.find((item) => item.id === "N:obs.surface.no-signal.unresolved");
const majorGap = decision.items.find((item) => item.id === "C:majorReassembly");
assert(negative && decisionItemMatches(negative, uvFocus), "the UV action focuses its matching decision item");
assert(majorGap && decisionItemMatches(majorGap, focusForQuestion("Q3")), "Q3 focuses the major-reassembly decision item");
assert(!decisionItemMatches(majorGap, uvFocus), "an exact UV focus must not match an unrelated gap merely because both remain open");

const firstStep = newSession();
expectTake(firstStep, "A.OBSERVE.WHOLE");
const firstDecision = decisionSurface(solve(firstStep), workbench(firstStep));
const identityPath = firstDecision.items.find((item) => item.id === "C:identity:path");
assert(identityPath, "the first-step decision surface should contain the identity path gap");
assert(
  decisionItemMatches(identityPath, focusForAction("A.OBSERVE.WHOLE", "obs.current.whole")),
  "claim-slot ids such as C:identity:path must still match their long-term question",
);
assert(
  firstDecision.items.some((item) => decisionItemMatches(item, focusForAction("A.OBSERVE.WHOLE", "obs.current.whole"))),
  "a completed action must still focus the open question it advances after it disappears from the suggested means",
);

for (const question of QUESTIONS) {
  assert(
    decisionItemMatches({ id: "AX:coherentDecisionProfile" }, focusForQuestion(question.id)),
    `the final coherent decision profile must visibly gather ${question.id}`,
  );
}

console.log("PASS focus model: 22 actions, five questions, four Q5 facets, non-node topics, action/place/map/decision focus");
