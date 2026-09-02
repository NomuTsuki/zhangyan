---
name: tune-params
description: Record and revisit product-affecting numbers — probabilities, costs, pacing, economy, thresholds that shape player experience. Use when introducing such a number, changing one, or running a tuning/calibration pass. Skip for loop bounds, internal tolerances, and throwaway fixtures.
---

# Tune params

A product number without a recorded reason becomes a superstition. Keep the
record just heavy enough to make revisiting possible.

## Registry

Keep one append-friendly file per project (e.g. `docs/project/PARAMS.md`).
Eight fields per entry, one line each:

```text
id:            (stable name, e.g. probe.cooldown)
value & unit:
identity:      sourced-fact | derived | content-param | experimental-default
why:           one line of rationale or source
affects:       player-visible consequence
does NOT affect:
status:        experimental | calibrated | frozen
reopen when:   the observation that would reopen this number
```

When the user delegates a reversible numeric choice, pick the best supported
default, mark it `experimental-default`, and move on — do not ask them to
pick numbers repeatedly. Ask only when the number encodes a value judgment
(difficulty philosophy, monetization, fairness).

## Calibration pass

Before tuning or simulating:

1. Resurface the relevant entries with their original `why` — re-decide with
   memory, not from scratch.
2. Disclose the setup before running: scenario, seed, baseline, tolerance.
3. Append the outcome: old value → new value, evidence, expected vs observed,
   rollback trigger.

Hard rules: never tune only until a test passes; never silently widen a
tolerance or regenerate a baseline after a failure; never claim a simulation
proves fun — feel goes to the sibling `playtest-protocol` skill.
