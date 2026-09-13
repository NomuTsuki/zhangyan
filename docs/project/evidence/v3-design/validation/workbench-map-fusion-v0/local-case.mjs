/* Experimental fusion-only case adaptation, 2026-09-08.
 * The frozen case and solver remain unchanged. IDs, source provenance, factors,
 * proof scopes, costs and dependency units are retained. Only the explicitly
 * approved material / interpretation dependencies below differ from the old case.
 */
import { events as frozenEvents, actionContracts as frozenActionContracts,
  proofRoleContracts as frozenProofRoleContracts } from "../first-ceramic-author-scenarios-v0/fixtures.mjs";
import { ACTIONS as frozenActions, COST_LABEL, playerView } from "../knowledge-map-slice-v0/case.mjs";

export { COST_LABEL, playerView };

export const COMPARISON_ACTION_ID = "A.MAP.REGION_CONTINUITY";
export const events = { ...frozenEvents,
  xrayEarly: { ...frozenEvents.xrayEarly,
    facts: [...frozenEvents.xrayEarly.facts, "currentStructureReadoutByRegion"],
    contextualFacts: [], requiresContextFacts: [] },
  identityContinuity: { ...frozenEvents.identityContinuity,
    acquisitionRequires: [...frozenEvents.identityContinuity.acquisitionRequires, "t1ReadingAcquired"] },
  // Approved 2026-09-10; applied 2026-09-12. Synthesis uses the player's
  // acquired point readings. The original source IDs and evidence factor stay intact.
  surface: { ...frozenEvents.surface,
    acquisitionRequires: [...frozenEvents.surface.acquisitionRequires, "surfacePointLayering"] },
};

const comparisonDefinitions = [
  { id: "photo", label: "旧照片与现器的可比区域", eventKey: "repairContinuity",
    method: "photo-cross-time", contextFact: "identityObjectContinuity",
    requiredFacts: ["t1ReadingAcquired", "currentBody", "currentRepairMap", "xrayReadingsByRegionAcquired"],
    materialObservationIds: ["obs.phase.t1", "obs.current.whole", "obs.structure.xray.early"],
    scopeNote: "比较旧照片与现器可比的可见区域；X 射线记录当前结构，不能用照片未显示内部接缝来证明过去没有接缝。" },
  { id: "archive", label: "事故记录与现器的对应区域", eventKey: "documentedCrossTime",
    method: "archive-cross-time", contextFact: "t2ArchiveObjectAttribution",
    requiredFacts: ["t2RecordGroupCoherent", "currentBody"],
    materialObservationIds: ["obs.accident.major", "obs.current.whole"],
    scopeNote: "比较事故记录与现器的对应区域；记录归属核实后，报告才用于本器事故的实物印证。" },
];

export const actionContracts = { ...frozenActionContracts,
  [COMPARISON_ACTION_ID]: { ...frozenActionContracts[COMPARISON_ACTION_ID],
    methods: { ...frozenActionContracts[COMPARISON_ACTION_ID].methods } },
};
export const proofRoleContracts = { ...frozenProofRoleContracts };
const oldCrossTimeContract = frozenActionContracts[COMPARISON_ACTION_ID].methods["cross-time"];
// The original roles are routed to the two explicit local methods. Keeping the
// old method with those roles would be an invalid schema, not a third route.
delete actionContracts[COMPARISON_ACTION_ID].methods["cross-time"];
for (const definition of comparisonDefinitions) {
  const old = frozenEvents[definition.eventKey];
  events[definition.eventKey] = { ...old,
    coverage: { ...old.coverage, method: definition.method },
    facts: [], contextualFacts: [...old.facts],
    requiresContextFacts: [definition.contextFact],
    acquisitionRequires: [...definition.requiredFacts],
  };
  actionContracts[COMPARISON_ACTION_ID].methods[definition.method] = {
    ...oldCrossTimeContract, allowedDirectFacts: [],
    allowedContextualFacts: [...old.facts], requiredContextFacts: [definition.contextFact],
    allowedProofRoles: [...old.proofRoles],
  };
  for (const role of old.proofRoles) {
    proofRoleContracts[role] = { ...frozenProofRoleContracts[role], method: definition.method };
  }
}

/* Bind UI materials to acquisition records while preserving distinct archival
 * source IDs. These bindings describe this local case's use of the records;
 * they do not assert source.archive.pre-accident, source.archive.image and
 * source.archive.major-region-pre are the same document or photograph.
 */
export const SOURCE_BINDINGS = {
  photo: {
    observationId: "obs.phase.t1", sourceIds: [...frozenEvents.t1.sourceIds],
    use: "玩家取得的早期照片及其原始内容。", sameDocumentAsOtherBindings: false,
  },
  identityReference: {
    observationId: "obs.object.continuity", sourceIds: [...frozenEvents.identityContinuity.sourceIds],
    materialObservationIds: ["obs.phase.t1", "obs.current.base"],
    use: "核验报告使用已取得照片和现器底足记录；报告内的档案参照来源保持单独可追溯。",
    sameDocumentAsOtherBindings: false,
  },
  photoComparison: {
    observationId: "obs.structure.major.cross-time", sourceIds: [...frozenEvents.repairContinuity.sourceIds],
    materialObservationIds: [...comparisonDefinitions[0].materialObservationIds],
    use: comparisonDefinitions[0].scopeNote, sameDocumentAsOtherBindings: false,
  },
  archiveComparison: {
    observationId: "obs.structure.major.documented-cross-time", sourceIds: [...frozenEvents.documentedCrossTime.sourceIds],
    materialObservationIds: [...comparisonDefinitions[1].materialObservationIds],
    use: comparisonDefinitions[1].scopeNote, sameDocumentAsOtherBindings: false,
  },
  surfaceSynthesis: {
    observationId: "obs.surface.resolved", sourceIds: [...frozenEvents.surface.sourceIds],
    materialObservationIds: ["obs.surface.point-layering"],
    use: "区域综合使用本局已取得的试窗点位记录；综合范围不超出实际覆盖。",
  },
};

const factNames = {
  currentBody: "现器整体观察", currentRepairMap: "现器可见修补记录",
  baseManufacture: "现器底足观察", t1ReadingAcquired: "已经取得的旧照片",
  xrayReadingsByRegionAcquired: "当前 X 射线读数", t2RecordGroupCoherent: "事故记录",
  identityObjectContinuity: "照片与现器的对象核验",
  surfacePointLayering: "已取得的试窗点位记录（先在表面开几个小窗看层次）",
};

export const ACTIONS = frozenActions.map((action) => {
  if (action.id === "A.VERIFY.OBJECT_CONTINUITY") return { ...action,
    ask: "已取得照片中的特征，与眼前这只碗的底足记录是否相符？" };
  if (action.id !== COMPARISON_ACTION_ID) return action;
  return { ...action,
    ask: "选定手中的两份材料，比较它们能共同显示的区域。",
    needs: (facts) => comparisonOptions(facts).some((option) => option.usable),
    needsWhy: "需要现器整体观察，以及旧照片与当前 X 射线读数，或一组事故记录，才能对照具体材料。",
    // Ambiguous selection deliberately has no fallback. The caller must retain
    // the player's basis instead of changing it when more evidence arrives.
    outcome: (facts, options = {}) => {
      const usable = comparisonOptions(facts).filter((option) => option.usable);
      return (options.comparisonBasis
        ? usable.find((option) => option.id === options.comparisonBasis)
        : usable.length === 1 ? usable[0] : null)?.eventKey;
    },
  };
});
export const ACTION_BY_ID = new Map(ACTIONS.map((action) => [action.id, action]));

function actionsForFacts(missingFacts) {
  return ACTIONS.filter((action) => action.id !== COMPARISON_ACTION_ID &&
    missingFacts.some((fact) => (events[action.outcome(new Set())]?.facts ?? []).includes(fact)))
    .map((action) => action.id);
}

// Always returns both choices so an unavailable alternative remains explainable.
export function comparisonOptions(facts) {
  return comparisonDefinitions.map((definition) => {
    const missingFacts = definition.requiredFacts.filter((fact) => !facts.has(fact));
    return { ...definition, materialObservationIds: [...definition.materialObservationIds],
      usable: !missingFacts.length, missingFacts,
      why: missingFacts.length ? "还需要：" + missingFacts.map((fact) => factNames[fact]).join("、") : null,
      needsActionIds: actionsForFacts(missingFacts),
      interpreted: facts.has(definition.contextFact),
    };
  });
}

export function availability(facts, doneActionIds) {
  return ACTIONS.map((action) => {
    if (action.id === COMPARISON_ACTION_ID) {
      const options = comparisonOptions(facts);
      const usable = options.some((option) => option.usable);
      return { action, done: doneActionIds.includes(action.id), usable,
        why: usable ? null : action.needsWhy,
        needsActionIds: usable ? [] : [...new Set(options.flatMap((option) => option.needsActionIds))],
        comparisonOptions: options, requiresBasis: options.filter((option) => option.usable).length > 1,
      };
    }
    const event = events[action.outcome(facts)];
    const missingFacts = event.acquisitionRequires.filter((fact) => !facts.has(fact));
    const needsActionIds = actionsForFacts(missingFacts);
    return { action, done: doneActionIds.includes(action.id), usable: !missingFacts.length,
      why: missingFacts.length ? "这一步要用到：" + missingFacts.map((fact) => factNames[fact] ?? "前项调查的记录").join("、") : null,
      needsActionIds,
    };
  });
}
