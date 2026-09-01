---
name: repo-audit
description: Read-only sweep of the whole repository for systemic problems — authority duplication, drift between spec and code, frozen-boundary violations, dead scaffolding, and claims unsupported by evidence. Use when defects keep recurring, after a large slice lands, or when the parent agent's own account of the repo is suspect.
---

# Repo audit

Symptom-by-symptom fixing hides the shape of the problem. This skill looks for
the shape: the recurring defect class, not the next instance of it.

The auditor must be a **separate read-only agent**. Whoever wrote the code will
audit it into agreement with its own intentions. Run it with no write tools and
no permission to fix anything — a finding it silently repairs is a finding you
never see.

## Scope the sweep first

Ask for the audit boundary explicitly, and state it in the report:

- which directories are live, which are frozen archives, which are throwaway;
- which files are declared authoritative for numbers, rules, or terminology;
- what "done" currently claims to be true.

Never audit a frozen archive for quality. Audit it only for **whether it was
touched**, which is the actual rule.

## The seven passes

1. **Single authority per number.** For every player-visible number, rule, or
   label, find every place it is defined. Two definitions is the finding, even
   when they currently agree — they will diverge silently. Say which one
   should win.
2. **Frozen boundaries.** Diff anything declared frozen against its tag or
   baseline, byte for byte. Report any drift as a violation, not a change.
3. **Spec versus code.** For each approved decision record, find the code that
   implements it and name the line. A decision with no implementing line is
   either unbuilt or built somewhere nobody will look for it. Also report the
   reverse: behavior in code that no decision authorizes.
4. **Semantics versus enforcement.** Where a name, label, or document promises
   an order, prerequisite, cost, or count, check that the engine enforces it.
   Names that lie about the rules are the highest-yield defect class in a
   knowledge game, because the player treats the interface as the rulebook.
5. **Test integrity.** Look for assertions weakened to pass, baselines
   regenerated after a failure, tolerances widened without a recorded reason,
   and checks that exempt exactly the case that once broke. Also list
   behavior with no coverage at all, especially anything the project calls a
   core system.
6. **Dead scaffolding.** Probes, dumps, servers, and fixtures that no longer
   run, or that still run but measure something the code no longer does. A
   stale measuring instrument is worse than no instrument: it produces
   confident wrong readings.
7. **Unsupported claims.** Every "done", "verified", "passing", or "fixed" in
   the project's own docs — find the evidence, or report the claim as
   unsupported. Check the state file and next-actions file against `git log`.

## Report format

Return findings only, no fixes. For each:

```text
Finding:            one sentence, the defect not the symptom
Class:              authority / frozen / spec-drift / semantics / test / dead / claim
Evidence:           file:line, command output, or diff — never "it seems"
Blast radius:       what else is wrong if this is wrong
Recommended owner:  who decides — user decision, or agent may fix unilaterally
```

Then, above the list, a five-line summary naming the **single most expensive
defect class** and the cheapest structural change that would prevent its
recurrence. If the audit found nothing systemic, say that plainly; a padded
audit trains everyone to skim the next one.

Findings that require a product decision are escalated, never resolved. Mark
them `review required` and stop.
