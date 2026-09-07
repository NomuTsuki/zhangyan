import assert from 'node:assert/strict';
import { layoutGraph, splitTitle } from './layout.mjs';
import { buildGraph } from './graph.mjs';
import { newSession, take, solve, workbench } from '../workbench-map-focus-v1/session.mjs';

let passed = 0;
const checks = [];
const node = (id, kind = 'evidence', title = `Known information ${id}`) => ({ id, kind, title, summary: '', sourceIds: [] });
const edge = (from, to, index = 0) => ({ id: `${from}-${to}-${index}`, from, to, label: 'Known relationship', kind: 'supports' });
function check(name, run) { run(); passed += 1; checks.push(name); console.log(`PASS ${name}`); }
function overlap(a, b) {
  return Math.abs(a.x - b.x) < (a.width + b.width) / 2 && Math.abs(a.y - b.y) < (a.height + b.height) / 2;
}
function polynomialRoots(a, b, c) {
  if (a === 0) return b === 0 ? [] : [-c / b];
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];
  return [(-b - Math.sqrt(discriminant)) / (2 * a), (-b + Math.sqrt(discriminant)) / (2 * a)];
}
function assertVisibleCurveAvoidsLabels(route, positions) {
  const tokens = route.path.match(/[MLQ]|-?\d+(?:\.\d+)?/g);
  let cursor = 0, current;
  while (cursor < tokens.length) {
    const command = tokens[cursor++];
    const first = { x: +tokens[cursor++], y: +tokens[cursor++] };
    if (command === 'M') { current = first; continue; }
    const end = command === 'Q' ? { x: +tokens[cursor++], y: +tokens[cursor++] } : first;
    const control = command === 'Q' ? first : { x: (current.x + end.x) / 2, y: (current.y + end.y) / 2 };
    const coefficient = axis => [current[axis] - 2 * control[axis] + end[axis], 2 * (control[axis] - current[axis]), current[axis]];
    const x = coefficient('x'), y = coefficient('y');
    const evaluate = (coefficients, t) => coefficients[0] * t * t + coefficients[1] * t + coefficients[2];
    for (const [id, position] of Object.entries(positions)) {
      const left = position.x - position.width / 2, right = position.x + position.width / 2;
      const top = id === route.from || id === route.to ? position.y - 15 : position.y - position.height / 2;
      const bottom = position.y + position.height / 2;
      const boundaries = [0, 1, ...polynomialRoots(x[0], x[1], x[2] - left), ...polynomialRoots(x[0], x[1], x[2] - right),
        ...polynomialRoots(y[0], y[1], y[2] - top), ...polynomialRoots(y[0], y[1], y[2] - bottom)].filter(t => t >= 0 && t <= 1).sort((a, b) => a - b);
      for (let index = 1; index < boundaries.length; index += 1) {
        const t = (boundaries[index - 1] + boundaries[index]) / 2, atX = evaluate(x, t), atY = evaluate(y, t);
        assert.equal(atX > left && atX < right && atY > top && atY < bottom, false, `visible ${command} curve ${route.id} crosses ${id}`);
      }
    }
    current = end;
  }
}
function verifyGeometry(graph, result) {
  assert.equal(Object.keys(result.positions).length, graph.nodes.length);
  const positions = Object.entries(result.positions);
  for (const [id, position] of positions) {
    for (const property of ['x', 'y', 'width', 'height', 'anchorX', 'anchorY']) assert.ok(Number.isFinite(position[property]), `${id}.${property}`);
    assert.ok(position.width >= 140 && position.width <= 170);
    assert.ok(position.lines.length <= 2);
    assert.ok(position.x - position.width / 2 >= 0);
    assert.ok(position.x + position.width / 2 <= result.width);
    assert.ok(position.y - position.height / 2 >= 0);
    assert.ok(position.y + position.height / 2 <= result.height);
  }
  for (let i = 0; i < positions.length; i += 1) {
    for (let j = i + 1; j < positions.length; j += 1) assert.equal(overlap(positions[i][1], positions[j][1]), false, `${positions[i][0]} intersects ${positions[j][0]}`);
  }
  assert.deepEqual(result.diagnostics.overlaps, []);
  assert.deepEqual(result.diagnostics.routeNodeIntersections, []);
  for (const route of result.edges) {
    assert.ok(route.path.startsWith('M '));
    assert.doesNotMatch(route.path, /NaN|Infinity|undefined/);
    assert.ok(Number.isFinite(route.labelX) && Number.isFinite(route.labelY));
    // Updated endpoint contract after browser evidence: a route formerly ended
    // at the glyph center, hiding its arrow tip under the opaque 12px glyph.
    // The rendered path and diagnostic points must now end outside that glyph.
    const source = result.positions[route.from], target = result.positions[route.to];
    assert.ok(Math.hypot(route.points[0].x - source.anchorX, route.points[0].y - source.anchorY) > 6, 'road starts outside source glyph');
    assert.ok(Math.hypot(route.points.at(-1).x - target.anchorX, route.points.at(-1).y - target.anchorY) > 6, 'arrow tip ends outside target glyph');
    assertVisibleCurveAvoidsLabels(route, result.positions);
  }
}

check('empty obtained graph creates no planned nodes', () => {
  const graph = { nodes: [], edges: [] }, result = layoutGraph(graph);
  verifyGeometry(graph, result); assert.deepEqual(result.edges, []); assert.deepEqual(result.diagnostics.components, []);
});

check('long real-world titles retain legible two-line display', () => {
  assert.ok(splitTitle('事故档案中的修补事件与眼前器物的实物痕迹得到了相互对应').length === 2);
  assert.ok(splitTitle('事故档案中的修补事件与眼前器物的实物痕迹得到了相互对应')[1].endsWith('…'));
  assert.deepEqual(splitTitle('同一只碗'), ['同一只碗']);
});

check('disconnected islands are independent without synthetic root or edges', () => {
  const graph = { nodes: Array.from({ length: 7 }, (_, index) => node(`island${index}`)), edges: [] };
  const result = layoutGraph(graph, { width: 790 });
  verifyGeometry(graph, result); assert.equal(result.diagnostics.components.length, 7); assert.equal(result.edges.length, 0);
});

check('bridge connects remembered islands without moving old nodes', () => {
  const first = { nodes: [node('archive'), node('xray'), node('photo')], edges: [] };
  const before = layoutGraph(first, { width: 790 });
  const next = { nodes: [...first.nodes, node('continuity', 'finding')], edges: [edge('continuity', 'archive'), edge('continuity', 'photo'), edge('continuity', 'xray')] };
  const after = layoutGraph(next, { width: 790, previous: before });
  verifyGeometry(next, after); assert.equal(after.diagnostics.maxMovement, 0); assert.equal(after.diagnostics.components.length, 1);
});

check('new relationship between existing nodes leaves their geometry intact', () => {
  const first = { nodes: [node('archive'), node('object')], edges: [] }, before = layoutGraph(first, { width: 950 });
  const next = { ...first, edges: [edge('archive', 'object')] }, after = layoutGraph(next, { width: 950, previous: before });
  verifyGeometry(next, after); assert.deepEqual(after.positions, before.positions);
});

check('repeat rendering is deterministic and records every old-node movement', () => {
  const graph = { nodes: [node('a'), node('b'), node('c')], edges: [edge('a', 'b'), edge('c', 'b')] };
  assert.deepEqual(layoutGraph(graph), layoutGraph(graph));
  const before = layoutGraph(graph), after = layoutGraph(graph, { previous: before });
  assert.equal(after.diagnostics.movements.length, graph.nodes.length); assert.equal(after.diagnostics.maxMovement, 0);
});

check('multiple evidence paths converge without imposing universal finding tier', () => {
  const graph = { nodes: [node('one'), node('two'), node('three'), node('four'), node('local', 'finding'), node('judgment', 'claim'), node('result', 'stage')],
    edges: [edge('one', 'local'), edge('two', 'local'), edge('local', 'judgment'), edge('three', 'judgment'), edge('four', 'judgment'), edge('judgment', 'result')] };
  const result = layoutGraph(graph, { width: 790 }); verifyGeometry(graph, result);
  assert.equal(result.edges.length, graph.edges.length);
});

const fullGraph = {
  nodes: Array.from({ length: 35 }, (_, index) => node(`item${index}`, ['evidence', 'finding', 'evidence', 'claim', 'stage'][index % 5], `Item ${index}: remembered evidence and links`)),
  edges: Array.from({ length: 34 }, (_, index) => edge(`item${index}`, `item${Math.floor(index / 3) + 1}`, index)).filter(item => item.from !== item.to),
};
fullGraph.edges.push(edge('item2', 'item18'), edge('item7', 'item26'), edge('item4', 'item29'));

for (const width of [790, 950, 1450]) {
  check(`35-node cold graph at ${width}px has no intersecting nodes or blocked roads`, () => {
    const result = layoutGraph(fullGraph, { width }); verifyGeometry(fullGraph, result);
    console.log(`METRIC cold width=${width} nodes=${fullGraph.nodes.length} edges=${result.edges.length} canvasHeight=${result.height}`);
  });
  check(`35-node incremental graph at ${width}px preserves every previous location`, () => {
    let previous = null;
    for (let count = 1; count <= fullGraph.nodes.length; count += 1) {
      const nodes = fullGraph.nodes.slice(0, count), ids = new Set(nodes.map(item => item.id));
      const graph = { nodes, edges: fullGraph.edges.filter(item => ids.has(item.from) && ids.has(item.to)) };
      const result = layoutGraph(graph, { width, previous }); verifyGeometry(graph, result);
      assert.equal(result.diagnostics.maxMovement, 0, `step ${count}`); previous = result;
    }
    console.log(`METRIC incremental width=${width} canvasHeight=${previous.height} maxOldMovement=0`);
  });
}

check('desktop resize reports necessary moves and keeps all labels in bounds', () => {
  const before = layoutGraph(fullGraph, { width: 1450 });
  const result = layoutGraph(fullGraph, { width: 790, previous: before }); verifyGeometry(fullGraph, result);
  assert.equal(result.diagnostics.movements.length, fullGraph.nodes.length);
  assert.ok(result.diagnostics.maxMovement > 0);
  console.log(`METRIC resize maxMovement=${result.diagnostics.maxMovement} relocated=${result.diagnostics.relocated.length}`);
});

check('caller graph and previous layout remain unchanged', () => {
  const beforeGraph = structuredClone(fullGraph), previous = layoutGraph(fullGraph), beforeLayout = structuredClone(previous);
  layoutGraph(fullGraph, { width: 790, previous });
  assert.deepEqual(fullGraph, beforeGraph); assert.deepEqual(previous, beforeLayout);
});

const realSession = newSession(), realSteps = [buildGraph(solve(realSession), realSession)];
while (realSession.log.length < realSession.budget) {
  const choice = workbench(realSession).find(item => item.usable && !item.done);
  assert.ok(choice, `real scenario blocked at ${realSession.log.length} actions`);
  assert.equal(take(realSession, choice.action.id).ok, true);
  realSteps.push(buildGraph(solve(realSession), realSession));
}
for (const width of [790, 950, 1450]) {
  check(`real 22-action obtained graph at ${width}px has no intersecting nodes or blocked roads`, () => {
    const graph = realSteps.at(-1), result = layoutGraph(graph, { width }); verifyGeometry(graph, result);
    console.log(`METRIC real cold width=${width} nodes=${graph.nodes.length} edges=${result.edges.length} canvasHeight=${result.height} boxAreaRatio=${result.diagnostics.nodeBoxAreaRatio} meanRoad=${result.diagnostics.averageRoadLength} maxRoad=${result.diagnostics.maxRoadLength}`);
  });
  check(`real investigation at ${width}px retains old-node location through all 22 actions`, () => {
    let previous = null;
    for (const graph of realSteps) {
      const result = layoutGraph(graph, { width, previous }); verifyGeometry(graph, result);
      assert.equal(result.diagnostics.maxMovement, 0); previous = result;
    }
    console.log(`METRIC real incremental width=${width} canvasHeight=${previous.height} maxOldMovement=0 boxAreaRatio=${previous.diagnostics.nodeBoxAreaRatio} meanRoad=${previous.diagnostics.averageRoadLength} maxRoad=${previous.diagnostics.maxRoadLength}`);
  });
}

console.log(`RESULT ${passed}/${checks.length} checks passed; browser readability and human experience remain unverified.`);
