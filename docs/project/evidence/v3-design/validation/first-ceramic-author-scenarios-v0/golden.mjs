// Separately written, runtime-isolated golden oracle for the validation-only author scenarios.
//
// This module deliberately imports neither solver.mjs nor fixtures.mjs. Its rational
// templates, scenario assignments, claims, conflicts, and coverage ledgers are written
// here by hand. There is intentionally no update/accept path from solver output. These
// properties do not prove historical pre-registration or that this file was written first.

export const GOLDEN_AXIS_ORDER = Object.freeze([
  "Identity",
  "RepairHistory",
  "KeyMaterial",
  "Surface",
  "Stability",
  "Documentation",
]);

export const GOLDEN_AXES = Object.freeze({
  Identity: Object.freeze(["REPRODUCTION", "LATE18_EXPORT"]),
  RepairHistory: Object.freeze([
    "NO_MAJOR_REASSEMBLY",
    "MAJOR_REASSEMBLY_NOT_THREE_PHASE",
    "THREE_PHASE",
  ]),
  KeyMaterial: Object.freeze(["KEY_RECONSTRUCTED", "KEY_MATERIAL_PRESERVED"]),
  Surface: Object.freeze([
    "ORIGINAL_SURFACE_PREDOMINANT",
    "MIXED_CROSS_OVERPAINT",
    "KEY_IDENTITY_IMAGE_RECONSTRUCTED",
  ]),
  Stability: Object.freeze([
    "SYSTEMIC_RISK",
    "DISPLAYABLE_LOCAL_RISK",
    "DISPLAYABLE_STABLE",
  ]),
  Documentation: Object.freeze([
    "CONFLICTED_OR_UNMATCHED",
    "COHERENT_PARTIAL",
    "COHERENT_SUFFICIENT",
  ]),
});

function gcd(left, right) {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}

function rational(numerator, denominator = 1n) {
  let n = BigInt(numerator);
  let d = BigInt(denominator);
  if (d === 0n) throw new RangeError("Golden rational denominator cannot be zero");
  if (d < 0n) [n, d] = [-n, -d];
  const divisor = gcd(n, d);
  return Object.freeze({ numerator: n / divisor, denominator: d / divisor });
}

function multiply(...values) {
  return values.reduce(
    (result, value) =>
      rational(
        result.numerator * value.numerator,
        result.denominator * value.denominator,
      ),
    rational(1n),
  );
}

function add(...values) {
  return values.reduce(
    (result, value) =>
      rational(
        result.numerator * value.denominator + value.numerator * result.denominator,
        result.denominator * value.denominator,
      ),
    rational(0n),
  );
}

export function goldenRationalToNumber(value) {
  return Number(value.numerator) / Number(value.denominator);
}

const Q = Object.freeze({
  zero: rational(0n),
  half: rational(1n, 2n),
  third: rational(1n, 3n),
  identity25Low: rational(1n, 26n),
  identity25High: rational(25n, 26n),
  identity625Low: rational(1n, 626n),
  identity625High: rational(625n, 626n),
  repair25Low: rational(1n, 51n),
  repair25High: rational(25n, 51n),
  repair625Low: rational(1n, 651n),
  repair625Mid: rational(25n, 651n),
  repair625High: rational(625n, 651n),
  binary25Low: rational(1n, 26n),
  binary25High: rational(25n, 26n),
  ternary25Low: rational(1n, 27n),
  ternary25High: rational(25n, 27n),
  repairCounterLow: rational(1n, 11n),
  repairCounterHigh: rational(5n, 11n),
  identityCounterLow: rational(1n, 6n),
  identityCounterHigh: rational(5n, 6n),
});

const VECTORS = Object.freeze({
  U2: Object.freeze([Q.half, Q.half]),
  U3: Object.freeze([Q.third, Q.third, Q.third]),
  I25: Object.freeze([Q.identity25Low, Q.identity25High]),
  I625: Object.freeze([Q.identity625Low, Q.identity625High]),
  R25: Object.freeze([Q.repair25Low, Q.repair25High, Q.repair25High]),
  R625: Object.freeze([Q.repair625Low, Q.repair625Mid, Q.repair625High]),
  K25: Object.freeze([Q.binary25Low, Q.binary25High]),
  SMIX: Object.freeze([Q.ternary25Low, Q.ternary25High, Q.ternary25Low]),
  TLOCAL: Object.freeze([Q.ternary25Low, Q.ternary25High, Q.ternary25Low]),
  TSYSTEMIC: Object.freeze([Q.ternary25High, Q.ternary25Low, Q.ternary25Low]),
  DPARTIAL: Object.freeze([Q.ternary25Low, Q.ternary25High, Q.ternary25Low]),
  RCOUNTER: Object.freeze([
    Q.repairCounterLow,
    Q.repairCounterHigh,
    Q.repairCounterHigh,
  ]),
  ICOUNTER: Object.freeze([Q.identityCounterLow, Q.identityCounterHigh]),
});

function productTemplate(id, vectors) {
  return Object.freeze({ id, kind: "product", vectors: Object.freeze(vectors) });
}

const POSTERIOR_TEMPLATES = Object.freeze({
  UNIFORM: productTemplate("UNIFORM", [VECTORS.U2, VECTORS.U3, VECTORS.U2, VECTORS.U3, VECTORS.U3, VECTORS.U3]),
  G1: productTemplate("G1", [VECTORS.I25, VECTORS.U3, VECTORS.U2, VECTORS.U3, VECTORS.U3, VECTORS.U3]),
  G2: productTemplate("G2", [VECTORS.I25, VECTORS.R25, VECTORS.U2, VECTORS.U3, VECTORS.U3, VECTORS.U3]),
  G2_SURFACE: productTemplate("G2_SURFACE", [VECTORS.I25, VECTORS.R25, VECTORS.U2, VECTORS.SMIX, VECTORS.U3, VECTORS.U3]),
  G2_STABILITY_SYSTEMIC: productTemplate("G2_STABILITY_SYSTEMIC", [VECTORS.I25, VECTORS.R25, VECTORS.U2, VECTORS.U3, VECTORS.TSYSTEMIC, VECTORS.U3]),
  G3: productTemplate("G3", [VECTORS.I625, VECTORS.R625, VECTORS.K25, VECTORS.SMIX, VECTORS.TLOCAL, VECTORS.DPARTIAL]),
  MAJOR_COUNTER: productTemplate("MAJOR_COUNTER", [VECTORS.I25, VECTORS.RCOUNTER, VECTORS.U2, VECTORS.U3, VECTORS.U3, VECTORS.U3]),
  IDENTITY_COUNTER: productTemplate("IDENTITY_COUNTER", [VECTORS.ICOUNTER, VECTORS.R25, VECTORS.U2, VECTORS.U3, VECTORS.U3, VECTORS.U3]),
  SINGLE_MAJOR: productTemplate("SINGLE_MAJOR", [VECTORS.U2, VECTORS.R25, VECTORS.U2, VECTORS.U3, VECTORS.U3, VECTORS.U3]),
  MARGINAL_SPLICE: Object.freeze({
    id: "MARGINAL_SPLICE",
    kind: "joint-identity-repair",
    jointIdentityRepair: Object.freeze([
      Object.freeze([rational(0n), rational(3n, 25n), rational(3n, 25n)]),
      Object.freeze([rational(6n, 25n), rational(13n, 50n), rational(13n, 50n)]),
    ]),
    remainingVectors: Object.freeze([VECTORS.U2, VECTORS.U3, VECTORS.U3, VECTORS.U3]),
  }),
});

export const GOLDEN_POSTERIOR_TEMPLATE_IDS = Object.freeze(
  Object.keys(POSTERIOR_TEMPLATES),
);

function exactSupports(identity, major, g2Joint, g3Profile) {
  return Object.freeze({ identity, major, g2Joint, g3Profile });
}

// These support fractions are separately hand specified; they are not summed from
// the expanded posterior at runtime. Tests can therefore check both the 324 cells and
// these aggregate invariants against separate golden statements.
const TEMPLATE_SUPPORTS = Object.freeze({
  UNIFORM: exactSupports(rational(1n, 2n), rational(2n, 3n), rational(1n, 3n), rational(1n, 324n)),
  G1: exactSupports(rational(25n, 26n), rational(2n, 3n), rational(25n, 39n), rational(25n, 4212n)),
  G2: exactSupports(rational(25n, 26n), rational(50n, 51n), rational(625n, 663n), rational(625n, 71604n)),
  G2_SURFACE: exactSupports(rational(25n, 26n), rational(50n, 51n), rational(625n, 663n), rational(15625n, 644436n)),
  G2_STABILITY_SYSTEMIC: exactSupports(rational(25n, 26n), rational(50n, 51n), rational(625n, 663n), rational(625n, 644436n)),
  G3: exactSupports(rational(625n, 626n), rational(650n, 651n), rational(203125n, 203763n), rational(152587890625n, 208554690708n)),
  MAJOR_COUNTER: exactSupports(rational(25n, 26n), rational(10n, 11n), rational(125n, 143n), rational(125n, 15444n)),
  IDENTITY_COUNTER: exactSupports(rational(5n, 6n), rational(50n, 51n), rational(125n, 153n), rational(125n, 16524n)),
  SINGLE_MAJOR: exactSupports(rational(1n, 2n), rational(50n, 51n), rational(25n, 51n), rational(25n, 5508n)),
  MARGINAL_SPLICE: exactSupports(rational(19n, 25n), rational(19n, 25n), rational(13n, 25n), rational(13n, 2700n)),
});

function observation(object, region, method) {
  return Object.freeze({ object, region, method });
}

const OBSERVATION_COVERAGE = Object.freeze({
  "obs.current.whole": observation("OBJECT.FIRST", "whole-visible", "visual"),
  "obs.current.whole.without-repair-map": observation("OBJECT.FIRST", "whole-visible", "visual"),
  "obs.current.base": observation("OBJECT.FIRST", "base-and-inner", "visual"),
  "obs.corpus.identity": observation("OBJECT.FIRST", "manufacture-comparison", "corpus"),
  "obs.corpus.identity.repeat": observation("OBJECT.FIRST", "manufacture-comparison", "corpus"),
  "obs.object.continuity": observation("OBJECT.FIRST", "stable-anchors", "cross-time"),
  "obs.accident.major": observation("ARCHIVE.CANDIDATE.T2", "declared-record-group", "archive"),
  "obs.archive.t2.object-attribution": observation("RELATION.ARCHIVE_T2_OBJECT_FIRST", "stable-noncomposition-anchors", "object-attribution"),
  "obs.archive.t2.object-attribution-contested": observation("RELATION.ARCHIVE_T2_OBJECT_FIRST", "stable-noncomposition-anchors", "contested"),
  "obs.archive.t2.current-corroboration": observation("RELATION.ARCHIVE_T2_EVENT_OBJECT_FIRST", "declared-major-scope", "record-current"),
  "obs.appearance.restore": observation("OBJECT.FIRST", "declared-restored-zone", "visual"),
  "obs.single-glue-line.answer-key": observation("OBJECT.FIRST", "single-glue-line", "visual"),
  "obs.structure.major.physical": observation("OBJECT.FIRST", "declared-major-scope-multi-view-readable", "xray"),
  "obs.structure.xray.early": observation("OBJECT.FIRST", "declared-major-scope-multi-view-readable", "xray"),
  "obs.structure.major.cross-time": observation("OBJECT.FIRST", "declared-major-scope", "cross-time"),
  "obs.structure.major.documented-cross-time": observation("RELATION.ARCHIVE_T2_EVENT_OBJECT_FIRST", "declared-major-scope", "cross-time"),
  "obs.phase.t1": observation("OBJECT.FIRST", "declared-time-anchor", "archive"),
  "obs.phase.t3": observation("ARCHIVE.CANDIDATE.T3", "declared-treatment-records", "archive"),
  "obs.archive.t3.object-attribution": observation("RELATION.ARCHIVE_T3_OBJECT_FIRST", "stable-noncomposition-anchors", "object-attribution"),
  "obs.archive.t3.current-corroboration": observation("RELATION.ARCHIVE_T3_EVENT_OBJECT_FIRST", "declared-treatment-scope", "record-current"),
  "obs.key-material.substrate-readings": observation("OBJECT.FIRST", "declared-key-material-points", "point-analysis"),
  "obs.key-material.layer-sequence": observation("OBJECT.FIRST", "declared-layer-interface-points", "micro-layering"),
  "obs.surface.point-layering": observation("OBJECT.FIRST", "declared-surface-points", "layering"),
  "obs.surface.resolved": observation("OBJECT.FIRST", "declared-surface-regions", "regional-synthesis"),
  "obs.stability.resolved": observation("OBJECT.FIRST", "declared-load-paths-supported-static-display", "condition"),
  "obs.stability.bad-news": observation("OBJECT.FIRST", "declared-load-paths", "condition"),
  "obs.documentation.resolved": observation("OBJECT.FIRST", "declared-document-boundary", "archive"),
  "obs.surface.no-signal.unresolved": observation("OBJECT.FIRST", "declared-screen-zone", "uv-screen"),
  "obs.surface.bad-news": observation("OBJECT.FIRST", "declared-surface-scope", "layering"),
  "obs.counter.major.abstract": observation("OBJECT.FIRST", "necessary-major-scope", "capable-structural"),
  "obs.counter.major.out-of-scope": observation("OBJECT.FIRST", "nonnecessary-local-scope", "capable-structural"),
  "obs.counter.major.out-of-scope-with-factor": observation("OBJECT.FIRST", "nonnecessary-local-scope", "capable-structural"),
  "obs.counter.major.weakens": observation("OBJECT.FIRST", "necessary-major-scope", "capable-structural"),
  "obs.counter.major.bounds": observation("OBJECT.FIRST", "nonnecessary-local-scope", "capable-structural"),
  "obs.counter.major.logical-refutation": observation("OBJECT.FIRST", "necessary-major-scope", "capable-structural"),
  "obs.counter.identity.hard": observation("OBJECT.FIRST", "manufacture-identity-scope", "capable-identity"),
  "obs.counter.major.insufficient-capability": observation("OBJECT.FIRST", "necessary-major-scope", "limited-structural"),
  "obs.fixture.identity-proof-only": observation("OBJECT.FIRST", "manufacture-comparison", "fixture"),
  "obs.fixture.major-proof-only": observation("ARCHIVE.CANDIDATE.T2", "declared-record-group", "archive"),
  "obs.single-xray.answer-key": observation("OBJECT.FIRST", "single-read-zone", "xray"),
  "obs.single-document.answer-key": observation("ARCHIVE.CANDIDATE.T2", "single-document", "archive"),
});

const O = Object.freeze({
  whole: "obs.current.whole",
  wholeWithoutRepairMap: "obs.current.whole.without-repair-map",
  base: "obs.current.base",
  corpus: "obs.corpus.identity",
  corpusRepeat: "obs.corpus.identity.repeat",
  continuity: "obs.object.continuity",
  accident: "obs.accident.major",
  t2Attribution: "obs.archive.t2.object-attribution",
  t2AttributionContested: "obs.archive.t2.object-attribution-contested",
  documentedCurrent: "obs.archive.t2.current-corroboration",
  appearance: "obs.appearance.restore",
  glue: "obs.single-glue-line.answer-key",
  physicalMajor: "obs.structure.major.physical",
  xrayEarly: "obs.structure.xray.early",
  repairContinuity: "obs.structure.major.cross-time",
  documentedCrossTime: "obs.structure.major.documented-cross-time",
  t1: "obs.phase.t1",
  t3: "obs.phase.t3",
  t3Attribution: "obs.archive.t3.object-attribution",
  t3Current: "obs.archive.t3.current-corroboration",
  materialSubstrate: "obs.key-material.substrate-readings",
  materialLayer: "obs.key-material.layer-sequence",
  surfacePoint: "obs.surface.point-layering",
  surface: "obs.surface.resolved",
  stability: "obs.stability.resolved",
  stabilityBad: "obs.stability.bad-news",
  documentation: "obs.documentation.resolved",
  uvUnresolved: "obs.surface.no-signal.unresolved",
  surfaceBad: "obs.surface.bad-news",
  hardMajor: "obs.counter.major.abstract",
  outOfScopeMajor: "obs.counter.major.out-of-scope",
  outOfScopeMajorFactor: "obs.counter.major.out-of-scope-with-factor",
  weakMajor: "obs.counter.major.weakens",
  boundsMajor: "obs.counter.major.bounds",
  logicalMajor: "obs.counter.major.logical-refutation",
  hardIdentity: "obs.counter.identity.hard",
  insufficientMajor: "obs.counter.major.insufficient-capability",
  identityProof: "obs.fixture.identity-proof-only",
  majorProof: "obs.fixture.major-proof-only",
  singleXray: "obs.single-xray.answer-key",
  singleDocument: "obs.single-document.answer-key",
});

const CONTEXT_REQUIREMENTS = Object.freeze({
  [O.xrayEarly]: Object.freeze(["identityObjectContinuity"]),
  [O.t1]: Object.freeze(["identityObjectContinuity"]),
});

const PROOF_ROLE_IDS = Object.freeze({
  currentRepairMap: "PROOF.CURRENT.NAMED_REPAIR_MAP",
  t2RecordCoherence: "PROOF.ARCHIVE.T2.RECORD_COHERENCE",
  t2ObjectAttribution: "PROOF.ARCHIVE.T2.OBJECT_ATTRIBUTION",
  t2CurrentCorroboration: "PROOF.ARCHIVE.T2.EVENT_CURRENT_CORROBORATION",
  t2CrossTimeCorroboration: "PROOF.ARCHIVE.T2.EVENT_CROSS_TIME_CORROBORATION",
  t3RecordCoherence: "PROOF.ARCHIVE.T3.RECORD_COHERENCE",
  t3ObjectAttribution: "PROOF.ARCHIVE.T3.OBJECT_ATTRIBUTION",
  t3CurrentCorroboration: "PROOF.ARCHIVE.T3.EVENT_CURRENT_CORROBORATION",
  physicalStructureMap: "PROOF.MAJOR.PHYSICAL.STRUCTURE_MAP",
  physicalCrossTime: "PROOF.MAJOR.PHYSICAL.CROSS_TIME",
});

const OBSERVATION_PROOF_ROLES = Object.freeze({
  [O.whole]: Object.freeze([PROOF_ROLE_IDS.currentRepairMap]),
  [O.accident]: Object.freeze([PROOF_ROLE_IDS.t2RecordCoherence]),
  [O.t2Attribution]: Object.freeze([PROOF_ROLE_IDS.t2ObjectAttribution]),
  [O.documentedCurrent]: Object.freeze([PROOF_ROLE_IDS.t2CurrentCorroboration]),
  [O.documentedCrossTime]: Object.freeze([PROOF_ROLE_IDS.t2CrossTimeCorroboration]),
  [O.t3]: Object.freeze([PROOF_ROLE_IDS.t3RecordCoherence]),
  [O.t3Attribution]: Object.freeze([PROOF_ROLE_IDS.t3ObjectAttribution]),
  [O.t3Current]: Object.freeze([PROOF_ROLE_IDS.t3CurrentCorroboration]),
  [O.physicalMajor]: Object.freeze([PROOF_ROLE_IDS.physicalStructureMap]),
  [O.xrayEarly]: Object.freeze([PROOF_ROLE_IDS.physicalStructureMap]),
  [O.repairContinuity]: Object.freeze([PROOF_ROLE_IDS.physicalCrossTime]),
  [O.majorProof]: Object.freeze([PROOF_ROLE_IDS.t2RecordCoherence]),
});

const FACTS = Object.freeze({
  whole: Object.freeze(["currentBody", "currentDecor", "currentRepairMap", "interventionObservation"]),
  wholeWithoutRepairMap: Object.freeze(["currentBody", "currentDecor", "interventionObservation"]),
  base: Object.freeze(["baseManufacture"]),
  corpus: Object.freeze(["directionCorpus", "identityComparisonExclusion"]),
  corpusRepeat: Object.freeze(["directionCorpus", "identityComparisonExclusion", "repeatObservation"]),
  continuity: Object.freeze(["directionHistoricCandidate", "identityObjectContinuity"]),
  accident: Object.freeze([
    "t2RecordGroupCoherent",
    "t2RecordClaimsAppearanceRestore",
    "t2RecordClaimsDamageExtent",
    "t2RecordClaimsReassembly",
  ]),
  t2Attribution: Object.freeze(["t2ArchiveObjectAttribution", "t2ArchiveObjectLinkCandidate"]),
  t2AttributionContested: Object.freeze(["t2ArchiveObjectAttributionContested"]),
  documentedCurrent: Object.freeze(["appearanceRestore", "t2EventPhysicalCorrespondence"]),
  appearance: Object.freeze(["appearanceRestore"]),
  physicalMajor: Object.freeze(["currentStructureReadoutByRegion"]),
  xrayContextualized: Object.freeze(["xrayReadingsByRegionAcquired", "currentStructureReadoutByRegion"]),
  repairContinuity: Object.freeze(["crossTimeMajorChange"]),
  documentedCrossTime: Object.freeze(["appearanceRestore", "t2EventPhysicalCorrespondence"]),
  t1Contextualized: Object.freeze(["t1ReadingAcquired", "t1Established"]),
  t3: Object.freeze(["t3RecordGroupCoherent", "t3RecordClaimsLocalTreatment"]),
  t3Attribution: Object.freeze(["t3ArchiveObjectAttribution", "t3ArchiveObjectLinkCandidate"]),
  t3Current: Object.freeze(["t3EventPhysicalCorrespondence"]),
  materialSubstrate: Object.freeze(["keyMaterialSubstrateReadings"]),
  materialLayer: Object.freeze(["keyMaterialLayerSequenceReadings"]),
  surfacePoint: Object.freeze(["surfacePointLayering"]),
  surface: Object.freeze(["surfaceRegionalCoverage", "surfaceResolved"]),
  stability: Object.freeze(["displayConditionSpecified", "stabilityResolved"]),
  stabilityBad: Object.freeze(["stabilityBadNews"]),
  documentation: Object.freeze(["documentationBoundary", "documentationNoConflict"]),
  negativeRaw: Object.freeze(["negativeSignalObserved"]),
  negativeCapable: Object.freeze(["negativeSignalObserved", "scopedAbsenceSupported"]),
  surfaceBad: Object.freeze(["surfaceBadNews"]),
  glue: Object.freeze(["glueLineObserved"]),
  singleXray: Object.freeze(["xraySingleReadingAcquired"]),
  majorProof: Object.freeze([
    "t2RecordGroupCoherent",
    "t2RecordClaimsAppearanceRestore",
    "t2RecordClaimsDamageExtent",
    "t2RecordClaimsReassembly",
  ]),
  singleDocument: Object.freeze(["t2RecordClaimsAppearanceRestore", "t2RecordClaimsReassembly"]),
});

function factLedger(dependencyUnitId, sourceIds, {
  direct = Object.freeze([]),
  capability = Object.freeze([]),
  contextual = Object.freeze([]),
} = {}) {
  return Object.freeze({
    dependencyUnitId,
    sourceIds: Object.freeze([...sourceIds].sort()),
    direct,
    capability,
    contextual,
  });
}

// Active fact lanes and their provenance are a separately written expected ledger. In
// particular, capability-insufficient negatives have no capability-lane witness,
// while the two contextual readings below are expected to be contextualized in the
// only declared scenarios that contain them.
const OBSERVATION_FACT_LEDGER = Object.freeze({
  [O.whole]: factLedger("dep.fact.current-whole", ["source.physical.current"], { direct: FACTS.whole }),
  [O.wholeWithoutRepairMap]: factLedger(
    "dep.fact.current-whole-without-repair-map",
    ["source.physical.current"],
    { direct: FACTS.wholeWithoutRepairMap },
  ),
  [O.base]: factLedger("dep.fact.current-base", ["source.physical.current"], { direct: FACTS.base }),
  [O.corpus]: factLedger("dep.corpus.identity", ["source.corpus.set-01"], { direct: FACTS.corpus }),
  [O.corpusRepeat]: factLedger("dep.corpus.identity", ["source.corpus.set-01"], { direct: FACTS.corpusRepeat }),
  [O.continuity]: factLedger("dep.object.continuity", ["source.archive.image", "source.physical.current"], { direct: FACTS.continuity }),
  [O.accident]: factLedger(
    "dep.accident.major",
    ["source.event.accident.insurance", "source.event.accident.photo"],
    { direct: FACTS.accident },
  ),
  [O.t2Attribution]: factLedger(
    "dep.archive.t2.object-attribution",
    ["source.archive.t2.object-register", "source.physical.t2.stable-anchors"],
    { direct: FACTS.t2Attribution },
  ),
  [O.t2AttributionContested]: factLedger(
    "dep.archive.t2.object-attribution",
    ["source.archive.t2.conflicting-object-register"],
    { direct: FACTS.t2AttributionContested },
  ),
  [O.documentedCurrent]: factLedger(
    "dep.archive.t2.current-corroboration",
    ["source.archive.t2.repair-diagram", "source.physical.current-repair-map"],
    { direct: FACTS.documentedCurrent },
  ),
  [O.appearance]: factLedger("dep.fact.appearance-restore", ["source.physical.current"], { direct: FACTS.appearance }),
  [O.glue]: factLedger("dep.single-glue-line", ["source.physical.glue-line"], { direct: FACTS.glue }),
  [O.physicalMajor]: factLedger("dep.structure.major", ["source.instrument.structure"], { direct: FACTS.physicalMajor }),
  [O.xrayEarly]: factLedger("dep.structure.major", ["source.instrument.xray"], {
    direct: Object.freeze(["xrayReadingsByRegionAcquired"]),
    contextual: Object.freeze(["currentStructureReadoutByRegion"]),
  }),
  [O.repairContinuity]: factLedger(
    "dep.structure.major",
    ["source.archive.major-region-pre", "source.physical.major-region-current"],
    { direct: FACTS.repairContinuity },
  ),
  [O.documentedCrossTime]: factLedger(
    "dep.documented.cross-time",
    ["source.archive.major-region-pre", "source.physical.major-region-current"],
    { direct: FACTS.documentedCrossTime },
  ),
  [O.t1]: factLedger("dep.phase.t1", ["source.archive.pre-accident"], {
    direct: Object.freeze(["t1ReadingAcquired"]),
    contextual: Object.freeze(["t1Established"]),
  }),
  [O.t3]: factLedger(
    "dep.phase.t3",
    ["source.archive.t3.condition-report", "source.archive.t3.treatment-map"],
    { direct: FACTS.t3 },
  ),
  [O.t3Attribution]: factLedger(
    "dep.archive.t3.object-attribution",
    ["source.archive.t3.object-register", "source.physical.t3.stable-anchors"],
    { direct: FACTS.t3Attribution },
  ),
  [O.t3Current]: factLedger(
    "dep.archive.t3.current-corroboration",
    ["source.archive.t3.post-treatment-photo", "source.physical.t3.current-zone"],
    { direct: FACTS.t3Current },
  ),
  [O.materialSubstrate]: factLedger(
    "dep.key-material.resolved",
    ["source.analysis.substrate-points"],
    { direct: FACTS.materialSubstrate },
  ),
  [O.materialLayer]: factLedger(
    "dep.key-material.resolved",
    ["source.inspection.layer-interface-points"],
    { direct: FACTS.materialLayer },
  ),
  [O.surfacePoint]: factLedger(
    "dep.surface.resolved",
    ["source.inspection.layer.point-set"],
    { direct: FACTS.surfacePoint },
  ),
  [O.surface]: factLedger(
    "dep.surface.resolved",
    ["source.inspection.layer.point-set", "source.surface.region-map"],
    { direct: FACTS.surface },
  ),
  [O.stability]: factLedger("dep.stability.resolved", ["source.assessment.condition"], { direct: FACTS.stability }),
  [O.stabilityBad]: factLedger("dep.stability.bad-news", ["source.assessment.bad-news"], { direct: FACTS.stabilityBad }),
  [O.documentation]: factLedger("dep.documentation.resolved", ["source.archive.chain"], { direct: FACTS.documentation }),
  [O.uvUnresolved]: factLedger("dep.surface.no-signal", ["source.instrument.screen"], { direct: FACTS.negativeRaw }),
  [O.surfaceBad]: factLedger("dep.surface.bad-news", ["source.inspection.surface"], { direct: FACTS.surfaceBad }),
  [O.hardMajor]: factLedger("dep.counter.major.abstract", ["source.method.capable-structural"], {
    direct: FACTS.negativeRaw,
    capability: Object.freeze(["scopedAbsenceSupported"]),
  }),
  [O.outOfScopeMajor]: factLedger("dep.counter.major.out-of-scope", ["source.method.capable-local"], {
    direct: FACTS.negativeRaw,
    capability: Object.freeze(["scopedAbsenceSupported"]),
  }),
  [O.outOfScopeMajorFactor]: factLedger("dep.counter.major.out-of-scope-with-factor", ["source.method.capable-local-factor"], {
    direct: FACTS.negativeRaw,
    capability: Object.freeze(["scopedAbsenceSupported"]),
  }),
  [O.weakMajor]: factLedger("dep.counter.major.weakens", ["source.method.weak-major"], {
    direct: FACTS.negativeRaw,
    capability: Object.freeze(["scopedAbsenceSupported"]),
  }),
  [O.boundsMajor]: factLedger("dep.counter.major.bounds", ["source.method.bounds-major"], {
    direct: FACTS.negativeRaw,
    capability: Object.freeze(["scopedAbsenceSupported"]),
  }),
  [O.logicalMajor]: factLedger("dep.counter.major.logical-refutation", ["source.method.logical-major"], {
    direct: FACTS.negativeRaw,
    capability: Object.freeze(["scopedAbsenceSupported"]),
  }),
  [O.hardIdentity]: factLedger("dep.counter.identity.hard", ["source.method.capable-identity"], {
    direct: FACTS.negativeRaw,
    capability: Object.freeze(["scopedAbsenceSupported"]),
  }),
  [O.insufficientMajor]: factLedger("dep.counter.major.insufficient-capability", ["source.method.insufficient-structural"], { direct: FACTS.negativeRaw }),
  [O.identityProof]: factLedger("dep.fixture.identity-proof", ["source.fixture.identity"], { direct: FACTS.corpus }),
  [O.majorProof]: factLedger(
    "dep.fixture.major-proof",
    ["source.event.accident.insurance", "source.event.accident.photo"],
    { direct: FACTS.majorProof },
  ),
  [O.singleXray]: factLedger("dep.single-xray", ["source.instrument.single-xray"], { direct: FACTS.singleXray }),
  [O.singleDocument]: factLedger(
    "dep.single-document",
    ["source.event.single-document"],
    { direct: FACTS.singleDocument },
  ),
});

function unionSorted(...groups) {
  return Object.freeze([...new Set(groups.flat())].sort());
}

const OBS_G1 = Object.freeze([O.whole, O.base, O.corpus]);
const OBS_G2 = Object.freeze([
  ...OBS_G1,
  O.accident,
  O.t2Attribution,
  O.documentedCurrent,
]);
const FACTS_G1 = unionSorted(FACTS.whole, FACTS.base, FACTS.corpus);
const FACTS_G2 = unionSorted(
  FACTS_G1,
  FACTS.accident,
  FACTS.t2Attribution,
  FACTS.documentedCurrent,
);

function claimLedger({
  g1 = false,
  identity = false,
  identityContested = false,
  identityLogicallyRefuted = false,
  major = false,
  majorContested = false,
  majorLogicallyRefuted = false,
  threePhase = false,
  coherent = false,
} = {}) {
  return Object.freeze({
    g1: Object.freeze({ established: g1 }),
    identity: Object.freeze({
      established: identity,
      contested: identityContested,
      logicallyRefuted: identityLogicallyRefuted,
    }),
    majorReassembly: Object.freeze({
      established: major,
      contested: majorContested,
      logicallyRefuted: majorLogicallyRefuted,
    }),
    threePhase: Object.freeze({ established: threePhase }),
    coherentDecisionProfile: Object.freeze({ established: coherent }),
  });
}

const CLAIMS = Object.freeze({
  NONE: claimLedger(),
  G1_IDENTITY: claimLedger({ g1: true, identity: true }),
  G1_IDENTITY_MAJOR: claimLedger({ g1: true, identity: true, major: true }),
  G2: claimLedger({ g1: true, identity: true, major: true }),
  G3: claimLedger({ g1: true, identity: true, major: true, threePhase: true, coherent: true }),
  HARD_MAJOR: claimLedger({ g1: true, identity: true, majorContested: true }),
  LOGICAL_MAJOR: claimLedger({ g1: true, identity: true, majorLogicallyRefuted: true }),
  HARD_IDENTITY: claimLedger({ g1: true, identityContested: true, major: true }),
});

const MAJOR_REQUIRED_SCOPE = Object.freeze({
  object: "OBJECT.FIRST",
  region: "necessary-major-scope",
  time: "T2",
  materialLayer: "structural-substrate",
  quantifier: "necessary-condition",
});
const MAJOR_LOCAL_NECESSARY_SCOPE = Object.freeze({
  object: "OBJECT.FIRST",
  region: "nonnecessary-local-scope",
  time: "T2",
  materialLayer: "structural-substrate",
  quantifier: "necessary-condition",
});
const MAJOR_LOCAL_EXISTENTIAL_SCOPE = Object.freeze({
  object: "OBJECT.FIRST",
  region: "nonnecessary-local-scope",
  time: "T2",
  materialLayer: "structural-substrate",
  quantifier: "existential-local",
});
const IDENTITY_REQUIRED_SCOPE = Object.freeze({
  object: "OBJECT.FIRST",
  region: "manufacture-identity-scope",
  time: "manufacture",
  materialLayer: "ceramic-body-glaze",
  quantifier: "necessary-condition",
});

function conflict(observationId, declaredRelation, relation, scopeMatch, targetClaim, scope) {
  return Object.freeze({
    observationId,
    blocking: ["hard-counterevidence", "logical-refutation"].includes(relation) && scopeMatch,
    declaredRelation,
    relation,
    scopeMatch,
    targetClaim,
    scope,
  });
}

const CONFLICTS = Object.freeze({
  HARD_MAJOR: Object.freeze([conflict(O.hardMajor, "hard-counterevidence", "hard-counterevidence", true, "CLAIM.REPAIR.MAJOR_REASSEMBLY", MAJOR_REQUIRED_SCOPE)]),
  OUT_OF_SCOPE_MAJOR: Object.freeze([conflict(O.outOfScopeMajor, "hard-counterevidence", "bounds/refines", false, "CLAIM.REPAIR.MAJOR_REASSEMBLY", MAJOR_LOCAL_NECESSARY_SCOPE)]),
  OUT_OF_SCOPE_MAJOR_FACTOR: Object.freeze([conflict(O.outOfScopeMajorFactor, "hard-counterevidence", "bounds/refines", false, "CLAIM.REPAIR.MAJOR_REASSEMBLY", MAJOR_LOCAL_NECESSARY_SCOPE)]),
  WEAK_MAJOR: Object.freeze([conflict(O.weakMajor, "weakens", "weakens", true, "CLAIM.REPAIR.MAJOR_REASSEMBLY", MAJOR_REQUIRED_SCOPE)]),
  BOUNDS_MAJOR: Object.freeze([conflict(O.boundsMajor, "bounds/refines", "bounds/refines", false, "CLAIM.REPAIR.MAJOR_REASSEMBLY", MAJOR_LOCAL_EXISTENTIAL_SCOPE)]),
  LOGICAL_MAJOR: Object.freeze([conflict(O.logicalMajor, "logical-refutation", "logical-refutation", true, "CLAIM.REPAIR.MAJOR_REASSEMBLY", MAJOR_REQUIRED_SCOPE)]),
  HARD_IDENTITY: Object.freeze([conflict(O.hardIdentity, "hard-counterevidence", "hard-counterevidence", true, "CLAIM.IDENTITY.LATE18_EXPORT", IDENTITY_REQUIRED_SCOPE)]),
});

function scenario(template, stage, claims, observationIds, facts, {
  conflicts = Object.freeze([]),
  unknowns = Object.freeze([]),
  playerChoice = "CONTINUE",
} = {}) {
  return Object.freeze({
    template,
    stage,
    claims,
    observationIds: Object.freeze(observationIds),
    facts: Object.freeze(facts),
    conflicts,
    unknowns,
    playerChoice,
  });
}

const CAPABLE_COUNTER_FACTS = unionSorted(FACTS_G2, FACTS.negativeCapable);

const SCENARIO_GOLDENS = Object.freeze({
  "g1-oriented": scenario("G1", "G1", CLAIMS.G1_IDENTITY, OBS_G1, FACTS_G1),
  "archive-candidate-early-local-value": scenario(
    "G2",
    "G1",
    CLAIMS.G1_IDENTITY,
    [...OBS_G1, O.accident],
    unionSorted(FACTS_G1, FACTS.accident),
  ),
  "archive-attribution-contested-not-promoted": scenario(
    "G2",
    "G1",
    CLAIMS.G1_IDENTITY,
    [...OBS_G1, O.accident, O.t2AttributionContested],
    unionSorted(FACTS_G1, FACTS.accident, FACTS.t2AttributionContested),
  ),
  "g2-documented-stop": scenario("G2", "G2", CLAIMS.G2, OBS_G2, FACTS_G2, { playerChoice: "STOP" }),
  "g2-documented-cross-time-or": scenario(
    "G2",
    "G2",
    CLAIMS.G2,
    [
      O.wholeWithoutRepairMap,
      O.base,
      O.corpus,
      O.accident,
      O.t2Attribution,
      O.documentedCrossTime,
    ],
    unionSorted(
      FACTS.wholeWithoutRepairMap,
      FACTS.base,
      FACTS.corpus,
      FACTS.accident,
      FACTS.t2Attribution,
      FACTS.documentedCrossTime,
    ),
  ),
  "g2-continue-no-progress": scenario(
    "G2",
    "G2",
    CLAIMS.G2,
    [...OBS_G2, O.corpusRepeat, O.uvUnresolved],
    unionSorted(FACTS_G2, FACTS.corpusRepeat, FACTS.negativeRaw),
  ),
  "g2-alternate-physical": scenario(
    "G2",
    "G2",
    CLAIMS.G2,
    [O.whole, O.base, O.continuity, O.appearance, O.physicalMajor, O.repairContinuity],
    unionSorted(
      FACTS.whole,
      FACTS.base,
      FACTS.continuity,
      FACTS.appearance,
      FACTS.physicalMajor,
      FACTS.repairContinuity,
    ),
  ),
  "professional-evidence-early": scenario(
    "G2",
    "G2",
    CLAIMS.G2,
    [O.whole, O.base, O.continuity, O.appearance, O.xrayEarly, O.repairContinuity],
    unionSorted(
      FACTS.whole,
      FACTS.base,
      FACTS.continuity,
      FACTS.appearance,
      FACTS.xrayContextualized,
      FACTS.repairContinuity,
    ),
  ),
  "g3-with-allowed-unknowns": scenario(
    "G3",
    "G3",
    CLAIMS.G3,
    [
      ...OBS_G2,
      O.continuity,
      O.t1,
      O.t3,
      O.t3Attribution,
      O.t3Current,
      O.materialSubstrate,
      O.materialLayer,
      O.surfacePoint,
      O.surface,
      O.stability,
      O.documentation,
    ],
    unionSorted(
      FACTS_G2,
      FACTS.continuity,
      FACTS.t1Contextualized,
      FACTS.t3,
      FACTS.t3Attribution,
      FACTS.t3Current,
      FACTS.materialSubstrate,
      FACTS.materialLayer,
      FACTS.surfacePoint,
      FACTS.surface,
      FACTS.stability,
      FACTS.documentation,
    ),
    { unknowns: Object.freeze(["exact-treatment-formula", "noncritical-region"]) },
  ),
  "g2-surface-bad-news-stable": scenario(
    "G2_SURFACE",
    "G2",
    CLAIMS.G2,
    [...OBS_G2, O.surfaceBad],
    unionSorted(FACTS_G2, FACTS.surfaceBad),
  ),
  "g2-stability-bad-news-stable": scenario(
    "G2_STABILITY_SYSTEMIC",
    "G2",
    CLAIMS.G2,
    [...OBS_G2, O.stabilityBad],
    unionSorted(FACTS_G2, FACTS.stabilityBad),
  ),
  "g2-hard-counter-downgrade": scenario(
    "MAJOR_COUNTER",
    "G1",
    CLAIMS.HARD_MAJOR,
    [...OBS_G2, O.hardMajor],
    CAPABLE_COUNTER_FACTS,
    { conflicts: CONFLICTS.HARD_MAJOR },
  ),
  "g2-out-of-scope-counter-stable": scenario(
    "G2",
    "G2",
    CLAIMS.G2,
    [...OBS_G2, O.outOfScopeMajor],
    CAPABLE_COUNTER_FACTS,
    { conflicts: CONFLICTS.OUT_OF_SCOPE_MAJOR },
  ),
  "g2-out-of-scope-factor-stable": scenario(
    "G2",
    "G2",
    CLAIMS.G2,
    [...OBS_G2, O.outOfScopeMajorFactor],
    CAPABLE_COUNTER_FACTS,
    { conflicts: CONFLICTS.OUT_OF_SCOPE_MAJOR_FACTOR },
  ),
  "g2-major-weakened-stable": scenario(
    "MAJOR_COUNTER",
    "G2",
    CLAIMS.G2,
    [...OBS_G2, O.weakMajor],
    CAPABLE_COUNTER_FACTS,
    { conflicts: CONFLICTS.WEAK_MAJOR },
  ),
  "g2-major-bounded-stable": scenario(
    "G2",
    "G2",
    CLAIMS.G2,
    [...OBS_G2, O.boundsMajor],
    CAPABLE_COUNTER_FACTS,
    { conflicts: CONFLICTS.BOUNDS_MAJOR },
  ),
  "g2-logical-counter-downgrade": scenario(
    "MAJOR_COUNTER",
    "G1",
    CLAIMS.LOGICAL_MAJOR,
    [...OBS_G2, O.logicalMajor],
    CAPABLE_COUNTER_FACTS,
    { conflicts: CONFLICTS.LOGICAL_MAJOR },
  ),
  "g2-identity-hard-counter-downgrade": scenario(
    "IDENTITY_COUNTER",
    "G1",
    CLAIMS.HARD_IDENTITY,
    [...OBS_G2, O.hardIdentity],
    CAPABLE_COUNTER_FACTS,
    { conflicts: CONFLICTS.HARD_IDENTITY },
  ),
  "g2-insufficient-counter-unresolved": scenario(
    "G2",
    "G2",
    CLAIMS.G2,
    [...OBS_G2, O.insufficientMajor],
    unionSorted(FACTS_G2, FACTS.negativeRaw),
  ),
  "marginal-splice-rejected": scenario(
    "MARGINAL_SPLICE",
    "G1",
    CLAIMS.G1_IDENTITY_MAJOR,
    [
      O.whole,
      O.base,
      O.identityProof,
      O.majorProof,
      O.t2Attribution,
      O.documentedCurrent,
    ],
    unionSorted(
      FACTS.whole,
      FACTS.base,
      FACTS.corpus,
      FACTS.majorProof,
      FACTS.t2Attribution,
      FACTS.documentedCurrent,
    ),
  ),
  "single-test-answer-key-rejected": scenario(
    "SINGLE_MAJOR",
    "NONE",
    CLAIMS.NONE,
    [O.singleXray],
    FACTS.singleXray,
  ),
  "near-complete-single-instrument-rejected": scenario(
    "G2",
    "G1",
    CLAIMS.G1_IDENTITY,
    [O.whole, O.base, O.corpus, O.appearance, O.singleXray],
    unionSorted(FACTS.whole, FACTS.base, FACTS.corpus, FACTS.appearance, FACTS.singleXray),
  ),
  "near-complete-single-glue-line-rejected": scenario(
    "G1",
    "G1",
    CLAIMS.G1_IDENTITY,
    [O.whole, O.base, O.corpus, O.glue],
    unionSorted(FACTS_G1, FACTS.glue),
  ),
  "single-document-answer-key-rejected": scenario(
    "G2",
    "G1",
    CLAIMS.G1_IDENTITY,
    [O.whole, O.base, O.corpus, O.singleDocument],
    unionSorted(FACTS_G1, FACTS.singleDocument),
  ),
});

export const GOLDEN_SCENARIO_IDS = Object.freeze(Object.keys(SCENARIO_GOLDENS));

export const GOLDEN_G3_UNKNOWN_POLICY = Object.freeze({
  allowed: Object.freeze(["exact-treatment-formula", "noncritical-region"]),
  blocking: Object.freeze([
    "documentation-conflict",
    "identity-whether-late18",
    "key-material-core-regions",
    "load-path-stability",
    "surface-decision-boundary",
    "three-phase-relation",
  ]),
});

function stateSpace() {
  const output = [];
  function visit(axisIndex, values) {
    if (axisIndex === GOLDEN_AXIS_ORDER.length) {
      output.push(Object.freeze({
        values: Object.freeze([...values]),
        stateId: values.join("|"),
      }));
      return;
    }
    const axis = GOLDEN_AXIS_ORDER[axisIndex];
    for (const value of GOLDEN_AXES[axis]) visit(axisIndex + 1, [...values, value]);
  }
  visit(0, []);
  return Object.freeze(output);
}

export const GOLDEN_STATE_SPACE = stateSpace();

function expandPosterior(template) {
  return Object.freeze(GOLDEN_STATE_SPACE.map((state) => {
    let exact;
    if (template.kind === "product") {
      exact = multiply(...state.values.map((value, axisIndex) => {
        const axis = GOLDEN_AXIS_ORDER[axisIndex];
        return template.vectors[axisIndex][GOLDEN_AXES[axis].indexOf(value)];
      }));
    } else {
      const identityIndex = GOLDEN_AXES.Identity.indexOf(state.values[0]);
      const repairIndex = GOLDEN_AXES.RepairHistory.indexOf(state.values[1]);
      exact = multiply(
        template.jointIdentityRepair[identityIndex][repairIndex],
        ...state.values.slice(2).map((value, offset) => {
          const axisIndex = offset + 2;
          const axis = GOLDEN_AXIS_ORDER[axisIndex];
          return template.remainingVectors[offset][GOLDEN_AXES[axis].indexOf(value)];
        }),
      );
    }
    return Object.freeze({
      stateId: state.stateId,
      exact,
      probability: goldenRationalToNumber(exact),
    });
  }));
}

function numericSupports(exact) {
  return Object.freeze(Object.fromEntries(
    Object.entries(exact).map(([key, value]) => [key, goldenRationalToNumber(value)]),
  ));
}

function projectedProofWitnesses(facts) {
  const available = (...candidateFacts) => candidateFacts.filter((fact) => facts.includes(fact)).sort();
  return Object.freeze({
    g1: Object.freeze({
      currentBody: Object.freeze(available("currentBody")),
      currentDecorOrBaseManufacture: Object.freeze(available("baseManufacture", "currentDecor")),
      direction: Object.freeze(available("directionCorpus", "directionHistoricCandidate")),
      intervention: Object.freeze(available("interventionObservation")),
    }),
    identity: Object.freeze({
      currentObject: Object.freeze(available("baseManufacture", "currentBody")),
      path: Object.freeze(available("identityComparisonExclusion", "identityObjectContinuity")),
    }),
    majorReassembly: Object.freeze({
      currentRepairMap: Object.freeze(available("currentRepairMap")),
      documentedCrossTime: Object.freeze(available("t2EventPhysicalCorrespondence")),
      documentedSourceGroup: Object.freeze(
        available("t2RecordClaimsDamageExtent", "t2RecordClaimsReassembly"),
      ),
      physicalCrossTime: Object.freeze(available("crossTimeMajorChange")),
      physicalStructureMap: Object.freeze(available("currentStructureReadoutByRegion")),
    }),
    appearanceRestore: Object.freeze(available("appearanceRestore")),
    threePhase: Object.freeze({
      t1: Object.freeze(available("t1Established")),
      t2: Object.freeze(available(
        "t2ArchiveObjectAttribution",
        "t2EventPhysicalCorrespondence",
        "t2RecordGroupCoherent",
      )),
      t3: Object.freeze(available(
        "t3ArchiveObjectAttribution",
        "t3EventPhysicalCorrespondence",
        "t3RecordGroupCoherent",
      )),
    }),
    coherentDecisionProfile: Object.freeze({
      documentation: Object.freeze(available("documentationBoundary", "documentationNoConflict")),
      keyMaterial: Object.freeze(available(
        "keyMaterialLayerSequenceReadings",
        "keyMaterialSubstrateReadings",
      )),
      stability: Object.freeze(available("displayConditionSpecified", "stabilityResolved")),
      surface: Object.freeze(available(
        "surfacePointLayering",
        "surfaceRegionalCoverage",
        "surfaceResolved",
      )),
    }),
  });
}

function projectedFactLedger(spec) {
  const laneSets = {
    direct: new Set(),
    capability: new Set(),
    contextual: new Set(),
  };
  const witnesses = new Map();
  for (const observationId of spec.observationIds) {
    const entry = OBSERVATION_FACT_LEDGER[observationId];
    if (!entry) throw new Error(`Golden observation lacks fact ledger: ${observationId}`);
    for (const lane of ["direct", "capability", "contextual"]) {
      for (const fact of entry[lane]) {
        laneSets[lane].add(fact);
        const prior = witnesses.get(fact) ?? [];
        prior.push(Object.freeze({
          dependencyUnitId: entry.dependencyUnitId,
          observationId,
          sourceIds: entry.sourceIds,
        }));
        witnesses.set(fact, prior);
      }
    }
  }
  const projectedFacts = [...new Set(Object.values(laneSets).flatMap((values) => [...values]))].sort();
  if (JSON.stringify(projectedFacts) !== JSON.stringify(spec.facts)) {
    throw new Error(`Golden fact ledger disagrees with scenario facts: ${projectedFacts.join(",")}`);
  }
  const factWitnesses = Object.freeze(Object.fromEntries(
    [...witnesses.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([fact, entries]) => [
        fact,
        Object.freeze(entries.sort((left, right) => left.observationId.localeCompare(right.observationId))),
      ]),
  ));
  const contextActivationWitnesses = Object.freeze(Object.fromEntries(
    spec.observationIds
      .filter((observationId) => CONTEXT_REQUIREMENTS[observationId])
      .sort()
      .map((observationId) => {
        const requiredFacts = CONTEXT_REQUIREMENTS[observationId];
        return [
          observationId,
          Object.freeze({
            requiredFacts,
            witnesses: Object.freeze(Object.fromEntries(
              requiredFacts.map((fact) => [fact, factWitnesses[fact] ?? Object.freeze([])]),
            )),
          }),
        ];
      }),
  ));
  return Object.freeze({
    contextActivationWitnesses,
    factLanes: Object.freeze(Object.fromEntries(
      Object.entries(laneSets).map(([lane, values]) => [lane, Object.freeze([...values].sort())]),
    )),
    factWitnesses,
    proofWitnesses: projectedProofWitnesses(spec.facts),
  });
}

function goldenArchiveRelationships(facts, hasRole) {
  const status = ({ contested = false, established = false, suggestive = false }) => {
    if (contested) return "contested";
    if (established) return "established";
    if (suggestive) return "suggestive";
    return "unresolved";
  };
  const hasFact = (fact) => facts.includes(fact);
  const t2 = Object.freeze({
    eventCorroboration: status({
      contested: hasFact("t2EventPhysicalCorrespondenceContested"),
      established:
        hasRole(PROOF_ROLE_IDS.t2CurrentCorroboration) ||
        hasRole(PROOF_ROLE_IDS.t2CrossTimeCorroboration),
      suggestive:
        hasFact("currentRepairMap") ||
        hasFact("currentStructureReadoutByRegion") ||
        hasFact("t2EventPhysicalCorrespondence"),
    }),
    objectAttribution: status({
      contested: hasFact("t2ArchiveObjectAttributionContested"),
      established: hasRole(PROOF_ROLE_IDS.t2ObjectAttribution),
      suggestive: hasFact("t2ArchiveObjectLinkCandidate"),
    }),
    recordCoherence: status({
      contested: hasFact("t2ArchiveRecordCoherenceContested"),
      established: hasRole(PROOF_ROLE_IDS.t2RecordCoherence),
      suggestive:
        hasFact("t2RecordClaimsDamageExtent") || hasFact("t2RecordClaimsReassembly"),
    }),
  });
  const t3 = Object.freeze({
    eventCorroboration: status({
      contested: hasFact("t3EventPhysicalCorrespondenceContested"),
      established: hasRole(PROOF_ROLE_IDS.t3CurrentCorroboration),
      suggestive: hasFact("t3EventPhysicalCorrespondence") || hasFact("stabilityResolved"),
    }),
    objectAttribution: status({
      contested: hasFact("t3ArchiveObjectAttributionContested"),
      established: hasRole(PROOF_ROLE_IDS.t3ObjectAttribution),
      suggestive: hasFact("t3ArchiveObjectLinkCandidate"),
    }),
    recordCoherence: status({
      contested: hasFact("t3ArchiveRecordCoherenceContested"),
      established: hasRole(PROOF_ROLE_IDS.t3RecordCoherence),
      suggestive: hasFact("t3RecordClaimsLocalTreatment"),
    }),
  });
  const allEstablished = (questions) =>
    Object.values(questions).every((questionStatus) => questionStatus === "established");
  return Object.freeze({
    t2: Object.freeze({ ...t2, systemAttributionEstablished: allEstablished(t2) }),
    t3: Object.freeze({ ...t3, systemAttributionEstablished: allEstablished(t3) }),
  });
}

function coverageLedger(spec) {
  const projectedFacts = projectedFactLedger(spec);
  const proofRoleWitnesses = Object.freeze(Object.fromEntries(
    spec.observationIds
      .flatMap((observationId) =>
        (OBSERVATION_PROOF_ROLES[observationId] ?? []).map((roleId) => ({
          observationId,
          roleId,
        })),
      )
      .reduce((groups, entry) => {
        const prior = groups.get(entry.roleId) ?? [];
        const factLedger = OBSERVATION_FACT_LEDGER[entry.observationId];
        prior.push(Object.freeze({
          coverage: OBSERVATION_COVERAGE[entry.observationId],
          dependencyUnitId: factLedger.dependencyUnitId,
          observationId: entry.observationId,
          sourceIds: factLedger.sourceIds,
        }));
        groups.set(entry.roleId, prior);
        return groups;
      }, new Map())
      .entries(),
  ));
  const normalizedProofRoleWitnesses = Object.freeze(Object.fromEntries(
    [...Object.entries(proofRoleWitnesses)]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([roleId, entries]) => [
        roleId,
        Object.freeze(
          entries.sort((left, right) => left.observationId.localeCompare(right.observationId)),
        ),
      ]),
  ));
  const hasRole = (roleId) => (normalizedProofRoleWitnesses[roleId] ?? []).length > 0;
  return Object.freeze({
    ...projectedFacts,
    archiveRelations: goldenArchiveRelationships(spec.facts, hasRole),
    facts: spec.facts,
    g3BlockingUnknowns: Object.freeze([]),
    majorProofPaths: Object.freeze({
      documented:
        hasRole(PROOF_ROLE_IDS.t2RecordCoherence) &&
        hasRole(PROOF_ROLE_IDS.t2ObjectAttribution) &&
        (hasRole(PROOF_ROLE_IDS.t2CurrentCorroboration) ||
          hasRole(PROOF_ROLE_IDS.t2CrossTimeCorroboration)),
      physical:
        hasRole(PROOF_ROLE_IDS.currentRepairMap) &&
        hasRole(PROOF_ROLE_IDS.physicalStructureMap) &&
        hasRole(PROOF_ROLE_IDS.physicalCrossTime),
    }),
    unknowns: spec.unknowns,
    observations: Object.freeze([...spec.observationIds]
      .sort()
      .map((observationId) => {
        const coverage = OBSERVATION_COVERAGE[observationId];
        if (!coverage) throw new Error(`Golden observation lacks coverage: ${observationId}`);
        return Object.freeze({ observationId, coverage });
      })),
    proofRoleWitnesses: normalizedProofRoleWitnesses,
  });
}

/**
 * Expands one named scenario into the declared runtime-separated golden projection.
 *
 * `posterior` always has exactly 324 cells in GOLDEN_STATE_SPACE order. Every cell
 * carries both a BigInt rational (`exact`) and its numeric projection (`probability`).
 * `exactSupports` is separately hand authored rather than derived from those cells.
 */
export function expandScenarioGolden(scenarioName) {
  const spec = SCENARIO_GOLDENS[scenarioName];
  if (!spec) throw new Error(`Unknown golden scenario: ${scenarioName}`);
  const template = POSTERIOR_TEMPLATES[spec.template];
  const exact = TEMPLATE_SUPPORTS[spec.template];
  return Object.freeze({
    scenarioName,
    templateId: template.id,
    posterior: expandPosterior(template),
    exactSupports: exact,
    supports: numericSupports(exact),
    claims: spec.claims,
    conflicts: spec.conflicts,
    coverage: coverageLedger(spec),
    stage: spec.stage,
    stopping: Object.freeze({
      frozenStage: spec.playerChoice === "STOP" ? spec.stage : null,
      playerChoice: spec.playerChoice,
      systemAutoEnded: false,
    }),
  });
}

// Exported only for audit visibility; scenario expansion remains the normal API.
export function goldenPosteriorMass(posterior) {
  return posterior.reduce((total, entry) => add(total, entry.exact), rational(0n));
}
