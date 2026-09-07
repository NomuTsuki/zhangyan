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
      const endpoint = id === (route.routeFrom ?? route.from) || id === (route.routeTo ?? route.to);
      if (position.isJunction && endpoint) continue;
      const left = position.x - position.width / 2, right = position.x + position.width / 2;
      const top = endpoint ? position.y - 15 : position.y - position.height / 2;
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
  const positions = Object.entries({ ...result.positions, ...result.frontierPositions });
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
  const allPositions = { ...result.positions, ...result.frontierPositions, ...result.junctionPositions };
  for (const route of [...result.edges, ...Object.values(result.frontierRoutes).flat(), ...result.supportJunctions]) {
    assert.ok(route.path.startsWith('M '));
    assert.doesNotMatch(route.path, /NaN|Infinity|undefined/);
    assert.ok(Number.isFinite(route.labelX) && Number.isFinite(route.labelY));
    // Updated endpoint contract after browser evidence: a route formerly ended
    // at the glyph center, hiding its arrow tip under the opaque 12px glyph.
    // The rendered path and diagnostic points must now end outside that glyph.
    const source = allPositions[route.routeFrom ?? route.from], target = allPositions[route.routeTo ?? route.to];
    assert.ok(Math.hypot(route.points[0].x - source.anchorX, route.points[0].y - source.anchorY) > 6, 'road starts outside source glyph');
    assert.ok(Math.hypot(route.points.at(-1).x - target.anchorX, route.points.at(-1).y - target.anchorY) > 6, 'arrow tip ends outside target glyph');
    assertVisibleCurveAvoidsLabels(route, allPositions);
  }
}

const question = (id, anchorIds, kind = 'stub', continuation = []) => ({ id, anchorIds, kind,
  title: '这处已知还能说明什么？', sourceIds: anchorIds, actionIds: [],
  continuation: { nodeIds: continuation, edgeIds: [] } });

check('empty obtained graph creates neither future nodes nor question placeholders', () => {
  const graph = { nodes: [], edges: [], frontiers: [question('future', ['unknown'])] };
  const result = layoutGraph(graph); verifyGeometry(graph, result);
  assert.deepEqual(result.frontierPositions, {}); assert.deepEqual(result.edges, []);
});

check('shared pending question never creates a relation between its anchors', () => {
  const graph = { nodes: [node('xray'), node('photo')], edges: [], frontiers: [question('context', ['xray', 'photo'], 'shared')] };
  const result = layoutGraph(graph, { width: 618 }); verifyGeometry(graph, result);
  assert.equal(Object.keys(result.positions).length, 2);
  assert.equal(result.edges.length, 0); assert.equal(result.frontierRoutes.context.length, 2);
  assert.ok(result.frontierRoutes.context.every(route => route.to === 'context' && route.directed === false));
});

check('two-ended gap leaves a visible discontinuity without moving remembered nodes', () => {
  const graph = { nodes: [node('archive'), node('object')], edges: [], frontiers: [question('belongs', ['archive', 'object'], 'gap')] };
  const result = layoutGraph(graph, { width: 618 }); verifyGeometry(graph, result);
  const ends = result.frontierRoutes.belongs.map(route => route.points.at(-1));
  assert.ok(Math.hypot(ends[0].x - ends[1].x, ends[0].y - ends[1].y) >= 12);
  const strengthened = { ...graph, edges: [edge('archive', 'object')] };
  const after = layoutGraph(strengthened, { width: 618, previous: result }); verifyGeometry(strengthened, after);
  assert.deepEqual(after.positions, result.positions);
});

check('an acquired continuation occupies the retired frontier cell', () => {
  const graph = { nodes: [node('point')], edges: [], frontiers: [question('range', ['point'], 'stub', ['surface'])] };
  const before = layoutGraph(graph, { width: 618 }); verifyGeometry(graph, before);
  const next = { nodes: [...graph.nodes, node('surface')], edges: [edge('point', 'surface')], frontiers: [] };
  const after = layoutGraph(next, { width: 618, previous: before }); verifyGeometry(next, after);
  assert.deepEqual(after.positions.point, before.positions.point);
  assert.equal(after.positions.surface.x, before.frontierPositions.range.x);
  assert.equal(after.positions.surface.y, before.frontierPositions.range.y);
});

check('same-ID strengthened relation reuses geometry and refreshes semantics', () => {
  const graph = { nodes: [node('a'), node('b')], edges: [{ ...edge('a', 'b'), label: 'attribution', sourceIds: ['a'] }], frontiers: [] };
  const before = layoutGraph(graph, { width: 778 });
  const next = { ...graph, edges: [{ ...graph.edges[0], label: 'attribution and corroboration', sourceIds: ['a', 'b'] }] };
  const after = layoutGraph(next, { width: 778, previous: before }); verifyGeometry(next, after);
  assert.equal(after.edges[0].path, before.edges[0].path);
  assert.equal(after.edges[0].label, next.edges[0].label); assert.deepEqual(after.edges[0].sourceIds, ['a', 'b']);
  assert.equal(after.diagnostics.maxMovement, 0);
});

check('resize retains remembered coordinates and gives the canvas a scrollable extent', () => {
  const graph = { nodes: Array.from({ length: 8 }, (_, i) => node(`n${i}`)), edges: [], frontiers: [] };
  const before = layoutGraph(graph, { width: 1258 });
  const after = layoutGraph(graph, { width: 618, previous: before }); verifyGeometry(graph, after);
  assert.deepEqual(before.positions, after.positions); assert.equal(after.width, 1258);
});

check('caller graph and previous layout remain immutable', () => {
  const graph = { nodes: [node('a')], edges: [], frontiers: [question('q', ['a'])] };
  const previous = layoutGraph(graph), original = structuredClone(graph), old = structuredClone(previous);
  layoutGraph({ ...graph, nodes: [...graph.nodes, node('b')] }, { previous });
  assert.deepEqual(graph, original); assert.deepEqual(previous, old);
  assert.deepEqual(splitTitle('同一只碗'), ['同一只碗']);
});

check('joint conditions meet at a junction and alternative routes use separate junctions', () => {
  const graph = { nodes: [node('whole'), node('base'), node('comparison'), node('continuity'), node('identity', 'claim')],
    edges: [edge('whole', 'identity'), edge('base', 'identity'), edge('comparison', 'identity'), edge('continuity', 'identity')], frontiers: [] };
  graph.supportGroups = ['comparison', 'continuity'].map(id => ({ id: `identity:${id}`, targetId: 'identity', kind: 'all', alternativeSet: 'identity', title: '共同条件',
    memberNodeIds: ['whole', 'base', id], edgeIds: graph.edges.filter(item => item.from === 'whole' || item.from === 'base' || item.from === id).map(item => item.id) }));
  const result = layoutGraph(graph, { width: 618 }); verifyGeometry(graph, result);
  assert.equal(result.supportJunctions.length, 2);
  assert.notDeepEqual([result.supportJunctions[0].x, result.supportJunctions[0].y], [result.supportJunctions[1].x, result.supportJunctions[1].y]);
  assert.equal(result.edges.length, 6);
  for (const junction of result.supportJunctions) {
    assert.equal(result.edges.filter(item => item.supportGroupId === junction.groupId).length, 3);
    assert.ok(result.edges.filter(item => item.supportGroupId === junction.groupId).every(item => item.routeTo === junction.id && item.semanticEdgeId));
  }
  assert.equal(new Set(result.edges.map(item => item.semanticEdgeId)).size, 4);
  const repeated = layoutGraph(graph, { width: 618, previous: result }); verifyGeometry(graph, repeated);
  assert.deepEqual(repeated.edges, result.edges);
});

const minimumRoute = [
  'A.OBSERVE.WHOLE', 'A.OBSERVE.BASE', 'A.VERIFY.OBJECT_CONTINUITY',
  'A.RESEARCH.ACCIDENT', 'A.RELATE.ARCHIVE.T2_TO_OBJECT', 'A.CORROBORATE.ARCHIVE.T2_CURRENT',
  'A.LOCATE.HISTORIC_IMAGE', 'A.RESEARCH.LATE_TREATMENT', 'A.RELATE.ARCHIVE.T3_TO_OBJECT',
  'A.CORROBORATE.ARCHIVE.T3_CURRENT', 'A.ANALYZE.MATERIAL.SUBSTRATE', 'A.INSPECT.MATERIAL.LAYER_SEQUENCE',
  'A.INSPECT.WINDOWS', 'A.SYNTHESIZE.SURFACE_REGIONS', 'A.ASSESS.TREATED_AND_UNTREATED', 'A.TRACE.PROVENANCE_CHAIN',
];
const sequences = {
  'early-material-then-context': ['A.IMAGE.XRAY', 'A.LOCATE.HISTORIC_IMAGE', 'A.OBSERVE.BASE', 'A.VERIFY.OBJECT_CONTINUITY'],
  'independent-archive-relations': ['A.OBSERVE.WHOLE', 'A.RESEARCH.ACCIDENT', 'A.RELATE.ARCHIVE.T2_TO_OBJECT', 'A.CORROBORATE.ARCHIVE.T2_CURRENT'],
  'report-before-endpoints': ['A.RELATE.ARCHIVE.T2_TO_OBJECT', 'A.CORROBORATE.ARCHIVE.T2_CURRENT', 'A.RESEARCH.ACCIDENT', 'A.OBSERVE.WHOLE'],
  'sixteen-action-route': minimumRoute,
  'point-to-regional-range': ['A.INSPECT.WINDOWS', 'A.SYNTHESIZE.SURFACE_REGIONS'],
};
const allSession = newSession();
const allActions = [];
while (allSession.log.length < 22) {
  const choice = workbench(allSession).find(item => item.usable && !item.done);
  assert.ok(choice); assert.equal(take(allSession, choice.action.id).ok, true); allActions.push(choice.action.id);
}
sequences['all-twenty-two-actions'] = allActions;
for (const width of [618, 778, 1258]) for (const [name, actions] of Object.entries(sequences)) {
  check(`${name} at ${width}px avoids all node/question/visible-road collisions`, () => {
    const session = newSession(); let previous = layoutGraph(buildGraph(solve(session), session), { width });
    for (const action of actions) {
      assert.equal(take(session, action).ok, true, action);
      const graph = buildGraph(solve(session), session), result = layoutGraph(graph, { width, previous });
      verifyGeometry(graph, result); assert.equal(result.diagnostics.maxMovement, 0, `${name}: ${action}`);
      previous = result;
    }
    if (name === 'sixteen-action-route') {
      assert.equal(solve(session).stage, 'G3');
      assert.ok(previous.supportJunctions.length >= 4, 'four achieved judgments keep their completed support packages');
      assert.ok(previous.edges.some(item => item.supportGroupId), 'real support routes enter shared junctions');
    }
    console.log(`METRIC ${name} width=${width} height=${previous.height} nodes=${Object.keys(previous.positions).length} frontiers=${Object.keys(previous.frontierPositions).length} maxOldMovement=0`);
  });
}

console.log(`RESULT ${passed}/${checks.length} checks passed; rendered readability and human experience remain unverified.`);
