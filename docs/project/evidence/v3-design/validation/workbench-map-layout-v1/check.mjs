/* Layout-only checks; gameplay semantics remain covered by harness.mjs. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { newSession, take, solve } from "./session.mjs";
import { mentalMap } from "./projection.mjs";
import {
  CANVAS,
  constellationLayoutStep,
  layoutMetrics,
  nodeFootprint,
  previousPositionsForGraph,
  rectanglesOverlap,
} from "./layout.mjs";
import { EXPERIMENTAL_PARAMS as P } from "./params.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ORDER = [
  "A.OBSERVE.WHOLE",
  "A.OBSERVE.BASE",
  "A.OBSERVE.REGION_DECOR",
  "A.COMPARE.CORPUS",
  "A.VERIFY.OBJECT_CONTINUITY",
  "A.IMAGE.XRAY",
  "A.MAP.REGION_CONTINUITY",
  "A.RESEARCH.ACCIDENT",
  "A.RELATE.ARCHIVE.T2_TO_OBJECT",
  "A.CORROBORATE.ARCHIVE.T2_CURRENT",
  "A.LOCATE.HISTORIC_IMAGE",
  "A.RESEARCH.LATE_TREATMENT",
  "A.RELATE.ARCHIVE.T3_TO_OBJECT",
  "A.CORROBORATE.ARCHIVE.T3_CURRENT",
  "A.ANALYZE.MATERIAL.SUBSTRATE",
  "A.INSPECT.MATERIAL.LAYER_SEQUENCE",
  "A.INSPECT.WINDOWS",
  "A.SYNTHESIZE.SURFACE_REGIONS",
  "A.SCREEN.UV",
  "A.ASSESS.TREATED_AND_UNTREATED",
  "A.TRACE.PROVENANCE_CHAIN",
  "A.COMPARE.CORPUS.RECHECK",
];

const allNodes = (graph) => [...graph.nodes, ...graph.findings, ...graph.axioms];
const edgeKey = (edge) => `${edge.kind}:${edge.from}>${edge.to}`;

function bounds(point) {
  const cx = point.x + (point.boxOffsetX ?? 0);
  const cy = point.y + (point.boxOffsetY ?? 0);
  return {
    left: cx - point.width / 2,
    right: cx + point.width / 2,
    top: cy - point.height / 2,
    bottom: cy + point.height / 2,
  };
}

function runTimeline() {
  const session = newSession(ORDER.length);
  let positions = {};
  let previousGraph = null;
  const states = [];
  for (const actionId of ORDER) {
    const result = take(session, actionId);
    assert(result.ok, `${actionId} 应当可以执行：${result.why ?? ""}`);
    const graph = structuredClone(mentalMap(solve(session)));
    const graphBefore = JSON.stringify(graph);
    const oldIds = new Set(previousGraph ? allNodes(previousGraph).map((node) => node.id) : []);
    const expectedNewIds = allNodes(graph).filter((node) => !oldIds.has(node.id)).map((node) => node.id).sort();
    const staged = structuredClone(positions);
    for (const id of expectedNewIds) staged[id] = { x: 31, y: 47 };
    const filteredPrevious = previousPositionsForGraph(staged, previousGraph);
    for (const id of expectedNewIds) {
      assert(!filteredPrevious[id], `第一拍临时坐标错误成为软锚：${id}`);
    }
    const laidOut = constellationLayoutStep(graph, filteredPrevious, previousGraph, CANVAS);
    assert.deepEqual(laidOut.newNodeIds, expectedNewIds, "新增节点识别受第一拍 staging 污染");
    assert.equal(JSON.stringify(graph), graphBefore, "坐标求解不得修改投影图");
    positions = laidOut.positions;
    previousGraph = graph;
    states.push({ graph, laidOut });
  }
  return states;
}

assert(P.springs.supports.ideal < P.springs.latent.ideal, "supports 必须使用最短的目标距离");
assert(P.springs.supports.ideal < P.springs.caught.ideal, "supports 不能退回弱显示边");
assert(P.springs.supports.strength > P.springs.latent.strength, "supports 必须是一等布局约束");
assert(P.springs.supports.longStrength > 0, "supports 必须惩罚超长尾");
assert(P.springs.supports.longThreshold > P.springs.supports.ideal, "长尾阈值必须晚于目标距离");

const first = runTimeline();
const second = runTimeline();
assert.deepEqual(
  first.map((state) => state.laidOut.positions),
  second.map((state) => state.laidOut.positions),
  "相同图与行动顺序必须得到确定性坐标",
);

for (const [index, state] of first.entries()) {
  const nodes = allNodes(state.graph);
  const ids = new Set(nodes.map((node) => node.id));
  assert.deepEqual(new Set(Object.keys(state.laidOut.positions)), ids, `第 ${index + 1} 步坐标集合漂移`);
  assert.deepEqual(
    new Set(state.laidOut.usedEdgeKeys),
    new Set(state.graph.edges.map(edgeKey)),
    `第 ${index + 1} 步没有让全部关系参与布局`,
  );
  for (const node of nodes) {
    const point = state.laidOut.positions[node.id];
    const footprint = nodeFootprint(node);
    assert.deepEqual(point.labelLines, footprint.labelLines, `${node.id} 的可见换行与碰撞盒不一致`);
    const box = bounds(point);
    assert(box.left >= 0 && box.right <= CANVAS.width, `${node.id} 横向越界`);
    assert(box.top >= 0 && box.bottom <= CANVAS.height, `${node.id} 纵向越界`);
  }
  for (let left = 0; left < nodes.length; left += 1) {
    for (let right = left + 1; right < nodes.length; right += 1) {
      assert(
        !rectanglesOverlap(
          state.laidOut.positions[nodes[left].id],
          state.laidOut.positions[nodes[right].id],
        ),
        `第 ${index + 1} 步标签互压：${nodes[left].id} / ${nodes[right].id} `
          + JSON.stringify([
            state.laidOut.positions[nodes[left].id],
            state.laidOut.positions[nodes[right].id],
          ]),
      );
    }
  }
}

const full = first.at(-1);
assert.equal(full.graph.nodes.length, 22, "满局观察数漂移");
assert.equal(full.graph.edges.length, 43, "满局关系数漂移");
assert.deepEqual(
  new Set(full.graph.edges.map((edge) => edge.kind)),
  new Set(["latent", "prereq", "caught", "supports"]),
  "四类既有关系漂移",
);
const metrics = layoutMetrics(full.graph, full.laidOut.positions);
assert.equal(metrics.overlaps, 0, "满局仍有标签互压");
assert.equal(metrics.support.count, 23, "满局 supports 数量漂移");

const repeated = constellationLayoutStep(full.graph, full.laidOut.positions, full.graph, CANVAS);
assert.deepEqual(repeated.positions, full.laidOut.positions, "图未变化时坐标仍漂移");

const template = await readFile(resolve(here, "template.html"), "utf8");
const prototype = await readFile(resolve(here, "prototype.html"), "utf8");
const layoutSource = await readFile(resolve(here, "layout.mjs"), "utf8");
for (const forbidden of ["laneOrder", "acquiredAt", "conclusionOrder", "pinned.has"]) {
  assert(!layoutSource.includes(forbidden), `布局读取了禁止字段：${forbidden}`);
}
assert(template.includes("LAYOUT.constellationLayoutStep"), "工作台没有接入星座布局");
assert(template.includes("focusedNodeId"), "节点聚焦交互缺失");
assert(template.includes(" L${end.x},${end.y}"), "关系仍不是直接可追踪的直线");
assert(!prototype.includes("__INLINE__"), "离线产物仍有模块占位符");
assert(!prototype.includes("__STAMP__"), "离线产物仍有戳记占位符");
assert(prototype.includes("const LAYOUT = (() =>"), "离线产物没有内联布局模块");

console.log("layout check 全部通过");
console.log(`  满局：${full.graph.nodes.length} 情报 / ${full.graph.edges.length} 关系 / ${metrics.support.count} 条 supports`);
console.log(`  supports：均长 ${metrics.support.mean}px / 中位 ${metrics.support.median}px / 最长 ${metrics.support.max}px`);
console.log(`  交叉 ${metrics.crossings} / 穿其他标签 ${metrics.edgeLabelIntersections} / 标签互压 ${metrics.overlaps}`);
