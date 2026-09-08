/* review required: new tests and fusion-local experimental action contracts.
 * These checks establish rule behavior, not player comprehension or final UX.
 */
import assert from "node:assert/strict";
import { ACTIONS, comparisonOptions, events, actionContracts, proofRoleContracts,
  SOURCE_BINDINGS, COMPARISON_ACTION_ID } from "./local-case.mjs";
import { newSession, take, solve, factsOf, workbench, setBudget, replayLog } from "./local-session.mjs";
import { ACTIONS as frozenActions } from "../knowledge-map-slice-v0/case.mjs";
import { events as frozenEvents, actionContracts as frozenActionContracts,
  proofRoleContracts as frozenProofRoleContracts } from "../first-ceramic-author-scenarios-v0/fixtures.mjs";

let checks = 0;
const checked = (name) => { checks++; console.log(`PASS ${name}`); };
function act(session, action, options) {
  const result = take(session, action, options);
  assert.equal(result.ok, true, `${action}: ${result.why}`);
  return result;
}
function run(actions) {
  const session = newSession();
  for (const action of actions) act(session, action);
  return session;
}
const ids = {
  whole: "A.OBSERVE.WHOLE", base: "A.OBSERVE.BASE", photo: "A.LOCATE.HISTORIC_IMAGE",
  verify: "A.VERIFY.OBJECT_CONTINUITY", xray: "A.IMAGE.XRAY", compare: COMPARISON_ACTION_ID,
  accident: "A.RESEARCH.ACCIDENT", attribution: "A.RELATE.ARCHIVE.T2_TO_OBJECT",
};
const snapshot = (session) => JSON.stringify(session);

assert.equal(ACTIONS.length, 22);
assert.deepEqual(ACTIONS.map(({ id, place, cost }) => ({ id, place, cost })),
  frozenActions.map(({ id, place, cost }) => ({ id, place, cost })));
for (const key of ["xrayEarly", "identityContinuity", "repairContinuity", "documentedCrossTime"]) {
  for (const field of ["observationId", "sourceIds", "dependencyUnitId", "sharedLatentIds", "factor", "proofRoles"]) {
    assert.deepEqual(events[key][field], frozenEvents[key][field], `${key} ${field}`);
  }
  assert.equal(events[key].coverage.region, frozenEvents[key].coverage.region);
  assert.equal(events[key].coverage.object, frozenEvents[key].coverage.object);
}
assert.deepEqual(frozenEvents.xrayEarly.requiresContextFacts, ["identityObjectContinuity"]);
assert.deepEqual(frozenEvents.identityContinuity.acquisitionRequires, ["baseManufacture"]);
assert.equal(frozenEvents.repairContinuity.coverage.method, "cross-time");
assert.deepEqual(frozenEvents.repairContinuity.contextualFacts, []);
assert.ok(frozenActionContracts[ids.compare].methods["cross-time"]);
assert.equal(frozenProofRoleContracts["PROOF.MAJOR.PHYSICAL.CROSS_TIME"].method, "cross-time");
assert.notStrictEqual(actionContracts, frozenActionContracts);
assert.notStrictEqual(proofRoleContracts, frozenProofRoleContracts);
assert.deepEqual(new Set([SOURCE_BINDINGS.photo.sourceIds[0], SOURCE_BINDINGS.identityReference.sourceIds[0],
  SOURCE_BINDINGS.photoComparison.sourceIds[0]]).size, 3);
checked("22 action IDs, places and costs retained; provenance, factor, proof scope and frozen objects preserved");

const xray = newSession();
const xr = act(xray, ids.xray);
assert.ok(xr.gainedFacts.includes("currentStructureReadoutByRegion"));
assert.equal(xr.kind, "progress");
assert.ok(!solve(xray).evidence.inactiveObservationIds.includes("obs.structure.xray.early"));
assert.equal(solve(xray).claims.majorReassembly.established, false);
checked("X-ray immediately supplies current structure, without claiming a historical reconstruction");

const gate = run([ids.base]);
const preGate = snapshot(gate);
assert.equal(take(gate, ids.verify).ok, false);
assert.equal(snapshot(gate), preGate);
assert.deepEqual(workbench(gate).find((row) => row.action.id === ids.verify).needsActionIds, [ids.photo]);
act(gate, ids.photo);
act(gate, ids.verify);
assert.ok(factsOf(gate).has("t1Established"));
assert.deepEqual(gate.log.at(-1).materialObservationIds, ["obs.phase.t1", "obs.current.base"]);
checked("photo and observed base are real acquisition prerequisites; rejected verification costs no step or fee");

const photo = run([ids.xray, ids.photo, ids.whole]);
const photoReport = act(photo, ids.compare);
assert.equal(photoReport.comparisonBasis, "photo");
assert.equal(photoReport.kind, "suspended");
assert.equal(photoReport.newlyAcquired, true);
assert.deepEqual(photo.acquired.at(-1).facts, []);
assert.ok(solve(photo).evidence.observationIds.includes("obs.structure.major.cross-time"));
assert.ok(!factsOf(photo).has("crossTimeMajorChange"));
assert.equal(solve(photo).claims.majorReassembly.established, false);
const reportIndex = photo.log.length - 1;
const boundMaterials = [...photo.log[reportIndex].materialObservationIds];
act(photo, ids.base);
const interpreted = act(photo, ids.verify);
assert.ok(interpreted.gainedFacts.includes("crossTimeMajorChange"));
assert.ok(solve(photo).evidence.contextualizedObservationIds.includes("obs.structure.major.cross-time"));
assert.equal(solve(photo).claims.majorReassembly.established, true);
assert.equal(photo.log.filter((entry) => entry.observationId === "obs.structure.major.cross-time").length, 1);
assert.deepEqual(photo.log[reportIndex].materialObservationIds, boundMaterials);
const scope = SOURCE_BINDINGS.photoComparison.use;
assert.match(scope, /可见区域/);
assert.match(scope, /不能/);
checked("photo comparison report exists before attribution; later verification activates the original report, without reacquisition");

const photoFirstContext = run([ids.photo, ids.base, ids.verify, ids.whole, ids.xray]);
const directPhoto = act(photoFirstContext, ids.compare);
assert.equal(directPhoto.kind, "progress");
assert.ok(factsOf(photoFirstContext).has("crossTimeMajorChange"));
assert.deepEqual(solve(photoFirstContext).claims, solve(photo).claims);
checked("verification-first and report-first photo orders reach the same supported claims");

const archive = run([ids.whole, ids.accident]);
const archiveReport = act(archive, ids.compare);
assert.equal(archiveReport.comparisonBasis, "archive");
assert.equal(archiveReport.kind, "suspended");
assert.ok(solve(archive).evidence.observationIds.includes("obs.structure.major.documented-cross-time"));
assert.ok(!factsOf(archive).has("t2EventPhysicalCorrespondence"));
assert.equal(solve(archive).claims.majorReassembly.established, false);
const afterAttribution = act(archive, ids.attribution);
assert.ok(afterAttribution.gainedFacts.includes("t2EventPhysicalCorrespondence"));
assert.ok(afterAttribution.gainedFacts.includes("appearanceRestore"));
assert.equal(solve(archive).claims.majorReassembly.established, true);
assert.equal(archive.log.filter((entry) => entry.actionId === ids.compare).length, 1);
assert.ok(!factsOf(archive).has("crossTimeMajorChange"));
const archiveFirstContext = run([ids.whole, ids.accident, ids.attribution]);
act(archiveFirstContext, ids.compare);
assert.deepEqual(solve(archiveFirstContext).claims, solve(archive).claims);
checked("archive report can precede attribution; later assignment activates only archive corroboration and never physical cross-time facts");

const both = run([ids.whole, ids.photo, ids.xray, ids.accident]);
assert.equal(comparisonOptions(factsOf(both)).filter((option) => option.usable).length, 2);
const beforeChoice = snapshot(both);
assert.equal(take(both, ids.compare).requiresBasis, true);
assert.equal(snapshot(both), beforeChoice);
assert.equal(take(both, ids.compare, { comparisonBasis: "other" }).ok, false);
assert.equal(snapshot(both), beforeChoice);
act(both, ids.compare, { comparisonBasis: "archive" });
act(both, ids.compare, { comparisonBasis: "photo" });
assert.deepEqual(both.log.slice(-2).map((entry) => entry.comparisonBasis), ["archive", "photo"]);
assert.notEqual(both.log.at(-1).observationId, both.log.at(-2).observationId);
const unavailable = run([ids.whole, ids.accident]);
const beforeUnavailable = snapshot(unavailable);
assert.equal(take(unavailable, ids.compare, { comparisonBasis: "photo" }).ok, false);
assert.equal(snapshot(unavailable), beforeUnavailable);
checked("both bases require a recorded choice; single available basis defaults; invalid or unavailable choices never charge");

const repeated = run([ids.whole, ids.accident]);
act(repeated, ids.compare);
const beforeRepeat = solve(repeated);
const beforeBill = [...repeated.billed];
const repeat = act(repeated, ids.compare);
assert.equal(repeat.kind, "repeat");
assert.equal(repeat.newlyAcquired, false);
assert.equal(repeated.billed[2], beforeBill[2] + 1);
assert.equal(repeated.log.length, 4);
assert.deepEqual(solve(repeated).supports, beforeRepeat.supports);
assert.deepEqual(solve(repeated).evidence.observationIds, beforeRepeat.evidence.observationIds);
act(repeated, ids.attribution);
const activeSupports = solve(repeated).supports;
act(repeated, ids.compare);
assert.deepEqual(solve(repeated).supports, activeSupports);
assert.equal(solve(repeated).evidence.observationIds.filter((id) => id === "obs.structure.major.documented-cross-time").length, 1);
checked("repeated reports consume one step and one cost-tier count, while preserving one evidence contribution");

const replayed = replayLog(both.log, both.budget);
assert.deepEqual(replayed, both);
assert.deepEqual(solve(replayed), solve(both));
assert.throws(() => replayLog(both.log.map((entry) => {
  const clone = { ...entry }; if (clone.actionId === ids.compare) delete clone.comparisonBasis; return clone;
})), /lacks its recorded material basis/);
const oldPrefix = replayLog(both.log.slice(0, 3));
assert.equal(comparisonOptions(factsOf(oldPrefix)).filter((option) => option.usable).length, 1);
assert.equal(oldPrefix.acquired.some((event) => event.observationId.includes("cross-time")), false);
checked("history replay restores original material choices and observations; missing comparison history is rejected explicitly");

const oldOrder = run([ids.whole, ids.base]);
assert.equal(take(oldOrder, ids.verify).ok, false);
const sixteen = [ids.whole, ids.base, ids.photo, ids.verify, ids.accident, ids.attribution,
  "A.CORROBORATE.ARCHIVE.T2_CURRENT", "A.RESEARCH.LATE_TREATMENT", "A.RELATE.ARCHIVE.T3_TO_OBJECT",
  "A.CORROBORATE.ARCHIVE.T3_CURRENT", "A.ANALYZE.MATERIAL.SUBSTRATE", "A.INSPECT.MATERIAL.LAYER_SEQUENCE",
  "A.INSPECT.WINDOWS", "A.SYNTHESIZE.SURFACE_REGIONS", "A.ASSESS.TREATED_AND_UNTREATED", "A.TRACE.PROVENANCE_CHAIN"];
for (const alternative of [false, true]) {
  const route = [...sixteen]; if (alternative) route[6] = ids.compare;
  const session = run(route);
  assert.equal(session.log.length, 16);
  assert.equal(solve(session).stage, "G3");
  for (const claim of ["identity", "majorReassembly", "threePhase", "coherentDecisionProfile"]) {
    assert.equal(solve(session).claims[claim].established, true);
  }
}
checked("same 16-action inventory reaches all four claims on both archive routes after moving photo before verification; original ordering is intentionally no longer legal");

const all = newSession();
while (all.log.length < 22) {
  const row = workbench(all).find((item) => item.usable && !item.done);
  assert.ok(row, "all 22 actions remain reachable");
  const basis = row.action.id === ids.compare ? row.comparisonOptions.find((option) => option.usable).id : undefined;
  act(all, row.action.id, { comparisonBasis: basis });
}
assert.equal(new Set(all.log.map((entry) => entry.actionId)).size, 22);
assert.equal(all.billed.reduce((sum, count) => sum + count, 0), 22);
assert.equal(solve(all).stage, "G3");
const exhausted = snapshot(all);
assert.equal(take(all, ids.whole).ok, false);
assert.equal(snapshot(all), exhausted);
assert.equal(setBudget(all, 12).ok, false);
const stopped = newSession(); stopped.stopped = true;
const stoppedSnapshot = snapshot(stopped);
assert.equal(take(stopped, ids.whole).ok, false);
assert.equal(snapshot(stopped), stoppedSnapshot);
assert.equal(solve(stopped).stopping.systemAutoEnded, false);
const small = newSession(12); for (let index = 0; index < 12; index++) act(small, ids.whole);
assert.equal(take(small, ids.whole).ok, false);
assert.equal(small.stopped, false);
checked("all 22 actions remain accessible; budget, tier billing, stop behavior and 12-step budget are preserved");

console.log(`\n${checks}/${checks} fusion-local session checks passed.`);
console.log("review required: new tests and explicitly localized acquisition/context contracts; no frozen solver or previous tests modified.");
console.log("Not verified here: visual layout, browser interaction or human comprehension.");
