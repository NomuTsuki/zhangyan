/* Experimental presentation projection. Atlas remains the observation/claim
 * authority; frontiers expose questions grounded in acquired observations.
 * continuation contains layout hints only: it must never create a fact node.
 * Support groups are complete ALL packages; an alternativeSet relates packages
 * by OR. Neither this metadata nor a single visual edge establishes a claim. */
import { buildGraph as buildAtlasGraph } from "../workbench-map-atlas-v0/graph.mjs";
import { ACTION_BY_ID } from "../knowledge-map-slice-v0/case.mjs";

const unique = (items) => [...new Set(items.filter(Boolean))];
const O = {
  whole: "obs.current.whole", base: "obs.current.base", corpus: "obs.corpus.identity",
  continuity: "obs.object.continuity", xray: "obs.structure.xray.early", t1: "obs.phase.t1",
  t2: "obs.accident.major", t3: "obs.phase.t3", physical: "obs.structure.major.cross-time",
  documented: "obs.structure.major.documented-cross-time", point: "obs.surface.point-layering",
  surface: "obs.surface.resolved", substrate: "obs.key-material.substrate-readings",
  layer: "obs.key-material.layer-sequence",
};
const ARCHIVES = {
  t2: { record: O.t2, title: "事故记录", read: "A.RESEARCH.ACCIDENT", prefix: "PROOF.ARCHIVE.T2.",
    attr: "A.RELATE.ARCHIVE.T2_TO_OBJECT", corr: "A.CORROBORATE.ARCHIVE.T2_CURRENT" },
  t3: { record: O.t3, title: "后期记录", read: "A.RESEARCH.LATE_TREATMENT", prefix: "PROOF.ARCHIVE.T3.",
    attr: "A.RELATE.ARCHIVE.T3_TO_OBJECT", corr: "A.CORROBORATE.ARCHIVE.T3_CURRENT" },
};
const NEXT = {
  "question:context": { nodeIds: [O.continuity], edgeIds: [] },
  "question:surface": { nodeIds: [O.surface], edgeIds: [`support:${O.point}:${O.surface}`] },
  "question:material-sequence": { nodeIds: [O.layer], edgeIds: [] },
  "question:material-base": { nodeIds: [O.substrate], edgeIds: [] },
  "question:craft": { nodeIds: [O.corpus], edgeIds: [] },
  "question:negative": { nodeIds: [O.point], edgeIds: [] },
  "question:appearance": { nodeIds: [O.point], edgeIds: [] },
  "question:change": { nodeIds: [O.physical], edgeIds: [] },
};

export function buildGraph(solved, session) {
  const graph = buildAtlasGraph(solved, session);
  const coverage = solved.coverage ?? {};
  const facts = new Set(coverage.facts ?? []);
  const acquired = new Set(graph.observations.map((observation) => observation.id));
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const obsById = new Map(graph.observations.map((observation) => [observation.id, observation]));
  const roleIds = (...roles) => unique(roles.flatMap((role) =>
    (coverage.proofRoleWitnesses?.[role] ?? []).map((witness) => witness.observationId))).filter((id) => acquired.has(id));
  const factIds = (...names) => unique(names.flatMap((name) =>
    (coverage.factWitnesses?.[name] ?? []).map((witness) => witness.observationId))).filter((id) => acquired.has(id));
  const representative = (id) => obsById.get(id)?.nodeId ?? id;
  const sourceIdsFor = (anchors) => unique(anchors.flatMap((id) => nodeById.get(id)?.sourceIds ?? [])).filter((id) => acquired.has(id));
  const frontiers = [];
  const add = (question) => {
    const anchorIds = unique(question.anchorIds).filter((id) => nodeById.has(id));
    if (!anchorIds.length || frontiers.some((item) => item.id === question.id)) return;
    frontiers.push({
      ...question,
      anchorIds,
      sourceIds: unique([...(question.sourceIds ?? []), ...sourceIdsFor(anchorIds)]).filter((id) => acquired.has(id)),
      actionIds: unique(question.actionIds ?? []).filter((id) => ACTION_BY_ID.has(id)),
      continuation: question.continuation ?? { nodeIds: [], edgeIds: [] },
    });
  };

  // Preserve atlas's authored open questions while replacing the archive
  // catch-all by three independently meaningful relationship frontiers.
  for (const question of graph.questions) {
    if (/^question:archive:(t2|t3)$/.test(question.id)) continue;
    const kind = question.id.startsWith("question:registered:") ? "boundary"
      : question.id.startsWith("question:conflict:") ? "conflict"
      : question.anchorIds.length > 1 ? "shared" : "stub";
    const archiveSource = /^question:archive:(t2|t3):source$/.exec(question.id);
    const continuation = archiveSource ? { nodeIds: [ARCHIVES[archiveSource[1]].record], edgeIds: [] }
      : NEXT[question.id] ? { nodeIds: [...NEXT[question.id].nodeIds], edgeIds: [...NEXT[question.id].edgeIds] }
      : { nodeIds: [], edgeIds: [] };
    if (question.id === "question:context") {
      continuation.edgeIds = question.anchorIds.map((id) => `context:${O.continuity}:${id}`);
    }
    add({ ...question, kind, continuation });
  }

  for (const [key, archive] of Object.entries(ARCHIVES)) {
    if (!nodeById.has(archive.record)) continue;
    const relation = coverage.archiveRelations?.[key] ?? {};
    const knownEndpoints = [archive.record, O.whole].filter((id) => nodeById.has(id));
    const nextCorr = [archive.corr];
    const crossTime = ACTION_BY_ID.get("A.MAP.REGION_CONTINUITY");
    // Once readable X-ray structure is present this action takes the physical
    // branch. It must then disappear from the archive-correspondence methods.
    if (key === "t2" && crossTime.outcome(facts) === "documentedCrossTime" && crossTime.needs(facts)) {
      nextCorr.push(crossTime.id);
    }
    const relationships = [
      { suffix: "record", status: relation.recordCoherence,
        title: `${archive.title}内部相容吗？`,
        contestedTitle: `${archive.title}内部有冲突`,
        contestedFact: `${key}ArchiveRecordCoherenceContested`,
        explanation: "这组记录之间是否相容需要独立核对；它不等于记录属于这只碗，也不等于记载的事件得到物证印证。",
        anchorIds: [archive.record], actionIds: [], roles: ["RECORD_COHERENCE"] },
      { suffix: "attribution", status: relation.objectAttribution,
        title: `${archive.title}说的是这只碗吗？`,
        contestedTitle: `${archive.title}归属有冲突`,
        contestedFact: `${key}ArchiveObjectAttributionContested`,
        explanation: "需要核对记录所指的对象。事件看起来相符，仍不能代替对象归属；归属核实也不自动证明记载事件。",
        anchorIds: knownEndpoints, actionIds: [archive.attr], roles: ["OBJECT_ATTRIBUTION"] },
      { suffix: "corroboration", status: relation.eventCorroboration,
        title: `${archive.title}与实物相符吗？`,
        contestedTitle: `${archive.title}与实物有冲突`,
        contestedFact: `${key}EventPhysicalCorrespondenceContested`,
        explanation: "需要把记录所述处理与实物对应。对象归属与事件印证分别成立；本段接通不会替另一段作结论。",
        anchorIds: knownEndpoints, actionIds: nextCorr,
        roles: ["EVENT_CURRENT_CORROBORATION", "EVENT_CROSS_TIME_CORROBORATION"] },
    ];
    for (const relationQuestion of relationships) {
      if (relationQuestion.status === "established") continue;
      const contested = relationQuestion.status === "contested";
      const conflictSources = contested ? factIds(relationQuestion.contestedFact) : [];
      add({
        id: `question:archive:${key}:${relationQuestion.suffix}`,
        kind: contested ? "conflict" : relationQuestion.anchorIds.length === 2 ? "gap" : "stub",
        anchorIds: [...relationQuestion.anchorIds, ...conflictSources.map(representative)],
        title: contested ? relationQuestion.contestedTitle : relationQuestion.title,
        explanation: contested ? "已取得的核验对这一关系提出冲突。现有手段不能保证消除这项矛盾；保留双方依据，不替玩家选边。" : relationQuestion.explanation,
        sourceIds: [...roleIds(...relationQuestion.roles.map((role) => archive.prefix + role)), ...conflictSources],
        actionIds: contested ? [] : relationQuestion.actionIds,
        continuation: { nodeIds: [], edgeIds: relationQuestion.suffix === "record" ? [] : [`archive:${key}:object`] },
      });
    }
  }

  // An acquired report can establish record coherence even without a visible
  // object endpoint. Store all three statuses on the record for its detail view.
  for (const [key, archive] of Object.entries(ARCHIVES)) {
    const record = nodeById.get(archive.record);
    if (!record) continue;
    const relation = coverage.archiveRelations?.[key] ?? {};
    record.relations = [
      { key: "record", title: "记录内部一致", status: relation.recordCoherence ?? "unresolved", sourceIds: roleIds(archive.prefix + "RECORD_COHERENCE") },
      { key: "attribution", title: "记录对应这只碗", status: relation.objectAttribution ?? "unresolved", sourceIds: roleIds(archive.prefix + "OBJECT_ATTRIBUTION") },
      { key: "corroboration", title: "记载事件得到实物印证", status: relation.eventCorroboration ?? "unresolved", sourceIds: roleIds(archive.prefix + "EVENT_CURRENT_CORROBORATION", archive.prefix + "EVENT_CROSS_TIME_CORROBORATION") },
    ];
    const edge = graph.edges.find((item) => item.id === `archive:${key}:object`);
    if (edge) edge.relations = record.relations.map((item) => ({ ...item, sourceIds: [...item.sourceIds] }));
  }

  const supportGroups = [];
  const addSupportGroup = (id, key, title, sourceIds, edgeIds, memberNodeIds) => {
    const targetId = `claim:${key}`;
    if (nodeById.get(targetId)?.state !== "established") return;
    const sources = unique(sourceIds).filter((source) => acquired.has(source));
    const edges = unique(edgeIds).filter((edgeId) => graph.edges.some((edge) => edge.id === edgeId));
    if (!sources.length || !edges.length) return;
    const members = unique(memberNodeIds ?? sources.map(representative)).filter((nodeId) => nodeById.has(nodeId) && nodeId !== targetId);
    const group = { id, targetId, kind: "all", alternativeSet: `proof-options:${key}`, title,
      sourceIds: sources, memberNodeIds: members, edgeIds: edges };
    supportGroups.push(group);
    for (const edgeId of edges) {
      const edge = graph.edges.find((item) => item.id === edgeId);
      edge.supportGroupIds = unique([...(edge.supportGroupIds ?? []), id]);
    }
  };
  const incoming = (key) => graph.edges.filter((edge) => edge.to === `claim:${key}` && edge.kind === "support");
  const identityCommon = factIds("currentBody", "baseManufacture");
  for (const [suffix, fact, title] of [
    ["comparison", "identityComparisonExclusion", "整体与底足＋同期比对"],
    ["continuity", "identityObjectContinuity", "整体与底足＋对象连续性"],
  ]) {
    const paths = factIds(fact);
    if (!paths.length) continue;
    const members = unique([...identityCommon, ...paths].map(representative));
    addSupportGroup(`proof-group:identity:${suffix}`, "identity", title, [...identityCommon, ...paths],
      incoming("identity").filter((edge) => members.includes(edge.from)).map((edge) => edge.id), members);
  }
  if (coverage.majorProofPaths?.documented) {
    const common = roleIds("PROOF.ARCHIVE.T2.RECORD_COHERENCE", "PROOF.ARCHIVE.T2.OBJECT_ATTRIBUTION");
    for (const [suffix, role, title] of [
      ["current", "EVENT_CURRENT_CORROBORATION", "档案链＋现器事件印证"],
      ["cross-time", "EVENT_CROSS_TIME_CORROBORATION", "档案链＋跨时点印证"],
    ]) {
      const proof = roleIds("PROOF.ARCHIVE.T2." + role);
      if (proof.length) addSupportGroup(`proof-group:major:documented-${suffix}`, "majorReassembly", title,
        [...common, ...proof], incoming("majorReassembly").filter((edge) => edge.id.endsWith(":documented")).map((edge) => edge.id));
    }
  }
  if (coverage.majorProofPaths?.physical) {
    addSupportGroup("proof-group:major:physical", "majorReassembly", "修补分布＋逐区结构＋跨时点变化",
      roleIds("PROOF.CURRENT.NAMED_REPAIR_MAP", "PROOF.MAJOR.PHYSICAL.STRUCTURE_MAP", "PROOF.MAJOR.PHYSICAL.CROSS_TIME"),
      incoming("majorReassembly").filter((edge) => edge.id.endsWith(":physical")).map((edge) => edge.id));
  }
  for (const [key, title] of [["threePhase", "可解释的早期状态＋两组完整档案关系"],
    ["coherentDecisionProfile", "各项判断与决策范围共同成立"]]) {
    const node = nodeById.get(`claim:${key}`);
    if (!node) continue;
    addSupportGroup(`proof-group:${key}`, key, title, node.sourceIds,
      incoming(key).map((edge) => edge.id), incoming(key).map((edge) => edge.from));
  }
  graph.frontiers = frontiers;
  graph.questions = frontiers;
  graph.supportGroups = supportGroups;
  return graph;
}

// Compare semantic content, not insertion order or only edge IDs. An archive
// attribution and its later corroboration deliberately share a stable edge ID.
function stable(value) {
  if (Array.isArray(value)) return value.map(stable).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
const edgeContent = (edge) => JSON.stringify(stable({ kind: edge.kind, label: edge.label,
  details: edge.details, sourceIds: edge.sourceIds, relations: edge.relations, supportGroupIds: edge.supportGroupIds }));

export function diffGraphs(before, after) {
  const oldNodes = new Map((before?.nodes ?? []).map((node) => [node.id, node]));
  const oldEdges = new Map((before?.edges ?? []).map((edge) => [edge.id, edge]));
  const remainingFrontiers = new Set((after.frontiers ?? after.questions ?? []).map((frontier) => frontier.id));
  return {
    addedNodeIds: after.nodes.filter((node) => !oldNodes.has(node.id)).map((node) => node.id),
    addedEdgeIds: after.edges.filter((edge) => !oldEdges.has(edge.id)).map((edge) => edge.id),
    changedEdgeIds: after.edges.filter((edge) => oldEdges.has(edge.id) && edgeContent(oldEdges.get(edge.id)) !== edgeContent(edge)).map((edge) => edge.id),
    activatedNodeIds: after.nodes.filter((node) => oldNodes.get(node.id)?.state === "pending" && node.state !== "pending" && node.contextualized).map((node) => node.id),
    resolvedFrontierIds: (before?.frontiers ?? before?.questions ?? []).filter((frontier) => !remainingFrontiers.has(frontier.id)).map((frontier) => frontier.id),
  };
}
