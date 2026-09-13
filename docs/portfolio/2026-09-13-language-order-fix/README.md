# Order-dependent language repair

Candidate spread slot: **Process / reflection**. These are actual game and user-feedback captures, not new concept artwork. Before build: `c9e676caf708d41da51b22d27ed06ca5bedc35aa36f056cb8b74940bf4bd64e5`. Repaired build: `b0975f68be84929eb5c48558dc9e8aee54cb346cb18f21283d1a104d7de15ffb`.

| Asset | Caption |
|---|---|
| [User report](2026-09-13-user-language-leak.png) | Chinese appears inside an English appraisal · Investigation order exposed a missing state · The player's screenshot disproved the earlier coverage assumption. |
| [Before: one-step overview](2026-09-13-before-report-first-overview.png) | A verification report arrives before its source record · The fixed test route never visited this branch · The unresolved question still appears in Chinese. |
| [Before: question detail](2026-09-13-before-report-first-detail.png) | The untranslated question opens an untranslated explanation · Checking only the main screen is insufficient · The same failure is reproduced in the detail view. |
| [After: one-step overview](2026-09-13-final-report-first-overview.png) | The same report-first state now appears in English · Preserve the acquired evidence and authored roads · The missing branch is translated without changing gameplay. |
| [After: question detail](2026-09-13-final-report-first-detail.png) | The question and its limits are readable in English · Conditional copy must travel through the translation layer · The detail view retains its original reasoning scope. |
| [After: eight-action state](2026-09-13-final-eight-actions.png) | An expanded appraisal includes the repaired question · The screen must survive different investigation orders · The original language leak is absent in this evidence set. |

Automated captures use 1440×1000 CSS pixels at DPR2 (2880×2000 PNG). The user's original is 2559×1460. Before/after minimal states have the same single investigation, viewport and overview camera; keyboard focus can differ after the audit and remains visible in the saved images. The eight-action screenshot matches the reported evidence set, not an asserted reconstruction of the user's exact order or camera. The 30% overview documents topology, not close reading.

The three `after`-prefix files are retained intermediate audit captures: the text repair was already present, while the test runner still required selection/locator corrections. Their captions correspond to the matching final overview, detail and eight-action views above, with the outcome limited to that intermediate capture. Do not substitute them for the final result record.

[Asset dimensions and SHA-256](assets.json) · [Verification and limits](../../project/evidence/v3-design/validation/workbench-hifi-v0/VERIFICATION-LANGUAGE-AUDIT-2026-09-13.md). The original 18.56-second video is unchanged; this text repair does not require a new motion clip. Human English-language comprehension is still unverified.
