import assert from "node:assert/strict";
import test from "node:test";

import { lacquerBoxCase } from "../content/lacquer-box.ts";
import {
  calculateNpcPosterior,
  calculatePosterior,
  normalizePosterior,
  posteriorEntropy,
  posteriorExpectedValue,
  posteriorQuantile,
} from "../game/belief.ts";
import {
  calculateNpcPosterior as calculateNpcPosteriorFromFacade,
  calculatePosterior as calculatePosteriorFromFacade,
} from "../game/resolve-action.ts";

function assertNormalized(posterior) {
  const total = posterior.reduce((sum, entry) => sum + entry.probability, 0);
  assert.ok(
    Math.abs(total - 1) <= 1e-10,
    `posterior must sum to one; received ${total}`,
  );
  for (const entry of posterior) {
    assert.ok(Number.isFinite(entry.probability));
    assert.ok(entry.probability >= 0);
  }
}

test("player posterior is normalized and evidence order independent", () => {
  const evidenceIds = ["modern-adhesive-trace", "restored-interior"];
  const forward = calculatePosterior(lacquerBoxCase, evidenceIds);
  const reverse = calculatePosterior(lacquerBoxCase, [...evidenceIds].reverse());

  assert.deepEqual(forward, reverse);
  assertNormalized(forward);
});

test("normalization fails closed for invalid weights", () => {
  assert.throws(
    () => normalizePosterior(lacquerBoxCase, [
      { variantId: "counterfeit", weight: Number.NaN },
    ]),
    /finite/i,
  );
  assert.throws(
    () => normalizePosterior(lacquerBoxCase, [
      { variantId: "counterfeit", weight: -1 },
    ]),
    /non-negative/i,
  );
  assert.throws(
    () => normalizePosterior(lacquerBoxCase, [
      { variantId: "counterfeit", weight: 0 },
    ]),
    /positive/i,
  );
});

test("belief statistics read normalized posterior entries", () => {
  const posterior = normalizePosterior(lacquerBoxCase, [
    { variantId: "counterfeit", weight: 1 },
    { variantId: "restored-genuine", weight: 1 },
    { variantId: "hidden-treasure", weight: 2 },
  ]);

  assert.equal(posteriorExpectedValue(posterior), 86.25);
  assert.equal(posteriorQuantile(posterior, 0.25), 20);
  assert.equal(posteriorQuantile(posterior, 0.75), 130);
  assert.equal(posteriorEntropy(posterior), 1.5);
});

test("NPC posterior depends only on case knowledge and shared evidence", () => {
  const sharedEvidenceIds = ["modern-adhesive-trace", "restored-interior"];
  const forward = calculateNpcPosterior(lacquerBoxCase, sharedEvidenceIds);
  const reverse = calculateNpcPosterior(
    lacquerBoxCase,
    [...sharedEvidenceIds].reverse(),
  );

  assert.deepEqual(forward, reverse);
  assertNormalized(forward);
});

test("resolve-action preserves player and NPC belief compatibility exports", () => {
  const evidenceIds = ["modern-adhesive-trace"];

  assert.deepEqual(
    calculatePosteriorFromFacade(lacquerBoxCase, evidenceIds),
    calculatePosterior(lacquerBoxCase, evidenceIds),
  );
  assert.deepEqual(
    calculateNpcPosteriorFromFacade(lacquerBoxCase, evidenceIds),
    calculateNpcPosterior(lacquerBoxCase, evidenceIds),
  );
});
