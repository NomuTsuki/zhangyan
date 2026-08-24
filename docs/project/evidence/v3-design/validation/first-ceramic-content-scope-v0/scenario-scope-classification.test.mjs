import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  events,
  scenarioById as scenarioFixturesById,
  scenarios,
  unknownRegistry,
} from "../first-ceramic-author-scenarios-v0/fixtures.mjs";
import { solveFixture } from "../first-ceramic-author-scenarios-v0/solver.mjs";
import {
  firstCasePostG2LocalConflictEventKeys,
  frozenContractHashes,
  scenarioScopeClassification,
} from "./scenario-scope-classification.mjs";

const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));

function entriesByExpectedStage(group) {
  return Object.entries(group).flatMap(([expectedStage, ids]) =>
    ids.map((id) => ({ expectedStage, id })),
  );
}

const classifiedEntries = [
  ...entriesByExpectedStage(
    scenarioScopeClassification.firstCaseTruthCompatibleExamples,
  ),
  ...entriesByExpectedStage(
    scenarioScopeClassification.firstCaseTruthCompatibleGuardrails,
  ),
  ...entriesByExpectedStage(
    scenarioScopeClassification.genericDefensiveFutureCaseOnly,
  ),
  ...entriesByExpectedStage(
    scenarioScopeClassification.structuralAdversarialOnly,
  ),
];

test("scope overlay binds to the independently reviewed frozen v1 bytes", async () => {
  for (const [filename, expectedHash] of Object.entries(frozenContractHashes)) {
    const bytes = await readFile(
      new URL(`../first-ceramic-author-scenarios-v0/${filename}`, import.meta.url),
    );
    const actualHash = createHash("sha256").update(bytes).digest("hex").toUpperCase();
    assert.equal(actualHash, expectedHash, filename);
  }
});

test("scope classification is mutually exclusive and exhaustive", () => {
  const classifiedIds = classifiedEntries.map(({ id }) => id);
  assert.equal(new Set(classifiedIds).size, classifiedIds.length);
  assert.deepEqual(
    [...classifiedIds].sort(),
    [...scenarioById.keys()].sort(),
  );
});

test("every scope entry preserves the frozen scenario's expected stage", () => {
  for (const { expectedStage, id } of classifiedEntries) {
    assert.ok(scenarioById.has(id), id);
    assert.equal(scenarioById.get(id).expected.stage, expectedStage, id);
  }
});

test("permanent G2 collapse remains generic defensive or future-case only", () => {
  const defensiveIds = new Set(
    scenarioScopeClassification.genericDefensiveFutureCaseOnly.G1,
  );
  assert.deepEqual(
    [...defensiveIds].sort(),
    [
      "g2-hard-counter-downgrade",
      "g2-identity-hard-counter-downgrade",
      "g2-logical-counter-downgrade",
    ],
  );

  const firstCaseIds = new Set([
    ...Object.values(
      scenarioScopeClassification.firstCaseTruthCompatibleExamples,
    ).flat(),
    ...Object.values(
      scenarioScopeClassification.firstCaseTruthCompatibleGuardrails,
    ).flat(),
  ]);
  for (const id of defensiveIds) {
    assert.ok(!firstCaseIds.has(id), id);
  }
});

test("a pure-physical first-case G2 survives every deeper local conflict probe", () => {
  const base = scenarioFixturesById["g2-alternate-physical"];

  for (const eventKey of firstCasePostG2LocalConflictEventKeys) {
    const overlayEvents = [...base.events, events[eventKey]];
    const overlayFixture = {
      ...base,
      id: `scope-overlay-${eventKey}`,
      events: overlayEvents,
      orders: [overlayEvents.map((event) => event.observationId)],
    };
    const snapshot = solveFixture(overlayFixture, overlayEvents);

    assert.equal(snapshot.stage, "G2", eventKey);
    assert.equal(snapshot.claims.identity.established, true, eventKey);
    assert.equal(snapshot.claims.majorReassembly.established, true, eventKey);
    assert.equal(snapshot.evidence.attemptCount, overlayEvents.length, eventKey);
    assert.ok(
      snapshot.evidence.observationIds.includes(events[eventKey].observationId),
      eventKey,
    );
    assert.equal(snapshot.stopping.systemAutoEnded, false, eventKey);
  }
});

test("every decision-critical G3 unknown leaves the first case at G2", () => {
  const base = scenarioFixturesById["g3-with-allowed-unknowns"];
  const blockingUnknownIds = Object.entries(unknownRegistry)
    .filter(([, policy]) => !policy.g3Allowed)
    .map(([unknownId]) => unknownId);

  for (const unknownId of blockingUnknownIds) {
    const fixture = {
      ...base,
      id: `scope-overlay-unknown-${unknownId}`,
      unknowns: [unknownId],
    };
    const snapshot = solveFixture(fixture, base.events);

    assert.equal(snapshot.stage, "G2", unknownId);
    assert.equal(snapshot.claims.identity.established, true, unknownId);
    assert.equal(snapshot.claims.majorReassembly.established, true, unknownId);
    assert.ok(snapshot.coverage.g3BlockingUnknowns.includes(unknownId), unknownId);
    assert.equal(snapshot.stopping.systemAutoEnded, false, unknownId);
  }
});
