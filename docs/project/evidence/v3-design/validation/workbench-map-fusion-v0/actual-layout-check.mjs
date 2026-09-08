/* review required: new geometry coverage of the actual fusion-local session.
 * This deliberately imports local-session, not the frozen prototype session.
 * It checks the actual diagnostic arrays and the rendered quadratic curves.
 * It does not claim player readability. */
import assert from 'node:assert/strict';
import { newSession, take, solve, workbench } from './local-session.mjs';
import { buildGraph } from './graph.mjs';
import { layoutGraph } from './layout.mjs';

const COMPARISON = 'A.MAP.REGION_CONTINUITY';
const widths = [618, 778, 1258];
const sequence16 = [
  'A.OBSERVE.WHOLE', 'A.OBSERVE.BASE', 'A.LOCATE.HISTORIC_IMAGE', 'A.VERIFY.OBJECT_CONTINUITY',
  'A.RESEARCH.ACCIDENT', 'A.RELATE.ARCHIVE.T2_TO_OBJECT', 'A.CORROBORATE.ARCHIVE.T2_CURRENT',
  'A.RESEARCH.LATE_TREATMENT', 'A.RELATE.ARCHIVE.T3_TO_OBJECT', 'A.CORROBORATE.ARCHIVE.T3_CURRENT',
  'A.ANALYZE.MATERIAL.SUBSTRATE', 'A.INSPECT.MATERIAL.LAYER_SEQUENCE', 'A.INSPECT.WINDOWS',
  'A.SYNTHESIZE.SURFACE_REGIONS', 'A.ASSESS.TREATED_AND_UNTREATED', 'A.TRACE.PROVENANCE_CHAIN',
];
function roots(a, b, c) {
  if (a === 0) return b === 0 ? [] : [-c / b];
  const discriminant = b * b - 4 * a * c;
  return discriminant < 0 ? [] : [(-b - Math.sqrt(discriminant)) / (2 * a), (-b + Math.sqrt(discriminant)) / (2 * a)];
}
function checkVisiblePath(road, positions, label) {
  const tokens = road.path.match(/[MLQ]|-?\d+(?:\.\d+)?/g);
  let index = 0, current;
  while (index < tokens.length) {
    const command = tokens[index++], first = { x: +tokens[index++], y: +tokens[index++] };
    if (command === 'M') { current = first; continue; }
    const end = command === 'Q' ? { x: +tokens[index++], y: +tokens[index++] } : first;
    const control = command === 'Q' ? first : { x: (current.x + end.x) / 2, y: (current.y + end.y) / 2 };
    const coefficients = axis => [current[axis] - 2 * control[axis] + end[axis], 2 * (control[axis] - current[axis]), current[axis]];
    const x = coefficients('x'), y = coefficients('y');
    const at = (c, t) => c[0] * t * t + c[1] * t + c[2];
    for (const [id, position] of Object.entries(positions)) {
      const endpoint = road.routeFrom === id || road.routeTo === id;
      if (position.isJunction && endpoint) continue;
      const left = position.x - position.width / 2, right = position.x + position.width / 2;
      const top = endpoint ? position.y - 15 : position.y - position.height / 2;
      const bottom = position.y + position.height / 2;
      const cuts = [0, 1, ...roots(x[0], x[1], x[2] - left), ...roots(x[0], x[1], x[2] - right),
        ...roots(y[0], y[1], y[2] - top), ...roots(y[0], y[1], y[2] - bottom)]
        .filter(t => t >= 0 && t <= 1).sort((a, b) => a - b);
      for (let cut = 1; cut < cuts.length; cut += 1) {
        const t = (cuts[cut - 1] + cuts[cut]) / 2, px = at(x, t), py = at(y, t);
        assert.equal(px > left && px < right && py > top && py < bottom, false,
          `${label}: ${road.id} visible ${command} crosses ${id}`);
      }
    }
    current = end;
  }
}
function geometry(graph, result, previous, label) {
  assert.ok(Array.isArray(result.diagnostics.overlaps), 'must inspect real overlap diagnostic');
  assert.ok(Array.isArray(result.diagnostics.routeNodeIntersections), 'must inspect real path diagnostic');
  assert.deepEqual(result.diagnostics.overlaps, [], label + ' overlapping label boxes');
  assert.deepEqual(result.diagnostics.routeNodeIntersections, [], label + ' intersecting route segments');
  assert.equal(result.diagnostics.maxMovement, 0, label + ' old node movement');
  assert.equal(Object.keys(result.positions).length, graph.nodes.length, 'no placeholders become information');
  const positions = { ...result.positions, ...result.frontierPositions, ...result.junctionPositions };
  for (const node of graph.nodes) {
    const p = result.positions[node.id], old = previous?.positions[node.id];
    if (old) assert.deepEqual([p.x, p.y], [old.x, old.y], label + ' remembered ' + node.id);
    assert.ok(p.x - p.width / 2 >= 0 && p.x + p.width / 2 <= result.width, node.id + ' horizontal extent');
    assert.ok(p.y - p.height / 2 >= 0 && p.y + p.height / 2 <= result.height, node.id + ' vertical extent');
  }
  for (const road of [...result.edges, ...Object.values(result.frontierRoutes).flat(), ...result.supportJunctions]) {
    assert.ok(road.path.startsWith('M '));
    assert.doesNotMatch(road.path, /NaN|Infinity|undefined/);
    checkVisiblePath(road, positions, label);
  }
}
function allActions(basis) {
  const session = newSession(), actions = [];
  while (actions.length < 22) {
    const available = workbench(session).find(item => item.usable && !item.done);
    assert.ok(available, 'every distinct action can be reached');
    const action = available.action.id;
    const options = action === COMPARISON ? { comparisonBasis: basis } : {};
    const outcome = take(session, action, options);
    assert.equal(outcome.ok, true, action + ': ' + outcome.why);
    actions.push({ action, ...options });
  }
  assert.equal(new Set(actions.map(item => item.action)).size, 22);
  return actions;
}
const action = (action, comparisonBasis) => ({ action, ...(comparisonBasis ? { comparisonBasis } : {}) });
const sequences = {
  'full-sixteen': sequence16.map(item => action(item)),
  'all-twenty-two-photo': allActions('photo'),
  'all-twenty-two-archive': allActions('archive'),
  'photo-difference-before-attribution': [
    action('A.OBSERVE.WHOLE'), action('A.IMAGE.XRAY'), action('A.LOCATE.HISTORIC_IMAGE'),
    action(COMPARISON, 'photo'), action('A.OBSERVE.BASE'), action('A.VERIFY.OBJECT_CONTINUITY'),
  ],
  'attribution-before-photo-difference': [
    action('A.LOCATE.HISTORIC_IMAGE'), action('A.OBSERVE.BASE'), action('A.VERIFY.OBJECT_CONTINUITY'),
    action('A.OBSERVE.WHOLE'), action('A.IMAGE.XRAY'), action(COMPARISON, 'photo'),
  ],
  'archive-difference-before-attribution': [
    action('A.RESEARCH.ACCIDENT'), action('A.OBSERVE.WHOLE'), action(COMPARISON, 'archive'),
    action('A.RELATE.ARCHIVE.T2_TO_OBJECT'), action('A.CORROBORATE.ARCHIVE.T2_CURRENT'),
  ],
};
let passed = 0;
for (const width of widths) for (const [name, sequence] of Object.entries(sequences)) {
  const session = newSession();
  let graph = buildGraph(solve(session), session), previous = layoutGraph(graph, { width });
  geometry(graph, previous, null, name + ' initial');
  for (const [index, step] of sequence.entries()) {
    const result = take(session, step.action, { comparisonBasis: step.comparisonBasis });
    assert.equal(result.ok, true, step.action + ': ' + result.why);
    graph = buildGraph(solve(session), session);
    const layout = layoutGraph(graph, { width, previous });
    geometry(graph, layout, previous, `${name} at ${width}px step ${index + 1} ${step.action}`);
    previous = layout;
  }
  if (name === 'full-sixteen' || name.startsWith('all-twenty-two')) assert.equal(solve(session).stage, 'G3');
  passed += 1;
  console.log(`PASS ${name} width=${width} steps=${sequence.length} nodes=${graph.nodes.length} height=${previous.height} intersections=0 maxOldMovement=0`);
}
console.log(`RESULT ${passed}/${Object.keys(sequences).length * widths.length} actual local-session geometry sequences passed; review required; player readability remains unverified.`);
