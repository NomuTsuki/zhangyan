import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  STATE_SPACE,
  ModelConflict,
  assertSessionCanAcceptEvidence,
  projectPosterior,
  solveFixture,
} from "./solver.mjs";
import {
  FixtureContractError,
  PROOF_ROLES,
  conflictingDependencyEvents,
  events,
  eventsForOrder,
  scenarioById,
  scenarios,
} from "./fixtures.mjs";
import {
  GOLDEN_G3_UNKNOWN_POLICY,
  GOLDEN_SCENARIO_IDS,
  GOLDEN_STATE_SPACE,
  expandScenarioGolden,
  goldenPosteriorMass,
} from "./golden.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const NUMERIC_TOLERANCE = 1e-12;
const GOLDEN_CELL_TOLERANCE = 5e-15;
const GOLDEN_MASS_TOLERANCE = 5e-13;

function solveScenario(id, orderIndex = 0) {
  const scenario = scenarioById[id];
  return solveFixture(scenario, eventsForOrder(scenario, scenario.orders[orderIndex]));
}

function assertClose(actual, expected, message) {
  assert.ok(
    Math.abs(actual - expected) <= NUMERIC_TOLERANCE,
    `${message}: expected ${expected}, got ${actual}`,
  );
}

function assertNumericRecordClose(actual, expected, message) {
  assert.deepEqual(Object.keys(actual), Object.keys(expected), `${message}: keys`);
  for (const key of Object.keys(actual)) {
    assertClose(actual[key], expected[key], `${message}: ${key}`);
  }
}

function hasReason(error, reason) {
  return error instanceof ModelConflict && error.reason === reason;
}

function assertScenarioMatchesRuntimeSeparatedGolden(scenario, order) {
  const actual = solveFixture(scenario, eventsForOrder(scenario, order));
  const golden = expandScenarioGolden(scenario.id);
  const goldenByStateId = new Map(
    golden.posterior.map((entry) => [entry.stateId, entry]),
  );

  assert.equal(actual.posterior.length, 324, `${scenario.id}: actual state count`);
  assert.equal(golden.posterior.length, 324, `${scenario.id}: golden state count`);
  assert.equal(
    new Set(actual.posterior.map((entry) => entry.stateId)).size,
    324,
    `${scenario.id}: actual state IDs`,
  );
  assert.equal(goldenByStateId.size, 324, `${scenario.id}: golden state IDs`);

  let actualMass = 0;
  for (const actualEntry of actual.posterior) {
    const expectedEntry = goldenByStateId.get(actualEntry.stateId);
    assert.ok(expectedEntry, `${scenario.id}: missing golden state ${actualEntry.stateId}`);
    assert.ok(actualEntry.probability >= 0, `${scenario.id}: negative ${actualEntry.stateId}`);
    assert.ok(
      Math.abs(actualEntry.probability - expectedEntry.probability) <= GOLDEN_CELL_TOLERANCE,
      `${scenario.id}: ${actualEntry.stateId}; expected ${expectedEntry.probability}, got ${actualEntry.probability}`,
    );
    actualMass += actualEntry.probability;
  }
  assert.ok(
    Math.abs(actualMass - 1) <= GOLDEN_MASS_TOLERANCE,
    `${scenario.id}: actual posterior mass ${actualMass}`,
  );
  const goldenMass = goldenPosteriorMass(golden.posterior);
  assert.equal(
    goldenMass.numerator,
    goldenMass.denominator,
    `${scenario.id}: exact golden posterior mass`,
  );

  for (const key of Object.keys(golden.supports)) {
    assert.ok(
      Math.abs(actual.supports[key] - golden.supports[key]) <= GOLDEN_MASS_TOLERANCE,
      `${scenario.id}: support ${key}; expected ${golden.supports[key]}, got ${actual.supports[key]}`,
    );
  }
  assert.deepEqual(actual.claims, golden.claims, `${scenario.id}: claims`);
  assert.deepEqual(actual.conflicts, golden.conflicts, `${scenario.id}: conflicts`);
  assert.deepEqual(actual.coverage, golden.coverage, `${scenario.id}: coverage`);
  assert.equal(actual.stage, golden.stage, `${scenario.id}: stage`);
  assert.deepEqual(actual.stopping, golden.stopping, `${scenario.id}: stopping`);
}

test("frozen manifest sources match exact SHA-256 inputs", async () => {
  const manifest = JSON.parse(await readFile(resolve(here, "manifest.json"), "utf8"));
  assert.equal(manifest.status, "validation-only");
  assert.equal(manifest.productCode, false);
  assert.match(manifest.numericIdentity, /fixture-only technical values/);

  for (const source of manifest.sources) {
    const bytes = await readFile(resolve(here, source.path));
    const actual = createHash("sha256").update(bytes).digest("hex").toUpperCase();
    assert.equal(actual, source.sha256, source.path);
  }
});

test("joint author state space contains exactly 324 unique states", () => {
  assert.equal(STATE_SPACE.length, 324);
  assert.equal(new Set(STATE_SPACE.map((state) => state.id)).size, 324);
  assert.deepEqual(
    [...GOLDEN_STATE_SPACE.map((state) => state.stateId)].sort(),
    [...STATE_SPACE.map((state) => state.id)].sort(),
  );
});

test("golden oracle has no runtime dependency or mutation path to solver modules", async () => {
  const source = await readFile(resolve(here, "golden.mjs"), "utf8");
  assert.doesNotMatch(source, /^\s*import\s/m);
  assert.doesNotMatch(source, /\b(?:writeFile|appendFile|createWriteStream)\b/);
  assert.doesNotMatch(source, /\bprocess\.argv\b/);
  assert.deepEqual(
    [...GOLDEN_SCENARIO_IDS].sort(),
    scenarios.map((scenario) => scenario.id).sort(),
  );
});

test("every declared legal order matches the runtime-separated 324-cell rational golden", () => {
  for (const scenario of scenarios) {
    for (const order of scenario.orders) {
      assertScenarioMatchesRuntimeSeparatedGolden(scenario, order);
    }
  }
});

test("declared scenario matrix reaches or rejects the expected result", () => {
  for (const scenario of scenarios) {
    const snapshot = solveFixture(scenario, eventsForOrder(scenario, scenario.orders[0]));
    assert.equal(snapshot.stage, scenario.expected.stage, scenario.id);
    assert.equal(snapshot.posterior.length, 324, scenario.id);
  }
});

test("every declared legal order produces the same complete state snapshot", () => {
  for (const scenario of scenarios) {
    const baseline = solveFixture(scenario, eventsForOrder(scenario, scenario.orders[0]));
    for (const order of scenario.orders.slice(1)) {
      const reordered = solveFixture(scenario, eventsForOrder(scenario, order));
      assert.deepEqual(reordered, baseline, `${scenario.id}: ${order.join(" -> ")}`);
    }
  }
});

test("G2 can stop, then non-progress still spends attempts and returns to G2", () => {
  const stopped = solveScenario("g2-documented-stop");
  const continued = solveScenario("g2-continue-no-progress");
  assert.equal(stopped.stage, "G2");
  assert.deepEqual(stopped.stopping, {
    frozenStage: "G2",
    playerChoice: "STOP",
    systemAutoEnded: false,
  });
  assert.equal(continued.stage, "G2");
  assert.deepEqual(continued.stopping, {
    frozenStage: null,
    playerChoice: "CONTINUE",
    systemAutoEnded: false,
  });
  assert.throws(
    () => assertSessionCanAcceptEvidence(stopped),
    (error) => hasReason(error, "RUN_FROZEN") && error.details.frozenStage === "G2",
  );
  assert.equal(assertSessionCanAcceptEvidence(continued), true);
  const stoppedScenario = scenarioById["g2-documented-stop"];
  assert.throws(
    () => solveFixture(
      { ...stoppedScenario, resumeFromSnapshot: stopped },
      eventsForOrder(stoppedScenario, stoppedScenario.orders[0]),
    ),
    (error) => hasReason(error, "RUN_FROZEN"),
  );
  assert.throws(
    () => solveFixture(
      { ...stoppedScenario, playerChoice: "PAUSE" },
      eventsForOrder(stoppedScenario, stoppedScenario.orders[0]),
    ),
    (error) => hasReason(error, "PLAYER_CHOICE_INVALID"),
  );
  assert.throws(
    () => assertSessionCanAcceptEvidence({
      stopping: {
        frozenStage: null,
        playerChoice: "STOP",
        systemAutoEnded: false,
      },
    }),
    (error) => hasReason(error, "STOPPING_SNAPSHOT_INVALID"),
  );
  assert.throws(
    () => assertSessionCanAcceptEvidence({
      stage: "G1",
      stopping: {
        frozenStage: "G3",
        playerChoice: "STOP",
        systemAutoEnded: false,
      },
    }),
    (error) => hasReason(error, "STOPPING_SNAPSHOT_INVALID"),
  );
  assert.throws(
    () => assertSessionCanAcceptEvidence({
      stopping: {
        frozenStage: "G2",
        playerChoice: "CONTINUE",
        systemAutoEnded: false,
      },
    }),
    (error) => hasReason(error, "STOPPING_SNAPSHOT_INVALID"),
  );
  assert.deepEqual(continued.posterior, stopped.posterior);
  assert.equal(continued.evidence.attemptCount, stopped.evidence.attemptCount + 2);
  assert.deepEqual(continued.evidence.unresolvedNegativeIds, [
    "obs.surface.no-signal.unresolved",
  ]);
});

test("same dependency unit folds once while independent corroboration can move support", () => {
  const baselineScenario = scenarioById["g2-documented-stop"];
  const repeated = solveScenario("g2-continue-no-progress");
  const baseline = solveScenario("g2-documented-stop");
  assert.deepEqual(repeated.posterior, baseline.posterior);

  const independentFixture = {
    ...baselineScenario,
    id: "fixture-independent-corroboration",
    events: [...baselineScenario.events, events.identityContinuity],
  };
  const independentOrder = [
    events.whole,
    events.base,
    events.corpus,
    events.accident,
    events.t2Attribution,
    events.documentedCurrentCorroboration,
    events.identityContinuity,
  ];
  const independent = solveFixture(independentFixture, independentOrder);
  assert.ok(independent.supports.identity > baseline.supports.identity);
  assert.equal(independent.stage, "G2");
});

test("professional evidence can be acquired early and contextualized without recount", () => {
  const scenario = scenarioById["professional-evidence-early"];
  const earlyOnly = solveFixture(scenario, [events.xrayEarly]);
  assert.equal(earlyOnly.stage, "NONE");
  assert.deepEqual(earlyOnly.evidence.inactiveObservationIds, ["obs.structure.xray.early"]);
  assert.deepEqual(earlyOnly.coverage.factLanes.direct, ["xrayReadingsByRegionAcquired"]);
  assert.deepEqual(earlyOnly.coverage.factLanes.contextual, []);

  const final = solveScenario("professional-evidence-early");
  assert.equal(final.stage, "G2");
  assert.deepEqual(final.evidence.contextualizedObservationIds, ["obs.structure.xray.early"]);
  assert.deepEqual(final.coverage.factLanes.contextual, ["currentStructureReadoutByRegion"]);
  assert.deepEqual(final.coverage.factWitnesses.currentStructureReadoutByRegion, [{
    dependencyUnitId: "dep.structure.major",
    observationId: "obs.structure.xray.early",
    sourceIds: ["source.instrument.xray"],
  }]);
  assert.deepEqual(final.coverage.contextActivationWitnesses, {
    "obs.structure.xray.early": {
      requiredFacts: ["identityObjectContinuity"],
      witnesses: {
        identityObjectContinuity: [{
          dependencyUnitId: "dep.object.continuity",
          observationId: "obs.object.continuity",
          sourceIds: ["source.archive.image", "source.physical.current"],
        }],
      },
    },
  });
  const active = final.evidence.activeDependencyUnits.find(
    (unit) => unit.unitId === "dep.structure.major",
  );
  assert.deepEqual(active.observationIds, [
    "obs.structure.major.cross-time",
    "obs.structure.xray.early",
  ]);
  assert.equal(final.coverage.majorProofPaths.physical, true);
  assert.equal(final.coverage.majorProofPaths.documented, false);
});

test("surface-only bad news preserves the complete h marginal and does not break G2", () => {
  const baseline = solveScenario("g2-documented-stop");
  const badNews = solveScenario("g2-surface-bad-news-stable");
  assert.equal(badNews.stage, "G2");
  assertNumericRecordClose(
    projectPosterior(badNews, ["Identity", "RepairHistory", "KeyMaterial"]),
    projectPosterior(baseline, ["Identity", "RepairHistory", "KeyMaterial"]),
    "surface-only evidence must preserve the complete h marginal",
  );
  assert.notDeepEqual(badNews.marginals.Surface, baseline.marginals.Surface);
});

test("stability-only bad news preserves the complete h marginal and does not break G2", () => {
  const baseline = solveScenario("g2-documented-stop");
  const badNews = solveScenario("g2-stability-bad-news-stable");
  assert.equal(badNews.stage, "G2");
  assertNumericRecordClose(
    projectPosterior(badNews, ["Identity", "RepairHistory", "KeyMaterial"]),
    projectPosterior(baseline, ["Identity", "RepairHistory", "KeyMaterial"]),
    "stability-only evidence must preserve the complete h marginal",
  );
  assert.notDeepEqual(badNews.marginals.Stability, baseline.marginals.Stability);
});

test("capability-limited no-signal remains unresolved rather than absence-supported", () => {
  const snapshot = solveScenario("g2-continue-no-progress");
  assert.ok(snapshot.coverage.facts.includes("negativeSignalObserved"));
  assert.deepEqual(snapshot.coverage.factLanes.capability, []);
  assert.ok(snapshot.evidence.inactiveObservationIds.includes("obs.surface.no-signal.unresolved"));
  assert.equal(snapshot.conflicts.length, 0);
});

test("capability-insufficient counterevidence cannot create absence support or block G2", () => {
  const snapshot = solveScenario("g2-insufficient-counter-unresolved");
  assert.equal(snapshot.stage, "G2");
  assert.ok(snapshot.coverage.facts.includes("negativeSignalObserved"));
  assert.ok(!snapshot.coverage.facts.includes("scopedAbsenceSupported"));
  assert.deepEqual(snapshot.conflicts, []);
  assert.ok(
    snapshot.evidence.inactiveObservationIds.includes(
      "obs.counter.major.insufficient-capability",
    ),
  );
  assert.ok(
    snapshot.evidence.unresolvedNegativeIds.includes(
      "obs.counter.major.insufficient-capability",
    ),
  );
});

test("abstract scoped hard counterevidence downgrades G2 without erasing identity or G1", () => {
  const snapshot = solveScenario("g2-hard-counter-downgrade");
  assert.equal(snapshot.stage, "G1");
  assert.equal(snapshot.claims.g1.established, true);
  assert.equal(snapshot.claims.identity.established, true);
  assert.equal(snapshot.claims.majorReassembly.established, false);
  assert.equal(snapshot.claims.majorReassembly.contested, true);
  assert.equal(snapshot.claims.majorReassembly.logicallyRefuted, false);
  assert.deepEqual(snapshot.coverage.factLanes.capability, ["scopedAbsenceSupported"]);
  assert.equal(snapshot.conflicts[0].blocking, true);
  assert.equal(snapshot.conflicts[0].scopeMatch, true);
  assert.ok(snapshot.coverage.facts.includes("identityComparisonExclusion"));
  assert.deepEqual(snapshot.conflicts[0].scope, {
    materialLayer: "structural-substrate",
    object: "OBJECT.FIRST",
    quantifier: "necessary-condition",
    region: "necessary-major-scope",
    time: "T2",
  });
});

test("a capable negative result outside the necessary scope only bounds the claim", () => {
  const snapshot = solveScenario("g2-out-of-scope-counter-stable");
  assert.equal(snapshot.stage, "G2");
  assert.equal(snapshot.claims.majorReassembly.established, true);
  assert.equal(snapshot.claims.majorReassembly.contested, false);
  assert.equal(snapshot.claims.majorReassembly.logicallyRefuted, false);
  assert.equal(snapshot.conflicts.length, 1);
  assert.equal(snapshot.conflicts[0].blocking, false);
  assert.equal(snapshot.conflicts[0].scopeMatch, false);
  assert.equal(snapshot.conflicts[0].relation, "bounds/refines");
  assert.equal(snapshot.conflicts[0].declaredRelation, "hard-counterevidence");
});

test("an out-of-scope global factor is suppressed instead of silently downgrading G2", () => {
  const baseline = solveScenario("g2-documented-stop");
  const snapshot = solveScenario("g2-out-of-scope-factor-stable");
  assert.equal(snapshot.stage, "G2");
  assert.deepEqual(snapshot.posterior, baseline.posterior);
  assert.equal(snapshot.conflicts[0].blocking, false);
  assert.equal(snapshot.conflicts[0].relation, "bounds/refines");
  assert.ok(
    snapshot.evidence.scopeLimitedObservationIds.includes(
      "obs.counter.major.out-of-scope-with-factor",
    ),
  );
  assert.ok(
    snapshot.evidence.inactiveObservationIds.includes(
      "obs.counter.major.out-of-scope-with-factor",
    ),
  );
});

test("weakens and bounds/refines remain nonblocking while logical refutation blocks", () => {
  const baseline = solveScenario("g2-documented-stop");
  const weakened = solveScenario("g2-major-weakened-stable");
  assert.equal(weakened.stage, "G2");
  assert.ok(weakened.supports.major < baseline.supports.major);
  assert.equal(weakened.conflicts[0].relation, "weakens");
  assert.equal(weakened.conflicts[0].blocking, false);

  const bounded = solveScenario("g2-major-bounded-stable");
  assert.equal(bounded.stage, "G2");
  assert.equal(bounded.conflicts[0].relation, "bounds/refines");
  assert.equal(bounded.conflicts[0].blocking, false);

  const refuted = solveScenario("g2-logical-counter-downgrade");
  assert.equal(refuted.stage, "G1");
  assert.equal(refuted.conflicts[0].relation, "logical-refutation");
  assert.equal(refuted.conflicts[0].blocking, true);
  assert.equal(refuted.claims.majorReassembly.contested, false);
  assert.equal(refuted.claims.majorReassembly.logicallyRefuted, true);
});

test("direct identity counterevidence downgrades G2 without erasing the G1 frame", () => {
  const snapshot = solveScenario("g2-identity-hard-counter-downgrade");
  assert.equal(snapshot.stage, "G1");
  assert.equal(snapshot.claims.g1.established, true);
  assert.equal(snapshot.claims.identity.established, false);
  assert.equal(snapshot.claims.identity.contested, true);
  assert.equal(snapshot.claims.identity.logicallyRefuted, false);
  assert.equal(snapshot.claims.majorReassembly.established, true);
});

test("high identity and major marginals cannot splice a false G2", () => {
  const snapshot = solveScenario("marginal-splice-rejected");
  assertClose(snapshot.supports.identity, 0.76, "identity marginal");
  assertClose(snapshot.supports.major, 0.76, "major-reassembly marginal");
  assertClose(snapshot.supports.g2Joint, 0.52, "joint G2 support");
  assert.equal(snapshot.claims.identity.established, true);
  assert.equal(snapshot.claims.majorReassembly.established, true);
  assert.equal(snapshot.stage, "G1");
});

test("archive relationship questions update without gating player action", () => {
  const early = solveScenario("archive-candidate-early-local-value");
  assert.equal(early.stage, "G1");
  assert.deepEqual(early.coverage.archiveRelations.t2, {
    eventCorroboration: "suggestive",
    objectAttribution: "unresolved",
    recordCoherence: "established",
    systemAttributionEstablished: false,
  });
  assert.ok(early.supports.major > solveScenario("g1-oriented").supports.major);

  const contested = solveScenario("archive-attribution-contested-not-promoted");
  assert.equal(contested.coverage.archiveRelations.t2.objectAttribution, "contested");
  assert.equal(contested.coverage.archiveRelations.t2.systemAttributionEstablished, false);
  assert.equal(contested.stage, "G1");

  const established = solveScenario("g2-documented-stop");
  assert.deepEqual(established.coverage.archiveRelations.t2, {
    eventCorroboration: "established",
    objectAttribution: "established",
    recordCoherence: "established",
    systemAttributionEstablished: true,
  });
  assert.equal(established.stopping.playerChoice, "STOP");
});

test("every T2 and T3 archive relationship conflict overrides simultaneous positive evidence", () => {
  const t2Base = scenarioById["g2-documented-stop"];
  const t2Order = eventsForOrder(t2Base, t2Base.orders[0]);
  const t2Conflicts = [
    ["recordCoherence", events.t2RecordCoherenceContested],
    ["objectAttribution", events.t2AttributionContested],
    ["eventCorroboration", events.t2EventCorroborationContested],
  ];
  for (const [question, conflictEvent] of t2Conflicts) {
    const snapshot = solveFixture(
      { ...t2Base, playerChoice: "CONTINUE" },
      [...t2Order, conflictEvent],
    );
    assert.equal(snapshot.coverage.archiveRelations.t2[question], "contested", `T2 ${question}`);
    assert.equal(snapshot.coverage.archiveRelations.t2.systemAttributionEstablished, false, `T2 ${question}`);
    assert.equal(snapshot.stage, "G1", `T2 ${question}`);
  }

  const t3Base = scenarioById["g3-with-allowed-unknowns"];
  const t3Order = eventsForOrder(t3Base, t3Base.orders[0]);
  const t3Conflicts = [
    ["recordCoherence", events.t3RecordCoherenceContested],
    ["objectAttribution", events.t3AttributionContested],
    ["eventCorroboration", events.t3EventCorroborationContested],
  ];
  for (const [question, conflictEvent] of t3Conflicts) {
    const snapshot = solveFixture(t3Base, [...t3Order, conflictEvent]);
    assert.equal(snapshot.coverage.archiveRelations.t3[question], "contested", `T3 ${question}`);
    assert.equal(snapshot.coverage.archiveRelations.t3.systemAttributionEstablished, false, `T3 ${question}`);
    assert.equal(snapshot.claims.threePhase.established, false, `T3 ${question}`);
    assert.equal(snapshot.stage, "G2", `T3 ${question}`);
  }
});

test("a contradictory T1/T2/T3 chronology blocks G3 without erasing G2", () => {
  const base = scenarioById["g3-with-allowed-unknowns"];
  const snapshot = solveFixture(base, [
    ...eventsForOrder(base, base.orders[0]),
    events.threePhaseChronologyContested,
  ]);
  assert.equal(snapshot.claims.identity.established, true);
  assert.equal(snapshot.claims.majorReassembly.established, true);
  assert.equal(snapshot.claims.threePhase.established, false);
  assert.equal(snapshot.claims.coherentDecisionProfile.established, false);
  assert.equal(snapshot.stage, "G2");
});

test("one advanced test is not an answer key", () => {
  const snapshot = solveScenario("single-test-answer-key-rejected");
  assert.equal(snapshot.stage, "NONE");
  assert.equal(snapshot.claims.identity.established, false);
  assert.equal(snapshot.claims.majorReassembly.established, false);
});

test("instrument, glue-line and document near-misses cannot supply omitted proof groups", () => {
  const instrument = solveScenario("near-complete-single-instrument-rejected");
  assert.equal(instrument.stage, "G1");
  assert.equal(instrument.claims.identity.established, true);
  assert.equal(instrument.claims.majorReassembly.established, false);
  assert.deepEqual(instrument.coverage.proofWitnesses.majorReassembly, {
    currentRepairMap: ["currentRepairMap"],
    documentedCrossTime: [],
    documentedSourceGroup: [],
    physicalCrossTime: [],
    physicalStructureMap: [],
  });

  const glueLine = solveScenario("near-complete-single-glue-line-rejected");
  assert.equal(glueLine.stage, "G1");
  assert.equal(glueLine.claims.identity.established, true);
  assert.equal(glueLine.claims.majorReassembly.established, false);

  const document = solveScenario("single-document-answer-key-rejected");
  assert.equal(document.stage, "G1");
  assert.equal(document.claims.identity.established, true);
  assert.equal(document.claims.majorReassembly.established, false);
});

test("major proof eligibility is bound to source group, coverage and distinct role slots", () => {
  const nearInstrument = scenarioById["near-complete-single-instrument-rejected"];
  const broadFactFromLocalRead = {
    ...events.singleXray,
    observationId: "obs.adversarial.single-read-broad-fact",
    facts: ["currentStructureReadoutByRegion"],
  };
  const instrumentSnapshot = solveFixture(nearInstrument, [
    events.whole,
    events.base,
    events.corpus,
    events.appearance,
    broadFactFromLocalRead,
  ]);
  assert.equal(instrumentSnapshot.stage, "G1");
  assert.equal(instrumentSnapshot.claims.majorReassembly.established, false);
  assert.equal(instrumentSnapshot.coverage.majorProofPaths.physical, false);

  assert.throws(
    () => solveFixture(nearInstrument, [
      events.whole,
      events.base,
      events.corpus,
      events.appearance,
      {
        ...broadFactFromLocalRead,
        observationId: "obs.adversarial.single-read-role-smuggle",
        proofRoles: [PROOF_ROLES.PHYSICAL_STRUCTURE_MAP],
      },
    ]),
    (error) => hasReason(error, "PROOF_ROLE_COVERAGE_MISMATCH"),
  );

  const validMajorXrayWithoutCrossTime = {
    ...events.physicalMajor,
    observationId: "obs.adversarial.valid-major-xray-without-cross-time",
  };
  const xrayOnlySnapshot = solveFixture(nearInstrument, [
    events.whole,
    events.base,
    events.corpus,
    events.appearance,
    validMajorXrayWithoutCrossTime,
  ]);
  assert.equal(xrayOnlySnapshot.stage, "G1");
  assert.equal(xrayOnlySnapshot.claims.majorReassembly.established, false);
  assert.equal(xrayOnlySnapshot.coverage.majorProofPaths.physical, false);

  const documented = solveScenario("g2-documented-stop");
  assert.equal(documented.coverage.majorProofPaths.documented, true);
  assert.equal(documented.coverage.majorProofPaths.physical, false);
  assert.equal(solveScenario("single-document-answer-key-rejected").stage, "G1");

  const oneDocumentEmittingEveryArchiveFact = {
    ...events.singleDocument,
    observationId: "obs.adversarial.one-document-all-archive-facts",
    facts: [
      "t2RecordGroupCoherent",
      "t2RecordClaimsAppearanceRestore",
      "t2RecordClaimsDamageExtent",
      "t2RecordClaimsReassembly",
    ],
  };
  const oneDocumentSnapshot = solveFixture(nearInstrument, [
    events.whole,
    events.base,
    events.corpus,
    oneDocumentEmittingEveryArchiveFact,
  ]);
  assert.equal(oneDocumentSnapshot.stage, "G1");
  assert.equal(oneDocumentSnapshot.claims.majorReassembly.established, false);
  assert.equal(oneDocumentSnapshot.coverage.majorProofPaths.documented, false);

  const oneSourcePretendingToBeGroup = {
    ...events.accident,
    observationId: "obs.adversarial.single-document-group-smuggle",
    sourceIds: ["source.event.single-document"],
  };
  assert.throws(
    () => solveFixture(nearInstrument, [oneSourcePretendingToBeGroup]),
    (error) => hasReason(error, "PROOF_ROLE_SOURCE_MISMATCH"),
  );

  const wrongCoveragePretendingToBeGroup = {
    ...events.accident,
    observationId: "obs.adversarial.single-document-coverage-smuggle",
    coverage: { ...events.accident.coverage, region: "single-document" },
  };
  assert.throws(
    () => solveFixture(nearInstrument, [wrongCoveragePretendingToBeGroup]),
    (error) => hasReason(error, "PROOF_ROLE_COVERAGE_MISMATCH"),
  );

  const corroborationWithoutAppearance = {
    ...events.documentedCurrentCorroboration,
    observationId: "obs.adversarial.corroboration-without-appearance",
    facts: ["t2EventPhysicalCorrespondence"],
  };
  assert.throws(
    () => solveFixture(nearInstrument, [corroborationWithoutAppearance]),
    (error) => hasReason(error, "PROOF_ROLE_FACT_MISMATCH"),
  );

  assert.throws(
    () => solveFixture(nearInstrument, [{ ...events.whole, sourceIds: [] }]),
    (error) => hasReason(error, "SOURCE_IDS_EMPTY"),
  );
});

test("documented T2 accepts the declared cross-time OR without a current repair map", () => {
  const scenario = scenarioById["g2-documented-cross-time-or"];
  const snapshot = solveScenario("g2-documented-cross-time-or");
  const withoutCrossTime = solveFixture(scenario, [
    events.wholeWithoutRepairMap,
    events.base,
    events.corpus,
    events.accident,
    events.t2Attribution,
  ]);

  assert.equal(snapshot.stage, "G2");
  assert.equal(snapshot.coverage.facts.includes("currentRepairMap"), false);
  assert.deepEqual(snapshot.coverage.majorProofPaths, {
    documented: true,
    physical: false,
  });
  assert.deepEqual(
    snapshot.coverage.proofRoleWitnesses[PROOF_ROLES.T2_CROSS_TIME_CORROBORATION],
    [{
      coverage: {
        method: "cross-time",
        object: "RELATION.ARCHIVE_T2_EVENT_OBJECT_FIRST",
        region: "declared-major-scope",
      },
      dependencyUnitId: "dep.documented.cross-time",
      observationId: "obs.structure.major.documented-cross-time",
      sourceIds: [
        "source.archive.major-region-pre",
        "source.physical.major-region-current",
      ],
    }],
  );
  assert.deepEqual(snapshot.posterior, withoutCrossTime.posterior);
  assert.deepEqual(snapshot.supports, withoutCrossTime.supports);
  assert.equal(withoutCrossTime.stage, "G1");
  assert.equal(scenario.orders.length, 2);
});

test("documented cross-time proof fails closed on source, coverage, role or fact defects", () => {
  const scenario = scenarioById["g2-documented-cross-time-or"];
  const prefix = [
    events.wholeWithoutRepairMap,
    events.base,
    events.corpus,
    events.accident,
    events.t2Attribution,
  ];

  assert.throws(
    () => solveFixture(scenario, [
      ...prefix,
      {
        ...events.documentedCrossTime,
        observationId: "obs.invalid.documented-cross-time-single-source",
        sourceIds: ["source.archive.major-region-pre"],
      },
    ]),
    (error) => hasReason(error, "PROOF_ROLE_SOURCE_MISMATCH"),
  );
  assert.throws(
    () => solveFixture(scenario, [
      ...prefix,
      {
        ...events.documentedCrossTime,
        observationId: "obs.invalid.documented-cross-time-extra-source",
        sourceIds: [
          ...events.documentedCrossTime.sourceIds,
          "source.archive.unapproved-extra",
        ],
      },
    ]),
    (error) => hasReason(error, "PROOF_ROLE_SOURCE_MISMATCH"),
  );
  assert.throws(
    () => solveFixture(scenario, [
      ...prefix,
      {
        ...events.documentedCrossTime,
        observationId: "obs.invalid.documented-cross-time-coverage",
        coverage: {
          ...events.documentedCrossTime.coverage,
          region: "nondeclared-local-scope",
        },
      },
    ]),
    (error) => hasReason(error, "PROOF_ROLE_COVERAGE_MISMATCH"),
  );
  assert.throws(
    () => solveFixture(scenario, [
      ...prefix,
      {
        ...events.documentedCrossTime,
        observationId: "obs.invalid.documented-cross-time-no-atom",
        facts: [],
      },
    ]),
    (error) => hasReason(error, "PROOF_ROLE_FACT_MISMATCH"),
  );

  const missingRole = solveFixture(scenario, [
    ...prefix,
    {
      ...events.documentedCrossTime,
      observationId: "obs.adversarial.documented-cross-time-no-role",
      proofRoles: [],
    },
  ]);
  assert.equal(missingRole.stage, "G1");
  assert.equal(missingRole.coverage.majorProofPaths.documented, false);
});

test("the documented OR does not relax the physical major route", () => {
  const scenario = scenarioById["g2-documented-cross-time-or"];
  const snapshot = solveFixture(scenario, [
    events.wholeWithoutRepairMap,
    events.base,
    events.corpus,
    events.appearance,
    events.physicalMajor,
    events.repairContinuity,
  ]);

  assert.equal(snapshot.stage, "G1");
  assert.equal(snapshot.coverage.facts.includes("currentRepairMap"), false);
  assert.equal(snapshot.coverage.majorProofPaths.documented, false);
  assert.equal(snapshot.coverage.majorProofPaths.physical, false);
});

test("an omnibus instrument event is rejected by action, method and fact-axis authority", () => {
  const fixture = scenarioById["g3-with-allowed-unknowns"];
  const smuggledFacts = Object.freeze({
    ...events.singleXray,
    observationId: "obs.invalid.omnibus-facts",
    facts: Object.freeze([
      "currentBody",
      "currentDecor",
      "currentRepairMap",
      "interventionObservation",
      "baseManufacture",
      "directionCorpus",
      "identityComparisonExclusion",
      "currentStructureReadout",
      "appearanceRestore",
      "t1Established",
      "t2Established",
      "t3Established",
      "keyMaterialResolved",
      "surfaceResolved",
      "stabilityResolved",
      "documentationBoundary",
      "documentationNoConflict",
    ]),
  });
  assert.throws(
    () => solveFixture(fixture, [smuggledFacts]),
    (error) =>
      hasReason(error, "ACTION_CONTRACT_OVERREACH") &&
      error.details.observationId === "obs.invalid.omnibus-facts",
  );

  const smuggledAxis = Object.freeze({
    ...events.singleXray,
    observationId: "obs.invalid.omnibus-axis",
    factor: events.corpus.factor,
  });
  assert.throws(
    () => solveFixture(fixture, [smuggledAxis]),
    (error) =>
      hasReason(error, "ACTION_CONTRACT_OVERREACH") &&
      error.details.axis === "Identity",
  );

  const smuggledMethod = Object.freeze({
    ...events.singleXray,
    observationId: "obs.invalid.omnibus-method",
    coverage: Object.freeze({ ...events.singleXray.coverage, method: "visual" }),
  });
  assert.throws(
    () => solveFixture(fixture, [smuggledMethod]),
    (error) =>
      hasReason(error, "ACTION_METHOD_UNAUTHORIZED") &&
      error.details.method === "visual",
  );
});

test("G3 can establish while declared noncritical unknowns remain", () => {
  const snapshot = solveScenario("g3-with-allowed-unknowns");
  assert.equal(snapshot.stage, "G3");
  assert.equal(snapshot.claims.coherentDecisionProfile.established, true);
  assert.deepEqual(snapshot.coverage.unknowns, GOLDEN_G3_UNKNOWN_POLICY.allowed);
  assert.ok(snapshot.evidence.contextualizedObservationIds.includes("obs.phase.t1"));
});

test("G3 rejects every registered decision-critical unknown class", () => {
  const base = scenarioById["g3-with-allowed-unknowns"];
  const order = eventsForOrder(base, base.orders[0]);
  for (const unknownId of GOLDEN_G3_UNKNOWN_POLICY.blocking) {
    const snapshot = solveFixture({ ...base, unknowns: [unknownId] }, order);
    assert.equal(snapshot.stage, "G2", unknownId);
    assert.equal(snapshot.claims.coherentDecisionProfile.established, false, unknownId);
    assert.deepEqual(snapshot.coverage.g3BlockingUnknowns, [unknownId], unknownId);
  }
});

test("shared source or latent IDs cannot be hidden behind a second dependency unit", () => {
  const fixture = scenarioById["g2-documented-stop"];
  const mispartitionedDuplicate = Object.freeze({
    ...events.corpusDuplicate,
    dependencyUnitId: "dep.corpus.identity.wrong-second-unit",
  });
  assert.throws(
    () =>
      solveFixture(fixture, [
        events.whole,
        events.base,
        events.corpus,
        mispartitionedDuplicate,
      ]),
    (error) => hasReason(error, "DEPENDENCY_PARTITION_CONFLICT"),
  );
});

test("noncommuting axis constraints fail closed regardless of dependency-unit ID order", () => {
  const fixture = scenarioById["marginal-splice-rejected"];
  const renamedOrders = [
    ["dep.z.identity", "dep.a.repair"],
    ["dep.a.identity", "dep.z.repair"],
  ];
  for (const [identityUnitId, repairUnitId] of renamedOrders) {
    const identity = Object.freeze({ ...events.corpus, dependencyUnitId: identityUnitId });
    const repair = Object.freeze({ ...events.accident, dependencyUnitId: repairUnitId });
    assert.throws(
      () => solveFixture(fixture, [events.whole, events.base, identity, repair]),
      (error) => hasReason(error, "FACTOR_ORDER_DEPENDENT"),
      `${identityUnitId} / ${repairUnitId}`,
    );
  }
});

test("invalid priors, thresholds, factor weights and unknown IDs fail closed by reason", () => {
  const base = scenarioById["g1-oriented"];
  const order = eventsForOrder(base, base.orders[0]);
  const invalidPrior = {
    ...base,
    priorCells: [
      { when: { Identity: "LATE18_EXPORT" }, mass: 1.2 },
      { when: { Identity: "REPRODUCTION" }, mass: -0.2 },
    ],
  };
  assert.throws(
    () => solveFixture(invalidPrior, order),
    (error) => hasReason(error, "PRIOR_CELL_MASS_INVALID"),
  );
  for (const priorCells of [
    null,
    [{ when: {}, mass: Number.POSITIVE_INFINITY }],
    [
      { when: { Identity: "LATE18_EXPORT" }, mass: 0.5 },
      { when: { Identity: "REPRODUCTION" }, mass: -0.1 },
    ],
  ]) {
    assert.throws(
      () => solveFixture({ ...base, priorCells }, order),
      (error) =>
        priorCells === null
          ? hasReason(error, "PRIOR_CELLS_INVALID")
          : hasReason(error, "PRIOR_CELL_MASS_INVALID"),
    );
  }

  for (const mass of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    const invalidNonfinitePrior = {
      ...base,
      priorCells: [
        { when: { Identity: "LATE18_EXPORT" }, mass },
        { when: { Identity: "REPRODUCTION" }, mass: 1 - mass },
      ],
    };
    assert.throws(
      () => solveFixture(invalidNonfinitePrior, order),
      (error) => hasReason(error, "PRIOR_CELL_MASS_INVALID"),
      `prior mass ${mass}`,
    );
  }

  for (const value of [1.1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.throws(
      () => solveFixture({ ...base, thresholds: { ...base.thresholds, identity: value } }, order),
      (error) => hasReason(error, "THRESHOLD_INVALID") && error.details.threshold === "identity",
      `identity threshold ${value}`,
    );
  }

  for (const weight of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    const invalidFactor = {
      ...events.corpus,
      observationId: `obs.invalid.factor-${String(weight)}`,
      factor: {
        ...events.corpus.factor,
        weights: events.corpus.factor.weights.map((row, index) => ({
          ...row,
          weight: index === 0 ? weight : row.weight,
        })),
      },
    };
    assert.throws(
      () => solveFixture(base, [events.whole, events.base, invalidFactor]),
      (error) => hasReason(error, "FACTOR_WEIGHT_INVALID"),
      `factor weight ${weight}`,
    );
  }

  assert.throws(
    () => solveFixture({ ...base, unknowns: ["unregistered-core-unknown"] }, order),
    (error) => hasReason(error, "UNKNOWN_ID_UNREGISTERED"),
  );
});

test("derived numeric overflow and invalid public posterior projections fail closed", () => {
  const base = scenarioById["g1-oriented"];
  const overflowFactor = (factor) => ({
    ...factor,
    weights: factor.weights.map((row) => ({ ...row, weight: Number.MAX_VALUE })),
  });
  const overflowingCorpus = {
    ...events.corpus,
    observationId: "obs.invalid.overflow-corpus",
    factor: overflowFactor(events.corpus.factor),
  };
  const overflowingContinuity = {
    ...events.identityContinuity,
    observationId: "obs.invalid.overflow-continuity",
    factor: overflowFactor(events.identityContinuity.factor),
  };
  assert.throws(
    () => solveFixture(base, [
      events.whole,
      events.base,
      overflowingCorpus,
      overflowingContinuity,
    ]),
    (error) => hasReason(error, "DERIVED_FACTOR_WEIGHT_NONFINITE"),
  );

  const valid = solveScenario("g1-oriented");
  for (const probability of [Number.NaN, Number.POSITIVE_INFINITY]) {
    const invalid = {
      ...valid,
      posterior: valid.posterior.map((entry, index) =>
        index === 0 ? { ...entry, probability } : entry),
    };
    assert.throws(
      () => projectPosterior(invalid, ["Identity"]),
      (error) => hasReason(error, "POSTERIOR_ENTRY_INVALID"),
    );
  }
  assert.throws(
    () => projectPosterior(valid, ["UnknownAxis"]),
    (error) => hasReason(error, "PROJECTION_AXES_INVALID"),
  );
});

test("nested action, proof-role and unknown policy schemas fail closed", () => {
  const base = scenarioById["g1-oriented"];
  const order = eventsForOrder(base, base.orders[0]);
  const wholeAction = base.actionContracts["A.OBSERVE.WHOLE"];
  const invalidActionContracts = {
    ...base.actionContracts,
    "A.OBSERVE.WHOLE": {
      ...wholeAction,
      methods: {
        ...wholeAction.methods,
        visual: {
          ...wholeAction.methods.visual,
          allowedDirectFacts: null,
        },
      },
    },
  };
  assert.throws(
    () => solveFixture({ ...base, actionContracts: invalidActionContracts }, order),
    (error) => hasReason(error, "ACTION_CONTRACT_SCHEMA_INVALID"),
  );

  const invalidUnknownRegistry = {
    ...base.unknownRegistry,
    "load-path-stability": { g3Allowed: "false" },
  };
  assert.throws(
    () => solveFixture({ ...base, unknownRegistry: invalidUnknownRegistry }, order),
    (error) => hasReason(error, "UNKNOWN_REGISTRY_SCHEMA_INVALID"),
  );

  const roleId = PROOF_ROLES.CURRENT_REPAIR_MAP;
  const invalidProofRoleContracts = {
    ...base.proofRoleContracts,
    [roleId]: {
      ...base.proofRoleContracts[roleId],
      minimumSourceCount: 0,
    },
  };
  assert.throws(
    () => solveFixture({ ...base, proofRoleContracts: invalidProofRoleContracts }, order),
    (error) => hasReason(error, "PROOF_ROLE_CONTRACT_SCHEMA_INVALID"),
  );
});

test("invalid counter relations, targets and negative fact lanes fail closed", () => {
  const fixture = scenarioById["g2-documented-stop"];
  const typoRelation = Object.freeze({
    ...events.hardMajorCounter,
    observationId: "obs.invalid.counter-relation",
    counterevidence: Object.freeze({
      ...events.hardMajorCounter.counterevidence,
      relation: "hard-counterevdence",
    }),
  });
  assert.throws(
    () => solveFixture(fixture, [typoRelation]),
    (error) => hasReason(error, "COUNTER_RELATION_INVALID"),
  );

  const unknownTarget = Object.freeze({
    ...events.hardMajorCounter,
    observationId: "obs.invalid.counter-target",
    counterevidence: Object.freeze({
      ...events.hardMajorCounter.counterevidence,
      targetClaim: "CLAIM.UNKNOWN",
    }),
  });
  assert.throws(
    () => solveFixture(fixture, [unknownTarget]),
    (error) => hasReason(error, "COUNTER_TARGET_INVALID"),
  );

  const capabilityFactInRawLane = Object.freeze({
    ...events.insufficientMajorCounter,
    observationId: "obs.invalid.capability-fact-lane",
    facts: Object.freeze(["negativeSignalObserved", "scopedAbsenceSupported"]),
    negativeResult: Object.freeze({
      ...events.insufficientMajorCounter.negativeResult,
      rawFactIds: Object.freeze(["negativeSignalObserved", "scopedAbsenceSupported"]),
    }),
  });
  assert.throws(
    () => solveFixture(fixture, [capabilityFactInRawLane]),
    (error) => hasReason(error, "FACT_LANE_OVERLAP"),
  );

  const { negativeResult: omittedNegativeResult, ...capabilityWithoutNegative } =
    events.insufficientMajorCounter;
  assert.ok(omittedNegativeResult);
  assert.throws(
    () => solveFixture(fixture, [{
      ...capabilityWithoutNegative,
      observationId: "obs.invalid.capability-without-negative",
    }]),
    (error) => hasReason(error, "NEGATIVE_CAPABILITY_CONTRACT_REQUIRED"),
  );

  const negativeXrayProofSmuggle = {
    ...events.physicalMajor,
    observationId: "obs.invalid.negative-xray-proof-smuggle",
    negativeResult: {
      rawFactIds: ["currentStructureReadoutByRegion"],
      capability: {
        targetCorrect: true,
        coverageSufficient: false,
        sensitivitySufficient: true,
        materialSupportsSignal: true,
      },
    },
  };
  assert.throws(
    () => solveFixture(fixture, [negativeXrayProofSmuggle]),
    (error) => hasReason(error, "NEGATIVE_RAW_FACT_UNAUTHORIZED"),
  );

  const crossLaneDuplicate = {
    ...events.physicalMajor,
    observationId: "obs.invalid.cross-lane-duplicate",
    contextualFacts: ["currentStructureReadoutByRegion"],
    requiresContextFacts: ["identityObjectContinuity"],
  };
  assert.throws(
    () => solveFixture(fixture, [crossLaneDuplicate]),
    (error) => hasReason(error, "FACT_LANE_OVERLAP"),
  );

  assert.throws(
    () => solveFixture(fixture, [{ ...events.singleXray, coverage: null }]),
    (error) => hasReason(error, "EVENT_COVERAGE_INVALID"),
  );
});

test("declared scenario orders must be complete exact permutations", () => {
  const scenario = scenarioById["g2-documented-stop"];
  assert.throws(
    () => eventsForOrder(scenario, [scenario.orders[0][0]]),
    (error) =>
      error instanceof FixtureContractError && error.reason === "FIXTURE_ORDER_INVALID",
  );
  assert.throws(
    () => eventsForOrder(scenario, [
      scenario.orders[0][0],
      scenario.orders[0][0],
      ...scenario.orders[0].slice(2),
    ]),
    (error) =>
      error instanceof FixtureContractError && error.reason === "FIXTURE_ORDER_INVALID",
  );
});

test("conflicting factors inside one dependency unit fail as MODEL_CONFLICT", () => {
  const fixture = scenarioById["g2-documented-stop"];
  assert.throws(
    () =>
      solveFixture(fixture, [
        events.whole,
        events.base,
        ...conflictingDependencyEvents,
        events.accident,
      ]),
    (error) => hasReason(error, "DEPENDENCY_UNIT_FACTOR_CONFLICT"),
  );
});

test("scenario summary", () => {
  const summary = Object.fromEntries(
    scenarios.map((scenario) => [scenario.id, solveFixture(
      scenario,
      eventsForOrder(scenario, scenario.orders[0]),
    ).stage]),
  );
  console.log(`V3_AUTHOR_SCENARIOS ${JSON.stringify(summary)}`);
  assert.equal(Object.keys(summary).length, scenarios.length);
});
