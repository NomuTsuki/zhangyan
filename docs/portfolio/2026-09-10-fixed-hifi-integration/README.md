# Fixed-map integration — capture set, 10 September 2026

This set records implementation and visual iteration, not a passed human playtest. UI copy remains in Chinese as captured. Candidate placement: **process → system → outcome**, within the 594 × 210 mm portfolio spread sequence; the PNGs are source assets, not a finished spread layout.

Use **take3** for the current automatic-camera outcome. Take1 and take2 remain useful process evidence and are explicitly tied to earlier builds below.

| Asset | Candidate slot | English caption |
| --- | --- | --- |
| [Take3 final hero](2026-09-10-take3-final-automatic-pullback-hero-1440x1000-2x.png) | Outcome / system | Four investigations connect a photograph to the object · keeping all newly explained results in view was the constraint · the automatic pullback retains both the judgment and the historical use. |
| [Take3 final motion clip](2026-09-10-take3-final-automatic-road-connection.mp4) | System / outcome | An existing photograph gains historical use · the same report must connect without reacquiring evidence · one verification grows the road before a separate current scan appears. |
| [Review skeleton → playable workbench](2026-09-10-take2-review-skeleton-to-workbench-process-2x.png) | Process / concept | The local relationship moves from an isolated review to the workbench · its evidence roles must survive the visual integration · the same photograph, verification and historical use remain traceable. |
| [Before — same four actions](2026-09-10-take1-before-same-four-actions-1440x1000-2x.png) | Process / comparison | The previous high-fidelity checkpoint after four investigations · action history and viewport must stay comparable · the earlier composition is preserved without recapture changes. |
| [After — same four actions](2026-09-10-take1-after-same-four-actions-1440x1000-2x.png) | Process / comparison | Fixed roads after the identical investigations · inherited camera framing still clipped context · this capture exposed the next integration issue. |
| [Take1 natural-camera hero](2026-09-10-take1-hero-local-judgment-1440x1000-2x.png) | Reflection / process | Identity evidence is selected in the fixed map · the automatic 68% view misses part of the historical branch · the uncorrected framing is retained as process evidence. |
| [Take1 motion clip](2026-09-10-take1-verification-road-and-current-scan.mp4) | Reflection / process | Verification reconnects an earlier record at normal speed · the camera did not yet frame every new result · this earlier run preserves the behavior that prompted the pullback correction. |
| [Take2 manually framed local hero](2026-09-10-take2-final-hero-local-four-actions-1440x1000-2x.png) | Process / system | The four-action local graph is visible together · a real overview control supplies the framing · this intermediate capture separates layout readability from automatic-camera behavior. |

The before/after pair uses **1440 × 1000 CSS pixels, device scale factor 2** (2880 × 2000 PNGs), the same action sequence and the same gesture policy: observe the whole object → observe the base → obtain the earlier photograph → verify the photograph against the object. Each is captured after its normal motion finishes; selection is cleared, and neither frame uses manual map zoom or overview. Both resulting cameras report 68% scale, but their translations differ because the map layouts differ. They are comparable full-window captures, not an assertion of identical world coordinates.

The preferred take3 hero uses the **same four actions**, then selects the identity judgment without changing the camera. Its framing comes from the revised automatic pullback. Both the identity judgment and the newly available early-history interpretation are checked against the actual map viewport in the capture manifest. Take2 instead used the real local-overview button (50.64%) and is kept as an intermediate step. None of these captures uses the fully populated 24% overview.

The clips are Playwright recordings of actual UI operation at normal speed. Preparation performs whole-object observation, base observation and photograph acquisition; the retained segment includes object verification and then X-ray imaging. No session state is injected. The preparation prefix is trimmed with FFmpeg, without changing playback speed. FFprobe reads take1 as 19.96 seconds and the preferred take3 segment as exactly 22 seconds; both are 1440 × 1000 at 25 fps. Raw WebM files and exact trim/encode arguments are retained in the capture-helper output and manifests.

The process plate combines an actual screenshot of the independently reviewed photo-verification case with the take2 page screenshot. It is a labelled presentation composition, not another game screen. Its 1680 × 900 CSS-pixel composition was captured at 2× (3360 × 1800 PNG). The intermediate page framing and the final automatic-camera result are deliberately kept distinct.

## Exact sources

| Capture | Source | HTML bytes | SHA-256 |
| --- | --- | ---: | --- |
| Take1 before | Git `68f9283`, `docs/project/evidence/v3-design/validation/workbench-hifi-v0/prototype.html` | 5,056,180 | `40dfc7b133a602bf4a55b6dd1445fb69f9da05e6c42738dd1945a65c3b23d0b3` |
| Take1 after, natural hero and clip | Build after the road-hit correction; before subsequent entry-anchor and camera corrections | 5,085,140 | `8b66500f774c072640564829e214970dcae98f589f67b19787f5be0a55f82f74` |
| Take2 hero / process page | Build after the deferred entry-anchor correction; before automatic pullback correction | 5,085,304 | `8d8f672bd02f658ebe52943f0db9573ff788df531d6a383f3d2ed6f6ca3c9ff4` |
| Take3 preferred hero and clip | Final automatic pullback / visible flight-endpoint build at capture time | 5,085,383 | `98f640e5341d575d003e38b695851bf54f6ffecf275f0e5b308a9a7d0aafae1f` |
| Process plate, review side | `output/playwright/fixed-map-skeleton-v2-2026-09-09/preview.html`, photo case after its real review interaction | — | `b15a62765234a871490985e9f51bfe4f1fd4164cc0d0bbf64eda823ee58c3dfe` |

The earlier prototype was extracted with `git show` through Node `spawnSync` as a Buffer (`maxBuffer: 24 MiB`) and written byte-for-byte to a new output file. The current inputs were copied to new capture-specific files and hashed before opening them. No old prototype or old capture was overwritten.

Capture commands, from repository root:

```text
node output/playwright/portfolio-fixed-hifi-2026-09-10/capture.cjs
node output/playwright/portfolio-fixed-hifi-2026-09-10/final-hero-process.cjs
node output/playwright/portfolio-fixed-hifi-2026-09-10/capture-final-motion.cjs
```

The scripts intentionally refuse to overwrite their take-specific files. A rerun must use a new take prefix. They use the installed Playwright runtime and Microsoft Edge, whose local paths are recorded in the helpers. All UI assertions use actual clicks, keyboard navigation and read-only snapshots.

Evidence: [take1 manifest](2026-09-10-take1-capture-manifest.json), [take2 manifest](2026-09-10-take2-capture-manifest.json), [take3 manifest](2026-09-10-take3-capture-manifest.json), [asset dimensions, media properties and hashes](2026-09-10-asset-readback.json). The final capture run reports no page exceptions. Captures were produced and visually reviewed by the asset-capture agent; the clips were checked through extracted frames and metadata, not a human playtest. This set is **review required** as part of the experimental integration evidence. Human judgment of visual quality, reasoning clarity and play remains open.
