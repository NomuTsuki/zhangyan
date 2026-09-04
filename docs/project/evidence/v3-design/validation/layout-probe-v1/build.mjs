/* Build one offline comparison page from the current V3 projection. */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildProbeTimeline, CHECKPOINTS } from "./probe-data.mjs";
import { logicIslandLayoutStep } from "../layout-probe-v0/layout.mjs";
import {
  assertSupportedEdgeKinds,
  CANVAS,
  constellationLayoutStep,
  layoutMetrics,
} from "./layout.mjs";
import { EXPERIMENTAL_PARAMS } from "./params.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const sha256 = (content) => createHash("sha256").update(content, "utf8").digest("hex").toUpperCase();

const timeline = buildProbeTimeline();
const checkpointByStep = new Map(CHECKPOINTS.map((checkpoint) => [checkpoint.step, checkpoint]));
const checkpoints = [];
let baselinePositions = {};
let constellationPositions = {};
let previousGraph = null;
let previousCheckpointBaseline = null;
let previousCheckpointConstellation = null;

for (const state of timeline) {
  assertSupportedEdgeKinds(state.graph);
  const baseline = logicIslandLayoutStep(state.graph, baselinePositions, previousGraph);
  baselinePositions = baseline.positions;
  const constellation = constellationLayoutStep(state.graph, constellationPositions, previousGraph);
  constellationPositions = constellation.positions;
  previousGraph = state.graph;

  const checkpoint = checkpointByStep.get(state.step);
  if (!checkpoint) continue;
  const baselineMetrics = layoutMetrics(state.graph, baselinePositions, previousCheckpointBaseline);
  const constellationMetrics = layoutMetrics(
    state.graph,
    constellationPositions,
    previousCheckpointConstellation,
  );
  checkpoints.push({
    ...state,
    label: checkpoint.label,
    note: checkpoint.note,
    layouts: {
      baseline: {
        positions: structuredClone(baselinePositions),
        metrics: baselineMetrics,
      },
      constellation: {
        positions: structuredClone(constellationPositions),
        metrics: constellationMetrics,
        changedNodeIds: constellation.changedNodeIds,
        neighbourNodeIds: constellation.neighbourNodeIds,
        usedEdgeKeys: constellation.usedEdgeKeys,
      },
    },
  });
  previousCheckpointBaseline = structuredClone(baselinePositions);
  previousCheckpointConstellation = structuredClone(constellationPositions);
}

if (checkpoints.length !== CHECKPOINTS.length) {
  throw new Error(`只生成了 ${checkpoints.length}/${CHECKPOINTS.length} 个检查点`);
}

const sourcePaths = {
  fixtures: "../first-ceramic-author-scenarios-v0/fixtures.mjs",
  solver: "../first-ceramic-author-scenarios-v0/solver.mjs",
  case: "../knowledge-map-slice-v0/case.mjs",
  semantics: "../evidence-semantics-v0/semantics.mjs",
  session: "../workbench-map-v0/session.mjs",
  projection: "../workbench-map-v0/projection.mjs",
  probeData: "./probe-data.mjs",
  baselineLayout: "../layout-probe-v0/layout.mjs",
  constellationLayout: "./layout.mjs",
  params: "./params.mjs",
};
const sourceSha = {};
for (const [name, path] of Object.entries(sourcePaths)) {
  sourceSha[name] = sha256(await readFile(resolve(here, path), "utf8"));
}

const stamp = {
  builtAt: new Date().toISOString().slice(0, 10),
  sourceSha,
  canvas: CANVAS,
  parameters: EXPERIMENTAL_PARAMS,
  checkpoints: checkpoints.map((state) => ({ step: state.step, ...state.counts })),
};
const payload = { stamp, checkpoints };
const safeJson = JSON.stringify(payload).replace(/</g, "\\u003c");
const template = await readFile(resolve(here, "template.html"), "utf8");
const output = template.replace("/*__PROBE_DATA__*/", `const PROBE = ${safeJson};`);
if (output.includes("__PROBE_DATA__")) throw new Error("template.html 的数据占位符没有被替换");
await writeFile(resolve(here, "prototype.html"), output, "utf8");

console.log("prototype.html 已生成");
for (const state of checkpoints) {
  const baseline = state.layouts.baseline.metrics;
  const candidate = state.layouts.constellation.metrics;
  console.log(
    `  ${state.label}: ${state.counts.observations} 情报 / ${state.counts.edges} 关系`
      + ` | 支持均长 ${baseline.support.mean} -> ${candidate.support.mean}`
      + ` | 交叉 ${baseline.crossings} -> ${candidate.crossings}`
      + ` | 穿标签 ${baseline.edgeLabelIntersections} -> ${candidate.edgeLabelIntersections}`,
  );
}
console.log(`  数据来源 ${Object.keys(sourceSha).length} 个文件，产物 ${(output.length / 1024).toFixed(0)} KB`);
