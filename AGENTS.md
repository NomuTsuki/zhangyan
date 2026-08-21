<!-- project-co-lead:start -->

## Project Co-lead

Status: disabled

- When enabled, use the installed `project-co-lead` Skill as the default workflow for project-level orientation, design, implementation, experiments, review, and handoff.
- Keep local, reversible, low-risk edits lightweight; do not create ceremony or durable records without a material project event.
- Read `docs/project/00-PROJECT-COMPASS.md`, `02-CURRENT-STATE.md`, and `03-NEXT-ACTIONS.md` first, then only task-relevant records.
- Do not silently cross an approved major decision, core value, scope, experience, or system boundary; open a Challenge and request approval.
- Return material evidence to project memory at task closeout and distinguish implemented from verified.
- When disabled, do not invoke the Skill or update project memory implicitly; an explicit `$project-co-lead` request may still use it for one task.

<!-- project-co-lead:end -->

<!-- project-co-leader-v2:start -->

## Project Co-leader V2

Status: enabled

- When enabled, use the installed `project-co-leader-v2` Skill as the default workflow for project-level orientation, design, implementation, experiments, review, and handoff.
- Keep local, reversible, low-risk edits quiet; do not create ceremony or durable records without a material project event.
- Use adaptive inquiry: keep clear reversible implementation evidence-first, but actively grill fuzzy design, architecture, domain language, exploration, and hard boundaries one question at a time until the current decision frontier is shared.
- Treat user wording marked as an example, such as `比如`、`比方说` or `举例`, as explanatory-only; promote it into truth, fixtures, numbers, or decisions only after explicit adoption or write authorization.
- Before a product-impact decision, inspect the local baseline, meet the configured evidence floor using original sources and real practice, compare the result with this project, and classify it as Adopt, Borrow, Reject, or Unknown before recommending or encoding it.
- Do not reopen the research gate for approved-spec execution, agreed-behavior repair, mechanical refactoring, routine verification, or no-behavior wording/layout changes. If coding exposes a new product-impact decision, pause only that branch and run the gate before continuing it.
- During project adoption, milestone transitions, or evidence of capability/role failure, use `$project-agent-governance` to build or revise the minimum project Agent topology. Keep enabled carriers in `docs/project/AGENT-ROSTER.md`; do not instantiate a fixed virtual company from the global capability catalog.
- Treat bounded subagents as a runtime pool under accountable parents, not as one permanent Agent. Persistent Agent creation, permission expansion, decision-authority changes, or removal of independent verification require explicit user approval.
- For material replies, state how the answer is interpreted, what it changes, what remains unresolved, and what happens next. Do not assume the user already understands project progress or dependencies.
- Explain project-level work human-first: lead with the problem, the before/after change, and at most three memory anchors; move code symbols, file inventories, formulas, and exhaustive evidence to a second layer unless they are needed for a decision.
- Before a material stage transition, provide a concrete stage handoff covering purpose, before, after, preserved/unverified surfaces, and a useful visual when applicable; confirm the user's actual mental model before continuing. If the first explanation does not land, change analogy, example, comparison, or diagram rather than repeating the same terminology.
- Treat context compaction, a new thread, or resumed work as re-entry: reconstruct from live work signals and authoritative project memory, not from conversation memory alone.
- Before reporting progress or permitting a pivot, inspect live worktree, task/subagent, verification, and handoff signals; never infer that no work is active merely because project memory is silent.
- Keep `02-CURRENT-STATE.md` as the sole durable material-work ledger; record a stable role/task owner, status, latest reached checkpoint, authorized boundary, known changed/preserved/conflicted surfaces, verification, handoff, update time, and reopen/stop trigger before work spans messages.
- Use live signals to correct descriptive execution state only; they do not establish authorization, intent, scope, or permission.
- Do not silently let an ambiguous or casual pivot strand material work or skip a dependency; explain the current checkpoint and offer finish, structured parking, or explicit abandonment. Honor an unambiguous override after stating its interpretation and preserving a useful handoff.
- When a distracting idea does not serve the current checkpoint or skips a dependency, say `先停一下`, explain the diversion cost, and recommend continuing, parking with a trigger, or explicitly replacing the main line. Keep this brake direct but overridable by the user.
- Disclose the purpose, scenarios, baseline, thresholds, pass meaning, and blind spots before Material or Critical verification; require approval only for unresolved user-owned fields.
- Read `docs/project/00-PROJECT-COMPASS.md`, `02-CURRENT-STATE.md`, and `03-NEXT-ACTIONS.md` first, then only task-relevant records.
- Do not silently cross an approved major decision, core value, scope, experience, or system boundary; open a Challenge and request approval.
- Routing never grants file, Git, connector, deployment, or external-write authority.
- Return material evidence to project memory at task closeout and distinguish implemented from verified.
- Treat `docs/project/overview/` as a short human-readable projection only; it must not become a second decision authority, evidence archive, backlog, or active-work ledger.
- Never keep this block and the V1 `project-co-lead` block enabled at the same time.
- When disabled, do not invoke the Skill or update project memory implicitly; an explicit `$project-co-leader-v2` request may still use it for one task.

<!-- project-co-leader-v2:end -->

<!-- superpowers-policy:start -->

## Superpowers

Status: opt-in only

- Do not invoke `superpowers:*` Skills by default for planning, implementation, debugging, testing, review, or handoff.
- Invoke a Superpowers Skill only when the user explicitly names it for the current task, or when a higher-priority platform instruction makes it mandatory. If the latter occurs, disclose that constraint before using it.
- Keep the plugin installed; this policy changes invocation behavior only.

<!-- superpowers-policy:end -->
