// Post-Pass scope overlay for the frozen v1 scenario contract.
// Authority: ../../../../decisions/DEC-027-v3-first-ceramic-stable-g2-and-post-g2-fallback.md
// This file classifies existing scenarios; it does not change solver behavior.

export const frozenContractHashes = Object.freeze({
  "README.md": "D4FFE289765B3F2E0D4CDC243E4F2FD2F03A89523052C877B2E4BD926DB3CE08",
  "contract.test.mjs": "F5E9550DC5FA6BF7FA7DB875F67BE32EFA5B465F747F931EA65C021E887B83FB",
  "fixtures.mjs": "B3ED4F357B8FB84EAAB4F14CAF4629E62BF11F9C44BEFA5AAD6730C3393E0FDD",
  "golden.mjs": "6814029A5C85B17719D1F8761C1F86DED5A5E2606F618F353F08F7AB798422BB",
  "manifest.json": "66C8A51637BE14460AAE3EBA2E28DEBB9CD1CA7DB5B8AC7A53D180ACEFEDBBCB",
  "solver.mjs": "E217CAF56A9961EA7C46151E1CA6B0546A6C408CCC8ECDDB21E4B9DA66EE72D1",
});

export const scenarioScopeClassification = Object.freeze({
  formatVersion: "v3-first-ceramic-scenario-scope/1",
  decisionId: "DEC-027",
  firstCaseTruthCompatibleExamples: Object.freeze({
    G1: Object.freeze([
      "g1-oriented",
      "archive-candidate-early-local-value",
      "archive-attribution-contested-not-promoted",
    ]),
    G2: Object.freeze([
      "g2-documented-stop",
      "g2-documented-cross-time-or",
      "g2-continue-no-progress",
      "g2-alternate-physical",
      "professional-evidence-early",
      "g2-surface-bad-news-stable",
      "g2-stability-bad-news-stable",
    ]),
    G3: Object.freeze(["g3-with-allowed-unknowns"]),
  }),
  firstCaseTruthCompatibleGuardrails: Object.freeze({
    G2: Object.freeze([
      "g2-out-of-scope-counter-stable",
      "g2-out-of-scope-factor-stable",
      "g2-major-weakened-stable",
      "g2-major-bounded-stable",
      "g2-insufficient-counter-unresolved",
    ]),
  }),
  genericDefensiveFutureCaseOnly: Object.freeze({
    G1: Object.freeze([
      "g2-hard-counter-downgrade",
      "g2-logical-counter-downgrade",
      "g2-identity-hard-counter-downgrade",
    ]),
  }),
  structuralAdversarialOnly: Object.freeze({
    NONE: Object.freeze(["single-test-answer-key-rejected"]),
    G1: Object.freeze([
      "marginal-splice-rejected",
      "near-complete-single-instrument-rejected",
      "near-complete-single-glue-line-rejected",
      "single-document-answer-key-rejected",
    ]),
  }),
});

export const firstCasePostG2LocalConflictEventKeys = Object.freeze([
  "t2AttributionContested",
  "t2RecordCoherenceContested",
  "t2EventCorroborationContested",
  "t3AttributionContested",
  "t3RecordCoherenceContested",
  "t3EventCorroborationContested",
  "threePhaseChronologyContested",
]);
