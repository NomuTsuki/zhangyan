export const AXES = Object.freeze({
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

export const AXIS_NAMES = Object.freeze(Object.keys(AXES));

const NUMERIC_TOLERANCE = 1e-12;
const MAX_FACTOR_GROUPS_FOR_EXHAUSTIVE_ORDER_CHECK = 7;
const COUNTER_RELATIONS = Object.freeze([
  "weakens",
  "bounds/refines",
  "hard-counterevidence",
  "logical-refutation",
]);
const FACTOR_SOLUTION_CACHE = new Map();

export class ModelConflict extends Error {
  constructor(message, reason = "UNCLASSIFIED_MODEL_CONFLICT", details = {}) {
    super(message);
    this.name = "ModelConflict";
    this.code = "MODEL_CONFLICT";
    this.reason = reason;
    this.details = stableValue(details);
  }
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

function cartesian(axisIndex, current, output) {
  if (axisIndex === AXIS_NAMES.length) {
    const id = AXIS_NAMES.map((axis) => current[axis]).join("|");
    output.push(Object.freeze({ id, ...current }));
    return;
  }
  const axis = AXIS_NAMES[axisIndex];
  for (const value of AXES[axis]) {
    cartesian(axisIndex + 1, { ...current, [axis]: value }, output);
  }
}

export function buildStateSpace() {
  const states = [];
  cartesian(0, {}, states);
  return Object.freeze(states);
}

export const STATE_SPACE = buildStateSpace();
const STATE_ID_SET = new Set(STATE_SPACE.map((state) => state.id));

function selectorMatches(state, selector = {}) {
  return Object.entries(selector).every(([axis, wanted]) => {
    if (!AXES[axis]) {
      throw new ModelConflict(
        `Unknown selector axis: ${axis}`,
        "INVALID_SELECTOR_AXIS",
        { axis },
      );
    }
    return Array.isArray(wanted) ? wanted.includes(state[axis]) : state[axis] === wanted;
  });
}

function normalizeDistribution(entries) {
  for (const entry of entries) {
    if (!Number.isFinite(entry.probability) || entry.probability < 0) {
      throw new ModelConflict(
        `Distribution entry must be finite and non-negative; got ${entry.probability}`,
        "DISTRIBUTION_ENTRY_INVALID",
        { probability: entry.probability, stateId: entry.state?.id },
      );
    }
  }
  const sum = entries.reduce((total, entry) => total + entry.probability, 0);
  if (!Number.isFinite(sum) || !(sum > 0)) {
    throw new ModelConflict(
      `Distribution must have finite positive mass; got ${sum}`,
      Number.isFinite(sum) ? "DISTRIBUTION_ZERO_MASS" : "DISTRIBUTION_MASS_NONFINITE",
      { mass: sum },
    );
  }
  return entries.map((entry) => ({ ...entry, probability: entry.probability / sum }));
}

function buildPrior(priorCells) {
  if (priorCells === undefined) {
    const probability = 1 / STATE_SPACE.length;
    return STATE_SPACE.map((state) => ({ state, probability }));
  }
  if (!Array.isArray(priorCells) || priorCells.length === 0) {
    throw new ModelConflict(
      "priorCells must be a non-empty array",
      "PRIOR_CELLS_INVALID",
    );
  }

  for (const cell of priorCells) {
    if (!Number.isFinite(cell.mass) || cell.mass < 0) {
      throw new ModelConflict(
        `Prior cell mass must be finite and non-negative; got ${cell.mass}`,
        "PRIOR_CELL_MASS_INVALID",
        { mass: cell.mass },
      );
    }
  }
  const massSum = priorCells.reduce((sum, cell) => sum + cell.mass, 0);
  if (!Number.isFinite(massSum) || Math.abs(massSum - 1) > 1e-12) {
    throw new ModelConflict(
      `Prior cell masses must sum to 1; got ${massSum}`,
      "PRIOR_INVALID_MASS_SUM",
      { massSum },
    );
  }

  const assigned = new Map();
  for (const cell of priorCells) {
    const matches = STATE_SPACE.filter((state) => selectorMatches(state, cell.when));
    if (matches.length === 0) {
      throw new ModelConflict("Prior cell matches no state", "PRIOR_CELL_EMPTY");
    }
    for (const state of matches) {
      if (assigned.has(state.id)) {
        throw new ModelConflict(
          `Overlapping prior cells at ${state.id}`,
          "PRIOR_CELLS_OVERLAP",
          { stateId: state.id },
        );
      }
      assigned.set(state.id, cell.mass / matches.length);
    }
  }
  if (assigned.size !== STATE_SPACE.length) {
    throw new ModelConflict(
      `Prior cells leave ${STATE_SPACE.length - assigned.size} states uncovered`,
      "PRIOR_CELLS_INCOMPLETE",
      { uncoveredCount: STATE_SPACE.length - assigned.size },
    );
  }
  return normalizeDistribution(
    STATE_SPACE.map((state) => ({ state, probability: assigned.get(state.id) })),
  );
}

function isUniqueStringIdArray(value, { allowEmpty = true } = {}) {
  return (
    Array.isArray(value) &&
    (allowEmpty || value.length > 0) &&
    value.every((item) => typeof item === "string" && item.length > 0) &&
    new Set(value).size === value.length
  );
}

function invalidFixtureSchema(message, details = {}) {
  throw new ModelConflict(message, "ACTION_CONTRACT_SCHEMA_INVALID", details);
}

function validateFixture(fixture) {
  for (const key of ["identity", "major", "g2Joint", "g3Profile"]) {
    const value = fixture.thresholds?.[key];
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new ModelConflict(
        `Threshold ${key} must be finite and within [0,1]; got ${value}`,
        "THRESHOLD_INVALID",
        { threshold: key, value },
      );
    }
  }
  if (
    !fixture.actionContracts ||
    typeof fixture.actionContracts !== "object" ||
    Array.isArray(fixture.actionContracts)
  ) {
    throw new ModelConflict("Fixture lacks actionContracts", "ACTION_CONTRACTS_MISSING");
  }
  for (const [actionId, actionContract] of Object.entries(fixture.actionContracts)) {
    if (
      !actionContract ||
      typeof actionContract !== "object" ||
      !actionContract.methods ||
      typeof actionContract.methods !== "object" ||
      Array.isArray(actionContract.methods)
    ) {
      invalidFixtureSchema(`Action contract ${actionId} has invalid methods`, { actionId });
    }
    for (const [method, methodContract] of Object.entries(actionContract.methods)) {
      if (!methodContract || typeof methodContract !== "object") {
        invalidFixtureSchema(`Action contract ${actionId}/${method} is invalid`, {
          actionId,
          method,
        });
      }
      for (const field of [
        "allowedDirectFacts",
        "allowedContextualFacts",
        "allowedCapabilityFacts",
        "allowedNegativeRawFacts",
        "allowedProofRoles",
        "allowedAxes",
        "requiredContextFacts",
      ]) {
        if (!isUniqueStringIdArray(methodContract[field])) {
          invalidFixtureSchema(
            `Action contract ${actionId}/${method} has invalid ${field}`,
            { actionId, field, method },
          );
        }
      }
      if (methodContract.allowedAxes.some((axis) => !AXES[axis])) {
        invalidFixtureSchema(`Action contract ${actionId}/${method} names an unknown axis`, {
          actionId,
          method,
        });
      }
      if (typeof methodContract.fixtureOnly !== "boolean") {
        invalidFixtureSchema(`Action contract ${actionId}/${method} lacks fixtureOnly boolean`, {
          actionId,
          method,
        });
      }
    }
  }
  if (
    !fixture.proofRoleContracts ||
    typeof fixture.proofRoleContracts !== "object" ||
    Array.isArray(fixture.proofRoleContracts)
  ) {
    throw new ModelConflict(
      "Fixture lacks proofRoleContracts",
      "PROOF_ROLE_CONTRACTS_MISSING",
    );
  }
  for (const [roleId, roleContract] of Object.entries(fixture.proofRoleContracts)) {
    const validCoverage =
      roleContract?.coverage &&
      typeof roleContract.coverage === "object" &&
      ["object", "region"].every(
        (key) =>
          typeof roleContract.coverage[key] === "string" && roleContract.coverage[key],
      );
    if (
      !roleContract ||
      typeof roleContract.acquisitionActionId !== "string" ||
      typeof roleContract.method !== "string" ||
      !validCoverage ||
      !isUniqueStringIdArray(roleContract.requiredFacts, { allowEmpty: false }) ||
      !Number.isInteger(roleContract.minimumSourceCount) ||
      roleContract.minimumSourceCount < 1 ||
      (roleContract.requiredSourceIds !== undefined &&
        !isUniqueStringIdArray(roleContract.requiredSourceIds, { allowEmpty: false })) ||
      (roleContract.allowedSourceIds !== undefined &&
        !isUniqueStringIdArray(roleContract.allowedSourceIds, { allowEmpty: false }))
    ) {
      throw new ModelConflict(
        `Proof role contract ${roleId} is invalid`,
        "PROOF_ROLE_CONTRACT_SCHEMA_INVALID",
        { roleId },
      );
    }
    const methodContract =
      fixture.actionContracts[roleContract.acquisitionActionId]?.methods?.[roleContract.method];
    if (!methodContract?.allowedProofRoles?.includes(roleId)) {
      throw new ModelConflict(
        `Proof role ${roleId} is not registered on its action/method`,
        "PROOF_ROLE_CONTRACT_SCHEMA_INVALID",
        { roleId },
      );
    }
  }
  for (const [actionId, actionContract] of Object.entries(fixture.actionContracts)) {
    for (const [method, methodContract] of Object.entries(actionContract.methods)) {
      for (const roleId of methodContract.allowedProofRoles) {
        const roleContract = fixture.proofRoleContracts[roleId];
        if (
          roleContract?.acquisitionActionId === actionId &&
          roleContract?.method === method
        ) {
          continue;
        }
        throw new ModelConflict(
          `Action contract ${actionId}/${method} misroutes proof role ${roleId}`,
          "PROOF_ROLE_CONTRACT_SCHEMA_INVALID",
          { actionId, method, roleId },
        );
      }
    }
  }
  if (
    !fixture.unknownRegistry ||
    typeof fixture.unknownRegistry !== "object" ||
    Array.isArray(fixture.unknownRegistry)
  ) {
    throw new ModelConflict("Fixture lacks unknownRegistry", "UNKNOWN_REGISTRY_MISSING");
  }
  for (const [unknownId, policy] of Object.entries(fixture.unknownRegistry)) {
    if (
      !policy ||
      typeof policy !== "object" ||
      Array.isArray(policy) ||
      typeof policy.g3Allowed !== "boolean"
    ) {
      throw new ModelConflict(
        `Unknown policy ${unknownId} must declare boolean g3Allowed`,
        "UNKNOWN_REGISTRY_SCHEMA_INVALID",
        { unknownId },
      );
    }
  }
  if (!["STOP", "CONTINUE"].includes(fixture.playerChoice)) {
    throw new ModelConflict(
      `Fixture playerChoice must be STOP or CONTINUE; got ${fixture.playerChoice}`,
      "PLAYER_CHOICE_INVALID",
      { playerChoice: fixture.playerChoice },
    );
  }
  for (const unknownId of fixture.unknowns ?? []) {
    if (!fixture.unknownRegistry[unknownId]) {
      throw new ModelConflict(
        `Unknown coverage ID is not registered: ${unknownId}`,
        "UNKNOWN_ID_UNREGISTERED",
        { unknownId },
      );
    }
  }
}

function validateStringIds(values, label, event) {
  if (!Array.isArray(values) || values.some((value) => typeof value !== "string" || !value)) {
    throw new ModelConflict(
      `Event ${event.observationId} has invalid ${label}`,
      "EVENT_ID_LIST_INVALID",
      { label, observationId: event.observationId },
    );
  }
  if (new Set(values).size !== values.length) {
    throw new ModelConflict(
      `Event ${event.observationId} has duplicate ${label}`,
      "EVENT_ID_LIST_DUPLICATE",
      { label, observationId: event.observationId },
    );
  }
}

function validateEvent(event, fixture) {
  for (const key of [
    "observationId",
    "sourceIds",
    "sharedLatentIds",
    "dependencyUnitId",
    "acquisitionActionId",
    "coverage",
  ]) {
    if (event[key] === undefined) {
      throw new ModelConflict(
        `Event missing ${key}`,
        "EVENT_FIELD_MISSING",
        { field: key },
      );
    }
  }
  for (const key of ["observationId", "dependencyUnitId", "acquisitionActionId"]) {
    if (typeof event[key] !== "string" || !event[key]) {
      throw new ModelConflict(
        `Event has invalid ${key}`,
        "EVENT_FIELD_INVALID",
        { field: key, observationId: event.observationId },
      );
    }
  }
  if (
    !event.coverage ||
    typeof event.coverage !== "object" ||
    ["object", "region", "method"].some(
      (key) => typeof event.coverage[key] !== "string" || !event.coverage[key],
    )
  ) {
    throw new ModelConflict(
      `Event ${event.observationId} has invalid coverage`,
      "EVENT_COVERAGE_INVALID",
      { observationId: event.observationId },
    );
  }
  validateStringIds(event.sourceIds, "sourceIds", event);
  if (event.sourceIds.length === 0) {
    throw new ModelConflict(
      `Event ${event.observationId} must declare at least one sourceId`,
      "SOURCE_IDS_EMPTY",
      { observationId: event.observationId },
    );
  }
  validateStringIds(event.sharedLatentIds, "sharedLatentIds", event);
  for (const key of ["facts", "capabilityFacts", "contextualFacts", "proofRoles"]) {
    validateStringIds(event[key] ?? [], key, event);
  }
  const factLaneMembership = new Map();
  for (const [lane, laneFacts] of [
    ["direct", event.facts ?? []],
    ["capability", event.capabilityFacts ?? []],
    ["contextual", event.contextualFacts ?? []],
  ]) {
    for (const fact of laneFacts) {
      const priorLane = factLaneMembership.get(fact);
      if (priorLane) {
        throw new ModelConflict(
          `Event ${event.observationId} repeats fact ${fact} across ${priorLane}/${lane} lanes`,
          "FACT_LANE_OVERLAP",
          { fact, lanes: [priorLane, lane], observationId: event.observationId },
        );
      }
      factLaneMembership.set(fact, lane);
    }
  }

  const actionContract = fixture.actionContracts[event.acquisitionActionId];
  if (!actionContract) {
    throw new ModelConflict(
      `Event ${event.observationId} uses unregistered action ${event.acquisitionActionId}`,
      "ACTION_UNREGISTERED",
      { actionId: event.acquisitionActionId, observationId: event.observationId },
    );
  }
  const methodContract = actionContract.methods?.[event.coverage.method];
  if (!methodContract) {
    throw new ModelConflict(
      `Action ${event.acquisitionActionId} cannot use method ${event.coverage.method}`,
      "ACTION_METHOD_UNAUTHORIZED",
      {
        actionId: event.acquisitionActionId,
        method: event.coverage.method,
        observationId: event.observationId,
      },
    );
  }
  const declaredFacts = new Set([
    ...(event.facts ?? []),
    ...(event.capabilityFacts ?? []),
    ...(event.contextualFacts ?? []),
  ]);
  for (const roleId of event.proofRoles ?? []) {
    if (!methodContract.allowedProofRoles.includes(roleId)) {
      throw new ModelConflict(
        `Action ${event.acquisitionActionId}/${event.coverage.method} cannot emit proof role ${roleId}`,
        "PROOF_ROLE_UNAUTHORIZED",
        { observationId: event.observationId, roleId },
      );
    }
    const roleContract = fixture.proofRoleContracts[roleId];
    if (
      roleContract.acquisitionActionId !== event.acquisitionActionId ||
      roleContract.method !== event.coverage.method
    ) {
      throw new ModelConflict(
        `Proof role ${roleId} is routed through the wrong action or method`,
        "PROOF_ROLE_UNAUTHORIZED",
        { observationId: event.observationId, roleId },
      );
    }
    const coverageMatches = Object.entries(roleContract.coverage).every(
      ([key, value]) => event.coverage[key] === value,
    );
    if (!coverageMatches) {
      throw new ModelConflict(
        `Proof role ${roleId} does not cover ${event.coverage.object}/${event.coverage.region}`,
        "PROOF_ROLE_COVERAGE_MISMATCH",
        { observationId: event.observationId, roleId },
      );
    }
    if (event.sourceIds.length < roleContract.minimumSourceCount) {
      throw new ModelConflict(
        `Proof role ${roleId} lacks the required source cardinality`,
        "PROOF_ROLE_SOURCE_MISMATCH",
        { observationId: event.observationId, roleId },
      );
    }
    if (
      roleContract.requiredSourceIds?.some(
        (sourceId) => !event.sourceIds.includes(sourceId),
      ) ||
      roleContract.allowedSourceIds &&
        event.sourceIds.some((sourceId) => !roleContract.allowedSourceIds.includes(sourceId))
    ) {
      throw new ModelConflict(
        `Proof role ${roleId} has an unauthorized source set`,
        "PROOF_ROLE_SOURCE_MISMATCH",
        { observationId: event.observationId, roleId },
      );
    }
    if (roleContract.requiredFacts.some((fact) => !declaredFacts.has(fact))) {
      throw new ModelConflict(
        `Proof role ${roleId} lacks a required declared fact`,
        "PROOF_ROLE_FACT_MISMATCH",
        { observationId: event.observationId, roleId },
      );
    }
  }
  const factLanes = [
    ["direct", event.facts ?? [], methodContract.allowedDirectFacts],
    ["capability", event.capabilityFacts ?? [], methodContract.allowedCapabilityFacts],
    ["contextual", event.contextualFacts ?? [], methodContract.allowedContextualFacts],
  ];
  for (const [lane, facts, allowedFacts] of factLanes) {
    for (const fact of facts) {
      if (allowedFacts.includes(fact)) continue;
      throw new ModelConflict(
        `Action ${event.acquisitionActionId}/${event.coverage.method} cannot emit ${lane} fact ${fact}`,
        "ACTION_CONTRACT_OVERREACH",
        {
          actionId: event.acquisitionActionId,
          fact,
          lane,
          method: event.coverage.method,
          observationId: event.observationId,
        },
      );
    }
  }

  const declaredContext = [...(event.requiresContextFacts ?? [])].sort();
  const requiredContext = (event.contextualFacts ?? []).length
    ? [...methodContract.requiredContextFacts].sort()
    : [];
  if (stableStringify(declaredContext) !== stableStringify(requiredContext)) {
    throw new ModelConflict(
      `Event ${event.observationId} must declare context [${requiredContext.join(",")}]`,
      "CONTEXT_CONTRACT_MISMATCH",
      { observationId: event.observationId, requiredContext },
    );
  }

  if ((event.capabilityFacts ?? []).length && !event.negativeResult) {
    throw new ModelConflict(
      `Event ${event.observationId} has capabilityFacts without negativeResult`,
      "NEGATIVE_CAPABILITY_CONTRACT_REQUIRED",
      { observationId: event.observationId },
    );
  }

  if (event.negativeResult) {
    validateStringIds(event.negativeResult.rawFactIds, "negativeResult.rawFactIds", event);
    if (
      stableStringify([...event.negativeResult.rawFactIds].sort()) !==
      stableStringify([...(event.facts ?? [])].sort())
    ) {
      throw new ModelConflict(
        `Negative event ${event.observationId} rawFactIds must equal direct facts`,
        "NEGATIVE_RAW_FACT_MISMATCH",
        { observationId: event.observationId },
      );
    }
    for (const rawFact of event.negativeResult.rawFactIds) {
      if ((methodContract.allowedNegativeRawFacts ?? []).includes(rawFact)) continue;
      throw new ModelConflict(
        `Action ${event.acquisitionActionId}/${event.coverage.method} cannot emit negative raw fact ${rawFact}`,
        "NEGATIVE_RAW_FACT_UNAUTHORIZED",
        {
          actionId: event.acquisitionActionId,
          fact: rawFact,
          method: event.coverage.method,
          observationId: event.observationId,
        },
      );
    }
    const capability = event.negativeResult.capability;
    const capabilityKeys = [
      "coverageSufficient",
      "materialSupportsSignal",
      "sensitivitySufficient",
      "targetCorrect",
    ];
    if (
      !capability ||
      stableStringify(Object.keys(capability).sort()) !== stableStringify(capabilityKeys) ||
      capabilityKeys.some((key) => typeof capability[key] !== "boolean")
    ) {
      throw new ModelConflict(
        `Negative event ${event.observationId} has invalid capability contract`,
        "NEGATIVE_CAPABILITY_INVALID",
        { observationId: event.observationId },
      );
    }
  }

  if (event.counterevidence) {
    if (!event.negativeResult) {
      throw new ModelConflict(
        `Counterevidence ${event.observationId} lacks negativeResult`,
        "COUNTER_NEGATIVE_REQUIRED",
        { observationId: event.observationId },
      );
    }
    const { relation, targetClaim } = event.counterevidence;
    if (!COUNTER_RELATIONS.includes(relation)) {
      throw new ModelConflict(
        `Unknown counterevidence relation: ${relation}`,
        "COUNTER_RELATION_INVALID",
        { observationId: event.observationId, relation },
      );
    }
    if (!fixture.claimScopeRequirements?.[targetClaim]) {
      throw new ModelConflict(
        `Unknown counterevidence target: ${targetClaim}`,
        "COUNTER_TARGET_INVALID",
        { observationId: event.observationId, targetClaim },
      );
    }
    const scope = event.counterevidence.scope;
    for (const key of ["object", "region", "time", "materialLayer", "quantifier"]) {
      if (typeof scope?.[key] !== "string" || !scope[key]) {
        throw new ModelConflict(
          `Counterevidence ${event.observationId} lacks scope ${key}`,
          "COUNTER_SCOPE_INVALID",
          { field: key, observationId: event.observationId },
        );
      }
    }
    if (scope.object !== event.coverage.object || scope.region !== event.coverage.region) {
      throw new ModelConflict(
        `Counterevidence ${event.observationId} scope must match event coverage`,
        "COUNTER_SCOPE_COVERAGE_MISMATCH",
        { observationId: event.observationId },
      );
    }
  }

  if (event.factor) {
    const axes = event.factor.affectsAxes;
    if (!Array.isArray(axes) || axes.length === 0 || new Set(axes).size !== axes.length) {
      throw new ModelConflict(
        `Factor ${event.observationId} has no affected axes`,
        "FACTOR_AXES_INVALID",
        { observationId: event.observationId },
      );
    }
    for (const axis of axes) {
      if (!AXES[axis]) {
        throw new ModelConflict(
          `Factor uses unknown axis ${axis}`,
          "FACTOR_AXIS_UNKNOWN",
          { axis, observationId: event.observationId },
        );
      }
      if (!methodContract.allowedAxes.includes(axis)) {
        throw new ModelConflict(
          `Action ${event.acquisitionActionId} cannot update axis ${axis}`,
          "ACTION_CONTRACT_OVERREACH",
          {
            actionId: event.acquisitionActionId,
            axis,
            method: event.coverage.method,
            observationId: event.observationId,
          },
        );
      }
    }
    if (!Array.isArray(event.factor.weights) || event.factor.weights.length === 0) {
      throw new ModelConflict(
        `Factor ${event.observationId} has no weight rows`,
        "FACTOR_WEIGHTS_INVALID",
        { observationId: event.observationId },
      );
    }
    for (const row of event.factor.weights) {
      if (!row || typeof row.when !== "object" || row.when === null) {
        throw new ModelConflict(
          `Factor ${event.observationId} has an invalid weight row`,
          "FACTOR_WEIGHTS_INVALID",
          { observationId: event.observationId },
        );
      }
      for (const axis of Object.keys(row.when)) {
        if (!axes.includes(axis)) {
          throw new ModelConflict(
            `Factor ${event.observationId} changes undeclared axis ${axis}`,
            "FACTOR_UNDECLARED_AXIS",
            { axis, observationId: event.observationId },
          );
        }
      }
      if (!Number.isFinite(row.weight) || row.weight < 0) {
        throw new ModelConflict(
          "Factor weight must be finite and non-negative",
          "FACTOR_WEIGHT_INVALID",
          { observationId: event.observationId, weight: row.weight },
        );
      }
    }
  }
}

function canonicalLedger(orderedEvents, fixture) {
  const byObservation = new Map();
  for (const event of orderedEvents) {
    validateEvent(event, fixture);
    const prior = byObservation.get(event.observationId);
    if (prior && stableStringify(prior) !== stableStringify(event)) {
      throw new ModelConflict(
        `Observation ID collision: ${event.observationId}`,
        "OBSERVATION_ID_COLLISION",
        { observationId: event.observationId },
      );
    }
    if (!prior) byObservation.set(event.observationId, event);
  }
  return [...byObservation.values()].sort((a, b) =>
    a.observationId.localeCompare(b.observationId),
  );
}

function capabilitySufficient(event) {
  if (!event.negativeResult) return true;
  const capability = event.negativeResult.capability;
  return [
    "targetCorrect",
    "coverageSufficient",
    "sensitivitySufficient",
    "materialSupportsSignal",
  ].every((key) => capability?.[key] === true);
}

function deriveFacts(events) {
  const facts = new Set();
  for (const event of events) {
    for (const fact of event.facts ?? []) facts.add(fact);
    if (capabilitySufficient(event)) {
      for (const fact of event.capabilityFacts ?? []) facts.add(fact);
    }
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const event of events) {
      const contextReady = (event.requiresContextFacts ?? []).every((fact) => facts.has(fact));
      if (!contextReady || !capabilitySufficient(event)) continue;
      for (const fact of event.contextualFacts ?? []) {
        if (!facts.has(fact)) {
          facts.add(fact);
          changed = true;
        }
      }
    }
  }
  return facts;
}

function contextReady(event, facts) {
  return (event.requiresContextFacts ?? []).every((fact) => facts.has(fact));
}

function proofRoleProjection(events, facts) {
  const witnesses = new Map();
  for (const event of events) {
    if (!capabilitySufficient(event) || !contextReady(event, facts)) continue;
    for (const roleId of event.proofRoles ?? []) {
      const prior = witnesses.get(roleId) ?? [];
      prior.push({
        coverage: stableValue(event.coverage),
        dependencyUnitId: event.dependencyUnitId,
        observationId: event.observationId,
        sourceIds: [...event.sourceIds].sort(),
      });
      witnesses.set(roleId, prior);
    }
  }
  return Object.fromEntries(
    [...witnesses.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([roleId, entries]) => [
        roleId,
        entries.sort((left, right) => left.observationId.localeCompare(right.observationId)),
      ]),
  );
}

function coverageProjection(events, facts) {
  const lanes = {
    direct: new Set(),
    capability: new Set(),
    contextual: new Set(),
  };
  const witnesses = new Map();

  const record = (lane, fact, event) => {
    lanes[lane].add(fact);
    const prior = witnesses.get(fact) ?? [];
    prior.push({
      dependencyUnitId: event.dependencyUnitId,
      observationId: event.observationId,
      sourceIds: [...event.sourceIds].sort(),
    });
    witnesses.set(fact, prior);
  };

  for (const event of events) {
    for (const fact of event.facts ?? []) record("direct", fact, event);
    if (!capabilitySufficient(event)) continue;
    for (const fact of event.capabilityFacts ?? []) record("capability", fact, event);
    if (!contextReady(event, facts)) continue;
    for (const fact of event.contextualFacts ?? []) record("contextual", fact, event);
  }

  const available = (...candidateFacts) =>
    candidateFacts.filter((fact) => facts.has(fact)).sort();
  const factWitnesses = Object.fromEntries(
    [...witnesses.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([fact, entries]) => [
        fact,
        entries.sort((left, right) => left.observationId.localeCompare(right.observationId)),
      ]),
  );
  const contextActivationWitnesses = Object.fromEntries(
    events
      .filter(
        (event) =>
          (event.contextualFacts ?? []).length > 0 &&
          capabilitySufficient(event) &&
          contextReady(event, facts),
      )
      .sort((left, right) => left.observationId.localeCompare(right.observationId))
      .map((event) => [
        event.observationId,
        {
          requiredFacts: [...event.requiresContextFacts].sort(),
          witnesses: Object.fromEntries(
            [...event.requiresContextFacts]
              .sort()
              .map((fact) => [fact, factWitnesses[fact] ?? []]),
          ),
        },
      ]),
  );

  return {
    contextActivationWitnesses,
    factLanes: Object.fromEntries(
      Object.entries(lanes).map(([lane, values]) => [lane, [...values].sort()]),
    ),
    factWitnesses,
    proofWitnesses: {
      g1: {
        currentBody: available("currentBody"),
        currentDecorOrBaseManufacture: available("baseManufacture", "currentDecor"),
        direction: available("directionCorpus", "directionHistoricCandidate"),
        intervention: available("interventionObservation"),
      },
      identity: {
        currentObject: available("baseManufacture", "currentBody"),
        path: available("identityComparisonExclusion", "identityObjectContinuity"),
      },
      majorReassembly: {
        currentRepairMap: available("currentRepairMap"),
        documentedCrossTime: available("t2EventPhysicalCorrespondence"),
        documentedSourceGroup: available(
          "t2RecordClaimsDamageExtent",
          "t2RecordClaimsReassembly",
        ),
        physicalCrossTime: available("crossTimeMajorChange"),
        physicalStructureMap: available("currentStructureReadoutByRegion"),
      },
      appearanceRestore: available("appearanceRestore"),
      threePhase: {
        t1: available("t1Established"),
        t2: available(
          "t2ArchiveObjectAttribution",
          "t2EventPhysicalCorrespondence",
          "t2RecordGroupCoherent",
        ),
        t3: available(
          "t3ArchiveObjectAttribution",
          "t3EventPhysicalCorrespondence",
          "t3RecordGroupCoherent",
        ),
      },
      coherentDecisionProfile: {
        documentation: available("documentationBoundary", "documentationNoConflict"),
        keyMaterial: available(
          "keyMaterialLayerSequenceReadings",
          "keyMaterialSubstrateReadings",
        ),
        stability: available("displayConditionSpecified", "stabilityResolved"),
        surface: available(
          "surfacePointLayering",
          "surfaceRegionalCoverage",
          "surfaceResolved",
        ),
      },
    },
  };
}

export function assertLegalAcquisitionOrder(orderedEvents) {
  const acquired = [];
  for (const event of orderedEvents) {
    const facts = deriveFacts(acquired);
    const missing = (event.acquisitionRequires ?? []).filter((fact) => !facts.has(fact));
    if (missing.length) {
      throw new ModelConflict(
        `ILLEGAL_ACQUISITION_ORDER ${event.observationId}; missing ${missing.join(",")}`,
        "ILLEGAL_ACQUISITION_ORDER",
        { missing, observationId: event.observationId },
      );
    }
    acquired.push(event);
  }
  return true;
}

function factorWeight(factor, state) {
  if (factor.components) {
    let product = 1;
    for (const component of factor.components) {
      product *= factorWeight(component, state);
      if (!Number.isFinite(product)) {
        throw new ModelConflict(
          `Combined factor ${factor.id} overflows at ${state.id}`,
          "DERIVED_FACTOR_WEIGHT_NONFINITE",
          { factorId: factor.id, stateId: state.id },
        );
      }
    }
    return product;
  }
  const rows = factor.weights.filter((row) => selectorMatches(state, row.when));
  if (rows.length !== 1) {
    throw new ModelConflict(
      `Factor ${factor.id} must match exactly one weight row for ${state.id}; got ${rows.length}`,
      "FACTOR_ROW_COVERAGE_INVALID",
      { factorId: factor.id, matchCount: rows.length, stateId: state.id },
    );
  }
  return rows[0].weight;
}

function applyAxisPreservingFactor(distribution, factor) {
  const unaffected = AXIS_NAMES.filter((axis) => !factor.affectsAxes.includes(axis));
  const groups = new Map();
  for (const entry of distribution) {
    const key = unaffected.map((axis) => entry.state[axis]).join("|");
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }

  const updated = [];
  for (const group of groups.values()) {
    const groupMass = group.reduce((sum, entry) => sum + entry.probability, 0);
    const weighted = group.map((entry) => {
      const probability = entry.probability * factorWeight(factor, entry.state);
      if (!Number.isFinite(probability)) {
        throw new ModelConflict(
          `Factor ${factor.id} produces non-finite mass at ${entry.state.id}`,
          "DERIVED_FACTOR_MASS_NONFINITE",
          { factorId: factor.id, stateId: entry.state.id },
        );
      }
      return { ...entry, weighted: probability };
    });
    const denominator = weighted.reduce((sum, entry) => sum + entry.weighted, 0);
    if (!Number.isFinite(denominator)) {
      throw new ModelConflict(
        `Factor ${factor.id} produces non-finite stratum mass`,
        "DERIVED_FACTOR_MASS_NONFINITE",
        { factorId: factor.id },
      );
    }
    if (!(denominator > 0)) {
      throw new ModelConflict(
        `Factor ${factor.id} removes an entire preserved marginal stratum`,
        "FACTOR_REMOVES_STRATUM",
        { factorId: factor.id },
      );
    }
    for (const entry of weighted) {
      updated.push({
        state: entry.state,
        probability: groupMass * (entry.weighted / denominator),
      });
    }
  }
  return updated.sort((a, b) => a.state.id.localeCompare(b.state.id));
}

function foldedFactors(events, facts, fixture) {
  const byUnit = new Map();
  const inactiveObservationIds = [];
  const unresolvedNegativeIds = [];
  const contextualizedObservationIds = [];
  const scopeLimitedObservationIds = [];

  for (const event of events) {
    const ready = contextReady(event, facts);
    const capable = capabilitySufficient(event);
    if ((event.requiresContextFacts ?? []).length && ready) {
      contextualizedObservationIds.push(event.observationId);
    }
    if (event.negativeResult && !capable) unresolvedNegativeIds.push(event.observationId);
    if (!event.factor) continue;
    if (!ready || !capable) {
      inactiveObservationIds.push(event.observationId);
      continue;
    }
    if (event.counterevidence && !counterScopeProjection(event, fixture).scopeMatch) {
      inactiveObservationIds.push(event.observationId);
      scopeLimitedObservationIds.push(event.observationId);
      continue;
    }

    const signature = stableStringify(event.factor);
    const current = byUnit.get(event.dependencyUnitId);
    if (current && current.signature !== signature) {
      throw new ModelConflict(
        `Dependency unit ${event.dependencyUnitId} contains conflicting factors`,
        "DEPENDENCY_UNIT_FACTOR_CONFLICT",
        { dependencyUnitId: event.dependencyUnitId },
      );
    }
    if (!current) {
      byUnit.set(event.dependencyUnitId, {
        unitId: event.dependencyUnitId,
        factor: event.factor,
        signature,
        observationIds: [event.observationId],
        sourceIds: [...event.sourceIds],
        sharedLatentIds: [...event.sharedLatentIds],
      });
    } else {
      current.observationIds.push(event.observationId);
      current.sourceIds.push(...event.sourceIds);
      current.sharedLatentIds.push(...event.sharedLatentIds);
    }
  }

  const factors = [...byUnit.values()]
    .map((unit) => ({
      ...unit,
      sourceIds: [...new Set(unit.sourceIds)].sort(),
      sharedLatentIds: [...new Set(unit.sharedLatentIds)].sort(),
    }))
    .sort((a, b) => a.unitId.localeCompare(b.unitId));

  for (let leftIndex = 0; leftIndex < factors.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < factors.length; rightIndex += 1) {
      const left = factors[leftIndex];
      const right = factors[rightIndex];
      const sharedSources = left.sourceIds.filter((id) => right.sourceIds.includes(id));
      const sharedLatents = left.sharedLatentIds.filter((id) =>
        right.sharedLatentIds.includes(id),
      );
      if (sharedSources.length || sharedLatents.length) {
        throw new ModelConflict(
          `Dependency units ${left.unitId} and ${right.unitId} share undeclared dependencies; ` +
          `sources=[${sharedSources.join(",")}], latents=[${sharedLatents.join(",")}]`,
          "DEPENDENCY_PARTITION_CONFLICT",
          {
            leftUnitId: left.unitId,
            rightUnitId: right.unitId,
            sharedLatentIds: sharedLatents,
            sharedSourceIds: sharedSources,
          },
        );
      }
    }
  }

  return {
    factors,
    inactiveObservationIds: inactiveObservationIds.sort(),
    unresolvedNegativeIds: unresolvedNegativeIds.sort(),
    contextualizedObservationIds: contextualizedObservationIds.sort(),
    scopeLimitedObservationIds: scopeLimitedObservationIds.sort(),
  };
}

function groupedFactors(units) {
  const byAxes = new Map();
  for (const unit of units) {
    const affectsAxes = [...unit.factor.affectsAxes].sort((left, right) =>
      AXIS_NAMES.indexOf(left) - AXIS_NAMES.indexOf(right),
    );
    const key = affectsAxes.join("|");
    const current = byAxes.get(key) ?? { affectsAxes, components: [] };
    current.components.push(unit.factor);
    byAxes.set(key, current);
  }
  return [...byAxes.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, group]) => ({
      id: `fixture.factor-group.${key}`,
      affectsAxes: group.affectsAxes,
      components: group.components,
    }));
}

function permutations(items) {
  if (items.length <= 1) return [items];
  const output = [];
  for (let index = 0; index < items.length; index += 1) {
    const head = items[index];
    const tail = [...items.slice(0, index), ...items.slice(index + 1)];
    for (const suffix of permutations(tail)) output.push([head, ...suffix]);
  }
  return output;
}

function applyFactorOrder(prior, factorOrder) {
  let distribution = prior;
  for (const factor of factorOrder) {
    distribution = applyAxisPreservingFactor(distribution, factor);
  }
  return normalizeDistribution(distribution);
}

function maximumProbabilityDelta(left, right) {
  return left.reduce(
    (maximum, entry, index) =>
      Math.max(maximum, Math.abs(entry.probability - right[index].probability)),
    0,
  );
}

function solveOrderIndependentFactors(prior, units) {
  const groups = groupedFactors(units);
  if (groups.length > MAX_FACTOR_GROUPS_FOR_EXHAUSTIVE_ORDER_CHECK) {
    throw new ModelConflict(
      `Validation solver cannot exhaustively check ${groups.length} factor-axis groups`,
      "VALIDATION_EXHAUSTION_LIMIT",
      { groupCount: groups.length },
    );
  }
  if (groups.length === 0) return prior;

  const cacheKey = stableStringify({
    factors: groups,
    prior: prior.map((entry) => entry.probability),
  });
  const cached = FACTOR_SOLUTION_CACHE.get(cacheKey);
  if (cached) return cached;

  const orders = permutations(groups);
  const baseline = applyFactorOrder(prior, orders[0]);
  for (const order of orders.slice(1)) {
    const candidate = applyFactorOrder(prior, order);
    const delta = maximumProbabilityDelta(baseline, candidate);
    if (delta > NUMERIC_TOLERANCE) {
      throw new ModelConflict(
        `Axis-preserving factor constraints are order-dependent; maxDelta=${delta}`,
        "FACTOR_ORDER_DEPENDENT",
        { maxDelta: delta },
      );
    }
  }
  FACTOR_SOLUTION_CACHE.set(cacheKey, baseline);
  return baseline;
}

function scopeMatches(scope, requirement) {
  return Object.entries(requirement).every(([key, wanted]) => {
    const actual = scope[key];
    return Array.isArray(wanted) ? wanted.includes(actual) : actual === wanted;
  });
}

function counterScopeProjection(event, fixture) {
  const scope = event.counterevidence.scope;
  for (const key of ["object", "region", "time", "materialLayer", "quantifier"]) {
    if (!scope?.[key]) {
      throw new ModelConflict(
        `Counterevidence ${event.observationId} lacks scope ${key}`,
        "COUNTER_SCOPE_INVALID",
        { field: key, observationId: event.observationId },
      );
    }
  }
  const declaredRelation = event.counterevidence.relation;
  const targetClaim = event.counterevidence.targetClaim;
  const requirement = fixture.claimScopeRequirements[targetClaim];
  const scopeMatch = scopeMatches(scope, requirement);
  const potentiallyBlocking = ["hard-counterevidence", "logical-refutation"].includes(
    declaredRelation,
  );
  return {
    blocking: potentiallyBlocking && scopeMatch,
    declaredRelation,
    relation: potentiallyBlocking && !scopeMatch ? "bounds/refines" : declaredRelation,
    scopeMatch,
    targetClaim,
    scope: stableValue(scope),
  };
}

function activeConflicts(events, facts, fixture) {
  return events
    .filter(
      (event) =>
        event.counterevidence && contextReady(event, facts) && capabilitySufficient(event),
    )
    .map((event) => ({
        observationId: event.observationId,
        ...counterScopeProjection(event, fixture),
      }))
    .sort((a, b) => a.observationId.localeCompare(b.observationId));
}

function support(distribution, selector) {
  return distribution
    .filter((entry) => selectorMatches(entry.state, selector))
    .reduce((sum, entry) => sum + entry.probability, 0);
}

function supportPredicate(distribution, predicate) {
  return distribution
    .filter((entry) => predicate(entry.state))
    .reduce((sum, entry) => sum + entry.probability, 0);
}

function rounded(value) {
  return Number(value.toFixed(15));
}

function archiveRelationshipProjection(facts, proofRoleWitnesses) {
  const hasRole = (roleId) => (proofRoleWitnesses[roleId] ?? []).length > 0;
  const status = ({ contested = false, established = false, suggestive = false }) => {
    if (contested) return "contested";
    if (established) return "established";
    if (suggestive) return "suggestive";
    return "unresolved";
  };
  const t2 = {
    eventCorroboration: status({
      contested: facts.has("t2EventPhysicalCorrespondenceContested"),
      established:
        hasRole("PROOF.ARCHIVE.T2.EVENT_CURRENT_CORROBORATION") ||
        hasRole("PROOF.ARCHIVE.T2.EVENT_CROSS_TIME_CORROBORATION"),
      suggestive:
        facts.has("currentRepairMap") ||
        facts.has("currentStructureReadoutByRegion") ||
        facts.has("t2EventPhysicalCorrespondence"),
    }),
    objectAttribution: status({
      contested: facts.has("t2ArchiveObjectAttributionContested"),
      established: hasRole("PROOF.ARCHIVE.T2.OBJECT_ATTRIBUTION"),
      suggestive: facts.has("t2ArchiveObjectLinkCandidate"),
    }),
    recordCoherence: status({
      contested: facts.has("t2ArchiveRecordCoherenceContested"),
      established: hasRole("PROOF.ARCHIVE.T2.RECORD_COHERENCE"),
      suggestive:
        facts.has("t2RecordClaimsDamageExtent") ||
        facts.has("t2RecordClaimsReassembly"),
    }),
  };
  const t3 = {
    eventCorroboration: status({
      contested: facts.has("t3EventPhysicalCorrespondenceContested"),
      established: hasRole("PROOF.ARCHIVE.T3.EVENT_CURRENT_CORROBORATION"),
      suggestive: facts.has("t3EventPhysicalCorrespondence") || facts.has("stabilityResolved"),
    }),
    objectAttribution: status({
      contested: facts.has("t3ArchiveObjectAttributionContested"),
      established: hasRole("PROOF.ARCHIVE.T3.OBJECT_ATTRIBUTION"),
      suggestive: facts.has("t3ArchiveObjectLinkCandidate"),
    }),
    recordCoherence: status({
      contested: facts.has("t3ArchiveRecordCoherenceContested"),
      established: hasRole("PROOF.ARCHIVE.T3.RECORD_COHERENCE"),
      suggestive: facts.has("t3RecordClaimsLocalTreatment"),
    }),
  };
  const allEstablished = (questions) =>
    Object.values(questions).every((questionStatus) => questionStatus === "established");
  return {
    t2: { ...t2, systemAttributionEstablished: allEstablished(t2) },
    t3: { ...t3, systemAttributionEstablished: allEstablished(t3) },
  };
}

function axisMarginals(distribution) {
  return Object.fromEntries(
    AXIS_NAMES.map((axis) => [
      axis,
      Object.fromEntries(
        AXES[axis].map((value) => [
          value,
          rounded(support(distribution, { [axis]: value })),
        ]),
      ),
    ]),
  );
}

function claimProjection(distribution, facts, conflicts, fixture, proofRoleWitnesses) {
  const blockingConflicts = conflicts.filter((conflict) => conflict.blocking);
  const blocked = new Set(blockingConflicts.map((conflict) => conflict.targetClaim));
  const hardContested = new Set(
    blockingConflicts
      .filter((conflict) => conflict.relation === "hard-counterevidence")
      .map((conflict) => conflict.targetClaim),
  );
  const logicallyRefuted = new Set(
    blockingConflicts
      .filter((conflict) => conflict.relation === "logical-refutation")
      .map((conflict) => conflict.targetClaim),
  );
  const identitySupport = support(distribution, { Identity: "LATE18_EXPORT" });
  const majorSupport = supportPredicate(
    distribution,
    (state) => state.RepairHistory !== "NO_MAJOR_REASSEMBLY",
  );
  const g2JointSupport = supportPredicate(
    distribution,
    (state) =>
      state.Identity === "LATE18_EXPORT" &&
      state.RepairHistory !== "NO_MAJOR_REASSEMBLY",
  );
  const profileSupport = fixture.expectedProfile
    ? support(distribution, fixture.expectedProfile)
    : 0;
  const g3BlockingUnknowns = (fixture.unknowns ?? []).filter(
    (unknownId) => !fixture.unknownRegistry[unknownId].g3Allowed,
  );

  const g1 =
    facts.has("currentBody") &&
    (facts.has("currentDecor") || facts.has("baseManufacture")) &&
    facts.has("interventionObservation") &&
    (facts.has("directionCorpus") || facts.has("directionHistoricCandidate")) &&
    !blocked.has("STAGE_RESULT.G1.ORIENTED_CASE");

  const identityProof =
    facts.has("currentBody") &&
    facts.has("baseManufacture") &&
    (facts.has("identityObjectContinuity") || facts.has("identityComparisonExclusion"));
  const identityEstablished =
    identityProof &&
    identitySupport >= fixture.thresholds.identity &&
    !blocked.has("CLAIM.IDENTITY.LATE18_EXPORT");

  const hasProofRole = (roleId) => (proofRoleWitnesses[roleId] ?? []).length > 0;
  const archiveRelations = archiveRelationshipProjection(facts, proofRoleWitnesses);
  const currentRepairMapProof =
    facts.has("currentRepairMap") &&
    hasProofRole("PROOF.CURRENT.NAMED_REPAIR_MAP");
  const documentedCurrentProof =
    facts.has("t2EventPhysicalCorrespondence") &&
    hasProofRole("PROOF.ARCHIVE.T2.EVENT_CURRENT_CORROBORATION");
  const documentedCrossTimeProof =
    facts.has("t2EventPhysicalCorrespondence") &&
    hasProofRole("PROOF.ARCHIVE.T2.EVENT_CROSS_TIME_CORROBORATION");
  const documentedMajorProof =
    facts.has("t2RecordClaimsDamageExtent") &&
    facts.has("t2RecordClaimsReassembly") &&
    archiveRelations.t2.systemAttributionEstablished &&
    (documentedCurrentProof || documentedCrossTimeProof);
  const physicalMajorProof =
    currentRepairMapProof &&
    facts.has("currentStructureReadoutByRegion") &&
    facts.has("crossTimeMajorChange") &&
    hasProofRole("PROOF.MAJOR.PHYSICAL.STRUCTURE_MAP") &&
    hasProofRole("PROOF.MAJOR.PHYSICAL.CROSS_TIME");
  const majorProof = documentedMajorProof || physicalMajorProof;
  const majorEstablished =
    majorProof &&
    majorSupport >= fixture.thresholds.major &&
    !blocked.has("CLAIM.REPAIR.MAJOR_REASSEMBLY");

  const g2 =
    g1 &&
    identityEstablished &&
    majorEstablished &&
    facts.has("appearanceRestore") &&
    g2JointSupport >= fixture.thresholds.g2Joint;

  const threePhaseProof =
    facts.has("t1Established") &&
    archiveRelations.t2.systemAttributionEstablished &&
    archiveRelations.t3.systemAttributionEstablished &&
    !facts.has("threePhaseChronologyContested") &&
    !blocked.has("CLAIM.REPAIR.THREE_PHASE");
  const coreResolved =
    facts.has("keyMaterialSubstrateReadings") &&
    facts.has("keyMaterialLayerSequenceReadings") &&
    facts.has("surfacePointLayering") &&
    facts.has("surfaceRegionalCoverage") &&
    facts.has("surfaceResolved") &&
    facts.has("displayConditionSpecified") &&
    facts.has("stabilityResolved") &&
    facts.has("documentationBoundary") &&
    facts.has("documentationNoConflict");
  const g3 =
    g2 &&
    threePhaseProof &&
    coreResolved &&
    g3BlockingUnknowns.length === 0 &&
    profileSupport >= fixture.thresholds.g3Profile &&
    !blocked.has("STAGE_RESULT.G3.COHERENT_DECISION_PROFILE");

  const stage = g3 ? "G3" : g2 ? "G2" : g1 ? "G1" : "NONE";
  return {
    claims: {
      g1: { established: g1 },
      identity: {
        established: identityEstablished,
        contested: hardContested.has("CLAIM.IDENTITY.LATE18_EXPORT"),
        logicallyRefuted: logicallyRefuted.has("CLAIM.IDENTITY.LATE18_EXPORT"),
      },
      majorReassembly: {
        established: majorEstablished,
        contested: hardContested.has("CLAIM.REPAIR.MAJOR_REASSEMBLY"),
        logicallyRefuted: logicallyRefuted.has("CLAIM.REPAIR.MAJOR_REASSEMBLY"),
      },
      threePhase: { established: threePhaseProof },
      coherentDecisionProfile: { established: g3 },
    },
    stage,
    supports: {
      identity: rounded(identitySupport),
      major: rounded(majorSupport),
      g2Joint: rounded(g2JointSupport),
      g3Profile: rounded(profileSupport),
    },
    g3BlockingUnknowns: [...g3BlockingUnknowns].sort(),
    archiveRelations,
    majorProofPaths: {
      documented: documentedMajorProof,
      physical: physicalMajorProof,
    },
  };
}

export function assertSessionCanAcceptEvidence(snapshot) {
  const stopping = snapshot?.stopping;
  const validStages = ["NONE", "G1", "G2", "G3"];
  const validChoice = ["STOP", "CONTINUE"].includes(stopping?.playerChoice);
  const validAutoEnd = stopping?.systemAutoEnded === false;
  const validSnapshotStage = validStages.includes(snapshot?.stage);
  const validFrozenStage =
    stopping?.playerChoice === "STOP"
      ? validStages.includes(stopping.frozenStage) && stopping.frozenStage === snapshot.stage
      : stopping?.frozenStage === null;
  if (!validChoice || !validAutoEnd || !validSnapshotStage || !validFrozenStage) {
    throw new ModelConflict(
      "Snapshot has an invalid stopping contract",
      "STOPPING_SNAPSHOT_INVALID",
      { stopping },
    );
  }
  if (stopping.playerChoice === "STOP") {
    throw new ModelConflict(
      `Run is frozen at ${stopping.frozenStage}`,
      "RUN_FROZEN",
      { frozenStage: stopping.frozenStage },
    );
  }
  return true;
}

export function solveFixture(fixture, orderedEvents) {
  if (fixture.resumeFromSnapshot) assertSessionCanAcceptEvidence(fixture.resumeFromSnapshot);
  validateFixture(fixture);
  assertLegalAcquisitionOrder(orderedEvents);
  const ledger = canonicalLedger(orderedEvents, fixture);
  const facts = deriveFacts(ledger);
  const folded = foldedFactors(ledger, facts, fixture);
  const distribution = solveOrderIndependentFactors(
    buildPrior(fixture.priorCells),
    folded.factors,
  );
  const conflicts = activeConflicts(ledger, facts, fixture);
  const proofRoleWitnesses = proofRoleProjection(ledger, facts);
  const projection = claimProjection(
    distribution,
    facts,
    conflicts,
    fixture,
    proofRoleWitnesses,
  );
  const projectedCoverage = coverageProjection(ledger, facts);

  return stableValue({
    posterior: distribution.map((entry) => ({
      stateId: entry.state.id,
      probability: rounded(entry.probability),
    })),
    marginals: axisMarginals(distribution),
    claims: projection.claims,
    conflicts,
    coverage: {
      facts: [...facts].sort(),
      ...projectedCoverage,
      g3BlockingUnknowns: projection.g3BlockingUnknowns,
      archiveRelations: projection.archiveRelations,
      majorProofPaths: projection.majorProofPaths,
      unknowns: [...(fixture.unknowns ?? [])].sort(),
      observations: ledger.map((event) => ({
        observationId: event.observationId,
        coverage: stableValue(event.coverage),
      })),
      proofRoleWitnesses,
    },
    stage: projection.stage,
    supports: projection.supports,
    stopping: {
      frozenStage: fixture.playerChoice === "STOP" ? projection.stage : null,
      playerChoice: fixture.playerChoice,
      systemAutoEnded: false,
    },
    evidence: {
      attemptCount: orderedEvents.length,
      observationIds: ledger.map((event) => event.observationId),
      activeDependencyUnits: folded.factors.map((unit) => ({
        unitId: unit.unitId,
        observationIds: unit.observationIds.sort(),
        sharedLatentIds: unit.sharedLatentIds,
        sourceIds: unit.sourceIds,
      })),
      inactiveObservationIds: folded.inactiveObservationIds,
      unresolvedNegativeIds: folded.unresolvedNegativeIds,
      contextualizedObservationIds: folded.contextualizedObservationIds,
      scopeLimitedObservationIds: folded.scopeLimitedObservationIds,
    },
  });
}

export function projectPosterior(snapshot, axes) {
  if (
    !Array.isArray(axes) ||
    axes.length === 0 ||
    new Set(axes).size !== axes.length ||
    axes.some((axis) => !AXES[axis])
  ) {
    throw new ModelConflict(
      "Projection axes must be a non-empty unique subset of registered axes",
      "PROJECTION_AXES_INVALID",
      { axes },
    );
  }
  if (!Array.isArray(snapshot?.posterior) || snapshot.posterior.length !== STATE_SPACE.length) {
    throw new ModelConflict(
      `Projection requires a complete ${STATE_SPACE.length}-state posterior`,
      "POSTERIOR_SNAPSHOT_INVALID",
      { stateCount: snapshot?.posterior?.length },
    );
  }

  const totals = new Map();
  const seenStateIds = new Set();
  let mass = 0;
  for (const entry of snapshot.posterior) {
    if (
      !entry ||
      typeof entry.stateId !== "string" ||
      !STATE_ID_SET.has(entry.stateId) ||
      seenStateIds.has(entry.stateId)
    ) {
      throw new ModelConflict(
        `Projection received an invalid or duplicate state ID: ${entry?.stateId}`,
        "POSTERIOR_STATE_INVALID",
        { stateId: entry?.stateId },
      );
    }
    if (!Number.isFinite(entry.probability) || entry.probability < 0) {
      throw new ModelConflict(
        `Projection probability must be finite and non-negative; got ${entry.probability}`,
        "POSTERIOR_ENTRY_INVALID",
        { probability: entry.probability, stateId: entry.stateId },
      );
    }
    seenStateIds.add(entry.stateId);
    mass += entry.probability;
    const stateValues = entry.stateId.split("|");
    const state = Object.fromEntries(AXIS_NAMES.map((axis, index) => [axis, stateValues[index]]));
    const key = axes.map((axis) => state[axis]).join("|");
    totals.set(key, (totals.get(key) ?? 0) + entry.probability);
  }
  if (!Number.isFinite(mass) || Math.abs(mass - 1) > NUMERIC_TOLERANCE) {
    throw new ModelConflict(
      `Projection posterior mass must equal 1; got ${mass}`,
      "POSTERIOR_MASS_INVALID",
      { mass },
    );
  }
  return Object.fromEntries(
    [...totals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, rounded(value)]),
  );
}
