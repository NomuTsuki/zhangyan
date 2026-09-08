/* Experimental shared selection. It projects acquired sources and real proof
 * witnesses, never changes session state, and never walks a graph recursively. */
import { ACTIONS, ACTION_BY_ID, events } from "./local-case.mjs";
import { ACTION_FOCUS, q5FacetStates } from "../workbench-map-focus-v1/focus.mjs";
import { claimSupporters } from "../workbench-map-focus-v1/projection.mjs";

const unique = (values) => [...new Set(values.filter(Boolean))];
const list = (value) => value instanceof Set ? [...value] : value ?? [];
const claimKey = (id = "") => id.startsWith("claim:") ? id.slice(6) : id;
const OVERVIEW = Object.freeze([
  { claimId: "identity", title: "年代与类别" },
  { claimId: "majorReassembly", title: "重大修复" },
  { claimId: "threePhase", title: "修复顺序" },
  { claimId: "coherentDecisionProfile", title: "连贯说明" },
]);
const CLAIM_IDS = new Set(OVERVIEW.map((row) => row.claimId));
const REQUIREMENTS = new Map(ACTIONS.map((action) => [action.id, unique(
  Object.values(events).filter((event) => event.acquisitionActionId === action.id)
    .flatMap((event) => [...(event.acquisitionRequires ?? []), ...(event.requiresContextFacts ?? [])]),
)]));
const LOCAL_ACTION_SOURCES={
  'A.VERIFY.OBJECT_CONTINUITY':['obs.current.base','obs.phase.t1','obs.object.continuity'],
  'A.IMAGE.XRAY':['obs.structure.xray.early','obs.current.whole'],
  'A.LOCATE.HISTORIC_IMAGE':['obs.phase.t1','obs.current.base','obs.object.continuity'],
  'A.MAP.REGION_CONTINUITY':['obs.phase.t1','obs.current.whole','obs.structure.xray.early','obs.accident.major','obs.structure.major.cross-time','obs.structure.major.documented-cross-time'],
};

function knownSources(solved, graph) {
  return new Set(list(solved?.evidence?.observationIds ?? (graph?.observations ?? []).map((o) => o.id)));
}

function sourcesForClaim(solved, graph, id) {
  const known = knownSources(solved, graph);
  const nodeId = `claim:${id}`;
  const node = (graph?.nodes ?? []).find((item) => item.id === nodeId);
  // Old proof slots omit the archive attribution witness and the foundational
  // claims of a coherent profile. A rendered complete proof therefore owns its
  // exact source package. Partial slots remain useful before a claim exists.
  const proofEdges = (graph?.edges ?? []).filter((edge) => edge.to === nodeId && edge.kind === "support");
  const raw = node
    ? [...(node.sourceIds ?? []), ...proofEdges.flatMap((edge) => edge.sourceIds ?? [])]
    : solved?.coverage ? claimSupporters(solved, id) : [];
  return unique(raw).filter((sourceId) => known.has(sourceId));
}

export function judgmentOverview(solved, graph) {
  return OVERVIEW.map((row) => {
    const claim = solved?.claims?.[row.claimId] ?? {};
    const sourceIds = sourcesForClaim(solved, graph, row.claimId);
    const status = claim.logicallyRefuted ? "refuted" : claim.contested ? "contested"
      : claim.established === true ? "established" : sourceIds.length ? "partial" : "unseen";
    const statusLabel = { refuted: "已有反驳", contested: "存在冲突", established: "已有依据", partial: "尚待判断", unseen: "尚无依据" }[status];
    return { ...row, id: `claim:${row.claimId}`, status, statusLabel,
      established: claim.established === true && !claim.contested && !claim.logicallyRefuted, sourceIds };
  });
}

export function judgmentFacets(solved, workbenchRows = []) {
  return q5FacetStates(solved, workbenchRows);
}

export function resolveSelection(selection, graph, solved, session, workbenchRows = []) {
  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];
  const frontiers = graph?.frontiers ?? [];
  const observations = graph?.observations ?? [];
  const byNode = new Map(nodes.map((node) => [node.id, node]));
  const byObservation = new Map(observations.map((observation) => [observation.id, observation]));
  const known = knownSources(solved, graph);
  const nodeIds = new Set(); const edgeIds = new Set(); const frontierIds = new Set();
  const actionIds = new Set(); const placeIds = new Set(); const claimIds = new Set();
  const sourceIds = new Set(); const primaryNodeIds = new Set(); const primaryEdgeIds = new Set();
  const knownSource = (id) => { if (known.has(id)) sourceIds.add(id); };
  const addNode = (id, primary = false) => {
    if (!byNode.has(id)) return;
    nodeIds.add(id);
    if (primary) primaryNodeIds.add(id);
  };
  const representSource = (id, primary = false) => {
    if (!known.has(id)) return;
    const observation = byObservation.get(id);
    if (byNode.has(id)) addNode(id, primary);
    else if (observation?.nodeId) addNode(observation.nodeId, primary);
    else for (const node of nodes) if (node.kind !== "claim" && (node.sourceIds ?? []).includes(id)) addNode(node.id, primary);
    // A relation report can be folded into a road, while its source remains
    // individually selectable from the investigation history.
    if (observation?.representedAs === "relation") {
      for (const edge of edges) if ((observation.edgeIds ?? []).includes(edge.id) && (edge.sourceIds ?? []).includes(id)) {
        edgeIds.add(edge.id); if (primary) primaryEdgeIds.add(edge.id);
        addNode(edge.from); addNode(edge.to);
      }
    }
  };
  const addEdge = (edge, primary = false) => {
    edgeIds.add(edge.id); if (primary) primaryEdgeIds.add(edge.id);
    addNode(edge.from); addNode(edge.to);
  };
  const expandOneHop = () => {
    const seeds = new Set(primaryNodeIds);
    for (const edge of edges) if (seeds.has(edge.from) || seeds.has(edge.to)) addEdge(edge);
    for (const frontier of frontiers) {
      if ((frontier.anchorIds ?? []).some((id) => seeds.has(id))) frontierIds.add(frontier.id);
    }
  };
  let subject = null;

  if (selection?.kind === "evidence") {
    const observation = byObservation.get(selection.id);
    const selectedNode = byNode.get(selection.id);
    const interpretation=selectedNode?.kind==='interpretation'&&selectedNode.sourceIds?.length&&selectedNode.sourceIds.every(id=>known.has(id));
    if (interpretation || (known.has(selection.id) && (observation || selectedNode?.kind === "evidence"))) {
      subject = observation ?? selectedNode;
      for (const id of selectedNode?.sourceIds ?? [selection.id]) knownSource(id);
      knownSource(selection.id);
      if(interpretation)addNode(selectedNode.id,true);
      for (const id of sourceIds) representSource(id, !interpretation);
      expandOneHop();
    }
  } else if (selection?.kind === "edge") {
    subject = edges.find((edge) => edge.id === selection.id) ?? null;
    if (subject) {
      addEdge(subject, true);
      for (const id of subject.sourceIds ?? []) knownSource(id);
    }
  } else if (selection?.kind === "gap") {
    subject = frontiers.find((frontier) => frontier.id === selection.id) ?? null;
    if (subject) {
      frontierIds.add(subject.id);
      for (const id of subject.anchorIds ?? []) addNode(id, true);
      for (const id of subject.sourceIds ?? []) knownSource(id);
      for (const id of subject.anchorIds ?? []) {
        const node = byNode.get(id);
        if (node?.kind === "evidence") for (const sourceId of node.sourceIds ?? [id]) knownSource(sourceId);
      }
      for (const id of subject.actionIds ?? []) if (ACTION_BY_ID.has(id)) actionIds.add(id);
    }
  } else if (selection?.kind === "claim" && CLAIM_IDS.has(claimKey(selection.id))) {
    const id = claimKey(selection.id);
    subject = judgmentOverview(solved, graph).find((row) => row.claimId === id);
    claimIds.add(id); addNode(`claim:${id}`, true);
    for (const sourceId of sourcesForClaim(solved, graph, id)) { knownSource(sourceId); representSource(sourceId); }
    for (const edge of edges) if (edge.to === `claim:${id}` && ["support", "conflict"].includes(edge.kind)) addEdge(edge);
    for (const frontier of frontiers) if ((frontier.anchorIds ?? []).includes(`claim:${id}`)) frontierIds.add(frontier.id);
  } else if (selection?.kind === "action" || selection?.kind === "place") {
    const selectedActions = selection.kind === "action"
      ? ACTIONS.filter((action) => action.id === selection.id)
      : ACTIONS.filter((action) => action.place === selection.id);
    if (selectedActions.length) {
      subject = selection.kind === "action"
        ? { ...selectedActions[0], ...(workbenchRows.find((row) => row.action.id === selection.id) ?? {}) }
        : { id: selection.id, actionIds: selectedActions.map((action) => action.id) };
      for (const action of selectedActions) {
        actionIds.add(action.id); placeIds.add(action.place);
        for (const id of LOCAL_ACTION_SOURCES[action.id]??ACTION_FOCUS[action.id]?.observationIds??[]) knownSource(id);
        // Acquisition and interpretation conditions may point at already-held
        // evidence. Their future outputs never become visible node identities.
        for (const fact of REQUIREMENTS.get(action.id) ?? []) {
          for (const witness of solved?.coverage?.factWitnesses?.[fact] ?? []) knownSource(witness.observationId);
        }
        if (action.id === "A.MAP.REGION_CONTINUITY") {
          for (const fact of ["currentStructureReadoutByRegion", "t2ArchiveObjectAttribution"]) {
            for (const witness of solved?.coverage?.factWitnesses?.[fact] ?? []) knownSource(witness.observationId);
          }
        }
        for (const frontier of frontiers) if ((frontier.actionIds ?? []).includes(action.id)) {
          frontierIds.add(frontier.id);
          for (const id of frontier.anchorIds ?? []) {
            addNode(id, true);
            const node = byNode.get(id);
            if (node?.kind === "evidence") for (const sourceId of node.sourceIds ?? [id]) knownSource(sourceId);
          }
        }
      }
      for (const id of sourceIds) representSource(id, true);
      expandOneHop();
    }
  }

  // Claim chips reflect actual proof witnesses only. Generic thematic overlap
  // (for example two observations mentioning repair) never counts as support.
  if (subject && selection.kind !== "claim") {
    for (const row of judgmentOverview(solved, graph)) {
      if (row.sourceIds.some((id) => sourceIds.has(id))) claimIds.add(row.claimId);
    }
  }
  const acquiredActions = new Map((session?.acquired ?? []).map((event) => [event.observationId, event.acquisitionActionId]));
  for (const id of sourceIds) {
    const actionId = byObservation.get(id)?.actionId ?? acquiredActions.get(id);
    if (ACTION_BY_ID.has(actionId)) actionIds.add(actionId);
  }
  for (const id of actionIds) { const place = ACTION_BY_ID.get(id)?.place; if (place) placeIds.add(place); }

  return {
    selection: subject ? { ...selection } : null, subject, active: subject !== null,
    related: nodeIds.size > 0 || edgeIds.size > 0 || frontierIds.size > 0,
    nodeIds: [...nodeIds], edgeIds: [...edgeIds], frontierIds: [...frontierIds],
    actionIds: [...actionIds], placeIds: [...placeIds], claimIds: [...claimIds],
    sourceIds: [...sourceIds], primaryNodeIds: [...primaryNodeIds], primaryEdgeIds: [...primaryEdgeIds],
    sources: [...sourceIds].map((id) => byObservation.get(id)).filter(Boolean),
  };
}
