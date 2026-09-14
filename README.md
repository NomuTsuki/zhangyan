# 掌眼 · Zhangyan

**A long-form antique-appraisal deduction game where understanding unfolds gradually from incomplete evidence.**

Rotate a porcelain bowl, investigate its materials and records, and follow the connections that emerge between what you know. Decide when you have enough evidence to stop.

[中文说明](README.zh-CN.md) · [Source and repository guide](docs/REPOSITORY-GUIDE.md)

![English workbench with a rotatable bowl, the evidence map and an assessment panel](docs/portfolio/2026-09-13-node-labels/2026-09-13-after-en-upper-map.png)

*A late-session view of the running prototype. Selecting evidence highlights its relationships while the map retains its spatial structure.*

## Experience the prototype

The current V3 is a **desktop browser prototype in Chinese and English**, centred on the investigation of one fictional porcelain bowl.

- **Play locally:** download the [self-contained game file](docs/project/evidence/v3-design/validation/workbench-hifi-v0/prototype.html?raw=1) and open it in desktop Edge or Chrome. No Node.js or local server is needed. Switch language with **中 / EN**.
- **Investigate:** drag to rotate the bowl and reveal investigation points, or choose an archive, comparison or test. Browsing methods is free; performing an investigation uses an enquiry. Completed investigations can be reviewed for free.
- **Follow the evidence:** select information, roads or assessments to inspect their basis. Drag and zoom the map to explore it; press Escape to dismiss an overlay or clear a selection.
- **Make your assessment:** choose **Finish & assess** when you are ready. Some questions may remain unresolved.

Download the HTML before opening it: GitHub's file viewer displays source content rather than running the game.

## The design question

How can a game help players hold a long investigation in mind without turning it into a checklist of answers?

Zhangyan separates the object's fixed history from the player's gradually revealed knowledge. An observation can be acquired before its relevance becomes clear. A later verification may connect it to an existing explanation; acquiring something and knowing what it supports are separate events.

Three choices shape the experience:

- **Inspect the object directly.** Rotate the bowl to reveal investigation points; use archives, comparisons and tests beyond the object.
- **Build spatial memory.** Known information keeps its position. Questions extend from known places, and subsequent evidence connects along those roads.
- **Retain the decision to stop.** Four assessment areas summarise the current evidence. The player can review the basis for a judgment and finish with some questions unresolved.

An investigation travels from its chosen action to the map. The camera approaches the new information, then pulls back as its relationships connect. This feedback shows both where the discovery arrived and how it changes the larger account.

## Current scope

The playable case includes one fictional export-porcelain bowl, 22 investigation methods, evidence review, map navigation, investigation history and manual assessment. React, TypeScript and Three.js run in a self-contained HTML file, with rule computation in an inline Worker.

V3 does not include the earlier visitor negotiation loop, a completed market/economy, or a mobile layout. V1 and V2 remain preserved as historical prototypes.

## Credits

- **NomuTsuki:** game and systems design, interaction and visual direction, prototype evaluation and final design decisions. Developed as an individually led internship project.
- **OpenAI Codex and Cursor:** AI assistance with design discussion, implementation, debugging, verification and documentation under the author's direction.
- **GPT Image:** visual exploration and the bowl's painted texture. Historical images and testing views are synthetic game materials; [material provenance](docs/project/evidence/v3-design/validation/workbench-hifi-v0/src/assets/README.md) records their source.

## Evidence and development

Dated reports document checks of the rules, interactions, language switching and map rendering, with the covered scenarios and remaining limitations. The fictional case is designed for play and is not a professional appraisal reference.

- [Final map revision and verification scope](docs/project/evidence/v3-design/validation/workbench-hifi-v0/VERIFICATION-NODE-LABELS-2026-09-13.md)
- [Map source, build commands and historical versions](docs/REPOSITORY-GUIDE.md)

The longer V1/V2 overview is preserved in the [previous README at checkpoint 3fe5704](https://github.com/NomuTsuki/zhangyan/blob/3fe5704dd3724ba547311976281865e5467068fb/README.md).
