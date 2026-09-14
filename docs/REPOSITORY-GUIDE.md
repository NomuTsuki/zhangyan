# Repository guide

The repository keeps the development record. The [root README](../README.md) is the visitor introduction, and the [portfolio index](portfolio/README.md) selects a small set of evidence. This guide locates the implementation and historical material without moving the original directories.

## Current work

| Purpose | Location |
|---|---|
| Author-selected final playable checkpoint | `3fe5704`, branch `codex/xray-photo-local-study` |
| Self-contained V3 game | [prototype.html](project/evidence/v3-design/validation/workbench-hifi-v0/prototype.html) |
| V3 React / Three.js presentation | [src](project/evidence/v3-design/validation/workbench-hifi-v0/src/) |
| Authored map coordinates and curves | [fixed-map-schema.mjs](project/evidence/v3-design/validation/workbench-hifi-v0/src/fixed-map-schema.mjs) |
| Label placement and visible map layout | [map-layout.mjs](project/evidence/v3-design/validation/workbench-hifi-v0/src/map-layout.mjs) |
| Investigation, camera and road feedback | [MapView.tsx](project/evidence/v3-design/validation/workbench-hifi-v0/src/MapView.tsx) and [map-motion.mjs](project/evidence/v3-design/validation/workbench-hifi-v0/src/map-motion.mjs) |
| Existing session, actions and graph used by V3 | [fusion local adapter](project/evidence/v3-design/validation/workbench-map-fusion-v0/) |
| Final revision checks and their limits | [node-label verification](project/evidence/v3-design/validation/workbench-hifi-v0/VERIFICATION-NODE-LABELS-2026-09-13.md) and [frontier verification](project/evidence/v3-design/validation/workbench-hifi-v0/VERIFICATION-FRONTIER-CONTINUITY-2026-09-13.md) |
| Current author decision / next presentation work | [current state](project/02-CURRENT-STATE.md) / [next actions](project/03-NEXT-ACTIONS.md) |

## Build the current V3

Use Node.js >=22.13.0. On Windows, `npm.cmd` avoids the PowerShell script-execution restriction.

```sh
git clone --branch codex/xray-photo-local-study https://github.com/NomuTsuki/zhangyan.git
cd zhangyan/docs/project/evidence/v3-design/validation/workbench-hifi-v0
npm ci
npm run dev
```

The repository is public. `npm run build` type-checks the presentation and regenerates the standalone `prototype.html` and its build stamp. To preserve the final checkpoint unchanged, use the existing HTML for display instead of rebuilding it merely to play.

Targeted checks from that directory:

```sh
node scripts/check-contract.mjs
node src/fixed-map-layout-check.mjs
node scripts/check-reveal-lifecycle.mjs
```

Browser checks and their local runtime requirements are documented in the dated verification reports. Some capture scripts refer to this development machine's Playwright cache; the README is not a claim that every historical script is portable without configuration. The old V2 `npm test` command belongs to a separate frozen prototype and is not the V3 launch command.

## Preserved history

| Area | Role |
|---|---|
| `docs/project/` | Design decisions, source evidence and verification, including failures |
| `docs/portfolio/` | Dated capture sets with source/build provenance; see the curated index before browsing all of them |
| `output/` | Working captures and audit output; some historically tracked evidence remains here |
| `docs/teacher/`, `docs/superpowers/` | Historical delivery and design records |
| `掌眼_Codex启动包_v2/` | Preserved V1/V2 implementation and materials |
| `release/` | Historical release-boundary manifests |

V1 is preserved under `v1.0.0-teacher-handoff`; V2 under `v2.0.0-player-prototype-freeze`; the migration snapshot under `handoff-freeze-2026-08-24`. The existing nine remote branches remain development history. No branch deletion, history rewrite or V1/V2 refactor is needed for the portfolio.

The default branch is now `codex/xray-photo-local-study`, updated on 14 September 2026. The old `main` and the other development branches are preserved for history; their older README files do not describe the current V3 scope. The repository's public-facing introduction is the root README on the V3 branch.

## Presentation and publication

The author made this repository public and approved its GitHub presentation update on 14 September. The [presentation plan](portfolio/PRESENTATION-PLAN.md) now uses this repository for any later, selectively published showcase files; a second repository is not needed. Video production and a hosted play page remain later work. This reorganisation does not create a site, Release, repository or license.
