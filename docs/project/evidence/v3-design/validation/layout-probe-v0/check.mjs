/* Structural and stability checks for the two-layout comparison probe. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildProbeTimeline, CHECKPOINTS } from "./probe-data.mjs";
import {
  CANVAS,
  forceLayoutStep,
  LOGIC_EDGE_PHYSICS,
  logicIslandLayoutStep,
  nodeFootprint,
  rectanglesOverlap,
} from "./layout.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const expected = new Map([
  [6, { observations: 6, findings: 2, conclusions: 1, edges: 14 }],
  [12, { observations: 12, findings: 2, conclusions: 2, edges: 21 }],
  [22, { observations: 22, findings: 4, conclusions: 4, edges: 43 }],
]);
const checkpointSteps = new Set(CHECKPOINTS.map((checkpoint) => checkpoint.step));
const structuralKinds = new Set(["latent", "prereq", "caught"]);

function allNodes(graph) {
  return [...graph.nodes, ...graph.findings, ...graph.axioms];
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

function expectedStructuralComponents(graph) {
  const nodes = allNodes(graph);
  const parent = new Map(nodes.map((node) => [node.id, node.id]));
  const find = (id) => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root);
    while (parent.get(id) !== id) {
      const next = parent.get(id);
      parent.set(id, root);
      id = next;
    }
    return root;
  };
  const union = (a, b) => {
    const ar = find(a);
    const br = find(b);
    if (ar !== br) parent.set(br, ar);
  };
  for (const edge of graph.edges) if (structuralKinds.has(edge.kind)) union(edge.from, edge.to);
  const groups = new Map();
  for (const node of nodes) {
    const root = find(node.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(node.id);
  }
  return [...groups.values()]
    .map((members) => members.sort())
    .sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));
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

function displacement(before, after) {
  const distances = [];
  const axiomDistances = [];
  for (const [id, from] of Object.entries(before)) {
    const to = after[id];
    if (!to) continue;
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    distances.push({ id, distance });
    if (id.startsWith("AX:")) axiomDistances.push(distance);
  }
  return {
    common: distances.length,
    movedOver12: distances.filter((entry) => entry.distance > 12).length,
    average: distances.reduce((sum, entry) => sum + entry.distance, 0) / Math.max(1, distances.length),
    maximum: Math.max(0, ...distances.map((entry) => entry.distance)),
    axiomMaximum: Math.max(0, ...axiomDistances),
    anyNonAxiomMovement: distances.some((entry) => !entry.id.startsWith("AX:") && entry.distance > 0.25),
  };
}

const timeline = buildProbeTimeline();
let forcePositions = {};
let pinned = [];
let islandPositions = {};
let previousGraph = null;
let checked = 0;
const saved = new Map();

for (const state of timeline) {
  const graphBefore = JSON.stringify(state.graph);
  const force = forceLayoutStep(state.graph, forcePositions, pinned);
  forcePositions = force.positions;
  pinned = force.pinned;

  const islands = logicIslandLayoutStep(state.graph, islandPositions, previousGraph);
  const reordered = logicIslandLayoutStep(
    reorderGraph(state.graph),
    islandPositions,
    previousGraph ? reorderGraph(previousGraph) : null,
  );
  assert.deepEqual(reordered, islands, `第 ${state.step} 步节点/边数组重排改变了候选布局`);
  assert.equal(JSON.stringify(state.graph), graphBefore, `第 ${state.step} 步布局过程修改了图数据`);
  islandPositions = islands.positions;
  previousGraph = state.graph;

  if (!checkpointSteps.has(state.step)) continue;
  const want = expected.get(state.step);
  assert.deepEqual(state.counts, want, `第 ${state.step} 步图规模漂移`);
  assert.equal(state.graph.nodes.length, state.step, `第 ${state.step} 步应当一步产生一条情报`);

  const nodes = allNodes(state.graph);
  const ids = new Set(nodes.map((node) => node.id));
  assert.equal(ids.size, nodes.length, `第 ${state.step} 步有重复节点 ID`);
  assert.deepEqual(new Set(Object.keys(force.positions)), ids, `第 ${state.step} 步力导向坐标集合漂移`);
  assert.deepEqual(new Set(Object.keys(islands.positions)), ids, `第 ${state.step} 步逻辑岛坐标集合漂移`);
  for (const edge of state.graph.edges) {
    assert(ids.has(edge.from), `关系起点不存在：${edge.from}`);
    assert(ids.has(edge.to), `关系终点不存在：${edge.to}`);
  }

  assert.deepEqual(
    islands.islands.map((island) => island.members),
    expectedStructuralComponents(state.graph),
    `第 ${state.step} 步 supports 或非结构字段改变了逻辑岛成员`,
  );

  const rectangles = [];
  for (const node of nodes) {
    const position = islands.positions[node.id];
    const footprint = nodeFootprint(node);
    assert.deepEqual(position.labelLines, footprint.labelLines, `${node.id} 的碰撞文字与可见文字不一致`);
    assert.equal(position.width, footprint.width, `${node.id} 的标签宽度未进入碰撞盒`);
    assert.equal(position.height, footprint.height, `${node.id} 的标签高度未进入碰撞盒`);
    const bounds = collisionBounds(position);
    assert(bounds.left >= 0, `${node.id} 的标签盒越出左边界`);
    assert(bounds.right <= CANVAS.width, `${node.id} 的标签盒越出右边界`);
    assert(bounds.top >= 0, `${node.id} 的标签盒越出上边界`);
    assert(bounds.bottom <= CANVAS.height, `${node.id} 的标签盒越出下边界`);
    rectangles.push({ id: node.id, ...position });
  }
  for (let left = 0; left < rectangles.length; left += 1) {
    for (let right = left + 1; right < rectangles.length; right += 1) {
      assert(
        !rectanglesOverlap(rectangles[left], rectangles[right]),
        `逻辑岛布局标签压叠：${rectangles[left].id} / ${rectangles[right].id}`,
      );
    }
  }
  saved.set(state.step, structuredClone(islands));
  checked += 1;
}

const full = timeline.at(-1);
assert.deepEqual(
  new Set(full.graph.edges.map((edge) => edge.kind)),
  new Set(["latent", "prereq", "caught", "supports"]),
  "满局没有保留四类既有关系",
);
const fullIslands = saved.get(22).islands.map((island) => island.members.length);
assert(fullIslands.some((size) => size === 1), "满局不再允许合法孤点");
assert(fullIslands.some((size) => size > 1 && size < 5), "满局没有保留小簇");
assert(fullIslands.some((size) => size >= 8), "满局没有形成可辨认的主簇");

assert.equal(LOGIC_EDGE_PHYSICS.supports.structural, false, "supports 被算成了逻辑岛结构边");
assert.equal(LOGIC_EDGE_PHYSICS.supports.normaliseTargetDegree, true, "supports 没有按目标结论度数归一化");
const weakestStructural = Math.min(
  LOGIC_EDGE_PHYSICS.latent.strength,
  LOGIC_EDGE_PHYSICS.prereq.strength,
  LOGIC_EDGE_PHYSICS.caught.strength,
);
assert(
  LOGIC_EDGE_PHYSICS.supports.strength < weakestStructural / 3,
  "supports 的物理引力仍足以主宰结构边",
);

const candidateSource = logicIslandLayoutStep.toString();
for (const forbidden of [".lane", ".laneOrder", ".acquiredAt", ".conclusionOrder", ".stage"]) {
  assert(!candidateSource.includes(forbidden), `候选坐标读取了禁止字段：${forbidden}`);
}
assert(!candidateSource.includes("pinned"), "候选仍按年龄或类型硬钉节点");

const repeat = logicIslandLayoutStep(full.graph, islandPositions, full.graph);
assert.deepEqual(repeat.positions, islandPositions, "图未变化时重复布局仍产生漂移");

const firstTransition = displacement(saved.get(6).positions, saved.get(12).positions);
const secondTransition = displacement(saved.get(12).positions, saved.get(22).positions);
for (const [label, diagnostic] of [["6→12", firstTransition], ["12→22", secondTransition]]) {
  assert(diagnostic.anyNonAxiomMovement, `${label} 的旧节点全部被硬钉`);
  assert(diagnostic.average < 130, `${label} 的软锚未能限制整图漂移`);
  assert(diagnostic.axiomMaximum < 40, `${label} 的既有结论地标漂移过大`);
}

const obs = (id, short) => ({ id, short, type: "obs", state: "known" });
const bridgeBefore = {
  nodes: [
    obs("obs.current.whole", "整只碗的样貌"),
    obs("obs.current.base", "底足痕迹"),
    obs("obs.structure.xray.early", "釉下结构影像"),
    obs("obs.unrelated", "暂未接上的另一条情报"),
  ],
  findings: [],
  axioms: [],
  edges: [{ kind: "prereq", from: "obs.current.whole", to: "obs.current.base" }],
};
const bridgeAfter = {
  ...bridgeBefore,
  nodes: [...bridgeBefore.nodes, obs("obs.object.continuity", "手里这只就是记录里那只")],
  edges: [
    ...bridgeBefore.edges,
    { kind: "prereq", from: "obs.current.base", to: "obs.object.continuity" },
    { kind: "caught", from: "obs.object.continuity", to: "obs.structure.xray.early" },
  ],
};
const bridgeSeed = logicIslandLayoutStep(bridgeBefore);
const bridge = logicIslandLayoutStep(bridgeAfter, bridgeSeed.positions, bridgeBefore);
const bridgeMain = bridge.islands.find((island) => island.members.includes("obs.object.continuity"));
assert.deepEqual(
  new Set(bridgeMain.members),
  new Set(["obs.current.whole", "obs.current.base", "obs.object.continuity", "obs.structure.xray.early"]),
  "caught 桥没有把 WHOLE→BASE 与 XRAY 接成同一局部结构",
);
assert(bridge.affectedNodeIds.includes("obs.current.whole"), "caught 桥的两跳邻域没有获得重排空间");
assert(!bridge.affectedNodeIds.includes("obs.unrelated"), "caught 桥错误扰动了无关孤点");

const prototype = await readFile(resolve(here, "prototype.html"), "utf8");
const template = await readFile(resolve(here, "template.html"), "utf8");
const probeDataSource = await readFile(resolve(here, "probe-data.mjs"), "utf8");
assert(!prototype.includes("__PROBE_DATA__"), "生成物仍有数据占位符");
assert(prototype.includes("const PROBE ="), "生成物没有内联探针数据");
for (const forbidden of ["PROBE.lanes", "node.acquiredAt", "laneBoxes", "conclusionBox", "所属分组"] ) {
  assert(!template.includes(forbidden), `候选页面仍显示泳道或取得顺序痕迹：${forbidden}`);
}
for (const forbidden of ["LANES", "FINDING_LANE", "AXIOM_ORDER", "laneOrder", "acquiredAt", "conclusionOrder"]) {
  assert(!probeDataSource.includes(forbidden), `同图数据仍混入旧布局字段：${forbidden}`);
}
const layoutSource = await readFile(resolve(here, "layout.mjs"), "utf8");
assert(
  layoutSource.includes("const magnitude = repulsion / distanceSquared;"),
  "力导向基线没有沿用当前工作台的无遮盖斥力公式",
);
assert(!layoutSource.includes("Math.min(28, repulsion / distanceSquared)"), "力导向基线偷偷封顶了斥力");

console.log(`布局探针检查通过：${checked} 个检查点`);
console.log("  同一图数据：两种布局只消费坐标，不改节点、文字或四类关系");
console.log("  候选布局：结构边形成逻辑岛；supports 不并岛且按结论度数归一化弱引力");
console.log("  候选约束：标签盒无压叠/越界；数组重排不改坐标；终态重复布局零漂移");
console.log(
  `  位移 6→12：${firstTransition.movedOver12}/${firstTransition.common} 个旧节点 >12px，`
  + `平均 ${firstTransition.average.toFixed(1)}px，最大 ${firstTransition.maximum.toFixed(1)}px`,
);
console.log(
  `  位移 12→22：${secondTransition.movedOver12}/${secondTransition.common} 个旧节点 >12px，`
  + `平均 ${secondTransition.average.toFixed(1)}px，最大 ${secondTransition.maximum.toFixed(1)}px`,
);
console.log("  微型桥接：WHOLE→BASE→OBJECT_CONTINUITY 通过 caught 接住 XRAY；无关孤点不进受影响邻域");
console.log("  力导向基线：斥力公式与当前工作台一致，不额外封顶");
