/* Experimental player projection. Only acquired observations and public solver
 * output are read. A sourceIds entry is an observation ID, never a new evidence
 * weight. Statements are not promoted from nonempty proof slots. */
import { events } from "../first-ceramic-author-scenarios-v0/fixtures.mjs";
import { ACTION_BY_ID } from "../knowledge-map-slice-v0/case.mjs";
import { ACTION_SEMANTICS, STAGE_SEMANTICS } from "../evidence-semantics-v0/semantics.mjs";

const eventById = new Map(Object.values(events).map((e) => [e.observationId, e]));
const unique = (xs) => [...new Set(xs.filter(Boolean))];
const O = {
  whole: "obs.current.whole", base: "obs.current.base", corpus: "obs.corpus.identity",
  repeat: "obs.corpus.identity.repeat", continuity: "obs.object.continuity",
  xray: "obs.structure.xray.early", t1: "obs.phase.t1", t2: "obs.accident.major", t3: "obs.phase.t3",
  physical: "obs.structure.major.cross-time", documented: "obs.structure.major.documented-cross-time",
  surface: "obs.surface.resolved", point: "obs.surface.point-layering",
  negative: "obs.surface.no-signal.unresolved", substrate: "obs.key-material.substrate-readings",
  layer: "obs.key-material.layer-sequence", stability: "obs.stability.resolved",
  provenance: "obs.documentation.resolved", appearance: "obs.appearance.restore",
};
const TEXT = {
  [O.whole]: ["整器形制与可见修补", "已记录形制、胎釉与肉眼可见的干预分布；可见修补本身不证明重大重组。", "craft"],
  [O.base]: ["底足制造痕迹", "底足留下修削与成型特征，为制造工艺判断提供局部读数。", "craft"],
  [O.corpus]: ["同期真品比对", "把这只碗的制造特征放入同期真品参照，得到可排除与保留的身份方向。", "craft"],
  [O.repeat]: ["比对复核未新增证据", "复核仍属于同一证据单元，保留调查经历，不按另一份独立证据累计。", "craft"],
  [O.continuity]: ["稳定特征确认对象连续", "未改动的稳定特征把现器与历史对象对应起来；这不等于所有事故档案都已归属此碗。", "object"],
  [O.xray]: ["釉下结构影像", "已取得多角度逐区射线读数。能否据此判断，取决于对象连续性的解释前提。", "structure"],
  [O.t1]: ["较早时点的影像", "已取得较早状态的读数；对象连续性确认后，才能把它作为这只碗的历史时间锚点。", "history"],
  [O.t2]: ["事故记录组", "这组记录记述严重损坏与重组。记录之间是否一致、是否属于这只碗、事件是否对应实物，分别核验。", "history"],
  [O.t3]: ["后期处理记录", "记录记述另一时点的局部处理；记录内容不能未经归属与对应就算作这只碗经历。", "history"],
  "obs.archive.t2.object-attribution": ["事故记录归属已核对", "已确认事故记录指向这只碗。记录与实物出现后，这份核验会显示在连接上；它不替代事件物证核验。", "history"],
  "obs.archive.t2.current-corroboration": ["事故所述与实物已核对", "所述处理在声明范围内得到实物对应。事件相符不自动证明记录的对象归属。", "history"],
  "obs.archive.t3.object-attribution": ["后期记录归属已核对", "已确认后期记录指向这只碗；这项归属与事故档案归属分别成立。", "history"],
  "obs.archive.t3.current-corroboration": ["后期处理与实物已核对", "后期处理在声明范围内得到对应，有助于划分后期与早先事件的解释边界。", "history"],
  [O.physical]: ["实物跨时点结构变化", "对比声明范围内的两个时点，取得结构变化读数；它与逐区结构、可见修补分布共同构成物证路线。", "structure"],
  [O.documented]: ["档案与现状的逐区对应", "以档案给出的时点进行逐区对照；这项对应仍依赖档案属于这只碗。", "structure"],
  [O.appearance]: ["外观重整痕迹", "纹饰衔接与色差表明外观被重新整合；它不能单独推出结构层面的大改。", "surface"],
  [O.negative]: ["紫外未见补绘信号", "本次没有检测到信号，但能力不足以证明没有补绘；阴性记录仍保留。", "surface"],
  [O.point]: ["试窗点位的层压关系", "试窗说明所取点位上各层的上下关系，不自动外推成整区结论。", "surface"],
  [O.surface]: ["表面处理的覆盖范围", "点位按区域综合后的范围判断，保留已覆盖区域与适用边界。", "surface"],
  [O.substrate]: ["关键点位的基底读数", "材料分析覆盖声明的关键点位，说明这些点的基底；不能据此宣称整个区域都已化验。", "material"],
  [O.layer]: ["关键界面的层序读数", "界面叠压顺序提供先后关系；与基底读数回答不同问题，不能彼此替代。", "material"],
  [O.stability]: ["承力与陈列条件", "结论限于评估过的承力路径与静态陈列条件，不代表任何使用条件下都安全。", "condition"],
  [O.provenance]: ["流转记录的可追边界", "已核实范围内的流转链与文件一致性；链条边界之外仍可保留未知。", "provenance"],
};
const CLAIMS = {
  identity: ["晚 18 世纪外销瓷方向成立", "整体制造特征与底足读数共同在场，再由比对排除或对象连续性提供身份路径；当前证据支持这一方向。", "craft"],
  majorReassembly: ["曾发生重大重组", "档案路线或物证路线能够成立。每条路线各自的共同条件必须满足，不能把两条未完成路线拼成一条证明。", "structure"],
  threePhase: ["修复史可分为三个阶段", "较早状态、事故事件和后期处理建立了先后解释。三个阶段不等于恰好做过三次修补。", "history"],
  coherentDecisionProfile: ["形成可用于决策的连贯说明", "身份与重大重组、三阶段修复史、材料、表面、承力和记录边界共同支持当前说明；允许保留不阻断判断的未知。", "condition"],
};
const TARGETS = {
  "CLAIM.IDENTITY.LATE18_EXPORT": "identity",
  "CLAIM.REPAIR.MAJOR_REASSEMBLY": "majorReassembly",
  "CLAIM.REPAIR.THREE_PHASE": "threePhase",
  "STAGE_RESULT.G3.COHERENT_DECISION_PROFILE": "coherentDecisionProfile",
};
const CONTEST_TEXT = {
  t2ArchiveRecordCoherenceContested: "事故记录内部有冲突",
  t2ArchiveObjectAttributionContested: "事故记录归属有冲突",
  t2EventPhysicalCorrespondenceContested: "事故所述与实物有冲突",
  t3ArchiveRecordCoherenceContested: "后期记录内部有冲突",
  t3ArchiveObjectAttributionContested: "后期记录归属有冲突",
  t3EventPhysicalCorrespondenceContested: "后期所述与实物有冲突",
  threePhaseChronologyContested: "时序记录互相矛盾",
};
const REL = {
  t2: { record: O.t2, name: "事故记录", prefix: "PROOF.ARCHIVE.T2.",
    attr: "A.RELATE.ARCHIVE.T2_TO_OBJECT", corr: "A.CORROBORATE.ARCHIVE.T2_CURRENT" },
  t3: { record: O.t3, name: "后期记录", prefix: "PROOF.ARCHIVE.T3.",
    attr: "A.RELATE.ARCHIVE.T3_TO_OBJECT", corr: "A.CORROBORATE.ARCHIVE.T3_CURRENT" },
};

export function buildGraph(solved, session) {
  const evidence = solved.evidence ?? {};
  const coverage = solved.coverage ?? {};
  const has = new Set(evidence.observationIds ?? []);
  const inactive = new Set(evidence.inactiveObservationIds ?? []);
  const negative = new Set(evidence.unresolvedNegativeIds ?? []);
  const scoped = new Set(evidence.scopeLimitedObservationIds ?? []);
  const activated = new Set(evidence.contextualizedObservationIds ?? []);
  const facts = new Set(coverage.facts ?? []);
  const acquired = new Map((session?.acquired ?? []).map((e) => [e.observationId, e]));
  const ev = (id) => acquired.get(id) ?? eventById.get(id);
  const factIds = (...names) => unique(names.flatMap((f) => (coverage.factWitnesses?.[f] ?? []).map((w) => w.observationId))).filter((id) => has.has(id));
  const roleIds = (...roles) => unique(roles.flatMap((r) => (coverage.proofRoleWitnesses?.[r] ?? []).map((w) => w.observationId))).filter((id) => has.has(id));
  const known = (...ids) => ids.filter((id) => has.has(id));
  const conflictFor = (id) => (solved.conflicts ?? []).filter((c) => c.observationId === id);
  const order = unique([...(session?.log ?? []).map((l) => l.observationId), ...has]).filter((id) => has.has(id));
  const observations = order.map((id, i) => {
    const e = ev(id);
    const a = ACTION_BY_ID.get(e?.acquisitionActionId);
    const text = TEXT[id];
    const isCounter = conflictFor(id).length > 0;
    const contestFact = (e?.facts ?? []).find((f) => CONTEST_TEXT[f]);
    const title = text?.[0] ?? CONTEST_TEXT[contestFact] ?? (isCounter ? "新读数对已有判断提出限制" : ACTION_SEMANTICS[a?.id]?.gotWhat ?? "已取得的局部观察");
    const state = scoped.has(id) ? "limited" : negative.has(id) ? "limited" : inactive.has(id) ? "pending"
      : conflictFor(id).some((c) => c.blocking) || (e?.facts ?? []).some((f) => /Contested$/.test(f)) ? "contested"
      : (e?.facts ?? []).includes("repeatObservation") ? "repeat" : "known";
    const steps = (session?.log ?? []).flatMap((l, n) => l.observationId === id ? [n + 1] : []);
    return { id, observationId: id, title, summary: text?.[1] ?? (isCounter ? "此项读数的影响按对象、区域、时间及检测能力限定。" : ACTION_SEMANTICS[a?.id]?.gotWhat ?? "保留本次读数及适用范围，不自动升格为完整判断。"),
      state, group: text?.[2] ?? "object", sourceIds: [id], actionId: e?.acquisitionActionId ?? null,
      actionName: a?.name ?? "专门核验", steps, firstSeen: steps[0] ?? i + 1, attempts: steps.length || 1,
      contextualized: activated.has(id), negative: negative.has(id), scopeLimited: scoped.has(id),
      coverage: coverage.observations?.find((o) => o.observationId === id)?.coverage ?? e?.coverage ?? null,
      originalSourceIds: [...(e?.sourceIds ?? [])],
    };
  });
  const byObs = new Map(observations.map((o) => [o.id, o]));
  const nodes = observations.map((o) => ({ ...o, kind: "evidence" }));
  const edges = [];
  const questions = [];
  const hiddenAsRelation = new Map();
  const node = (id) => nodes.find((n) => n.id === id);
  const addEdge = (from, to, label, kind, sourceIds, details, id = `${kind}:${from}:${to}`) => {
    const ids = unique(sourceIds).filter((x) => has.has(x));
    if (!node(from) || !node(to) || from === to || !ids.length || edges.some((e) => e.id === id)) return;
    edges.push({ id, from, to, label, kind, sourceIds: ids, details });
  };
  const ask = (id, anchors, title, explanation, actionIds = []) => {
    const anchorIds = unique(anchors).filter((a) => node(a));
    if (anchorIds.length) questions.push({ id, anchorIds, title, explanation, actionIds: unique(actionIds).filter((a) => ACTION_BY_ID.has(a)) });
  };
  const mergeObservationInto = (id, target) => {
    if (id === target || !node(id) || !node(target)) return;
    hiddenAsRelation.set(id, target);
    nodes.splice(nodes.findIndex((n) => n.id === id), 1);
  };

  // Two independently acquired relation reports can live on the connection.
  // No archive/object endpoint is invented when either has not been observed.
  const archiveSources = {};
  for (const [group, cfg] of Object.entries(REL)) {
    const r = coverage.archiveRelations?.[group] ?? {};
    const recordIds = roleIds(cfg.prefix + "RECORD_COHERENCE");
    const attrIds = roleIds(cfg.prefix + "OBJECT_ATTRIBUTION");
    const corrIds = roleIds(cfg.prefix + "EVENT_CURRENT_CORROBORATION", cfg.prefix + "EVENT_CROSS_TIME_CORROBORATION");
    const all = unique([...recordIds, ...attrIds, ...corrIds]);
    archiveSources[group] = all;
    const recordNode = node(cfg.record);
    if (recordNode) {
      const labels = { established: "已确认", contested: "有冲突", suggestive: "有指向但未确认", unresolved: "未确认" };
      recordNode.summary += ` 当前：记录内部${labels[r.recordCoherence] ?? "未确认"}；属于这只碗${labels[r.objectAttribution] ?? "未确认"}；事件与实物对应${labels[r.eventCorroboration] ?? "未确认"}。`;
      if ([r.recordCoherence, r.objectAttribution, r.eventCorroboration].includes("contested")) recordNode.state = "contested";
    }
    for (const o of observations) {
      const contestedFact = (ev(o.id)?.facts ?? []).find((f) => f.startsWith(group) && CONTEST_TEXT[f]);
      if (contestedFact) addEdge(o.id, cfg.record, CONTEST_TEXT[contestedFact], "conflict", [o.id], "这项已取得报告指出具体关系发生冲突；记录内部、对象归属和事件对应分别处理。");
    }
    const attrOk = r.objectAttribution === "established" && attrIds.length;
    const corrOk = r.eventCorroboration === "established" && corrIds.length;
    if (recordNode && node(O.whole) && (attrOk || corrOk)) {
      const relevant = [...(attrOk ? attrIds : []), ...(corrOk ? corrIds : [])];
      addEdge(cfg.record, O.whole, attrOk && corrOk ? "归属与实物对应已确认" : attrOk ? "记录属于此碗" : "所述事件与实物相符",
        corrOk ? "corroboration" : "attribution", relevant,
        (attrOk ? "稳定锚点确认记录指向此碗。" : "事件相符不自动证明档案归属。") + (corrOk ? "所述处理在声明范围内得到物证对应。" : "归属成立不自动证明记录中每项事件。"), `archive:${group}:object`);
      for (const id of relevant) if (id !== O.documented) mergeObservationInto(id, cfg.record);
    }
    const relationOnly = known(...all).filter((id) => id !== cfg.record);
    if (recordNode) {
      const unknown = [];
      const actions = [];
      if (r.recordCoherence !== "established") unknown.push("记录内部是否相容");
      if (r.objectAttribution !== "established") { unknown.push("是否指向眼前这只碗"); actions.push(cfg.attr); }
      if (r.eventCorroboration !== "established") { unknown.push("所述事件能否在实物上对应"); actions.push(cfg.corr); }
      if (unknown.length) ask(`question:archive:${group}`, [cfg.record], `${cfg.name}还有哪些关系未核实？`, unknown.join("；") + "。这些是对已取得记录的追问，各自独立，不是已完成证明。", actions);
    } else if (relationOnly.length) {
      ask(`question:archive:${group}:source`, relationOnly, "这份关系核验所指的原始记录是什么？", "已经取得关系核验报告；原始记录尚未在本局取得。保留报告，等记录与实物各自出现后再接线。", [group === "t2" ? "A.RESEARCH.ACCIDENT" : "A.RESEARCH.LATE_TREATMENT"]);
    }
  }

  // Reinspection keeps a single evidence identity, while every attempt survives.
  if (node(O.corpus) && node(O.repeat)) {
    const n = node(O.corpus);
    n.sourceIds.push(O.repeat);
    n.summary += " 本局复核没有增加独立证据；可回查复核记录。";
    n.attempts += byObs.get(O.repeat).attempts;
    mergeObservationInto(O.repeat, O.corpus);
  }
  const representative = (id) => hiddenAsRelation.get(id) ?? id;
  // A semantic comparison uses these observed readings. These are not generic
  // acquisitionRequires links: the relation is independently authored here.
  for (const from of [O.whole, O.base]) addEdge(from, O.corpus, from === O.base ? "底足参与工艺比对" : "整体特征参与比对", "context", known(from, O.corpus), "这次比对使用了这只碗的制造痕迹，比较结果依赖这些实际读数。");
  for (const [id, info] of Object.entries(coverage.contextActivationWitnesses ?? {})) {
    if (!activated.has(id)) continue;
    for (const w of Object.values(info.witnesses ?? {}).flat()) addEdge(representative(w.observationId), id, "补足解释前提", "context", known(w.observationId, id), "对象连续性使已取得读数可以解释。原观察没有重新取得，也不新增证据权重。");
  }
  const pending = known(O.xray, O.t1).filter((id) => inactive.has(id));
  ask("question:context", pending, "这些读数能否归到同一对象？", "资料已经到手，但缺少对象连续性的解释前提。补足后可以重新理解旧读数。", ["A.VERIFY.OBJECT_CONTINUITY"]);
  if (node(O.xray) && !inactive.has(O.xray) && node(O.physical)) addEdge(O.xray, O.physical, "逐区结构用于跨时点比较", "context", known(O.xray, O.physical), "当前结构与跨时点变化是两项不同读数；共享证据单元不算两份独立证据。");
  if (node(O.t2) && node(O.documented)) addEdge(O.t2, O.documented, "记录提供历史参照", "context", known(O.t2, O.documented, ...archiveSources.t2), "跨时点对应依赖档案归属；不因比较动作已经做过就宣称整条路线成立。");
  if (node(O.point) && node(O.surface)) addEdge(O.point, O.surface, "点位读数按区综合", "support", known(O.point, O.surface), "点位层压关系与区域覆盖共同说明表面范围，范围不得超出已声明覆盖。");
  if (node(O.negative) && !facts.has("surfaceResolved")) ask("question:negative", [O.negative], "未检出能说明没有补绘吗？", "本次检测能力不足以支持没有补绘；点位层次检查能提供另一种观察，但不会抹掉这次阴性记录。", ["A.INSPECT.WINDOWS"]);
  if (node(O.point) && !facts.has("surfaceResolved")) ask("question:surface", [O.point], "这些点能说明多大范围？", "点位层次已知，尚不能直接把几个点外推到整片区域。", ["A.SYNTHESIZE.SURFACE_REGIONS"]);
  if (node(O.substrate) && !facts.has("keyMaterialLayerSequenceReadings")) ask("question:material-sequence", [O.substrate], "这些基底与后来各层谁先谁后？", "材料组成已经取得；形成顺序需要界面层序说明。", ["A.INSPECT.MATERIAL.LAYER_SEQUENCE"]);
  if (node(O.layer) && !facts.has("keyMaterialSubstrateReadings")) ask("question:material-base", [O.layer], "这些层底下是什么材料？", "层序说明先后，不能替代基底材料分析。", ["A.ANALYZE.MATERIAL.SUBSTRATE"]);
  if (node(O.whole) && !solved.claims?.identity?.established && !node(O.corpus)) ask("question:craft", known(O.whole, O.base), "这些制造特征放进历史参照会怎样？", "把已有的形制与底足读数放进同期真品参照，可以了解哪些身份方向对得上、哪些对不上。", ["A.COMPARE.CORPUS"]);
  if (node(O.whole) && !node(O.xray) && !node(O.t2) && !node(O.appearance)) ask("question:visible-intervention", [O.whole], "眼见的修补牵涉哪些层面？", "肉眼已经看到修补分布。纹饰色差、内部结构或事件记录能从不同方面继续了解这些改动。", ["A.OBSERVE.REGION_DECOR", "A.IMAGE.XRAY", "A.RESEARCH.ACCIDENT"]);
  if (node(O.appearance) && !node(O.point) && !node(O.surface)) ask("question:appearance", [O.appearance], "这些外观变化压在哪一层？", "外观整合的迹象已经取得，还需要分清表面层次；这与结构是否大改是不同问题。", ["A.SCREEN.UV", "A.INSPECT.WINDOWS"]);
  if (node(O.xray) && !inactive.has(O.xray) && !node(O.physical)) ask("question:change", [O.xray], "结构从另一个时点到现在变了什么？", "当前结构已经能读，状态本身仍不能说明发生过什么变化。", ["A.MAP.REGION_CONTINUITY"]);

  // Complete proof packages are disclosed on achieved claims. The solver is
  // the authority for establishment, contest and route eligibility.
  const identitySources = unique([...factIds("currentBody", "baseManufacture", "identityComparisonExclusion", "identityObjectContinuity")]);
  const physicalSources = roleIds("PROOF.CURRENT.NAMED_REPAIR_MAP", "PROOF.MAJOR.PHYSICAL.STRUCTURE_MAP", "PROOF.MAJOR.PHYSICAL.CROSS_TIME");
  const majorSources = unique([...(coverage.majorProofPaths?.documented ? archiveSources.t2 : []), ...(coverage.majorProofPaths?.physical ? physicalSources : [])]);
  const threeSources = unique([...factIds("t1Established"), ...archiveSources.t2, ...archiveSources.t3]);
  const coreSources = factIds("keyMaterialSubstrateReadings", "keyMaterialLayerSequenceReadings", "surfacePointLayering", "surfaceRegionalCoverage", "surfaceResolved", "displayConditionSpecified", "stabilityResolved", "documentationBoundary", "documentationNoConflict");
  const sourceMap = { identity: identitySources, majorReassembly: majorSources, threePhase: threeSources,
    coherentDecisionProfile: unique([...identitySources, ...majorSources, ...factIds("appearanceRestore"), ...threeSources, ...coreSources]) };
  for (const [key, text] of Object.entries(CLAIMS)) {
    const c = solved.claims?.[key] ?? {};
    const relevant = (solved.conflicts ?? []).filter((x) => TARGETS[x.targetClaim] === key);
    const contested = c.contested || c.logicallyRefuted || relevant.some((x) => x.blocking);
    if (!c.established && !contested) continue;
    const sourceIds = unique([...sourceMap[key], ...relevant.map((x) => x.observationId)]).filter((id) => has.has(id));
    if (!sourceIds.length) continue;
    nodes.push({ id: "claim:" + key, kind: "claim", title: contested ? text[0].replace(/成立$/, "") : text[0], summary: (contested ? "此命题当前" + (c.logicallyRefuted ? "受到直接反驳" : "有冲突") + "，不能作为已成立结论。" : "") + text[1], state: contested ? "contested" : "established", sourceIds, group: text[2] });
  }
  const support = (from, key, label, sources, details, suffix = "") => addEdge(representative(from), "claim:" + key, label, "support", sources, details, `proof:${key}:${from}${suffix}`);
  if (node("claim:identity")) {
    const paths = unique(factIds("identityComparisonExclusion", "identityObjectContinuity").map(representative)).filter((id) => !inactive.has(id));
    for (const id of paths) support(id, "identity", paths.length > 1 ? "一条身份论证路径" : "工艺与身份路径共同支持", unique([...factIds("currentBody", "baseManufacture"), id]), "共同条件：整体制造特征 + 底足读数 + 一条身份路径。比对排除与对象连续性是替代路径，不能读成两项都必须做；是否成立还取决于当前命题状态。");
    for (const id of factIds("currentBody", "baseManufacture")) {
      // A completed corpus comparison already draws these inputs into the
      // identity path. The continuity-only route still needs visible AND inputs.
      const alreadyConnected = edges.some((e) => e.from === id && paths.includes(e.to));
      if (!alreadyConnected) support(id, "identity", "身份判断的共同条件", identitySources, "这份制造读数必须与另一处工艺读数及一条身份路径共同使用；本箭头不表示它单独能够推出身份。", ":current");
    }
  }
  if (coverage.majorProofPaths?.documented) support(O.t2, "majorReassembly", "档案链共同支持", archiveSources.t2, "共同条件：记录内部一致 + 对象归属 + 事件的实物对应。当前对应与跨时点对应可择一；这是一条完整路线。", ":documented");
  if (coverage.majorProofPaths?.physical) {
    for (const id of unique(physicalSources.map(representative))) support(id, "majorReassembly", "物证路线的共同条件", physicalSources, "三项必须同时在场：具体修补分布 + 可读的逐区结构 + 跨时点变化。任一条单独不能证明重大重组。", ":physical");
  }
  for (const id of known(O.t1, O.t2, O.t3)) support(id, "threePhase", "三个阶段共同成立", threeSources, "共同条件：较早时点可解释 + 两组档案分别完成内部一致、对象归属与事件对应 + 无未解时间冲突。不是三条各自独立的完整证明。");
  for (const key of ["identity", "majorReassembly", "threePhase"]) support("claim:" + key, "coherentDecisionProfile", "整体说明的共同条件", sourceMap.coherentDecisionProfile, "身份、重组、历史阶段、材料、表面、承力与记录边界需要共同站得住，而且不能与已取得的信息冲突。");
  for (const id of known(O.substrate, O.layer, O.surface, O.stability, O.provenance)) support(id, "coherentDecisionProfile", "补足决策范围", coreSources, "这项局部信息属于整体说明的一项共同条件，不单独推出完整说明。");
  for (const c of solved.conflicts ?? []) {
    const key = TARGETS[c.targetClaim];
    const from = representative(c.observationId);
    if (!node(from)) continue;
    const effect = c.blocking ? "与当前命题冲突" : c.scopeMatch === false ? "适用范围不覆盖该命题" : "限制当前判断";
    if (key) addEdge(from, "claim:" + key, effect, "conflict", [c.observationId], c.blocking ? "这项证据与该判断直接矛盾，当前不能把它当作已经成立的结论。" : "保留范围、能力与反证强度的区别，不能把所有不利信息都读成推翻。");
    if (c.blocking) ask(`question:conflict:${c.observationId}`, [from, "claim:" + key], "这处冲突应怎样理解？", "已有信息发生冲突。当前命题保留但标明争议，系统不替玩家选边。", []);
  }
  if (node("claim:majorReassembly")?.state === "established" && !solved.claims?.threePhase?.established) {
    const methods = [];
    if (!has.has(O.t1)) methods.push("A.LOCATE.HISTORIC_IMAGE");
    if (!has.has(O.t3)) methods.push("A.RESEARCH.LATE_TREATMENT");
    ask("question:history", ["claim:majorReassembly", ...known(O.t1, O.t3)], "这些改动发生在什么时点？", "重大重组已经有支撑；更早的状态、后来是否还有处理，可以帮助理解它怎样变成现在的样子。这仍是开放调查，也可以带着未知收手。", methods);
  }
  const registeredUnknowns = {
    "exact-treatment-formula": [known(O.t3, O.layer), "具体处理配方仍未确定", "已知发生过处理，配方仍未确定；原规则允许保留这一未知。"],
    "noncritical-region": [known(O.surface, O.whole), "部分非关键区域仍未覆盖", "已知覆盖边界之外还有空白；原规则允许保留这一未知。"],
    "identity-whether-late18": [known(O.whole, O.corpus), "制造年代与类别仍未确定", "当前已登记的身份问题尚未解决。"],
    "three-phase-relation": [known(O.t1, O.t2, O.t3), "几个时点的关系仍未解释", "已经接触的时点还缺少连贯关系。"],
    "key-material-core-regions": [known(O.substrate, O.layer, O.whole), "关键材料的范围仍未说明", "已登记的关键区域材料问题仍需保留。"],
    "surface-decision-boundary": [known(O.appearance, O.point, O.surface), "表面处理的判断边界仍未说明", "已取得表面信息，仍需保留其未解决边界。"],
    "load-path-stability": [known(O.stability, O.whole), "承力与使用条件仍未确定", "目前的认识不足以解释已登记的承力问题。"],
    "documentation-conflict": [known(O.provenance, O.t2, O.t3), "记录中的冲突仍未解决", "已取得记录中仍有登记在案的冲突。"],
  };
  for (const id of coverage.unknowns ?? []) {
    const info = registeredUnknowns[id];
    if (info) ask(`question:registered:${id}`, info[0], info[1], info[2]);
  }
  // Preserve compact traceability when an observation is represented by an edge.
  for (const o of observations) {
    o.nodeId = representative(o.id);
    o.edgeIds = edges.filter((e) => e.sourceIds.includes(o.id)).map((e) => e.id);
    if (hiddenAsRelation.has(o.id)) o.representedAs = o.id === O.repeat ? "record" : "relation";
  }
  const stageSem = STAGE_SEMANTICS[solved.stage] ?? STAGE_SEMANTICS.NONE;
  return { nodes, edges, questions, stage: { key: solved.stage ?? "NONE", title: stageSem.name, summary: stageSem.meaning }, observations };
}
