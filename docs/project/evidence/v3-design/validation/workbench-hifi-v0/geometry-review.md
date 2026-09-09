# Map geometry review — 2026-09-09

Status: **review required**. This is an execution record for the current high-fidelity map geometry, not approval of its visual quality or gameplay experience.

Executor: `fusion_road_geometry`, implementation subagent of the coordinating `/root` task. The executor also implemented `src/map-layout.mjs`; this report is therefore not an independent-agent review. The final path checks used a separate SVG parser rather than trusting the curve generator's internal samples.

## Scope and final adjustment

The executor inspected `verification-1440-mid.png` and `verification-1440-g3.png`. Their map scales were approximately 60% and 48%; the previous maximum 4.5-world-pixel control offset was visually close to a straight chord at those scales.

The final source adjustment was confined to `src/map-layout.mjs`'s curve generation and the real-shape safety data passed to it:

- Long segments request a same-side control offset of approximately 6% of their length, capped at 26 world pixels. The second control uses 65% of that offset, producing one gentle bow per cubic segment.
- Short segments retain a small offset. There is no repeating sine-wave pattern.
- Candidate curves are checked against real node glyphs and judgment boxes. If necessary, the generator tries the other side and then reduces the offset.
- Titles, sublines and questions do not alter the roads. They are placed after routing.
- Node placement, semantic edge IDs and shared-condition group semantics were not changed by this final adjustment.

## Executed comparisons and checks

The following checks were executed as Node commands against the real fusion-local session and graph. No test baseline was changed for this report.

### Approved 17-action route

The route used was:

1. `A.OBSERVE.WHOLE`
2. `A.OBSERVE.BASE`
3. `A.LOCATE.HISTORIC_IMAGE`
4. `A.VERIFY.OBJECT_CONTINUITY`
5. `A.RESEARCH.ACCIDENT`
6. `A.RELATE.ARCHIVE.T2_TO_OBJECT`
7. `A.CORROBORATE.ARCHIVE.T2_CURRENT`
8. `A.RESEARCH.LATE_TREATMENT`
9. `A.RELATE.ARCHIVE.T3_TO_OBJECT`
10. `A.IMAGE.XRAY`
11. `A.INSPECT.WINDOWS`
12. `A.CORROBORATE.ARCHIVE.T3_CURRENT`
13. `A.SYNTHESIZE.SURFACE_REGIONS`
14. `A.ANALYZE.MATERIAL.SUBSTRATE`
15. `A.INSPECT.MATERIAL.LAYER_SEQUENCE`
16. `A.ASSESS.TREATED_AND_UNTREATED`
17. `A.TRACE.PROVENANCE_CHAIN`

Both the pre-adjustment and final layout modules were evaluated on each acquired state of this same route. At every step, the complete `[node ID, x, y]` list matched exactly. The final graph retained **17 nodes and 3 shared-condition junctions**. The real edge IDs and group meaning were retained.

For the six longest final routes, maximum deviation from the piecewise straight path increased from approximately **1.6–2.8 world pixels** to **11.3–16.3 world pixels**. At 48% display scale that corresponds to approximately **5.4–7.8 screen pixels**. These are measured geometric differences; they are not a claim that the final rendered page has passed visual review.

The final 11-action middle state and 17-action G3 state returned:

```text
maxNodeMovement: 0
ignoredEdgeIds: []
labelOverlaps: []
remoteLabelIds: []
labelMeasurement: estimated-16px-text
labelsMoveRoads: false
```

### Six randomized legal action orders

Six deterministic random legal orders were executed, with seeds 1 through 6. Each selected an available, unfinished action from the current `local-session` workbench, retaining an available comparison basis where required. Each order completed all 22 distinct actions and reached G3: **132 acquisition steps in total**.

At each step, checks covered:

- Existing node coordinates remained unchanged.
- Estimated label rectangles did not overlap one another.
- The actual output SVG `M`, `L`, `C` and `Q` commands were parsed separately from the generator.
- Cubic and quadratic paths were sampled at one-world-pixel or finer intervals, including frontier paths.
- Samples were checked against real information circles, junction diamonds and judgment rectangles. A small numerical boundary tolerance allowed intentional endpoint contact.

Result: **zero sampled intersections with those real shapes**, with **31,815 path–shape comparisons** across the six orders. One console summary mistakenly called this count “routes”; the correct unit is **path–shape comparisons**, not 31,815 distinct paths.

Final random-order remote-label counts were:

| Seed | Final labels more than 100 world pixels from their associated point |
| --- | ---: |
| 1 | 4 |
| 2 | 5 |
| 3 | 2 |
| 4 | 1 |
| 5 | 3 |
| 6 | 1 |

Earlier iterations had also exposed roughly 2–4 remote labels in several random full-map orders. These were reported to the coordinator rather than treated as a passing visual result. The exact final counts above take precedence over that earlier approximate description.

## Verification boundaries

- The SVG shape test was independently implemented as a parser and sampler, but run by the same agent who wrote the geometry. It is not independent-agent or human acceptance.
- Finite sampling, even at one-pixel or finer intervals, is not a mathematical proof for every point on every curve or every possible future graph.
- Label checks in this execution used estimated 16px text dimensions. **They do not establish collision-free placement for actual DOM font metrics, wrapping, browser zoom or every rendered state.** The renderer's DOM remeasurement and the coordinator's browser verification remain separate evidence.
- Zero estimated label overlaps does not mean a caption is close enough to its node to be understood. The remote-label diagnostic above identifies that remaining risk.
- No claim is made that arbitrary investigation orders have passed aesthetic review, that the game is understandable to a first-time player, or that it is enjoyable.
- The coordinator is responsible for rebuilding the final page, checking the live 1280/1440/1920 desktop layouts and motion, and retaining the final rendered evidence. No further source changes or reruns were made when writing this record.
