/*
 * Experimental defaults for layout-probe-v1 only.
 *
 * These values are deliberately collected in one place. They are not product
 * defaults and may be changed or discarded after visual comparison.
 */
export const EXPERIMENTAL_PARAMS = Object.freeze({
  canvas: Object.freeze({ width: 1400, height: 920, margin: 24 }),
  labels: Object.freeze({
    chineseGlyphWidth: 11.6,
    latinGlyphWidth: 6.4,
    lineHeight: 14,
    obsWrap: 12,
    findingWrap: 15,
    axiomWrap: 18,
    horizontalPadding: 14,
    collisionPadding: 10,
  }),
  solve: Object.freeze({
    forceIterations: 520,
    collisionPasses: 180,
    crossingPassesPerStep: 2,
    localStepSizes: Object.freeze([64, 40, 24, 14, 8]),
    edgeLabelRepairPasses: 28,
    edgeLabelRepairSteps: Object.freeze([26, 42, 64]),
    maximumForceStep: 18,
    finalMaximumForceStep: 4,
  }),
  springs: Object.freeze({
    latent: Object.freeze({ ideal: 156, strength: 0.078 }),
    caught: Object.freeze({ ideal: 164, strength: 0.084 }),
    prereq: Object.freeze({ ideal: 188, strength: 0.054 }),
    supports: Object.freeze({
      ideal: 142,
      strength: 0.150,
      longThreshold: 225,
      longStrength: 0.120,
      degreeFloor: 0.42,
    }),
  }),
  spacing: Object.freeze({
    repulsion: 41000,
    overlapPush: 0.52,
    centreGravity: 0.0014,
  }),
  stability: Object.freeze({
    newNodeMobility: 1,
    changedNodeMobility: 0.78,
    neighbourMobility: 0.50,
    remoteNodeMobility: 0.22,
    changedAnchor: 0.004,
    neighbourAnchor: 0.012,
    remoteAnchor: 0.030,
    movementMetricThreshold: 12,
  }),
  objective: Object.freeze({
    crossingPenalty: 7200,
    shallowCrossingPenalty: 3000,
    edgeLabelPenalty: 11000,
    overlapPenalty: 24000,
    boundaryPenalty: 24000,
    stabilityPenaltyScale: 0.20,
    unrelatedCrowdingDistance: 88,
    unrelatedCrowdingPenalty: 0.55,
  }),
});

export const CANVAS = EXPERIMENTAL_PARAMS.canvas;
