import {
  posteriorEntropy,
  posteriorExpectedValue,
  posteriorQuantile,
} from "./belief.ts";
import { round1 } from "./numeric.ts";
import type { PlayerValuation, PosteriorEntry } from "./types.ts";

export function calculatePlayerValuation(
  posterior: PosteriorEntry[],
): PlayerValuation {
  if (posterior.length < 2) {
    throw new Error("Player valuation requires at least two hypotheses");
  }
  const expectedValue = round1(posteriorExpectedValue(posterior));
  // Discrete, skewed posteriors can place the mathematical mean just outside
  // a raw central quantile interval. The player-facing plausible range keeps
  // the approved invariant by expanding to include the mean, never by moving
  // the estimate itself.
  const q10 = Math.min(posteriorQuantile(posterior, 0.1), expectedValue);
  const q90 = Math.max(posteriorQuantile(posterior, 0.9), expectedValue);
  const maximumEntropy = Math.log2(posterior.length);
  const normalizedEntropy = round1(
    maximumEntropy > 0 ? posteriorEntropy(posterior) / maximumEntropy : 0,
  );
  const uncertaintyLabel =
    normalizedEntropy <= 0.35
      ? "低"
      : normalizedEntropy <= 0.7
        ? "中"
        : "高";

  if (!(q10 <= expectedValue && expectedValue <= q90)) {
    throw new Error("Player valuation must satisfy Q10 <= expectation <= Q90");
  }

  return {
    expectedValue,
    q10,
    q90,
    normalizedEntropy,
    uncertaintyLabel,
  };
}
