---
name: blind-playtest
description: Run a zero-context player agent against a built prototype through a browser only, with the repository hidden, to find where a first-time player stalls. Use when a build is playable and the question is comprehensibility, onboarding, or first-minute drop-off — not correctness.
---

# Blind playtest

A machine cannot tell you the game is fun. It can tell you, reliably, that a
reader with no context cannot work out what the game is asking of them. That
is the only claim this skill makes, and it is the claim that keeps failing.

The tester must be a **separate agent with no project context**. If the parent
agent evaluates its own text, the evaluation is worthless: the parent knows
what every word was supposed to mean.

## Non-negotiable isolation

Text dumps do not count. Reading source does not count. Two rounds have
already been wasted on a dump that printed internal keys the UI never shows —
the tester then distrusted every real string on the screen. The tester must
touch the same pixels the user touches.

1. Build first. Serve the **built artifact**, never the template.
2. Copy the built file to a scratch directory **outside the repository**
   (`%TEMP%\<slug>\index.html` on this machine) and serve from there.
3. Hand the subagent a URL and nothing else. No repo path, no file name that
   reveals the tree, no design doc, no decision record, no glossary.
4. Forbid the subagent, in its own prompt, from reading files, grepping,
   listing directories, or viewing page source. Its evidence is the rendered
   screen: snapshots and screenshots.
5. Do not answer its questions mid-run. A question it has to ask is a finding.

## What to ask the tester for

Give it a role and a budget, not a checklist — a checklist teaches it the
vocabulary you are trying to test.

Require, in this order:

1. **Before touching anything**: what do you think this is, what are you
   supposed to accomplish, and how would you know you had done well?
   Verbatim. This single answer is the highest-value output of the run.
2. **Every term on the first screen it cannot define**, quoted exactly, each
   marked: guessed from context / guessed but unsure / no idea.
3. **A real playthrough**, narrated per step: what it clicked, what it
   expected, what happened, and whether the two matched.
4. **Every place it stalled** — could not choose, could not tell two options
   apart, or could not tell whether something had already been done.
5. **Contradictions between the interface and itself**: a name that promises
   an order the rules do not enforce, a label that contradicts a tooltip, a
   count that disagrees with a list.
6. **Where it would have quit**, and at which step number.

Ask it to separate what it observed from what it inferred, and to say "I could
not tell" rather than guessing a designer's intent.

## Reading the report

- Quote the tester verbatim in the archive; keep your interpretation in a
  separate section. Never paraphrase a complaint into something easier.
- Sort findings by **step number at which they hurt**, not by severity. A mild
  confusion on step 1 outranks a serious one on step 15, because nobody
  reaches step 15.
- Split every finding into one of three, because they have different owners:
  - **wording** — the rules are right, the text lies about them;
  - **mechanics** — the text is right, the rules are wrong or absent;
  - **layout** — both are right and the screen still cannot be read.
  Wording fixes that are really mechanics findings will keep coming back.
- A term the tester guessed correctly is still a finding if it was never
  explained. Getting away with it is not the same as being clear.

## Then verify the fix mechanically

Every wording finding that claims an order, a prerequisite, or a count should
end up as an assertion in the headless harness. Confirm the rule with a probe
before rewriting the sentence: when a name promises a prerequisite, check
whether the engine actually enforces it. If it does not, the name is not a
wording bug, and rewording it hides a design hole.

Archive the run next to the prototype as `BLINDTEST-<date>.md`, and record
which findings were fixed, which were deferred, and which were rejected —
with the reason. An unarchived blind test gets re-litigated from memory.
