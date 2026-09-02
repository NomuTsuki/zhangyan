---
name: reorient
description: Reconstruct project state from live signals at re-entry — new session, resumed thread, post-compaction, or any gap where conversation memory is uncertain. Use before making claims about what is or is not in progress.
---

# Reorient

Live work signals outrank conversation memory. A summary is a navigation
hint, never a fact source.

## Inspect, in order

1. `git status` and `git diff --stat` — uncommitted work is the loudest signal.
2. `git log --oneline -10` on the current branch — what actually happened last.
3. The project's state file (e.g. `docs/project/02-CURRENT-STATE.md`) and next
   actions — treat as authoritative for intent, not for execution state.
4. Test / build status if cheap to check.

## Report before acting

Return, in under 15 lines:

```text
Where the project is:
In flight / uncommitted:
Last completed & verified:
Known unverified:
Recommended next action (one):
```

If live signals conflict with recorded memory, say so explicitly and treat
the discrepancy as a finding — do not silently normalize either side.
Live signals correct execution state only; they never establish intent,
scope, or approval.
