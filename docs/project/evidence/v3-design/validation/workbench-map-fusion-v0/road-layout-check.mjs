/* review required: new presentation-geometry tests. They verify coordinates
 * and visible paths, not whether a player understands the map. */
import assert from 'node:assert/strict';
import { layoutGraph } from './layout.mjs';

const node = (id, extras = {}) => ({ id, title: `Information ${id}`, kind: 'evidence', ...extras });
const edge = (id, from, to) => ({ id, from, to, kind: 'context', directed: false });
const gap = (id, from, to, nextEdge = 'match') => ({ id, kind: 'gap', anchorIds: [from, to],
  title: 'Is this the same bowl?', continuation: { nodeIds: [], edgeIds: [nextEdge] } });
let passed = 0;
function check(name, run) { run(); passed += 1; console.log(`PASS ${name}`); }
const allPositions = result => ({ ...result.positions, ...result.frontierPositions, ...result.junctionPositions });
function sameKnownCoordinates(before, after) {
  for (const [id, position] of Object.entries(before.positions)) {
    assert.equal(after.positions[id].x, position.x, `${id} x`);
    assert.equal(after.positions[id].y, position.y, `${id} y`);
  }
  assert.equal(after.diagnostics.maxMovement, 0);
}
function visibleSamples(path) {
  const tokens = path.match(/[MLQ]|-?\d+(?:\.\d+)?/g), samples = [];
  let index = 0, current;
  while (index < tokens.length) {
    const command = tokens[index++], first = { x: +tokens[index++], y: +tokens[index++] };
    if (command === 'M') { current = first; samples.push(first); continue; }
    const end = command === 'Q' ? { x: +tokens[index++], y: +tokens[index++] } : first;
    const control = command === 'Q' ? first : { x: (current.x + end.x) / 2, y: (current.y + end.y) / 2 };
    const count = Math.max(80, Math.ceil(Math.hypot(end.x - current.x, end.y - current.y) * 2));
    for (let step = 0; step <= count; step += 1) {
      const t = step / count;
      samples.push({ x: (1 - t) ** 2 * current.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x,
        y: (1 - t) ** 2 * current.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y });
    }
    current = end;
  }
  return samples;
}
function clearGeometry(result) {
  assert.deepEqual(result.diagnostics.overlaps, []);
  assert.deepEqual(result.diagnostics.routeNodeIntersections, []);
  const positions = allPositions(result);
  for (const position of Object.values(positions)) {
    assert.ok(position.x >= 0 && position.x <= result.width);
    assert.ok(position.y >= 0 && position.y <= result.height);
  }
  for (const road of [...result.edges, ...Object.values(result.frontierRoutes).flat(), ...result.supportJunctions]) {
    assert.doesNotMatch(road.path, /NaN|Infinity|undefined/);
    for (const [id, position] of Object.entries(positions)) {
      const endpoint = road.routeFrom === id || road.routeTo === id;
      if (position.isJunction && endpoint) continue;
      const top = endpoint ? position.y - 15 : position.y - position.height / 2;
      const samples = visibleSamples(road.path);
      assert.equal(samples.some(point => point.x > position.x - position.width / 2 && point.x < position.x + position.width / 2
        && point.y > top && point.y < position.y + position.height / 2), false, `${road.id} covers ${id}`);
    }
  }
}

check('a two-ended question uses the middle when it has room, without creating an answer node', () => {
  const graph = { nodes: [node('photo'), node('bowl')], edges: [], frontiers: [gap('identity', 'photo', 'bowl')] };
  const remembered = { positions: { photo: { x: 116, y: 120 }, bowl: { x: 662, y: 120 } }, width: 778 };
  const result = layoutGraph(graph, { width: 778, previous: remembered });
  clearGeometry(result);
  assert.equal(result.frontierPositions.identity.x, 389);
  assert.equal(result.frontierPositions.identity.y, 120);
  assert.deepEqual(Object.keys(result.positions), ['photo', 'bowl']);
  assert.equal(result.edges.length, 0);
  assert.equal(result.frontierRoutes.identity.length, 2);
});

for (const width of [618, 778, 1258]) {
  check(`the same open road closes and survives new branches at ${width}px`, () => {
    const graph = { nodes: [node('photo'), node('bowl')], edges: [], frontiers: [gap('identity', 'photo', 'bowl')] };
    const before = layoutGraph(graph, { width }); clearGeometry(before);
    const joinedGraph = { ...graph, edges: [edge('match', 'photo', 'bowl')], frontiers: [] };
    const joined = layoutGraph(joinedGraph, { width, previous: before }); clearGeometry(joined);
    sameKnownCoordinates(before, joined);
    assert.deepEqual(joined.frontierPositions, {});
    assert.equal(joined.routes.match.gapFrontierId, 'identity');
    const oldPoints = [...before.frontierRoutes.identity[0].points, ...[...before.frontierRoutes.identity[1].points].reverse()];
    assert.deepEqual(joined.routes.match.points, oldPoints, 'both existing road portions remain exactly');
    const grownGraph = { ...joinedGraph,
      nodes: [...graph.nodes, node('historic-repair', { layoutAnchorIds: ['photo'] }), node('xray'), node('surface')],
      edges: [...joinedGraph.edges, edge('history', 'photo', 'historic-repair')],
      frontiers: [gap('range', 'xray', 'surface', 'range-match')] };
    const grown = layoutGraph(grownGraph, { width, previous: joined }); clearGeometry(grown);
    sameKnownCoordinates(joined, grown);
    assert.equal(grown.routes.match.gapFrontierId, 'identity');
    assert.deepEqual(grown.roadMemories.match, joined.roadMemories.match, 'later placement never overwrites the original road memory');
  });
}

check('placement-only anchors locate an acquired node without adding proof edges or merging components', () => {
  const graph = { nodes: [node('source')], edges: [], frontiers: [] };
  const before = layoutGraph(graph, { width: 778 });
  const next = { ...graph, nodes: [...graph.nodes, node('interpretation', { layoutAnchorIds: ['source', 'not-obtained'] })] };
  const after = layoutGraph(next, { width: 778, previous: before }); clearGeometry(after);
  sameKnownCoordinates(before, after);
  assert.equal(after.edges.length, 0);
  assert.equal(after.diagnostics.components.length, 2);
  assert.equal(Object.hasOwn(after.positions, 'not-obtained'), false);
  assert.ok(Math.hypot(after.positions.source.x - after.positions.interpretation.x, after.positions.source.y - after.positions.interpretation.y) < 300);
});

check('changed titles refresh their text while preserving the acquired node position', () => {
  const beforeGraph = { nodes: [node('photo')], edges: [], frontiers: [] };
  const before = layoutGraph(beforeGraph, { width: 618 });
  const after = layoutGraph({ ...beforeGraph, nodes: [node('photo', { title: 'Confirmed historic photo' })] }, { width: 618, previous: before });
  clearGeometry(after); sameKnownCoordinates(before, after);
  assert.notDeepEqual(after.positions.photo.lines, before.positions.photo.lines);
});

check('new content at a retired gap reroutes only where needed and keeps the original road memory', () => {
  const question = gap('identity', 'photo', 'bowl');
  question.continuation.nodeIds = ['historic-repair'];
  const graph = { nodes: [node('photo'), node('bowl')], edges: [], frontiers: [question] };
  const before = layoutGraph(graph, { width: 778,
    previous: { positions: { photo: { x: 116, y: 120 }, bowl: { x: 662, y: 120 } }, width: 778 } });
  const next = { nodes: [...graph.nodes, node('historic-repair')], edges: [edge('match', 'photo', 'bowl')], frontiers: [] };
  const after = layoutGraph(next, { width: 778, previous: before }); clearGeometry(after);
  sameKnownCoordinates(before, after);
  assert.equal(after.positions['historic-repair'].x, before.frontierPositions.identity.x);
  assert.equal(after.positions['historic-repair'].y, before.frontierPositions.identity.y);
  assert.equal(after.routes.match.gapFrontierId, 'identity');
  assert.notDeepEqual(after.routes.match.points, after.roadMemories.match.points, 'the new label actually required a detour');
  assert.deepEqual(after.routes.match.points[0], after.roadMemories.match.points[0]);
  assert.deepEqual(after.routes.match.points.at(-1), after.roadMemories.match.points.at(-1));
});

check('a second relationship update retains the road that first closed between the same endpoints', () => {
  const graph = { nodes: [node('record'), node('bowl')], edges: [],
    frontiers: [gap('attribution', 'record', 'bowl'), gap('corroboration', 'record', 'bowl')] };
  const initial = layoutGraph(graph, { width: 778 }); clearGeometry(initial);
  const next = { ...graph, edges: [edge('match', 'record', 'bowl')], frontiers: [graph.frontiers[1]] };
  const attributed = layoutGraph(next, { width: 778, previous: initial }); clearGeometry(attributed);
  const resolved = layoutGraph({ ...next, frontiers: [], edges: [{ ...next.edges[0], label: 'attribution and corroboration' }] },
    { width: 778, previous: attributed }); clearGeometry(resolved);
  assert.equal(resolved.routes.match.gapFrontierId, 'attribution');
  assert.deepEqual(resolved.roadMemories.match, attributed.roadMemories.match);
  sameKnownCoordinates(initial, resolved);
});

console.log(`RESULT ${passed}/${passed} road geometry checks passed; review required; player readability remains unverified.`);
