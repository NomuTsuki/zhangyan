# Responsive map reveal — 10 September 2026

**Experimental implementation evidence; not human acceptance.** Candidate position in the 594 × 210 mm portfolio sequence: **process / system**, followed by the small playable-state hero as an outcome reference. These are source assets, not a finished spread or a new design proposal.

| Asset | Candidate slot | English caption |
| --- | --- | --- |
| [Before: first X-ray during flight](2026-09-10-before-first-xray-during-flight-2x.png) | Process / problem evidence | The first scan is still travelling into the map · its question has already appeared · the earlier build exposes the reveal-order mismatch. |
| [After: first X-ray during flight](2026-09-10-after-first-xray-during-flight-2x.png) | Process / system | The same first scan is still in flight · frontier visibility must follow the information's arrival · the revised map keeps the dependent question hidden at this stage. |
| [Four-action hero](2026-09-10-responsive-reveal-hero-four-actions-2x.png) | System / outcome | Whole-object, base and photographic observations meet in one verification · the earlier record must gain meaning without being collected again · the automatic pullback retains the resulting local explanation. |
| [Normal-speed operation clip](2026-09-10-responsive-reveal-normal-speed.mp4) | System / outcome | A photograph is verified and a current scan follows · controls, computation and reveal timing must remain coordinated · the recorded session continues through both investigations at normal speed. |

The three PNGs use **1440 × 1000 CSS pixels at device scale factor 2**: **2880 × 2000** exported pixels. The MP4 is **1440 × 1000, 25 fps, 21.96 seconds**, checked with FFprobe. Playback speed is unchanged; only the preparation prefix was trimmed. UI text remains in the shipped Chinese.

## Comparable timing, not identical frames

Both comparison pages start from an empty session and execute the same real UI action, `A.IMAGE.XRAY`. A read-only MutationObserver records the actual DOM transition to `phase=fly`; the capture requests target 500ms after that event. Neither page receives injected game state or a manual camera adjustment.

| Capture | Request since `fly` | Camera at request `(x, y, scale)` | Screenshot return since `fly` |
| --- | ---: | --- | ---: |
| Before | 504.8ms | `(-596.031, 82.534, 1.145666)` | 1154.6ms, phase `focus` |
| After | 509.2ms | `(-601.183, 83.248, 1.146925)` | 1153.7ms, phase `focus` |

The screenshots visibly retain the flight segment. Their request/return brackets are recorded because screenshot capture and PNG encoding take time while the animation continues. They are **not pixel-identical, exactly synchronized frames**, and screenshot latency is not used as a CPU-performance result. At request time, the old map question was perceptible by style and viewport bounds; the new map question was mounted but hidden. The comparison claims this change in **map frontier visibility**, not that every interface panel waits for the animation—the right-side material summary is present in both captures.

The hero performs **whole object → base → earlier photograph → object verification**, then selects the identity judgment. Its camera is the normal automatic post-investigation camera (`scale=0.506410`), with no manual zoom, pan or overview. The clip prepares the first three observations through actual UI operation, retains the verification and subsequent X-ray investigation, and waits for asynchronous computation before proceeding. Source observations are not created through scripting.

## Exact sources and capture command

| Side | Source | HTML bytes | SHA-256 |
| --- | --- | ---: | --- |
| Before | The byte-preserved offline page from Git `18dc40d` | 5,085,383 | `98f640e5341d575d003e38b695851bf54f6ffecf275f0e5b308a9a7d0aafae1f` |
| After, hero and clip | Current revised offline build, `docs/project/evidence/v3-design/validation/workbench-hifi-v0/prototype.html` | 5,161,993 | `10039aac47de84d8415c07db09c9d8d332c1ebc3fc42691565d845ec29730336` |

The old input comes from the separate read-only `minzoom-baseline/18dc40d-prototype.html` extraction. Both inputs were copied and hashed into this capture's own output directory before use; previous prototypes, screenshots, clips and checks were not overwritten.

```text
node output/playwright/responsive-map-reveal-2026-09-10/capture.cjs
```

The helper intentionally refuses to overwrite existing assets. Exact local Playwright/Edge/FFmpeg paths, raw WebM path, trim parameters, action logs, cameras and timing samples are retained in the helper and [capture manifest](2026-09-10-capture-manifest.json). File dimensions, video properties and hashes are in [asset readback](2026-09-10-asset-readback.json).

The capture run reports **zero page exceptions**. The capture agent inspected the screenshots and extracted video frames; this is not continuous human playback review, a gameplay test or proof that the user's original machine-specific stall is resolved. The implementation and new diagnostics remain **review required** pending the separate review and user experience feedback.
