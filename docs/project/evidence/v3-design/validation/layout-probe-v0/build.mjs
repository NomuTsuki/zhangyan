/* Build a single offline comparison page from the current V3 projection. */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildProbeTimeline, CHECKPOINTS } from "./probe-data.mjs";
import { CANVAS, forceLayoutStep, logicIslandLayoutStep } from "./layout.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const sha256 = (content) => createHash("sha256").update(content, "utf8").digest("hex").toUpperCase();
const positionsWithRoles = (graph, positions) => {
  const roles = new Map(
    [...graph.nodes, ...graph.findings, ...graph.axioms].map((node) => [node.id, node.type]),
  );
  return Object.fromEntries(
    Object.entries(positions).map(([id, point]) => [id, { ...point, role: roles.get(id) }]),
  );
};

const timeline = buildProbeTimeline();
const checkpointByStep = new Map(CHECKPOINTS.map((checkpoint) => [checkpoint.step, checkpoint]));
const checkpoints = [];
let forcePositions = {};
let pinned = [];
let islandPositions = {};
let previousGraph = null;

for (const state of timeline) {
  const force = forceLayoutStep(state.graph, forcePositions, pinned);
  forcePositions = force.positions;
  pinned = force.pinned;
  const islands = logicIslandLayoutStep(state.graph, islandPositions, previousGraph);
  islandPositions = islands.positions;
  previousGraph = state.graph;

  const checkpoint = checkpointByStep.get(state.step);
  if (!checkpoint) continue;
  checkpoints.push({
    ...state,
    label: checkpoint.label,
    note: checkpoint.note,
    layouts: {
      force: { positions: positionsWithRoles(state.graph, forcePositions) },
      islands: structuredClone(islands),
    },
  });
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
  layout: "./layout.mjs",
};
const sourceSha = {};
for (const [name, path] of Object.entries(sourcePaths)) {
  sourceSha[name] = sha256(await readFile(resolve(here, path), "utf8"));
}

const stamp = {
  builtAt: new Date().toISOString().slice(0, 10),
  sourceSha,
  canvas: CANVAS,
  checkpoints: checkpoints.map((state) => ({ step: state.step, ...state.counts })),
};
const payload = { stamp, checkpoints };
const safeJson = JSON.stringify(payload).replace(/</g, "\\u003c");
const template = await readFile(resolve(here, "template.html"), "utf8");
const output = template.replace("/*__PROBE_DATA__*/", `const PROBE = ${safeJson};`);

if (output.includes("__PROBE_DATA__")) {
  throw new Error("template.html 的数据占位符没有被替换");
}

await writeFile(resolve(here, "prototype.html"), output, "utf8");
console.log("prototype.html 已生成");
for (const state of checkpoints) {
  console.log(
    `  ${state.label}: 情报 ${state.counts.observations} / Finding ${state.counts.findings}`
    + ` / 结论 ${state.counts.conclusions} / 关系 ${state.counts.edges}`,
  );
}
console.log(`  数据来源 ${Object.keys(sourceSha).length} 个文件，产物 ${(output.length / 1024).toFixed(0)} KB`);
