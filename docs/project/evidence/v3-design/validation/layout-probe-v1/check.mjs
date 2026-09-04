/* Focused structural, geometry, and regression checks for layout-probe-v1. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildProbeTimeline, CHECKPOINTS } from "./probe-data.mjs";
import { logicIslandLayoutStep } from "../layout-probe-v0/layout.mjs";
import {
  assertSupportedEdgeKinds,
  CANVAS,
  constellationLayoutStep,
  layoutDiagnostics,
  layoutMetrics,
  nodeFootprint,
  rectanglesOverlap,
} from "./layout.mjs";
import { EXPERIMENTAL_PARAMS as P } from "./params.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const expected = new Map([
  [6, { observations: 6, findings: 2, conclusions: 1, edges: 14 }],
  [12, { observations: 12, findings: 2, conclusions: 2, edges: 21 }],
  [22, { observations: 22, findings: 4, conclusions: 4, edges: 43 }],
]);
const checkpointSteps = new Set(CHECKPOINTS.map((checkpoint) => checkpoint.step));

function allNodes(graph) {
  return [...graph.nodes, ...graph.findings, ...graph.axioms];
}

function edgeKey(edge) {
  return `${edge.kind}:${edge.from}>${edge.to}`;
}

function reorderGraph(graph) {
  return {
    ...graph,
    nodes: [...graph.nodes].reverse(),
    findings: [...graph.findings].reverse(),
    axioms: [...graph.axioms].reverse(),
    edges: [...graph.edges].reverse(),
  };
}

function collisionBounds(position) {
  const centerX = position.x + (position.boxOffsetX ?? 0);
  const centerY = position.y + (position.boxOffsetY ?? 0);
  return {
    left: centerX - position.width / 2,
    right: centerX + position.width / 2,
    top: centerY - position.height / 2,
    bottom: centerY + position.height / 2,
  };
}

function assertSafeRectangles(graph, positions, label) {
  const nodes = allNodes(graph);
  assert.deepEqual(
    new Set(Object.keys(positions)),
    new Set(nodes.map((node) => node.id)),
    `${label} 坐标集合与节点集合不一致`,
  );
  for (const node of nodes) {
    const point = positions[node.id];
    const footprint = nodeFootprint(node);
    assert.deepEqual(point.labelLines, footprint.labelLines, `${label} ${node.id} 可见文字与碰撞文字不一致`);
    assert.equal(point.width, footprint.width, `${label} ${node.id} 标签宽度未进入碰撞盒`);
    assert.equal(point.height, footprint.height, `${label} ${node.id} 标签高度未进入碰撞盒`);
    const box = collisionBounds(point);
    assert(box.left >= 0 && box.right <= CANVAS.width, `${label} ${node.id} 横向越界`);
    assert(box.top >= 0 && box.bottom <= CANVAS.height, `${label} ${node.id} 纵向越界`);
  }
  for (let left = 0; left < nodes.length; left += 1) {
    for (let right = left + 1; right < nodes.length; right += 1) {
      assert(
        !rectanglesOverlap(positions[nodes[left].id], positions[nodes[right].id]),
        `${label} 标签互压：${nodes[left].id} / ${nodes[right].id}`,
      );
    }
  }
  assert.equal(layoutDiagnostics(graph, positions).overlaps, 0, `${label} 诊断器仍报告标签互压`);
}

function supportDistanceSum(graph, positions, observationId) {
  const targets = graph.edges
    .filter((edge) => edge.kind === "supports" && edge.from === observationId)
    .map((edge) => edge.to);
  return {
    targets,
    sum: targets.reduce((total, targetId) => {
      const from = positions[observationId];
      const to = positions[targetId];
      return total + Math.hypot(to.x - from.x, to.y - from.y);
    }, 0),
  };
}

assert(P.springs.supports.ideal < P.springs.latent.ideal, "supports 没有较短理想距离");
assert(P.springs.supports.strength > P.springs.latent.strength, "supports 仍弱于普通结构边");
assert(P.springs.supports.longThreshold > P.springs.supports.ideal, "supports 长尾阈值没有留出理想距离区间");
assert(P.springs.supports.longStrength > 0, "supports 没有超长惩罚");
assert(P.springs.supports.degreeFloor > 0, "高连接结论可把 supports 归一到零");
assert(P.objective.crossingPenalty > 0, "没有显式交叉惩罚");
assert(P.objective.edgeLabelPenalty > 0, "没有显式边穿标签惩罚");

const timeline = buildProbeTimeline();
let baselinePositions = {};
let constellationPositions = {};
let previousGraph = null;
const saved = new Map();

for (const state of timeline) {
  const graphBefore = JSON.stringify(state.graph);
  assertSupportedEdgeKinds(state.graph);

  const priorConstellation = structuredClone(constellationPositions);
  const normal = constellationLayoutStep(state.graph, priorConstellation, previousGraph);
  const reordered = constellationLayoutStep(
    reorderGraph(state.graph),
    priorConstellation,
    previousGraph ? reorderGraph(previousGraph) : null,
  );
  assert.deepEqual(reordered, normal, `第 ${state.step} 步节点或边数组顺序改变了 v1 结果`);
  assert.equal(JSON.stringify(state.graph), graphBefore, `第 ${state.step} 步布局修改了图语义数据`);

  const expectedEdges = new Set(state.graph.edges.map(edgeKey));
  assert.deepEqual(new Set(normal.usedEdgeKeys), expectedEdges, `第 ${state.step} 步并非全部关系参与布局`);
  constellationPositions = normal.positions;

  const baseline = logicIslandLayoutStep(state.graph, baselinePositions, previousGraph);
  baselinePositions = baseline.positions;
  previousGraph = state.graph;

  if (!checkpointSteps.has(state.step)) continue;
  assert.deepEqual(state.counts, expected.get(state.step), `第 ${state.step} 步图规模漂移`);
  assertSafeRectangles(state.graph, constellationPositions, `第 ${state.step} 步 v1`);
  saved.set(state.step, {
    graph: structuredClone(state.graph),
    baseline: structuredClone(baselinePositions),
    constellation: structuredClone(constellationPositions),
  });
}

const full = saved.get(22);
assert.deepEqual(
  new Set(full.graph.edges.map((edge) => edge.kind)),
  new Set(["latent", "prereq", "caught", "supports"]),
  "满图没有保留四类既有关系",
);

const baselineFull = layoutMetrics(full.graph, full.baseline);
const candidateFull = layoutMetrics(full.graph, full.constellation);
assert(candidateFull.support.mean < baselineFull.support.mean * 0.5, "满图支持均长没有至少减半");
assert(candidateFull.support.max < baselineFull.support.max * 0.5, "满图最长支持线没有至少减半");
assert(candidateFull.crossings < baselineFull.crossings * 0.5, "满图交叉没有至少减半");
assert(
  candidateFull.edgeLabelIntersections < baselineFull.edgeLabelIntersections * 0.5,
  "满图边穿标签没有至少减半",
);
assert.equal(candidateFull.overlaps, 0, "满图仍有标签互压");

const sharedEvidence = new Map();
for (const edge of full.graph.edges) {
  if (edge.kind !== "supports") continue;
  if (!sharedEvidence.has(edge.from)) sharedEvidence.set(edge.from, []);
  sharedEvidence.get(edge.from).push(edge.to);
}
const multiConclusionIds = [...sharedEvidence]
  .filter(([, targets]) => targets.length > 1)
  .map(([id]) => id)
  .sort();
assert.deepEqual(
  multiConclusionIds,
  ["obs.accident.major", "obs.archive.t2.current-corroboration", "obs.current.whole"],
  "多结论共享证据集合漂移",
);
const sharedRows = [];
for (const id of multiConclusionIds) {
  const baseline = supportDistanceSum(full.graph, full.baseline, id);
  const candidate = supportDistanceSum(full.graph, full.constellation, id);
  assert.deepEqual(candidate.targets, baseline.targets, `${id} 的支持目标在布局间漂移`);
  assert(candidate.sum < baseline.sum * 0.6, `${id} 到多个结论的距离总和没有明显缩短`);
  sharedRows.push({ id, baseline: baseline.sum, candidate: candidate.sum });
}

const repeated = constellationLayoutStep(full.graph, full.constellation, full.graph);
assert.deepEqual(repeated.positions, full.constellation, "相同满图再次求解仍产生漂移");
assert.equal(repeated.metrics.movement.max, 0, "相同满图的位移指标不为零");

const source = await readFile(resolve(here, "layout.mjs"), "utf8");
for (const forbidden of [".lane", ".laneOrder", ".acquiredAt", ".conclusionOrder", ".stage", "edgeBundl"]) {
  assert(!source.includes(forbidden), `v1 布局读取或制造了禁止原语：${forbidden}`);
}
const template = await readFile(resolve(here, "template.html"), "utf8");
for (const forbidden of ["PROBE.lanes", "node.acquiredAt", "laneBoxes", "conclusionBox", "所属分组"]) {
  assert(!template.includes(forbidden), `页面仍显示泳道、顺序或硬分组：${forbidden}`);
}
const prototype = await readFile(resolve(here, "prototype.html"), "utf8");
assert(!prototype.includes("__PROBE_DATA__"), "生成物仍有数据占位符");
assert(prototype.includes("const PROBE ="), "生成物没有内联探针数据");
assert(prototype.includes("v1：结论牵引星座"), "生成物没有 v1 对照入口");

const firstTransition = layoutMetrics(
  saved.get(12).graph,
  saved.get(12).constellation,
  saved.get(6).constellation,
).movement;
const secondTransition = layoutMetrics(
  saved.get(22).graph,
  saved.get(22).constellation,
  saved.get(12).constellation,
).movement;

console.log("结论牵引星座布局检查通过：3 个检查点");
console.log("  语义边界：同一批节点、文字与四类关系；43 条满图关系全部参与坐标求解");
console.log("  空间约束：完整标签盒无互压或越界；数组重排不改坐标；相同满图零漂移");
console.log(
  `  满图支持线：均长 ${baselineFull.support.mean} -> ${candidateFull.support.mean}px，`
    + `最长 ${baselineFull.support.max} -> ${candidateFull.support.max}px`,
);
console.log(
  `  满图杂乱度：交叉 ${baselineFull.crossings} -> ${candidateFull.crossings}，`
    + `边穿其他标签 ${baselineFull.edgeLabelIntersections} -> ${candidateFull.edgeLabelIntersections}`,
);
for (const row of sharedRows) {
  console.log(`  共享证据 ${row.id}：到关联结论距离和 ${row.baseline.toFixed(0)} -> ${row.candidate.toFixed(0)}px`);
}
console.log(
  `  旧节点位移：6→12 均 ${firstTransition.mean}px / 最大 ${firstTransition.max}px；`
    + `12→22 均 ${secondTransition.mean}px / 最大 ${secondTransition.max}px（仍待真人判断方位感）`,
);
