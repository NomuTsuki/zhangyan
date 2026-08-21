const FIXTURE_WEIGHT = 25;

export const thresholds = Object.freeze({
  identity: 0.75,
  major: 0.75,
  g2Joint: 0.75,
  g3Profile: 0.5,
});

export const expectedProfile = Object.freeze({
  Identity: "LATE18_EXPORT",
  RepairHistory: "THREE_PHASE",
  KeyMaterial: "KEY_MATERIAL_PRESERVED",
  Surface: "MIXED_CROSS_OVERPAINT",
  Stability: "DISPLAYABLE_LOCAL_RISK",
  Documentation: "COHERENT_PARTIAL",
});

export const claimScopeRequirements = Object.freeze({
  "CLAIM.IDENTITY.LATE18_EXPORT": Object.freeze({
    object: "OBJECT.FIRST",
    region: "manufacture-identity-scope",
    time: "manufacture",
    materialLayer: "ceramic-body-glaze",
    quantifier: "necessary-condition",
  }),
  "CLAIM.REPAIR.MAJOR_REASSEMBLY": Object.freeze({
    object: "OBJECT.FIRST",
    region: "necessary-major-scope",
    time: "T2",
    materialLayer: "structural-substrate",
    quantifier: "necessary-condition",
  }),
});

export const unknownRegistry = Object.freeze({
  "exact-treatment-formula": Object.freeze({ g3Allowed: true }),
  "noncritical-region": Object.freeze({ g3Allowed: true }),
  "documentation-conflict": Object.freeze({ g3Allowed: false }),
  "identity-whether-late18": Object.freeze({ g3Allowed: false }),
  "key-material-core-regions": Object.freeze({ g3Allowed: false }),
  "load-path-stability": Object.freeze({ g3Allowed: false }),
  "surface-decision-boundary": Object.freeze({ g3Allowed: false }),
  "three-phase-relation": Object.freeze({ g3Allowed: false }),
});

export const PROOF_ROLES = Object.freeze({
  CURRENT_REPAIR_MAP: "PROOF.CURRENT.NAMED_REPAIR_MAP",
  T2_RECORD_COHERENCE: "PROOF.ARCHIVE.T2.RECORD_COHERENCE",
  T2_OBJECT_ATTRIBUTION: "PROOF.ARCHIVE.T2.OBJECT_ATTRIBUTION",
  T2_CURRENT_CORROBORATION: "PROOF.ARCHIVE.T2.EVENT_CURRENT_CORROBORATION",
  T2_CROSS_TIME_CORROBORATION: "PROOF.ARCHIVE.T2.EVENT_CROSS_TIME_CORROBORATION",
  T3_RECORD_COHERENCE: "PROOF.ARCHIVE.T3.RECORD_COHERENCE",
  T3_OBJECT_ATTRIBUTION: "PROOF.ARCHIVE.T3.OBJECT_ATTRIBUTION",
  T3_CURRENT_CORROBORATION: "PROOF.ARCHIVE.T3.EVENT_CURRENT_CORROBORATION",
  PHYSICAL_STRUCTURE_MAP: "PROOF.MAJOR.PHYSICAL.STRUCTURE_MAP",
  PHYSICAL_CROSS_TIME: "PROOF.MAJOR.PHYSICAL.CROSS_TIME",
});

export const proofRoleContracts = Object.freeze({
  [PROOF_ROLES.CURRENT_REPAIR_MAP]: Object.freeze({
    acquisitionActionId: "A.OBSERVE.WHOLE",
    method: "visual",
    coverage: Object.freeze({ object: "OBJECT.FIRST", region: "whole-visible" }),
    requiredFacts: Object.freeze(["currentRepairMap"]),
    requiredSourceIds: Object.freeze(["source.physical.current"]),
    minimumSourceCount: 1,
  }),
  [PROOF_ROLES.T2_RECORD_COHERENCE]: Object.freeze({
    acquisitionActionId: "A.RESEARCH.ACCIDENT",
    method: "archive",
    coverage: Object.freeze({ object: "ARCHIVE.CANDIDATE.T2", region: "declared-record-group" }),
    requiredFacts: Object.freeze([
      "t2RecordGroupCoherent",
      "t2RecordClaimsDamageExtent",
      "t2RecordClaimsReassembly",
    ]),
    requiredSourceIds: Object.freeze([
      "source.event.accident.insurance",
      "source.event.accident.photo",
    ]),
    minimumSourceCount: 2,
  }),
  [PROOF_ROLES.T2_OBJECT_ATTRIBUTION]: Object.freeze({
    acquisitionActionId: "A.RELATE.ARCHIVE.T2_TO_OBJECT",
    method: "object-attribution",
    coverage: Object.freeze({ object: "RELATION.ARCHIVE_T2_OBJECT_FIRST", region: "stable-noncomposition-anchors" }),
    requiredFacts: Object.freeze(["t2ArchiveObjectAttribution"]),
    requiredSourceIds: Object.freeze([
      "source.archive.t2.object-register",
      "source.physical.t2.stable-anchors",
    ]),
    allowedSourceIds: Object.freeze([
      "source.archive.t2.object-register",
      "source.physical.t2.stable-anchors",
    ]),
    minimumSourceCount: 2,
  }),
  [PROOF_ROLES.T2_CURRENT_CORROBORATION]: Object.freeze({
    acquisitionActionId: "A.CORROBORATE.ARCHIVE.T2_CURRENT",
    method: "record-current",
    coverage: Object.freeze({ object: "RELATION.ARCHIVE_T2_EVENT_OBJECT_FIRST", region: "declared-major-scope" }),
    requiredFacts: Object.freeze(["t2EventPhysicalCorrespondence", "appearanceRestore"]),
    requiredSourceIds: Object.freeze([
      "source.archive.t2.repair-diagram",
      "source.physical.current-repair-map",
    ]),
    allowedSourceIds: Object.freeze([
      "source.archive.t2.repair-diagram",
      "source.physical.current-repair-map",
    ]),
    minimumSourceCount: 2,
  }),
  [PROOF_ROLES.T2_CROSS_TIME_CORROBORATION]: Object.freeze({
    acquisitionActionId: "A.MAP.REGION_CONTINUITY",
    method: "cross-time",
    coverage: Object.freeze({ object: "RELATION.ARCHIVE_T2_EVENT_OBJECT_FIRST", region: "declared-major-scope" }),
    requiredFacts: Object.freeze(["t2EventPhysicalCorrespondence", "appearanceRestore"]),
    requiredSourceIds: Object.freeze([
      "source.archive.major-region-pre",
      "source.physical.major-region-current",
    ]),
    allowedSourceIds: Object.freeze([
      "source.archive.major-region-pre",
      "source.physical.major-region-current",
    ]),
    minimumSourceCount: 2,
  }),
  [PROOF_ROLES.T3_RECORD_COHERENCE]: Object.freeze({
    acquisitionActionId: "A.RESEARCH.LATE_TREATMENT",
    method: "archive",
    coverage: Object.freeze({ object: "ARCHIVE.CANDIDATE.T3", region: "declared-treatment-records" }),
    requiredFacts: Object.freeze(["t3RecordGroupCoherent", "t3RecordClaimsLocalTreatment"]),
    requiredSourceIds: Object.freeze([
      "source.archive.t3.condition-report",
      "source.archive.t3.treatment-map",
    ]),
    allowedSourceIds: Object.freeze([
      "source.archive.t3.condition-report",
      "source.archive.t3.treatment-map",
    ]),
    minimumSourceCount: 2,
  }),
  [PROOF_ROLES.T3_OBJECT_ATTRIBUTION]: Object.freeze({
    acquisitionActionId: "A.RELATE.ARCHIVE.T3_TO_OBJECT",
    method: "object-attribution",
    coverage: Object.freeze({ object: "RELATION.ARCHIVE_T3_OBJECT_FIRST", region: "stable-noncomposition-anchors" }),
    requiredFacts: Object.freeze(["t3ArchiveObjectAttribution"]),
    requiredSourceIds: Object.freeze([
      "source.archive.t3.object-register",
      "source.physical.t3.stable-anchors",
    ]),
    allowedSourceIds: Object.freeze([
      "source.archive.t3.object-register",
      "source.physical.t3.stable-anchors",
    ]),
    minimumSourceCount: 2,
  }),
  [PROOF_ROLES.T3_CURRENT_CORROBORATION]: Object.freeze({
    acquisitionActionId: "A.CORROBORATE.ARCHIVE.T3_CURRENT",
    method: "record-current",
    coverage: Object.freeze({ object: "RELATION.ARCHIVE_T3_EVENT_OBJECT_FIRST", region: "declared-treatment-scope" }),
    requiredFacts: Object.freeze(["t3EventPhysicalCorrespondence"]),
    requiredSourceIds: Object.freeze([
      "source.archive.t3.post-treatment-photo",
      "source.physical.t3.current-zone",
    ]),
    allowedSourceIds: Object.freeze([
      "source.archive.t3.post-treatment-photo",
      "source.physical.t3.current-zone",
    ]),
    minimumSourceCount: 2,
  }),
  [PROOF_ROLES.PHYSICAL_STRUCTURE_MAP]: Object.freeze({
    acquisitionActionId: "A.IMAGE.XRAY",
    method: "xray",
    coverage: Object.freeze({ object: "OBJECT.FIRST", region: "declared-major-scope-multi-view-readable" }),
    requiredFacts: Object.freeze(["currentStructureReadoutByRegion"]),
    allowedSourceIds: Object.freeze([
      "source.instrument.structure",
      "source.instrument.xray",
    ]),
    minimumSourceCount: 1,
  }),
  [PROOF_ROLES.PHYSICAL_CROSS_TIME]: Object.freeze({
    acquisitionActionId: "A.MAP.REGION_CONTINUITY",
    method: "cross-time",
    coverage: Object.freeze({ object: "OBJECT.FIRST", region: "declared-major-scope" }),
    requiredFacts: Object.freeze(["crossTimeMajorChange"]),
    requiredSourceIds: Object.freeze([
      "source.archive.major-region-pre",
      "source.physical.major-region-current",
    ]),
    minimumSourceCount: 2,
  }),
});

function methodContract({
  direct = [],
  contextual = [],
  capability = [],
  negativeRaw = [],
  proofRoles = [],
  axes = [],
  requiredContextFacts = [],
  fixtureOnly = false,
}) {
  return Object.freeze({
    allowedDirectFacts: Object.freeze(direct),
    allowedContextualFacts: Object.freeze(contextual),
    allowedCapabilityFacts: Object.freeze(capability),
    allowedNegativeRawFacts: Object.freeze(negativeRaw),
    allowedProofRoles: Object.freeze(proofRoles),
    allowedAxes: Object.freeze(axes),
    requiredContextFacts: Object.freeze(requiredContextFacts),
    fixtureOnly,
  });
}

function actionContract(methods) {
  return Object.freeze({ methods: Object.freeze(methods) });
}

export const actionContracts = Object.freeze({
  "A.OBSERVE.WHOLE": actionContract({
    visual: methodContract({
      direct: [
        "currentBody",
        "currentDecor",
        "currentRepairMap",
        "interventionObservation",
      ],
      proofRoles: [PROOF_ROLES.CURRENT_REPAIR_MAP],
    }),
  }),
  "A.OBSERVE.BASE": actionContract({
    visual: methodContract({ direct: ["baseManufacture"] }),
  }),
  "A.COMPARE.CORPUS": actionContract({
    corpus: methodContract({
      direct: ["directionCorpus", "identityComparisonExclusion"],
      axes: ["Identity"],
    }),
    fixture: methodContract({
      direct: ["directionCorpus", "identityComparisonExclusion"],
      fixtureOnly: true,
    }),
    "capable-identity": methodContract({
      direct: ["negativeSignalObserved"],
      capability: ["scopedAbsenceSupported"],
      negativeRaw: ["negativeSignalObserved"],
      axes: ["Identity"],
    }),
  }),
  "A.COMPARE.CORPUS.RECHECK": actionContract({
    corpus: methodContract({
      direct: ["directionCorpus", "identityComparisonExclusion", "repeatObservation"],
      axes: ["Identity"],
    }),
  }),
  "A.VERIFY.OBJECT_CONTINUITY": actionContract({
    "cross-time": methodContract({
      direct: ["directionHistoricCandidate", "identityObjectContinuity"],
      axes: ["Identity"],
    }),
  }),
  "A.RESEARCH.ACCIDENT": actionContract({
    archive: methodContract({
      direct: [
        "t2RecordGroupCoherent",
        "t2RecordClaimsAppearanceRestore",
        "t2RecordClaimsDamageExtent",
        "t2RecordClaimsReassembly",
      ],
      axes: ["RepairHistory"],
      proofRoles: [PROOF_ROLES.T2_RECORD_COHERENCE],
    }),
    fixture: methodContract({
      direct: [
        "t2RecordClaimsAppearanceRestore",
        "t2RecordClaimsDamageExtent",
        "t2RecordClaimsReassembly",
      ],
      fixtureOnly: true,
    }),
    contested: methodContract({ direct: ["t2ArchiveRecordCoherenceContested"] }),
  }),
  "A.RELATE.ARCHIVE.T2_TO_OBJECT": actionContract({
    "object-attribution": methodContract({
      direct: ["t2ArchiveObjectAttribution", "t2ArchiveObjectLinkCandidate"],
      proofRoles: [PROOF_ROLES.T2_OBJECT_ATTRIBUTION],
    }),
    contested: methodContract({ direct: ["t2ArchiveObjectAttributionContested"] }),
  }),
  "A.CORROBORATE.ARCHIVE.T2_CURRENT": actionContract({
    "record-current": methodContract({
      direct: ["appearanceRestore", "t2EventPhysicalCorrespondence"],
      proofRoles: [PROOF_ROLES.T2_CURRENT_CORROBORATION],
    }),
    contested: methodContract({ direct: ["t2EventPhysicalCorrespondenceContested"] }),
  }),
  "A.OBSERVE.REGION_DECOR": actionContract({
    visual: methodContract({ direct: ["appearanceRestore", "glueLineObserved"] }),
  }),
  "A.IMAGE.XRAY": actionContract({
    xray: methodContract({
      direct: [
        "currentStructureReadoutByRegion",
        "xrayReadingsByRegionAcquired",
        "xraySingleReadingAcquired",
      ],
      contextual: ["currentStructureReadoutByRegion"],
      axes: ["RepairHistory"],
      requiredContextFacts: ["identityObjectContinuity"],
      proofRoles: [PROOF_ROLES.PHYSICAL_STRUCTURE_MAP],
    }),
  }),
  "A.LOCATE.HISTORIC_IMAGE": actionContract({
    archive: methodContract({
      direct: ["t1ReadingAcquired"],
      contextual: ["t1Established"],
      axes: ["RepairHistory"],
      requiredContextFacts: ["identityObjectContinuity"],
    }),
  }),
  "A.RESEARCH.LATE_TREATMENT": actionContract({
    archive: methodContract({
      direct: ["t3RecordGroupCoherent", "t3RecordClaimsLocalTreatment"],
      axes: ["RepairHistory"],
      proofRoles: [PROOF_ROLES.T3_RECORD_COHERENCE],
    }),
    contested: methodContract({ direct: ["t3ArchiveRecordCoherenceContested"] }),
  }),
  "A.RELATE.ARCHIVE.T3_TO_OBJECT": actionContract({
    "object-attribution": methodContract({
      direct: ["t3ArchiveObjectAttribution", "t3ArchiveObjectLinkCandidate"],
      proofRoles: [PROOF_ROLES.T3_OBJECT_ATTRIBUTION],
    }),
    contested: methodContract({ direct: ["t3ArchiveObjectAttributionContested"] }),
  }),
  "A.CORROBORATE.ARCHIVE.T3_CURRENT": actionContract({
    "record-current": methodContract({
      direct: ["t3EventPhysicalCorrespondence"],
      proofRoles: [PROOF_ROLES.T3_CURRENT_CORROBORATION],
    }),
    contested: methodContract({ direct: ["t3EventPhysicalCorrespondenceContested"] }),
  }),
  "A.RELATE.PHASE.CHRONOLOGY": actionContract({
    contested: methodContract({ direct: ["threePhaseChronologyContested"] }),
  }),
  "A.MAP.REGION_CONTINUITY": actionContract({
    "cross-time": methodContract({
      direct: [
        "appearanceRestore",
        "crossTimeMajorChange",
        "keyMaterialResolved",
        "t2EventPhysicalCorrespondence",
      ],
      axes: ["KeyMaterial", "RepairHistory"],
      proofRoles: [PROOF_ROLES.T2_CROSS_TIME_CORROBORATION, PROOF_ROLES.PHYSICAL_CROSS_TIME],
    }),
    "capable-structural": methodContract({
      direct: ["negativeSignalObserved"],
      capability: ["scopedAbsenceSupported"],
      negativeRaw: ["negativeSignalObserved"],
      axes: ["RepairHistory"],
    }),
    "limited-structural": methodContract({
      direct: ["negativeSignalObserved"],
      capability: ["scopedAbsenceSupported"],
      negativeRaw: ["negativeSignalObserved"],
      axes: ["RepairHistory"],
    }),
  }),
  "A.INSPECT.WINDOWS": actionContract({
    layering: methodContract({
      direct: ["surfaceBadNews", "surfacePointLayering"],
      axes: ["Surface"],
    }),
  }),
  "A.SYNTHESIZE.SURFACE_REGIONS": actionContract({
    "regional-synthesis": methodContract({
      direct: ["surfaceRegionalCoverage", "surfaceResolved"],
      axes: ["Surface"],
    }),
  }),
  "A.ANALYZE.MATERIAL.SUBSTRATE": actionContract({
    "point-analysis": methodContract({ direct: ["keyMaterialSubstrateReadings"] }),
  }),
  "A.INSPECT.MATERIAL.LAYER_SEQUENCE": actionContract({
    "micro-layering": methodContract({
      direct: ["keyMaterialLayerSequenceReadings"],
      axes: ["KeyMaterial"],
    }),
  }),
  "A.ASSESS.TREATED_AND_UNTREATED": actionContract({
    condition: methodContract({
      direct: ["displayConditionSpecified", "stabilityBadNews", "stabilityResolved"],
      axes: ["Stability"],
    }),
  }),
  "A.TRACE.PROVENANCE_CHAIN": actionContract({
    archive: methodContract({
      direct: ["documentationBoundary", "documentationNoConflict"],
      axes: ["Documentation"],
    }),
  }),
  "A.SCREEN.UV": actionContract({
    "uv-screen": methodContract({
      direct: ["negativeSignalObserved"],
      negativeRaw: ["negativeSignalObserved"],
      axes: ["Surface"],
    }),
  }),
});

function axisFactor(id, axis, favored, favoredWeight = FIXTURE_WEIGHT) {
  const values = {
    Identity: ["REPRODUCTION", "LATE18_EXPORT"],
    RepairHistory: [
      "NO_MAJOR_REASSEMBLY",
      "MAJOR_REASSEMBLY_NOT_THREE_PHASE",
      "THREE_PHASE",
    ],
    KeyMaterial: ["KEY_RECONSTRUCTED", "KEY_MATERIAL_PRESERVED"],
    Surface: [
      "ORIGINAL_SURFACE_PREDOMINANT",
      "MIXED_CROSS_OVERPAINT",
      "KEY_IDENTITY_IMAGE_RECONSTRUCTED",
    ],
    Stability: ["SYSTEMIC_RISK", "DISPLAYABLE_LOCAL_RISK", "DISPLAYABLE_STABLE"],
    Documentation: [
      "CONFLICTED_OR_UNMATCHED",
      "COHERENT_PARTIAL",
      "COHERENT_SUFFICIENT",
    ],
  }[axis];
  const favoredValues = Array.isArray(favored) ? favored : [favored];
  return Object.freeze({
    id,
    affectsAxes: Object.freeze([axis]),
    weights: Object.freeze(
      values.map((value) =>
        Object.freeze({
          when: Object.freeze({ [axis]: value }),
          weight: favoredValues.includes(value) ? favoredWeight : 1,
        }),
      ),
    ),
  });
}

const factorIdentityOld = axisFactor(
  "fixture.factor.identity.old",
  "Identity",
  "LATE18_EXPORT",
);
const factorMajor = axisFactor(
  "fixture.factor.repair.major",
  "RepairHistory",
  ["MAJOR_REASSEMBLY_NOT_THREE_PHASE", "THREE_PHASE"],
);
const factorThreePhaseWeak = axisFactor(
  "fixture.factor.repair.three-phase-source",
  "RepairHistory",
  "THREE_PHASE",
  5,
);
const factorKeyPreserved = axisFactor(
  "fixture.factor.key.preserved",
  "KeyMaterial",
  "KEY_MATERIAL_PRESERVED",
);
const factorSurfaceMixed = axisFactor(
  "fixture.factor.surface.mixed",
  "Surface",
  "MIXED_CROSS_OVERPAINT",
);
const factorSurfaceOriginal = axisFactor(
  "fixture.factor.surface.original",
  "Surface",
  "ORIGINAL_SURFACE_PREDOMINANT",
);
const factorStabilityLocalRisk = axisFactor(
  "fixture.factor.stability.local-risk",
  "Stability",
  "DISPLAYABLE_LOCAL_RISK",
);
const factorStabilitySystemic = axisFactor(
  "fixture.factor.stability.systemic",
  "Stability",
  "SYSTEMIC_RISK",
);
const factorDocumentationPartial = axisFactor(
  "fixture.factor.documentation.partial",
  "Documentation",
  "COHERENT_PARTIAL",
);
const factorNoMajor = axisFactor(
  "fixture.factor.repair.no-major",
  "RepairHistory",
  "NO_MAJOR_REASSEMBLY",
  5,
);
const factorNoMajorWeak = axisFactor(
  "fixture.factor.repair.no-major-weak",
  "RepairHistory",
  "NO_MAJOR_REASSEMBLY",
  5,
);
const factorReproduction = axisFactor(
  "fixture.factor.identity.reproduction",
  "Identity",
  "REPRODUCTION",
  5,
);

function makeEvent({
  observationId,
  sourceIds,
  sharedLatentIds = [],
  dependencyUnitId,
  acquisitionActionId,
  coverage,
  facts = [],
  capabilityFacts = [],
  contextualFacts = [],
  proofRoles = [],
  requiresContextFacts = [],
  acquisitionRequires = [],
  factor,
  negativeResult,
  counterevidence,
}) {
  return Object.freeze({
    observationId,
    sourceIds: Object.freeze(sourceIds),
    sharedLatentIds: Object.freeze(sharedLatentIds),
    dependencyUnitId,
    acquisitionActionId,
    coverage: Object.freeze(coverage),
    facts: Object.freeze(facts),
    capabilityFacts: Object.freeze(capabilityFacts),
    contextualFacts: Object.freeze(contextualFacts),
    proofRoles: Object.freeze(proofRoles),
    requiresContextFacts: Object.freeze(requiresContextFacts),
    acquisitionRequires: Object.freeze(acquisitionRequires),
    ...(factor ? { factor } : {}),
    ...(negativeResult ? { negativeResult: Object.freeze(negativeResult) } : {}),
    ...(counterevidence ? { counterevidence: Object.freeze(counterevidence) } : {}),
  });
}

export const events = Object.freeze({
  whole: makeEvent({
    observationId: "obs.current.whole",
    sourceIds: ["source.physical.current"],
    sharedLatentIds: ["latent.current-craft", "latent.repair-map"],
    dependencyUnitId: "dep.fact.current-whole",
    acquisitionActionId: "A.OBSERVE.WHOLE",
    coverage: { object: "OBJECT.FIRST", region: "whole-visible", method: "visual" },
    facts: ["currentBody", "currentDecor", "currentRepairMap", "interventionObservation"],
    proofRoles: [PROOF_ROLES.CURRENT_REPAIR_MAP],
  }),
  wholeWithoutRepairMap: makeEvent({
    observationId: "obs.current.whole.without-repair-map",
    sourceIds: ["source.physical.current"],
    sharedLatentIds: ["latent.current-craft"],
    dependencyUnitId: "dep.fact.current-whole-without-repair-map",
    acquisitionActionId: "A.OBSERVE.WHOLE",
    coverage: { object: "OBJECT.FIRST", region: "whole-visible", method: "visual" },
    facts: ["currentBody", "currentDecor", "interventionObservation"],
  }),
  base: makeEvent({
    observationId: "obs.current.base",
    sourceIds: ["source.physical.current"],
    sharedLatentIds: ["latent.current-craft"],
    dependencyUnitId: "dep.fact.current-base",
    acquisitionActionId: "A.OBSERVE.BASE",
    coverage: { object: "OBJECT.FIRST", region: "base-and-inner", method: "visual" },
    facts: ["baseManufacture"],
  }),
  corpus: makeEvent({
    observationId: "obs.corpus.identity",
    sourceIds: ["source.corpus.set-01"],
    sharedLatentIds: ["latent.current-craft"],
    dependencyUnitId: "dep.corpus.identity",
    acquisitionActionId: "A.COMPARE.CORPUS",
    coverage: { object: "OBJECT.FIRST", region: "manufacture-comparison", method: "corpus" },
    acquisitionRequires: ["currentBody", "baseManufacture"],
    facts: ["directionCorpus", "identityComparisonExclusion"],
    factor: factorIdentityOld,
  }),
  corpusDuplicate: makeEvent({
    observationId: "obs.corpus.identity.repeat",
    sourceIds: ["source.corpus.set-01"],
    sharedLatentIds: ["latent.current-craft"],
    dependencyUnitId: "dep.corpus.identity",
    acquisitionActionId: "A.COMPARE.CORPUS.RECHECK",
    coverage: { object: "OBJECT.FIRST", region: "manufacture-comparison", method: "corpus" },
    acquisitionRequires: ["currentBody", "baseManufacture"],
    facts: ["directionCorpus", "identityComparisonExclusion", "repeatObservation"],
    factor: factorIdentityOld,
  }),
  identityContinuity: makeEvent({
    observationId: "obs.object.continuity",
    sourceIds: ["source.archive.image", "source.physical.current"],
    sharedLatentIds: ["latent.object-match"],
    dependencyUnitId: "dep.object.continuity",
    acquisitionActionId: "A.VERIFY.OBJECT_CONTINUITY",
    coverage: { object: "OBJECT.FIRST", region: "stable-anchors", method: "cross-time" },
    acquisitionRequires: ["baseManufacture"],
    facts: ["directionHistoricCandidate", "identityObjectContinuity"],
    factor: factorIdentityOld,
  }),
  accident: makeEvent({
    observationId: "obs.accident.major",
    sourceIds: ["source.event.accident.photo", "source.event.accident.insurance"],
    sharedLatentIds: ["latent.accident-event"],
    dependencyUnitId: "dep.accident.major",
    acquisitionActionId: "A.RESEARCH.ACCIDENT",
    coverage: { object: "ARCHIVE.CANDIDATE.T2", region: "declared-record-group", method: "archive" },
    facts: [
      "t2RecordGroupCoherent",
      "t2RecordClaimsAppearanceRestore",
      "t2RecordClaimsDamageExtent",
      "t2RecordClaimsReassembly",
    ],
    proofRoles: [PROOF_ROLES.T2_RECORD_COHERENCE],
    factor: factorMajor,
  }),
  t2Attribution: makeEvent({
    observationId: "obs.archive.t2.object-attribution",
    sourceIds: [
      "source.archive.t2.object-register",
      "source.physical.t2.stable-anchors",
    ],
    sharedLatentIds: ["latent.archive-t2-object-relation"],
    dependencyUnitId: "dep.archive.t2.object-attribution",
    acquisitionActionId: "A.RELATE.ARCHIVE.T2_TO_OBJECT",
    coverage: {
      object: "RELATION.ARCHIVE_T2_OBJECT_FIRST",
      region: "stable-noncomposition-anchors",
      method: "object-attribution",
    },
    facts: ["t2ArchiveObjectAttribution", "t2ArchiveObjectLinkCandidate"],
    proofRoles: [PROOF_ROLES.T2_OBJECT_ATTRIBUTION],
  }),
  t2AttributionContested: makeEvent({
    observationId: "obs.archive.t2.object-attribution-contested",
    sourceIds: ["source.archive.t2.conflicting-object-register"],
    sharedLatentIds: ["latent.archive-t2-object-relation"],
    dependencyUnitId: "dep.archive.t2.object-attribution",
    acquisitionActionId: "A.RELATE.ARCHIVE.T2_TO_OBJECT",
    coverage: {
      object: "RELATION.ARCHIVE_T2_OBJECT_FIRST",
      region: "stable-noncomposition-anchors",
      method: "contested",
    },
    facts: ["t2ArchiveObjectAttributionContested"],
  }),
  t2RecordCoherenceContested: makeEvent({
    observationId: "obs.archive.t2.record-coherence-contested",
    sourceIds: ["source.event.accident.conflicting-record"],
    sharedLatentIds: ["latent.accident-event"],
    dependencyUnitId: "dep.accident.major",
    acquisitionActionId: "A.RESEARCH.ACCIDENT",
    coverage: { object: "ARCHIVE.CANDIDATE.T2", region: "declared-record-group", method: "contested" },
    facts: ["t2ArchiveRecordCoherenceContested"],
  }),
  documentedCurrentCorroboration: makeEvent({
    observationId: "obs.archive.t2.current-corroboration",
    sourceIds: [
      "source.archive.t2.repair-diagram",
      "source.physical.current-repair-map",
    ],
    sharedLatentIds: ["latent.archive-t2-event-relation"],
    dependencyUnitId: "dep.archive.t2.current-corroboration",
    acquisitionActionId: "A.CORROBORATE.ARCHIVE.T2_CURRENT",
    coverage: {
      object: "RELATION.ARCHIVE_T2_EVENT_OBJECT_FIRST",
      region: "declared-major-scope",
      method: "record-current",
    },
    facts: ["appearanceRestore", "t2EventPhysicalCorrespondence"],
    proofRoles: [PROOF_ROLES.T2_CURRENT_CORROBORATION],
  }),
  t2EventCorroborationContested: makeEvent({
    observationId: "obs.archive.t2.event-corroboration-contested",
    sourceIds: ["source.physical.t2.conflicting-current-zone"],
    sharedLatentIds: ["latent.archive-t2-event-relation"],
    dependencyUnitId: "dep.archive.t2.current-corroboration",
    acquisitionActionId: "A.CORROBORATE.ARCHIVE.T2_CURRENT",
    coverage: {
      object: "RELATION.ARCHIVE_T2_EVENT_OBJECT_FIRST",
      region: "declared-major-scope",
      method: "contested",
    },
    facts: ["t2EventPhysicalCorrespondenceContested"],
  }),
  appearance: makeEvent({
    observationId: "obs.appearance.restore",
    sourceIds: ["source.physical.current"],
    sharedLatentIds: ["latent.repair-map"],
    dependencyUnitId: "dep.fact.appearance-restore",
    acquisitionActionId: "A.OBSERVE.REGION_DECOR",
    coverage: { object: "OBJECT.FIRST", region: "declared-restored-zone", method: "visual" },
    facts: ["appearanceRestore"],
  }),
  glueLine: makeEvent({
    observationId: "obs.single-glue-line.answer-key",
    sourceIds: ["source.physical.glue-line"],
    sharedLatentIds: ["latent.repair-map-glue-line"],
    dependencyUnitId: "dep.single-glue-line",
    acquisitionActionId: "A.OBSERVE.REGION_DECOR",
    coverage: { object: "OBJECT.FIRST", region: "single-glue-line", method: "visual" },
    facts: ["glueLineObserved"],
  }),
  physicalMajor: makeEvent({
    observationId: "obs.structure.major.physical",
    sourceIds: ["source.instrument.structure"],
    sharedLatentIds: ["latent.repair-map"],
    dependencyUnitId: "dep.structure.major",
    acquisitionActionId: "A.IMAGE.XRAY",
    coverage: { object: "OBJECT.FIRST", region: "declared-major-scope-multi-view-readable", method: "xray" },
    facts: ["currentStructureReadoutByRegion"],
    proofRoles: [PROOF_ROLES.PHYSICAL_STRUCTURE_MAP],
    factor: factorMajor,
  }),
  xrayEarly: makeEvent({
    observationId: "obs.structure.xray.early",
    sourceIds: ["source.instrument.xray"],
    sharedLatentIds: ["latent.repair-map"],
    dependencyUnitId: "dep.structure.major",
    acquisitionActionId: "A.IMAGE.XRAY",
    coverage: { object: "OBJECT.FIRST", region: "declared-major-scope-multi-view-readable", method: "xray" },
    facts: ["xrayReadingsByRegionAcquired"],
    requiresContextFacts: ["identityObjectContinuity"],
    contextualFacts: ["currentStructureReadoutByRegion"],
    proofRoles: [PROOF_ROLES.PHYSICAL_STRUCTURE_MAP],
    factor: factorMajor,
  }),
  repairContinuity: makeEvent({
    observationId: "obs.structure.major.cross-time",
    sourceIds: [
      "source.archive.major-region-pre",
      "source.physical.major-region-current",
    ],
    sharedLatentIds: ["latent.repair-map"],
    dependencyUnitId: "dep.structure.major",
    acquisitionActionId: "A.MAP.REGION_CONTINUITY",
    coverage: { object: "OBJECT.FIRST", region: "declared-major-scope", method: "cross-time" },
    facts: ["crossTimeMajorChange"],
    proofRoles: [PROOF_ROLES.PHYSICAL_CROSS_TIME],
    factor: factorMajor,
  }),
  documentedCrossTime: makeEvent({
    observationId: "obs.structure.major.documented-cross-time",
    sourceIds: [
      "source.archive.major-region-pre",
      "source.physical.major-region-current",
    ],
    sharedLatentIds: ["latent.documented-cross-time"],
    dependencyUnitId: "dep.documented.cross-time",
    acquisitionActionId: "A.MAP.REGION_CONTINUITY",
    coverage: { object: "RELATION.ARCHIVE_T2_EVENT_OBJECT_FIRST", region: "declared-major-scope", method: "cross-time" },
    facts: ["appearanceRestore", "t2EventPhysicalCorrespondence"],
    proofRoles: [PROOF_ROLES.T2_CROSS_TIME_CORROBORATION],
  }),
  t1: makeEvent({
    observationId: "obs.phase.t1",
    sourceIds: ["source.archive.pre-accident"],
    sharedLatentIds: ["latent.pre-accident-reading"],
    dependencyUnitId: "dep.phase.t1",
    acquisitionActionId: "A.LOCATE.HISTORIC_IMAGE",
    coverage: { object: "OBJECT.FIRST", region: "declared-time-anchor", method: "archive" },
    facts: ["t1ReadingAcquired"],
    requiresContextFacts: ["identityObjectContinuity"],
    contextualFacts: ["t1Established"],
    factor: factorThreePhaseWeak,
  }),
  t3: makeEvent({
    observationId: "obs.phase.t3",
    sourceIds: [
      "source.archive.t3.condition-report",
      "source.archive.t3.treatment-map",
    ],
    sharedLatentIds: ["latent.treatment-scope"],
    dependencyUnitId: "dep.phase.t3",
    acquisitionActionId: "A.RESEARCH.LATE_TREATMENT",
    coverage: { object: "ARCHIVE.CANDIDATE.T3", region: "declared-treatment-records", method: "archive" },
    facts: ["t3RecordGroupCoherent", "t3RecordClaimsLocalTreatment"],
    proofRoles: [PROOF_ROLES.T3_RECORD_COHERENCE],
    factor: factorThreePhaseWeak,
  }),
  t3RecordCoherenceContested: makeEvent({
    observationId: "obs.archive.t3.record-coherence-contested",
    sourceIds: ["source.archive.t3.conflicting-treatment-record"],
    sharedLatentIds: ["latent.treatment-scope"],
    dependencyUnitId: "dep.phase.t3",
    acquisitionActionId: "A.RESEARCH.LATE_TREATMENT",
    coverage: { object: "ARCHIVE.CANDIDATE.T3", region: "declared-treatment-records", method: "contested" },
    facts: ["t3ArchiveRecordCoherenceContested"],
  }),
  t3Attribution: makeEvent({
    observationId: "obs.archive.t3.object-attribution",
    sourceIds: [
      "source.archive.t3.object-register",
      "source.physical.t3.stable-anchors",
    ],
    sharedLatentIds: ["latent.archive-t3-object-relation"],
    dependencyUnitId: "dep.archive.t3.object-attribution",
    acquisitionActionId: "A.RELATE.ARCHIVE.T3_TO_OBJECT",
    coverage: {
      object: "RELATION.ARCHIVE_T3_OBJECT_FIRST",
      region: "stable-noncomposition-anchors",
      method: "object-attribution",
    },
    facts: ["t3ArchiveObjectAttribution", "t3ArchiveObjectLinkCandidate"],
    proofRoles: [PROOF_ROLES.T3_OBJECT_ATTRIBUTION],
  }),
  t3AttributionContested: makeEvent({
    observationId: "obs.archive.t3.object-attribution-contested",
    sourceIds: ["source.archive.t3.conflicting-object-register"],
    sharedLatentIds: ["latent.archive-t3-object-relation"],
    dependencyUnitId: "dep.archive.t3.object-attribution",
    acquisitionActionId: "A.RELATE.ARCHIVE.T3_TO_OBJECT",
    coverage: {
      object: "RELATION.ARCHIVE_T3_OBJECT_FIRST",
      region: "stable-noncomposition-anchors",
      method: "contested",
    },
    facts: ["t3ArchiveObjectAttributionContested"],
  }),
  t3CurrentCorroboration: makeEvent({
    observationId: "obs.archive.t3.current-corroboration",
    sourceIds: [
      "source.archive.t3.post-treatment-photo",
      "source.physical.t3.current-zone",
    ],
    sharedLatentIds: ["latent.archive-t3-event-relation"],
    dependencyUnitId: "dep.archive.t3.current-corroboration",
    acquisitionActionId: "A.CORROBORATE.ARCHIVE.T3_CURRENT",
    coverage: {
      object: "RELATION.ARCHIVE_T3_EVENT_OBJECT_FIRST",
      region: "declared-treatment-scope",
      method: "record-current",
    },
    facts: ["t3EventPhysicalCorrespondence"],
    proofRoles: [PROOF_ROLES.T3_CURRENT_CORROBORATION],
  }),
  t3EventCorroborationContested: makeEvent({
    observationId: "obs.archive.t3.event-corroboration-contested",
    sourceIds: ["source.physical.t3.conflicting-current-zone"],
    sharedLatentIds: ["latent.archive-t3-event-relation"],
    dependencyUnitId: "dep.archive.t3.current-corroboration",
    acquisitionActionId: "A.CORROBORATE.ARCHIVE.T3_CURRENT",
    coverage: {
      object: "RELATION.ARCHIVE_T3_EVENT_OBJECT_FIRST",
      region: "declared-treatment-scope",
      method: "contested",
    },
    facts: ["t3EventPhysicalCorrespondenceContested"],
  }),
  threePhaseChronologyContested: makeEvent({
    observationId: "obs.phase.chronology-contested",
    sourceIds: ["source.archive.conflicting-phase-date"],
    sharedLatentIds: ["latent.phase-chronology"],
    dependencyUnitId: "dep.phase.chronology",
    acquisitionActionId: "A.RELATE.PHASE.CHRONOLOGY",
    coverage: { object: "RELATION.PHASE_SEQUENCE", region: "declared-three-phase-sequence", method: "contested" },
    facts: ["threePhaseChronologyContested"],
  }),
  materialSubstrate: makeEvent({
    observationId: "obs.key-material.substrate-readings",
    sourceIds: ["source.analysis.substrate-points"],
    sharedLatentIds: ["latent.region-map"],
    dependencyUnitId: "dep.key-material.resolved",
    acquisitionActionId: "A.ANALYZE.MATERIAL.SUBSTRATE",
    coverage: { object: "OBJECT.FIRST", region: "declared-key-material-points", method: "point-analysis" },
    facts: ["keyMaterialSubstrateReadings"],
  }),
  materialLayerSequence: makeEvent({
    observationId: "obs.key-material.layer-sequence",
    sourceIds: ["source.inspection.layer-interface-points"],
    sharedLatentIds: ["latent.region-map"],
    dependencyUnitId: "dep.key-material.resolved",
    acquisitionActionId: "A.INSPECT.MATERIAL.LAYER_SEQUENCE",
    coverage: { object: "OBJECT.FIRST", region: "declared-layer-interface-points", method: "micro-layering" },
    facts: ["keyMaterialLayerSequenceReadings"],
    factor: factorKeyPreserved,
  }),
  surfacePoint: makeEvent({
    observationId: "obs.surface.point-layering",
    sourceIds: ["source.inspection.layer.point-set"],
    sharedLatentIds: ["latent.surface-map"],
    dependencyUnitId: "dep.surface.resolved",
    acquisitionActionId: "A.INSPECT.WINDOWS",
    coverage: { object: "OBJECT.FIRST", region: "declared-surface-points", method: "layering" },
    facts: ["surfacePointLayering"],
  }),
  surface: makeEvent({
    observationId: "obs.surface.resolved",
    sourceIds: ["source.inspection.layer.point-set", "source.surface.region-map"],
    sharedLatentIds: ["latent.surface-map"],
    dependencyUnitId: "dep.surface.resolved",
    acquisitionActionId: "A.SYNTHESIZE.SURFACE_REGIONS",
    coverage: { object: "OBJECT.FIRST", region: "declared-surface-regions", method: "regional-synthesis" },
    facts: ["surfaceRegionalCoverage", "surfaceResolved"],
    factor: factorSurfaceMixed,
  }),
  stability: makeEvent({
    observationId: "obs.stability.resolved",
    sourceIds: ["source.assessment.condition"],
    sharedLatentIds: ["latent.condition-session"],
    dependencyUnitId: "dep.stability.resolved",
    acquisitionActionId: "A.ASSESS.TREATED_AND_UNTREATED",
    coverage: { object: "OBJECT.FIRST", region: "declared-load-paths-supported-static-display", method: "condition" },
    facts: ["displayConditionSpecified", "stabilityResolved"],
    factor: factorStabilityLocalRisk,
  }),
  stabilityBadNews: makeEvent({
    observationId: "obs.stability.bad-news",
    sourceIds: ["source.assessment.bad-news"],
    sharedLatentIds: ["latent.condition-bad-news"],
    dependencyUnitId: "dep.stability.bad-news",
    acquisitionActionId: "A.ASSESS.TREATED_AND_UNTREATED",
    coverage: { object: "OBJECT.FIRST", region: "declared-load-paths", method: "condition" },
    facts: ["stabilityBadNews"],
    factor: factorStabilitySystemic,
  }),
  documentation: makeEvent({
    observationId: "obs.documentation.resolved",
    sourceIds: ["source.archive.chain"],
    sharedLatentIds: ["latent.event-chain"],
    dependencyUnitId: "dep.documentation.resolved",
    acquisitionActionId: "A.TRACE.PROVENANCE_CHAIN",
    coverage: { object: "OBJECT.FIRST", region: "declared-document-boundary", method: "archive" },
    acquisitionRequires: ["identityObjectContinuity"],
    facts: ["documentationBoundary", "documentationNoConflict"],
    factor: factorDocumentationPartial,
  }),
  noSignalUnresolved: makeEvent({
    observationId: "obs.surface.no-signal.unresolved",
    sourceIds: ["source.instrument.screen"],
    sharedLatentIds: ["latent.surface-map"],
    dependencyUnitId: "dep.surface.no-signal",
    acquisitionActionId: "A.SCREEN.UV",
    coverage: { object: "OBJECT.FIRST", region: "declared-screen-zone", method: "uv-screen" },
    facts: ["negativeSignalObserved"],
    factor: factorSurfaceOriginal,
    negativeResult: {
      rawFactIds: ["negativeSignalObserved"],
      capability: {
        targetCorrect: true,
        coverageSufficient: false,
        sensitivitySufficient: true,
        materialSupportsSignal: false,
      },
    },
  }),
  surfaceBadNews: makeEvent({
    observationId: "obs.surface.bad-news",
    sourceIds: ["source.inspection.surface"],
    sharedLatentIds: ["latent.surface-map"],
    dependencyUnitId: "dep.surface.bad-news",
    acquisitionActionId: "A.INSPECT.WINDOWS",
    coverage: { object: "OBJECT.FIRST", region: "declared-surface-scope", method: "layering" },
    facts: ["surfaceBadNews"],
    factor: factorSurfaceMixed,
  }),
  hardMajorCounter: makeEvent({
    observationId: "obs.counter.major.abstract",
    sourceIds: ["source.method.capable-structural"],
    sharedLatentIds: ["latent.repair-map"],
    dependencyUnitId: "dep.counter.major.abstract",
    acquisitionActionId: "A.MAP.REGION_CONTINUITY",
    coverage: { object: "OBJECT.FIRST", region: "necessary-major-scope", method: "capable-structural" },
    facts: ["negativeSignalObserved"],
    capabilityFacts: ["scopedAbsenceSupported"],
    factor: factorNoMajor,
    negativeResult: {
      rawFactIds: ["negativeSignalObserved"],
      capability: {
        targetCorrect: true,
        coverageSufficient: true,
        sensitivitySufficient: true,
        materialSupportsSignal: true,
      },
    },
    counterevidence: {
      relation: "hard-counterevidence",
      targetClaim: "CLAIM.REPAIR.MAJOR_REASSEMBLY",
      scope: {
        object: "OBJECT.FIRST",
        region: "necessary-major-scope",
        time: "T2",
        materialLayer: "structural-substrate",
        quantifier: "necessary-condition",
      },
    },
  }),
  outOfScopeMajorCounter: makeEvent({
    observationId: "obs.counter.major.out-of-scope",
    sourceIds: ["source.method.capable-local"],
    sharedLatentIds: ["latent.local-continuity"],
    dependencyUnitId: "dep.counter.major.out-of-scope",
    acquisitionActionId: "A.MAP.REGION_CONTINUITY",
    coverage: { object: "OBJECT.FIRST", region: "nonnecessary-local-scope", method: "capable-structural" },
    facts: ["negativeSignalObserved"],
    capabilityFacts: ["scopedAbsenceSupported"],
    negativeResult: {
      rawFactIds: ["negativeSignalObserved"],
      capability: {
        targetCorrect: true,
        coverageSufficient: true,
        sensitivitySufficient: true,
        materialSupportsSignal: true,
      },
    },
    counterevidence: {
      relation: "hard-counterevidence",
      targetClaim: "CLAIM.REPAIR.MAJOR_REASSEMBLY",
      scope: {
        object: "OBJECT.FIRST",
        region: "nonnecessary-local-scope",
        time: "T2",
        materialLayer: "structural-substrate",
        quantifier: "necessary-condition",
      },
    },
  }),
  outOfScopeMajorCounterWithFactor: makeEvent({
    observationId: "obs.counter.major.out-of-scope-with-factor",
    sourceIds: ["source.method.capable-local-factor"],
    sharedLatentIds: ["latent.local-continuity-factor"],
    dependencyUnitId: "dep.counter.major.out-of-scope-with-factor",
    acquisitionActionId: "A.MAP.REGION_CONTINUITY",
    coverage: { object: "OBJECT.FIRST", region: "nonnecessary-local-scope", method: "capable-structural" },
    facts: ["negativeSignalObserved"],
    capabilityFacts: ["scopedAbsenceSupported"],
    factor: factorNoMajor,
    negativeResult: {
      rawFactIds: ["negativeSignalObserved"],
      capability: {
        targetCorrect: true,
        coverageSufficient: true,
        sensitivitySufficient: true,
        materialSupportsSignal: true,
      },
    },
    counterevidence: {
      relation: "hard-counterevidence",
      targetClaim: "CLAIM.REPAIR.MAJOR_REASSEMBLY",
      scope: {
        object: "OBJECT.FIRST",
        region: "nonnecessary-local-scope",
        time: "T2",
        materialLayer: "structural-substrate",
        quantifier: "necessary-condition",
      },
    },
  }),
  weakMajorCounter: makeEvent({
    observationId: "obs.counter.major.weakens",
    sourceIds: ["source.method.weak-major"],
    sharedLatentIds: ["latent.repair-map-weak"],
    dependencyUnitId: "dep.counter.major.weakens",
    acquisitionActionId: "A.MAP.REGION_CONTINUITY",
    coverage: { object: "OBJECT.FIRST", region: "necessary-major-scope", method: "capable-structural" },
    facts: ["negativeSignalObserved"],
    capabilityFacts: ["scopedAbsenceSupported"],
    factor: factorNoMajorWeak,
    negativeResult: {
      rawFactIds: ["negativeSignalObserved"],
      capability: {
        targetCorrect: true,
        coverageSufficient: true,
        sensitivitySufficient: true,
        materialSupportsSignal: true,
      },
    },
    counterevidence: {
      relation: "weakens",
      targetClaim: "CLAIM.REPAIR.MAJOR_REASSEMBLY",
      scope: {
        object: "OBJECT.FIRST",
        region: "necessary-major-scope",
        time: "T2",
        materialLayer: "structural-substrate",
        quantifier: "necessary-condition",
      },
    },
  }),
  boundedMajorObservation: makeEvent({
    observationId: "obs.counter.major.bounds",
    sourceIds: ["source.method.bounds-major"],
    sharedLatentIds: ["latent.repair-map-bounds"],
    dependencyUnitId: "dep.counter.major.bounds",
    acquisitionActionId: "A.MAP.REGION_CONTINUITY",
    coverage: { object: "OBJECT.FIRST", region: "nonnecessary-local-scope", method: "capable-structural" },
    facts: ["negativeSignalObserved"],
    capabilityFacts: ["scopedAbsenceSupported"],
    negativeResult: {
      rawFactIds: ["negativeSignalObserved"],
      capability: {
        targetCorrect: true,
        coverageSufficient: true,
        sensitivitySufficient: true,
        materialSupportsSignal: true,
      },
    },
    counterevidence: {
      relation: "bounds/refines",
      targetClaim: "CLAIM.REPAIR.MAJOR_REASSEMBLY",
      scope: {
        object: "OBJECT.FIRST",
        region: "nonnecessary-local-scope",
        time: "T2",
        materialLayer: "structural-substrate",
        quantifier: "existential-local",
      },
    },
  }),
  logicalMajorCounter: makeEvent({
    observationId: "obs.counter.major.logical-refutation",
    sourceIds: ["source.method.logical-major"],
    sharedLatentIds: ["latent.repair-map-logical"],
    dependencyUnitId: "dep.counter.major.logical-refutation",
    acquisitionActionId: "A.MAP.REGION_CONTINUITY",
    coverage: { object: "OBJECT.FIRST", region: "necessary-major-scope", method: "capable-structural" },
    facts: ["negativeSignalObserved"],
    capabilityFacts: ["scopedAbsenceSupported"],
    factor: factorNoMajor,
    negativeResult: {
      rawFactIds: ["negativeSignalObserved"],
      capability: {
        targetCorrect: true,
        coverageSufficient: true,
        sensitivitySufficient: true,
        materialSupportsSignal: true,
      },
    },
    counterevidence: {
      relation: "logical-refutation",
      targetClaim: "CLAIM.REPAIR.MAJOR_REASSEMBLY",
      scope: {
        object: "OBJECT.FIRST",
        region: "necessary-major-scope",
        time: "T2",
        materialLayer: "structural-substrate",
        quantifier: "necessary-condition",
      },
    },
  }),
  hardIdentityCounter: makeEvent({
    observationId: "obs.counter.identity.hard",
    sourceIds: ["source.method.capable-identity"],
    sharedLatentIds: ["latent.identity-counter"],
    dependencyUnitId: "dep.counter.identity.hard",
    acquisitionActionId: "A.COMPARE.CORPUS",
    coverage: { object: "OBJECT.FIRST", region: "manufacture-identity-scope", method: "capable-identity" },
    facts: ["negativeSignalObserved"],
    capabilityFacts: ["scopedAbsenceSupported"],
    factor: factorReproduction,
    negativeResult: {
      rawFactIds: ["negativeSignalObserved"],
      capability: {
        targetCorrect: true,
        coverageSufficient: true,
        sensitivitySufficient: true,
        materialSupportsSignal: true,
      },
    },
    counterevidence: {
      relation: "hard-counterevidence",
      targetClaim: "CLAIM.IDENTITY.LATE18_EXPORT",
      scope: {
        object: "OBJECT.FIRST",
        region: "manufacture-identity-scope",
        time: "manufacture",
        materialLayer: "ceramic-body-glaze",
        quantifier: "necessary-condition",
      },
    },
  }),
  insufficientMajorCounter: makeEvent({
    observationId: "obs.counter.major.insufficient-capability",
    sourceIds: ["source.method.insufficient-structural"],
    sharedLatentIds: ["latent.repair-map-insufficient"],
    dependencyUnitId: "dep.counter.major.insufficient-capability",
    acquisitionActionId: "A.MAP.REGION_CONTINUITY",
    coverage: { object: "OBJECT.FIRST", region: "necessary-major-scope", method: "limited-structural" },
    facts: ["negativeSignalObserved"],
    capabilityFacts: ["scopedAbsenceSupported"],
    factor: factorNoMajor,
    negativeResult: {
      rawFactIds: ["negativeSignalObserved"],
      capability: {
        targetCorrect: true,
        coverageSufficient: false,
        sensitivitySufficient: true,
        materialSupportsSignal: true,
      },
    },
    counterevidence: {
      relation: "hard-counterevidence",
      targetClaim: "CLAIM.REPAIR.MAJOR_REASSEMBLY",
      scope: {
        object: "OBJECT.FIRST",
        region: "necessary-major-scope",
        time: "T2",
        materialLayer: "structural-substrate",
        quantifier: "necessary-condition",
      },
    },
  }),
  identityProofOnly: makeEvent({
    observationId: "obs.fixture.identity-proof-only",
    sourceIds: ["source.fixture.identity"],
    dependencyUnitId: "dep.fixture.identity-proof",
    acquisitionActionId: "A.COMPARE.CORPUS",
    coverage: { object: "OBJECT.FIRST", region: "manufacture-comparison", method: "fixture" },
    acquisitionRequires: ["currentBody", "baseManufacture"],
    facts: ["directionCorpus", "identityComparisonExclusion"],
  }),
  majorProofOnly: makeEvent({
    observationId: "obs.fixture.major-proof-only",
    sourceIds: ["source.event.accident.photo", "source.event.accident.insurance"],
    dependencyUnitId: "dep.fixture.major-proof",
    acquisitionActionId: "A.RESEARCH.ACCIDENT",
    coverage: { object: "ARCHIVE.CANDIDATE.T2", region: "declared-record-group", method: "archive" },
    facts: [
      "t2RecordGroupCoherent",
      "t2RecordClaimsAppearanceRestore",
      "t2RecordClaimsDamageExtent",
      "t2RecordClaimsReassembly",
    ],
    proofRoles: [PROOF_ROLES.T2_RECORD_COHERENCE],
  }),
  singleXray: makeEvent({
    observationId: "obs.single-xray.answer-key",
    sourceIds: ["source.instrument.single-xray"],
    sharedLatentIds: ["latent.repair-map"],
    dependencyUnitId: "dep.single-xray",
    acquisitionActionId: "A.IMAGE.XRAY",
    coverage: { object: "OBJECT.FIRST", region: "single-read-zone", method: "xray" },
    facts: ["xraySingleReadingAcquired"],
    factor: factorMajor,
  }),
  singleDocument: makeEvent({
    observationId: "obs.single-document.answer-key",
    sourceIds: ["source.event.single-document"],
    sharedLatentIds: ["latent.accident-event"],
    dependencyUnitId: "dep.single-document",
    acquisitionActionId: "A.RESEARCH.ACCIDENT",
    coverage: { object: "ARCHIVE.CANDIDATE.T2", region: "single-document", method: "archive" },
    facts: ["t2RecordClaimsAppearanceRestore", "t2RecordClaimsReassembly"],
    factor: factorMajor,
  }),
});

const g2Documented = [
  events.whole,
  events.base,
  events.corpus,
  events.accident,
  events.t2Attribution,
  events.documentedCurrentCorroboration,
];
const g2DocumentedCrossTime = [
  events.wholeWithoutRepairMap,
  events.base,
  events.corpus,
  events.accident,
  events.t2Attribution,
  events.documentedCrossTime,
];
const g2Alternate = [
  events.whole,
  events.base,
  events.identityContinuity,
  events.appearance,
  events.physicalMajor,
  events.repairContinuity,
];

function fixture(id, fixtureEvents, orders, expected, extra = {}) {
  return Object.freeze({
    id,
    thresholds,
    expectedProfile,
    claimScopeRequirements,
    actionContracts,
    proofRoleContracts,
    unknownRegistry,
    playerChoice: "CONTINUE",
    events: Object.freeze(fixtureEvents),
    orders: Object.freeze(orders.map((order) => Object.freeze(order))),
    expected: Object.freeze(expected),
    ...extra,
  });
}

export const scenarios = Object.freeze([
  fixture(
    "g1-oriented",
    [events.whole, events.base, events.corpus],
    [
      ["obs.current.whole", "obs.current.base", "obs.corpus.identity"],
      ["obs.current.base", "obs.current.whole", "obs.corpus.identity"],
    ],
    { stage: "G1" },
  ),
  fixture(
    "archive-candidate-early-local-value",
    [events.whole, events.base, events.corpus, events.accident],
    [[
      "obs.accident.major",
      "obs.current.whole",
      "obs.current.base",
      "obs.corpus.identity",
    ]],
    { stage: "G1" },
  ),
  fixture(
    "archive-attribution-contested-not-promoted",
    [events.whole, events.base, events.corpus, events.accident, events.t2AttributionContested],
    [[
      "obs.current.whole",
      "obs.current.base",
      "obs.corpus.identity",
      "obs.accident.major",
      "obs.archive.t2.object-attribution-contested",
    ]],
    { stage: "G1" },
  ),
  fixture(
    "g2-documented-stop",
    g2Documented,
    [
      [
        "obs.current.whole",
        "obs.current.base",
        "obs.corpus.identity",
        "obs.accident.major",
        "obs.archive.t2.object-attribution",
        "obs.archive.t2.current-corroboration",
      ],
      [
        "obs.accident.major",
        "obs.archive.t2.object-attribution",
        "obs.archive.t2.current-corroboration",
        "obs.current.base",
        "obs.current.whole",
        "obs.corpus.identity",
      ],
      [
        "obs.current.whole",
        "obs.accident.major",
        "obs.archive.t2.current-corroboration",
        "obs.current.base",
        "obs.archive.t2.object-attribution",
        "obs.corpus.identity",
      ],
    ],
    { stage: "G2" },
    { playerChoice: "STOP" },
  ),
  fixture(
    "g2-documented-cross-time-or",
    g2DocumentedCrossTime,
    [
      [
        "obs.current.whole.without-repair-map",
        "obs.current.base",
        "obs.corpus.identity",
        "obs.accident.major",
        "obs.archive.t2.object-attribution",
        "obs.structure.major.documented-cross-time",
      ],
      [
        "obs.accident.major",
        "obs.structure.major.documented-cross-time",
        "obs.archive.t2.object-attribution",
        "obs.current.whole.without-repair-map",
        "obs.current.base",
        "obs.corpus.identity",
      ],
    ],
    { stage: "G2" },
  ),
  fixture(
    "g2-continue-no-progress",
    [...g2Documented, events.corpusDuplicate, events.noSignalUnresolved],
    [
      [
        "obs.current.whole",
        "obs.current.base",
        "obs.corpus.identity",
        "obs.accident.major",
        "obs.archive.t2.object-attribution",
        "obs.archive.t2.current-corroboration",
        "obs.corpus.identity.repeat",
        "obs.surface.no-signal.unresolved",
      ],
      [
        "obs.surface.no-signal.unresolved",
        "obs.accident.major",
        "obs.archive.t2.current-corroboration",
        "obs.current.base",
        "obs.current.whole",
        "obs.archive.t2.object-attribution",
        "obs.corpus.identity",
        "obs.corpus.identity.repeat",
      ],
      [
        "obs.current.whole",
        "obs.current.base",
        "obs.corpus.identity.repeat",
        "obs.accident.major",
        "obs.archive.t2.object-attribution",
        "obs.archive.t2.current-corroboration",
        "obs.corpus.identity",
        "obs.surface.no-signal.unresolved",
      ],
    ],
    { stage: "G2" },
  ),
  fixture(
    "g2-alternate-physical",
    g2Alternate,
    [
      [
        "obs.current.whole",
        "obs.current.base",
        "obs.object.continuity",
        "obs.appearance.restore",
        "obs.structure.major.physical",
        "obs.structure.major.cross-time",
      ],
      [
        "obs.structure.major.physical",
        "obs.structure.major.cross-time",
        "obs.current.whole",
        "obs.current.base",
        "obs.object.continuity",
        "obs.appearance.restore",
      ],
    ],
    { stage: "G2" },
  ),
  fixture(
    "professional-evidence-early",
    [
      events.whole,
      events.base,
      events.identityContinuity,
      events.appearance,
      events.xrayEarly,
      events.repairContinuity,
    ],
    [
      [
        "obs.structure.xray.early",
        "obs.current.whole",
        "obs.current.base",
        "obs.object.continuity",
        "obs.appearance.restore",
        "obs.structure.major.cross-time",
      ],
      [
        "obs.current.whole",
        "obs.structure.xray.early",
        "obs.current.base",
        "obs.object.continuity",
        "obs.appearance.restore",
        "obs.structure.major.cross-time",
      ],
      [
        "obs.current.whole",
        "obs.current.base",
        "obs.object.continuity",
        "obs.structure.xray.early",
        "obs.appearance.restore",
        "obs.structure.major.cross-time",
      ],
    ],
    { stage: "G2" },
  ),
  fixture(
    "g3-with-allowed-unknowns",
    [
      ...g2Documented,
      events.identityContinuity,
      events.t1,
      events.t3,
      events.t3Attribution,
      events.t3CurrentCorroboration,
      events.materialSubstrate,
      events.materialLayerSequence,
      events.surfacePoint,
      events.surface,
      events.stability,
      events.documentation,
    ],
    [
      [
        "obs.current.whole",
        "obs.current.base",
        "obs.object.continuity",
        "obs.corpus.identity",
        "obs.accident.major",
        "obs.archive.t2.object-attribution",
        "obs.archive.t2.current-corroboration",
        "obs.phase.t1",
        "obs.phase.t3",
        "obs.archive.t3.object-attribution",
        "obs.archive.t3.current-corroboration",
        "obs.key-material.substrate-readings",
        "obs.key-material.layer-sequence",
        "obs.surface.point-layering",
        "obs.surface.resolved",
        "obs.stability.resolved",
        "obs.documentation.resolved",
      ],
      [
        "obs.phase.t1",
        "obs.accident.major",
        "obs.phase.t3",
        "obs.archive.t2.current-corroboration",
        "obs.archive.t3.current-corroboration",
        "obs.key-material.layer-sequence",
        "obs.current.base",
        "obs.current.whole",
        "obs.object.continuity",
        "obs.archive.t2.object-attribution",
        "obs.archive.t3.object-attribution",
        "obs.corpus.identity",
        "obs.documentation.resolved",
        "obs.stability.resolved",
        "obs.key-material.substrate-readings",
        "obs.surface.point-layering",
        "obs.surface.resolved",
      ],
      [
        "obs.stability.resolved",
        "obs.surface.resolved",
        "obs.surface.point-layering",
        "obs.accident.major",
        "obs.archive.t2.object-attribution",
        "obs.archive.t2.current-corroboration",
        "obs.current.whole",
        "obs.current.base",
        "obs.object.continuity",
        "obs.documentation.resolved",
        "obs.corpus.identity",
        "obs.key-material.substrate-readings",
        "obs.key-material.layer-sequence",
        "obs.phase.t3",
        "obs.archive.t3.object-attribution",
        "obs.archive.t3.current-corroboration",
        "obs.phase.t1",
      ],
    ],
    { stage: "G3" },
    { unknowns: Object.freeze(["noncritical-region", "exact-treatment-formula"]) },
  ),
  fixture(
    "g2-surface-bad-news-stable",
    [...g2Documented, events.surfaceBadNews],
    [[
      "obs.current.whole",
      "obs.current.base",
      "obs.corpus.identity",
      "obs.accident.major",
      "obs.archive.t2.object-attribution",
      "obs.archive.t2.current-corroboration",
      "obs.surface.bad-news",
    ]],
    { stage: "G2" },
  ),
  fixture(
    "g2-stability-bad-news-stable",
    [...g2Documented, events.stabilityBadNews],
    [[
      "obs.current.whole",
      "obs.current.base",
      "obs.corpus.identity",
      "obs.accident.major",
      "obs.archive.t2.object-attribution",
      "obs.archive.t2.current-corroboration",
      "obs.stability.bad-news",
    ]],
    { stage: "G2" },
  ),
  fixture(
    "g2-hard-counter-downgrade",
    [...g2Documented, events.hardMajorCounter],
    [[
      "obs.current.whole",
      "obs.current.base",
      "obs.corpus.identity",
      "obs.accident.major",
      "obs.archive.t2.object-attribution",
      "obs.archive.t2.current-corroboration",
      "obs.counter.major.abstract",
    ]],
    { stage: "G1" },
  ),
  fixture(
    "g2-out-of-scope-counter-stable",
    [...g2Documented, events.outOfScopeMajorCounter],
    [[
      "obs.current.whole",
      "obs.current.base",
      "obs.corpus.identity",
      "obs.accident.major",
      "obs.archive.t2.object-attribution",
      "obs.archive.t2.current-corroboration",
      "obs.counter.major.out-of-scope",
    ]],
    { stage: "G2" },
  ),
  fixture(
    "g2-out-of-scope-factor-stable",
    [...g2Documented, events.outOfScopeMajorCounterWithFactor],
    [[
      "obs.current.whole",
      "obs.current.base",
      "obs.corpus.identity",
      "obs.accident.major",
      "obs.archive.t2.object-attribution",
      "obs.archive.t2.current-corroboration",
      "obs.counter.major.out-of-scope-with-factor",
    ]],
    { stage: "G2" },
  ),
  fixture(
    "g2-major-weakened-stable",
    [...g2Documented, events.weakMajorCounter],
    [[
      "obs.current.whole",
      "obs.current.base",
      "obs.corpus.identity",
      "obs.accident.major",
      "obs.archive.t2.object-attribution",
      "obs.archive.t2.current-corroboration",
      "obs.counter.major.weakens",
    ]],
    { stage: "G2" },
  ),
  fixture(
    "g2-major-bounded-stable",
    [...g2Documented, events.boundedMajorObservation],
    [[
      "obs.current.whole",
      "obs.current.base",
      "obs.corpus.identity",
      "obs.accident.major",
      "obs.archive.t2.object-attribution",
      "obs.archive.t2.current-corroboration",
      "obs.counter.major.bounds",
    ]],
    { stage: "G2" },
  ),
  fixture(
    "g2-logical-counter-downgrade",
    [...g2Documented, events.logicalMajorCounter],
    [[
      "obs.current.whole",
      "obs.current.base",
      "obs.corpus.identity",
      "obs.accident.major",
      "obs.archive.t2.object-attribution",
      "obs.archive.t2.current-corroboration",
      "obs.counter.major.logical-refutation",
    ]],
    { stage: "G1" },
  ),
  fixture(
    "g2-identity-hard-counter-downgrade",
    [...g2Documented, events.hardIdentityCounter],
    [[
      "obs.current.whole",
      "obs.current.base",
      "obs.corpus.identity",
      "obs.accident.major",
      "obs.archive.t2.object-attribution",
      "obs.archive.t2.current-corroboration",
      "obs.counter.identity.hard",
    ]],
    { stage: "G1" },
  ),
  fixture(
    "g2-insufficient-counter-unresolved",
    [...g2Documented, events.insufficientMajorCounter],
    [[
      "obs.current.whole",
      "obs.current.base",
      "obs.corpus.identity",
      "obs.accident.major",
      "obs.archive.t2.object-attribution",
      "obs.archive.t2.current-corroboration",
      "obs.counter.major.insufficient-capability",
    ]],
    { stage: "G2" },
  ),
  fixture(
    "marginal-splice-rejected",
    [
      events.whole,
      events.base,
      events.identityProofOnly,
      events.majorProofOnly,
      events.t2Attribution,
      events.documentedCurrentCorroboration,
    ],
    [[
      "obs.current.whole",
      "obs.current.base",
      "obs.fixture.identity-proof-only",
      "obs.fixture.major-proof-only",
      "obs.archive.t2.object-attribution",
      "obs.archive.t2.current-corroboration",
    ]],
    { stage: "G1" },
    {
      priorCells: Object.freeze([
        Object.freeze({
          when: Object.freeze({
            Identity: "LATE18_EXPORT",
            RepairHistory: Object.freeze([
              "MAJOR_REASSEMBLY_NOT_THREE_PHASE",
              "THREE_PHASE",
            ]),
          }),
          mass: 0.52,
        }),
        Object.freeze({
          when: Object.freeze({
            Identity: "LATE18_EXPORT",
            RepairHistory: "NO_MAJOR_REASSEMBLY",
          }),
          mass: 0.24,
        }),
        Object.freeze({
          when: Object.freeze({
            Identity: "REPRODUCTION",
            RepairHistory: Object.freeze([
              "MAJOR_REASSEMBLY_NOT_THREE_PHASE",
              "THREE_PHASE",
            ]),
          }),
          mass: 0.24,
        }),
        Object.freeze({
          when: Object.freeze({
            Identity: "REPRODUCTION",
            RepairHistory: "NO_MAJOR_REASSEMBLY",
          }),
          mass: 0,
        }),
      ]),
    },
  ),
  fixture(
    "single-test-answer-key-rejected",
    [events.singleXray],
    [["obs.single-xray.answer-key"]],
    { stage: "NONE" },
  ),
  fixture(
    "near-complete-single-instrument-rejected",
    [events.whole, events.base, events.corpus, events.appearance, events.singleXray],
    [[
      "obs.current.whole",
      "obs.current.base",
      "obs.corpus.identity",
      "obs.appearance.restore",
      "obs.single-xray.answer-key",
    ]],
    { stage: "G1" },
  ),
  fixture(
    "near-complete-single-glue-line-rejected",
    [events.whole, events.base, events.corpus, events.glueLine],
    [[
      "obs.current.whole",
      "obs.current.base",
      "obs.corpus.identity",
      "obs.single-glue-line.answer-key",
    ]],
    { stage: "G1" },
  ),
  fixture(
    "single-document-answer-key-rejected",
    [events.whole, events.base, events.corpus, events.singleDocument],
    [[
      "obs.current.whole",
      "obs.current.base",
      "obs.corpus.identity",
      "obs.single-document.answer-key",
    ]],
    { stage: "G1" },
  ),
]);

export const scenarioById = Object.freeze(
  Object.fromEntries(scenarios.map((scenario) => [scenario.id, scenario])),
);

export class FixtureContractError extends Error {
  constructor(message, reason, details = {}) {
    super(message);
    this.name = "FixtureContractError";
    this.code = "FIXTURE_CONTRACT_ERROR";
    this.reason = reason;
    this.details = Object.freeze({ ...details });
  }
}

export function eventsForOrder(scenario, order) {
  const byId = new Map(scenario.events.map((event) => [event.observationId, event]));
  const expectedIds = [...byId.keys()].sort();
  const actualIds = [...order].sort();
  if (
    byId.size !== scenario.events.length ||
    order.length !== scenario.events.length ||
    new Set(order).size !== order.length ||
    JSON.stringify(actualIds) !== JSON.stringify(expectedIds)
  ) {
    throw new FixtureContractError(
      `Scenario ${scenario.id} order must be an exact event permutation`,
      "FIXTURE_ORDER_INVALID",
      { scenarioId: scenario.id },
    );
  }
  return order.map((id) => {
    const event = byId.get(id);
    if (!event) {
      throw new FixtureContractError(
        `Scenario ${scenario.id} order references missing event ${id}`,
        "FIXTURE_ORDER_MISSING_EVENT",
        { observationId: id, scenarioId: scenario.id },
      );
    }
    return event;
  });
}

export const conflictingDependencyEvents = Object.freeze([
  events.corpus,
  Object.freeze({
    ...events.corpusDuplicate,
    factor: axisFactor(
      "fixture.factor.identity.conflicting",
      "Identity",
      "REPRODUCTION",
    ),
  }),
]);
