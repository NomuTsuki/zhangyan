/*
  Experimental player-facing focus model.

  This file only projects the existing action / solver state into five short
  player questions.  It does not decide action availability, proof, stage, or
  outcome.  In particular, a Q5 facet being "resolved" is a presentation of
  the frozen coverage facts, not a second G3 rule.
*/

import { ACTIONS } from "../knowledge-map-slice-v0/case.mjs";
import { SLOT_FACTS } from "./projection.mjs";

const freezeList = (values) => Object.freeze([...values]);

export const QUESTIONS = Object.freeze([
  Object.freeze({ id: "Q1", label: "它大概是什么？" }),
  Object.freeze({ id: "Q2", label: "这些证据说的是同一只吗？" }),
  Object.freeze({ id: "Q3", label: "它是不是被大修过？" }),
  Object.freeze({ id: "Q4", label: "它先后经历了什么？" }),
  Object.freeze({ id: "Q5", label: "接手还要看哪些方面？" }),
]);

export const Q5_FACETS = Object.freeze([
  Object.freeze({
    id: "material",
    questionId: "Q5",
    label: "关键处由什么构成？",
    actionIds: freezeList([
      "A.ANALYZE.MATERIAL.SUBSTRATE",
      "A.INSPECT.MATERIAL.LAYER_SEQUENCE",
    ]),
    requiredFacts: freezeList(SLOT_FACTS.coherentDecisionProfile.keyMaterial),
    clueObservationIds: freezeList([
      "obs.key-material.substrate-readings",
      "obs.key-material.layer-sequence",
    ]),
  }),
  Object.freeze({
    id: "surface",
    questionId: "Q5",
    label: "表面改过多少？",
    actionIds: freezeList([
      "A.INSPECT.WINDOWS",
      "A.SYNTHESIZE.SURFACE_REGIONS",
      "A.SCREEN.UV",
    ]),
    requiredFacts: freezeList(SLOT_FACTS.coherentDecisionProfile.surface),
    clueObservationIds: freezeList([
      "obs.surface.point-layering",
      "obs.surface.resolved",
      "obs.surface.no-signal.unresolved",
    ]),
  }),
  Object.freeze({
    id: "stability",
    questionId: "Q5",
    label: "现在稳不稳？",
    actionIds: freezeList([
      "A.ASSESS.TREATED_AND_UNTREATED",
    ]),
    requiredFacts: freezeList(SLOT_FACTS.coherentDecisionProfile.stability),
    clueObservationIds: freezeList([
      "obs.stability.resolved",
    ]),
  }),
  Object.freeze({
    id: "documentation",
    questionId: "Q5",
    label: "来路边界清楚吗？",
    actionIds: freezeList([
      "A.TRACE.PROVENANCE_CHAIN",
    ]),
    requiredFacts: freezeList(SLOT_FACTS.coherentDecisionProfile.documentation),
    clueObservationIds: freezeList([
      "obs.documentation.resolved",
    ]),
  }),
]);

const RAW_ACTION_FOCUS = {
  "A.OBSERVE.WHOLE": {
    primaryQuestionIds: ["Q1", "Q3"],
    observationIds: ["obs.current.whole"],
  },
  "A.OBSERVE.BASE": {
    primaryQuestionIds: ["Q1"],
    relatedQuestionIds: ["Q2"],
    observationIds: ["obs.current.base"],
  },
  "A.OBSERVE.REGION_DECOR": {
    primaryQuestionIds: ["Q3"],
    observationIds: ["obs.appearance.restore"],
  },
  "A.COMPARE.CORPUS": {
    primaryQuestionIds: ["Q1"],
    observationIds: ["obs.corpus.identity"],
  },
  "A.COMPARE.CORPUS.RECHECK": {
    primaryQuestionIds: ["Q1"],
    observationIds: ["obs.corpus.identity.repeat"],
  },
  "A.VERIFY.OBJECT_CONTINUITY": {
    primaryQuestionIds: ["Q2"],
    relatedQuestionIds: ["Q1", "Q3", "Q4", "Q5"],
    observationIds: ["obs.object.continuity"],
  },
  "A.IMAGE.XRAY": {
    primaryQuestionIds: ["Q3"],
    observationIds: ["obs.structure.xray.early"],
  },
  "A.SCREEN.UV": {
    primaryQuestionIds: ["Q5"],
    facetId: "surface",
    observationIds: ["obs.surface.no-signal.unresolved"],
  },
  "A.RESEARCH.ACCIDENT": {
    primaryQuestionIds: ["Q3", "Q4"],
    observationIds: ["obs.accident.major"],
  },
  "A.RELATE.ARCHIVE.T2_TO_OBJECT": {
    primaryQuestionIds: ["Q2"],
    relatedQuestionIds: ["Q3", "Q4"],
    observationIds: ["obs.archive.t2.object-attribution"],
  },
  "A.CORROBORATE.ARCHIVE.T2_CURRENT": {
    primaryQuestionIds: ["Q3", "Q4"],
    observationIds: ["obs.archive.t2.current-corroboration"],
  },
  "A.LOCATE.HISTORIC_IMAGE": {
    primaryQuestionIds: ["Q4"],
    observationIds: ["obs.phase.t1"],
  },
  "A.MAP.REGION_CONTINUITY": {
    primaryQuestionIds: ["Q3"],
    relatedQuestionIds: ["Q4"],
    observationIds: [
      "obs.structure.major.documented-cross-time",
      "obs.structure.major.cross-time",
    ],
  },
  "A.RESEARCH.LATE_TREATMENT": {
    primaryQuestionIds: ["Q4"],
    observationIds: ["obs.phase.t3"],
  },
  "A.RELATE.ARCHIVE.T3_TO_OBJECT": {
    primaryQuestionIds: ["Q2", "Q4"],
    observationIds: ["obs.archive.t3.object-attribution"],
  },
  "A.CORROBORATE.ARCHIVE.T3_CURRENT": {
    primaryQuestionIds: ["Q4"],
    observationIds: ["obs.archive.t3.current-corroboration"],
  },
  "A.ANALYZE.MATERIAL.SUBSTRATE": {
    primaryQuestionIds: ["Q5"],
    facetId: "material",
    observationIds: ["obs.key-material.substrate-readings"],
  },
  "A.INSPECT.MATERIAL.LAYER_SEQUENCE": {
    primaryQuestionIds: ["Q5"],
    facetId: "material",
    observationIds: ["obs.key-material.layer-sequence"],
  },
  "A.INSPECT.WINDOWS": {
    primaryQuestionIds: ["Q5"],
    facetId: "surface",
    observationIds: ["obs.surface.point-layering"],
  },
  "A.SYNTHESIZE.SURFACE_REGIONS": {
    primaryQuestionIds: ["Q5"],
    facetId: "surface",
    observationIds: ["obs.surface.resolved"],
  },
  "A.ASSESS.TREATED_AND_UNTREATED": {
    primaryQuestionIds: ["Q5"],
    facetId: "stability",
    observationIds: ["obs.stability.resolved"],
  },
  "A.TRACE.PROVENANCE_CHAIN": {
    primaryQuestionIds: ["Q5"],
    relatedQuestionIds: ["Q2"],
    facetId: "documentation",
    observationIds: ["obs.documentation.resolved"],
  },
};

export const ACTION_FOCUS = Object.freeze(Object.fromEntries(
  Object.entries(RAW_ACTION_FOCUS).map(([actionId, value]) => [
    actionId,
    Object.freeze({
      primaryQuestionIds: freezeList(value.primaryQuestionIds),
      relatedQuestionIds: freezeList(value.relatedQuestionIds ?? []),
      questionIds: freezeList([...(value.primaryQuestionIds ?? []), ...(value.relatedQuestionIds ?? [])]),
      facetId: value.facetId ?? null,
      observationIds: freezeList(value.observationIds),
    }),
  ]),
));

const ACTION_BY_ID = new Map(ACTIONS.map((action) => [action.id, action]));
const QUESTION_ORDER = new Map(QUESTIONS.map((question, index) => [question.id, index]));
const FACET_BY_ID = new Map(Q5_FACETS.map((facet) => [facet.id, facet]));

const placeGroups = new Map();
for (const action of ACTIONS) {
  if (!placeGroups.has(action.place)) placeGroups.set(action.place, []);
  placeGroups.get(action.place).push(action.id);
}

export const PLACE_FOCUS = Object.freeze(Object.fromEntries(
  [...placeGroups.entries()].map(([placeId, actionIds]) => [placeId, freezeList(actionIds)]),
));

const unique = (values) => [...new Set(values)];

function makeFocus(actionIds, source = "actions", extra = {}) {
  const validActionIds = unique(actionIds).filter((id) => ACTION_FOCUS[id]);
  const primaryQuestionIds = unique(validActionIds.flatMap((id) => ACTION_FOCUS[id].primaryQuestionIds))
    .sort((a, b) => QUESTION_ORDER.get(a) - QUESTION_ORDER.get(b));
  const relatedQuestionIds = unique(validActionIds.flatMap((id) => ACTION_FOCUS[id].relatedQuestionIds))
    .filter((id) => !primaryQuestionIds.includes(id))
    .sort((a, b) => QUESTION_ORDER.get(a) - QUESTION_ORDER.get(b));
  const questionIds = unique([...primaryQuestionIds, ...relatedQuestionIds])
    .sort((a, b) => QUESTION_ORDER.get(a) - QUESTION_ORDER.get(b));
  const facetIds = unique(validActionIds.map((id) => ACTION_FOCUS[id].facetId).filter(Boolean));
  const observationIds = unique(validActionIds.flatMap((id) => ACTION_FOCUS[id].observationIds));
  const placeIds = unique(validActionIds.map((id) => ACTION_BY_ID.get(id)?.place).filter(Boolean));
  return Object.freeze({
    source,
    actionId: validActionIds.length === 1 ? validActionIds[0] : null,
    actionIds: freezeList(validActionIds),
    primaryQuestionIds: freezeList(primaryQuestionIds),
    relatedQuestionIds: freezeList(relatedQuestionIds),
    questionIds: freezeList(questionIds),
    facetId: facetIds.length === 1 ? facetIds[0] : null,
    observationIds: freezeList(observationIds),
    placeIds: freezeList(placeIds),
    ...extra,
  });
}

export function focusForAction(actionId, observationId = null) {
  if (!ACTION_FOCUS[actionId]) return null;
  const extra = {};
  if (actionId === "A.MAP.REGION_CONTINUITY" && observationId) {
    const documented = observationId === "obs.structure.major.documented-cross-time";
    extra.primaryQuestionIds = freezeList(["Q3"]);
    extra.relatedQuestionIds = freezeList(documented ? ["Q4"] : []);
    extra.questionIds = freezeList(documented ? ["Q3", "Q4"] : ["Q3"]);
  }
  if (observationId && ACTION_FOCUS[actionId].observationIds.includes(observationId)) {
    extra.observationIds = freezeList([observationId]);
  }
  return makeFocus([actionId], "action", extra);
}

export function focusForActions(actionIds = []) {
  return makeFocus(actionIds, "actions");
}

export function focusForPlace(placeId) {
  const actionIds = PLACE_FOCUS[placeId];
  return actionIds ? makeFocus(actionIds, "place", { placeId }) : null;
}

export function focusForQuestion(questionId) {
  if (!QUESTION_ORDER.has(questionId)) return null;
  return Object.freeze({
    source: "question",
    actionId: null,
    actionIds: freezeList([]),
    primaryQuestionIds: freezeList([questionId]),
    relatedQuestionIds: freezeList([]),
    questionIds: freezeList([questionId]),
    facetId: null,
    observationIds: freezeList([]),
    placeIds: freezeList([]),
  });
}

export function focusForFacet(facetId) {
  const facet = FACET_BY_ID.get(facetId);
  if (!facet) return null;
  return Object.freeze({
    source: "facet",
    actionId: null,
    actionIds: freezeList([]),
    primaryQuestionIds: freezeList([facet.questionId]),
    relatedQuestionIds: freezeList([]),
    questionIds: freezeList([facet.questionId]),
    facetId,
    observationIds: freezeList(facet.clueObservationIds),
    placeIds: freezeList(unique(facet.actionIds.map((id) => ACTION_BY_ID.get(id)?.place).filter(Boolean))),
  });
}

export const Q5_STATE_LABEL = Object.freeze({
  unseen: "未查",
  clue: "已有线索",
  resolved: "已覆盖",
  blocked: "暂时查不了",
});

const asSet = (value) => value instanceof Set ? value : new Set(value ?? []);

export function q5FacetStates(solved, workbenchRows = []) {
  const facts = asSet(solved?.coverage?.facts);
  const observationIds = asSet(solved?.evidence?.observationIds);
  const rows = new Map((workbenchRows ?? []).map((row) => [row?.action?.id, row]));

  return Q5_FACETS.map((facet) => {
    const resolved = facet.requiredFacts.every((fact) => facts.has(fact));
    const hasClue = facet.requiredFacts.some((fact) => facts.has(fact))
      || facet.clueObservationIds.some((id) => observationIds.has(id))
      || facet.actionIds.some((id) => rows.get(id)?.done === true);
    const incompleteRows = facet.actionIds
      .map((id) => rows.get(id))
      .filter((row) => row && row.done !== true);
    const waitsForPrerequisite = !hasClue
      && incompleteRows.length > 0
      && incompleteRows.every((row) => row.usable === false);
    const state = resolved ? "resolved" : hasClue ? "clue" : waitsForPrerequisite ? "blocked" : "unseen";

    return Object.freeze({
      id: facet.id,
      questionId: facet.questionId,
      label: facet.label,
      actionIds: facet.actionIds,
      state,
      stateLabel: Q5_STATE_LABEL[state],
    });
  });
}

export function actionMatchesFocus(actionId, focus) {
  const actionFocus = ACTION_FOCUS[actionId];
  if (!actionFocus || !focus) return false;
  const exactActions = focus.actionIds?.length
    ? focus.actionIds
    : focus.actionId ? [focus.actionId] : [];
  if (exactActions.length) return exactActions.includes(actionId);
  if (focus.facetId) return actionFocus.facetId === focus.facetId;
  return (focus.questionIds ?? []).some((id) => actionFocus.questionIds.includes(id));
}

function graphBody(graph) {
  return graph?.map?.nodes ? graph.map : graph ?? {};
}

function graphNodes(graph) {
  const body = graphBody(graph);
  return [
    ...(body.nodes ?? []),
    ...(body.findings ?? []),
    ...(body.axioms ?? []),
  ];
}

const CLAIM_QUESTIONS = Object.freeze({
  g1: freezeList(["Q1"]),
  identity: freezeList(["Q1", "Q2"]),
  majorReassembly: freezeList(["Q3"]),
  appearanceRestore: freezeList(["Q3"]),
  g2: freezeList(["Q1", "Q2", "Q3"]),
  threePhase: freezeList(["Q4"]),
  coreResolved: freezeList(["Q5"]),
  coherentDecisionProfile: freezeList(["Q1", "Q2", "Q3", "Q4", "Q5"]),
  g3: freezeList(["Q1", "Q2", "Q3", "Q4", "Q5"]),
});

function claimIdOf(value) {
  if (value?.claimId) return value.claimId;
  const id = typeof value?.id === "string" ? value.id : "";
  if (id.startsWith("C:") || id.startsWith("AX:")) {
    return id.slice(id.indexOf(":") + 1).split(":")[0];
  }
  return null;
}

function claimMatchesFocus(value, focus) {
  const claimId = claimIdOf(value);
  const questionIds = CLAIM_QUESTIONS[claimId] ?? [];
  const focusedQuestions = focus?.primaryQuestionIds?.length
    ? focus.primaryQuestionIds
    : focus?.questionIds ?? [];
  return questionIds.some((id) => focusedQuestions.includes(id));
}

export function relatedNodeIds(graph, focus) {
  const body = graphBody(graph);
  const nodes = graphNodes(body);
  const knownIds = new Set(nodes.map((node) => node.id));
  const ids = new Set();
  const focusObservations = asSet(focus?.observationIds);
  const exactActions = focus?.actionIds?.length || focus?.actionId;

  for (const node of nodes) {
    if (node.actionId && actionMatchesFocus(node.actionId, focus)) ids.add(node.id);
    if (focusObservations.has(node.id)) ids.add(node.id);
    if (!exactActions && claimMatchesFocus(node, focus)) ids.add(node.id);
  }

  // One hop shows why the selected evidence matters without turning a precise
  // action click into a highlight of the whole long-term question.
  const seeds = new Set(ids);
  for (const edge of body.edges ?? []) {
    if (seeds.has(edge.from) || seeds.has(edge.to)) {
      if (knownIds.has(edge.from)) ids.add(edge.from);
      if (knownIds.has(edge.to)) ids.add(edge.to);
    }
  }
  return ids;
}

function collectReferences(value, refs, seen = new WeakSet()) {
  if (typeof value === "string") {
    if (ACTION_FOCUS[value]) refs.actionIds.add(value);
    if (value.startsWith("obs.")) refs.observationIds.add(value);
    return;
  }
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const entry of value) collectReferences(entry, refs, seen);
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (key === "body" || key === "title" || key === "why" || key === "line") continue;
    collectReferences(entry, refs, seen);
  }
}

export function decisionItemMatches(item, focus) {
  if (!item || !focus) return false;
  const refs = { actionIds: new Set(), observationIds: new Set() };
  collectReferences(item, refs);
  const id = typeof item.id === "string" ? item.id : "";
  for (const observationId of focus.observationIds ?? []) {
    if (id === observationId || id.endsWith(`:${observationId}`)) refs.observationIds.add(observationId);
  }

  const exactActions = focus.actionIds?.length
    ? focus.actionIds
    : focus.actionId ? [focus.actionId] : [];
  if (exactActions.length) {
    if (exactActions.some((id) => refs.actionIds.has(id))) return true;
    if ((focus.observationIds ?? []).some((id) => refs.observationIds.has(id))) return true;
    return claimMatchesFocus(item, focus);
  }

  if ([...refs.actionIds].some((id) => actionMatchesFocus(id, focus))) return true;
  const focusObservations = asSet(focus.observationIds);
  if ([...refs.observationIds].some((id) => focusObservations.has(id))) return true;
  return claimMatchesFocus(item, focus);
}
