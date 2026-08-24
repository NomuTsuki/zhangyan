---
name: playtest-protocol
description: Prepare a short, structured human playtest checklist whenever a change affects gameplay feel, pacing, difficulty, clarity, or any experience the machine cannot verify. Use before asking the user to evaluate a build, and after any change marked "pending human verification".
---

# Playtest protocol

Convert "please try it" into a three-minute test the user can run and answer.
The user is the authority on how it feels; your job is to make their三分钟
maximally informative, not to pre-judge the result.

## Build the checklist

Produce, in this order:

1. **What changed** — one sentence per change, player-visible terms only.
2. **How to reach it** — exact build/URL/branch, and the shortest path to the
   affected moment (seed, level, debug flag if needed).
3. **What to compare against** — the previous build/tag when the change is a
   tuning of something that existed; state the old behavior in one line.
4. **Actions to try** — 3 to 6 concrete inputs ("cut the bridge edge early,
   then watch the second wave"), each tied to one hypothesis about feel.
5. **Questions to answer** — for each action, one question answerable with
   yes / no / worse / better / can't tell. Never ask "does it feel good?"
   in general; ask about one specific tension at a time.
6. **What to ignore** — known-broken or out-of-scope surfaces, so attention
   is not wasted.

Keep the whole checklist under 25 lines. If it cannot fit, the change batch
is too large to test honestly — say so and propose a split.

## Record the result

After the user reports back, write the outcome as evidence:

- verbatim answers, kept separate from your interpretation;
- what this confirms, refutes, or leaves unknown;
- the parameter or design follow-up, if any, with its owner.

Do not average away a negative answer. A failed feel-test is a finding, not
an obstacle.
