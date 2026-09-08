/* Fusion-local material and interpretation session. The shared frozen solver
 * evaluates local contracts; no frozen implementation or numeric value changes.
 */
import { thresholds, expectedProfile, claimScopeRequirements, unknownRegistry } from "../first-ceramic-author-scenarios-v0/fixtures.mjs";
import { solveFixture, assertLegalAcquisitionOrder } from "../first-ceramic-author-scenarios-v0/solver.mjs";
import { BUDGET_MIN, BUDGET_MAX, BUDGET_DEFAULT, clampBudget, newSession, setBudget } from "../workbench-map-v0/session.mjs";
import { ACTION_BY_ID, availability, events, actionContracts, proofRoleContracts,
  comparisonOptions, COMPARISON_ACTION_ID, SOURCE_BINDINGS } from "./local-case.mjs";

export { BUDGET_MIN, BUDGET_MAX, BUDGET_DEFAULT, clampBudget, newSession, setBudget };

function liveFixture(acquired, playerChoice) {
  return { id: "fusion-local-material-logic", thresholds, expectedProfile, claimScopeRequirements,
    actionContracts, proofRoleContracts, unknownRegistry, playerChoice, events: acquired,
    orders: [acquired.map((event) => event.observationId)], expected: {} };
}

export function solve(session) {
  return solveFixture(liveFixture(session.acquired, session.stopped ? "STOP" : "CONTINUE"), session.acquired);
}
export function factsOf(session) {
  return new Set(session.acquired.length ? solve(session).coverage.facts : []);
}
export function workbench(session) {
  return availability(factsOf(session), session.log.map((entry) => entry.actionId)).map((row) => ({
    ...row, affordable: session.log.length < session.budget && !session.stopped,
  }));
}

export function take(session, actionId, options = {}) {
  if (session.stopped) return { ok: false, why: "本局已经收手" };
  if (session.log.length >= session.budget) return { ok: false, why: "行动点数已经用完" };
  const action = ACTION_BY_ID.get(actionId);
  if (!action) return { ok: false, why: `没有这个动作:${actionId}` };
  const facts = factsOf(session);
  const row = availability(facts, session.log.map((entry) => entry.actionId)).find((item) => item.action.id === actionId);
  if (!row.usable) return { ok: false, why: row.why };
  let comparison = null;
  if (actionId === COMPARISON_ACTION_ID) {
    const choices = comparisonOptions(facts);
    const usable = choices.filter((choice) => choice.usable);
    if (options.comparisonBasis) {
      comparison = choices.find((choice) => choice.id === options.comparisonBasis);
      if (!comparison?.usable) return { ok: false, why: comparison?.why ?? "没有这种比较材料", comparisonOptions: choices };
    } else if (usable.length === 1) comparison = usable[0];
    else return { ok: false, why: "请先选择这次要比较的材料。", requiresBasis: true, comparisonOptions: choices };
  }
  const eventKey = comparison?.eventKey ?? action.outcome(facts);
  const event = events[eventKey];
  const acquired = [...session.acquired, event];
  try { assertLegalAcquisitionOrder(acquired); }
  catch (error) { return { ok: false, why: `顺序非法:${error.message}` }; }
  const before = solve(session);
  // Validate before committing so a contract error cannot half-charge an action.
  const after = solveFixture(liveFixture(acquired, "CONTINUE"), acquired);
  const materialObservationIds = comparison ? [...comparison.materialObservationIds]
    : actionId === "A.VERIFY.OBJECT_CONTINUITY" ? [...SOURCE_BINDINGS.identityReference.materialObservationIds] : [];
  const entry = { actionId, eventKey, observationId: event.observationId, cost: action.cost,
    materialObservationIds, ...(comparison ? { comparisonBasis: comparison.id } : {}) };
  session.acquired = acquired;
  session.billed[action.cost] += 1;
  session.log.push(entry);
  const gainedFacts = after.coverage.facts.filter((fact) => !before.coverage.facts.includes(fact));
  const repeated = before.evidence.observationIds.includes(event.observationId);
  const newlyAcquired = !repeated;
  const kind = repeated || gainedFacts.includes("repeatObservation") ? "repeat"
    : after.evidence.unresolvedNegativeIds.includes(event.observationId) ? "negative"
    : event.requiresContextFacts.some((fact) => !after.coverage.facts.includes(fact)) ? "suspended"
    : gainedFacts.filter((fact) => fact !== "repeatObservation").length === 0 ? "deadend" : "progress";
  return { ok: true, kind, gainedFacts, observationId: event.observationId, newlyAcquired,
    comparisonBasis: comparison?.id ?? null, materialObservationIds,
    stageMoved: before.stage !== after.stage, from: before.stage, to: after.stage, before, after };
}

// Replay stored choices, never resolve A13 again from a later session's facts.
export function replayLog(log, budget = BUDGET_DEFAULT, stopped = false) {
  const session = newSession(budget);
  for (const entry of log) {
    const basis = entry.comparisonBasis;
    if (entry.actionId === COMPARISON_ACTION_ID && !basis) {
      throw new Error("Comparison history lacks its recorded material basis");
    }
    const result = take(session, entry.actionId, { comparisonBasis: basis });
    if (!result.ok) throw new Error(`Cannot replay ${entry.actionId}: ${result.why}`);
    const actual = session.log.at(-1);
    if (entry.observationId && actual.observationId !== entry.observationId) throw new Error("Replay observation mismatch");
    if (entry.materialObservationIds && JSON.stringify(entry.materialObservationIds) !== JSON.stringify(actual.materialObservationIds)) {
      throw new Error("Replay material binding mismatch");
    }
  }
  session.stopped = stopped;
  return session;
}
