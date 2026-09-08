/**
 * Experimental player-map geometry. Only the currently obtained graph is input.
 * Positions are centers; known nodes keep their coordinates. Questions reserve
 * space which can become a newly acquired continuation. No author topology, topic lane or kind rank is used.
 */
const NODE_WIDTH = 168;
const NODE_HEIGHT = 100;
const MARGIN = 32;
const GAP = 30;
const ROUTE_CLEARANCE = 10;
const ROAD_START_INSET = 7;
const ROAD_END_INSET = 9;

const round = value => Math.round(value * 100) / 100;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const hash = text => [...String(text)].reduce((value, char) => (value * 31 + char.codePointAt(0)) >>> 0, 17);

function measuredWidth(text) {
  return [...text].reduce((total, char) => total + (/[^\x00-\xff]/.test(char) ? 14 : /[MW@]/.test(char) ? 11 : 7.5), 0);
}

/** Two lines at 14 px. Complete original text remains on the graph node. */
export function splitTitle(title, width = NODE_WIDTH - 12) {
  const lines = [''];
  for (const char of [...String(title ?? '')]) {
    const index = lines.length - 1;
    if (measuredWidth(lines[index] + char) > width && lines[index]) lines.push(char);
    else lines[index] += char;
  }
  if (lines.length <= 2) return lines;
  let last = lines[1];
  while (measuredWidth(last + '…') > width) last = [...last].slice(0, -1).join('');
  return [lines[0], last + '…'];
}

function nodePosition(node, x, y) {
  const lines = splitTitle(node.title);
  return { x: round(x), y: round(y), width: NODE_WIDTH, height: NODE_HEIGHT,
    anchorX: round(x), anchorY: round(y - 32), lines, titleLines: lines };
}

function bounds(position, padding = 0) {
  return { left: position.x - position.width / 2 - padding, right: position.x + position.width / 2 + padding,
    top: position.y - position.height / 2 - padding, bottom: position.y + position.height / 2 + padding };
}

function boxesOverlap(a, b, padding = 0) {
  const one = bounds(a, padding / 2), two = bounds(b, padding / 2);
  return one.left < two.right && one.right > two.left && one.top < two.bottom && one.bottom > two.top;
}

function interior(point, rectangle) {
  return point.x > rectangle.left && point.x < rectangle.right && point.y > rectangle.top && point.y < rectangle.bottom;
}

/** Open-interior intersection: corners and travel on a rectangle boundary are legal. */
function crossesRectangle(a, b, rectangle) {
  if (interior(a, rectangle) || interior(b, rectangle)) return true;
  const dx = b.x - a.x, dy = b.y - a.y;
  let entry = 0, exit = 1;
  for (const [origin, delta, low, high] of [[a.x, dx, rectangle.left, rectangle.right], [a.y, dy, rectangle.top, rectangle.bottom]]) {
    if (delta === 0) {
      if (origin <= low || origin >= high) return false;
    } else {
      const values = [(low - origin) / delta, (high - origin) / delta].sort((x, y) => x - y);
      entry = Math.max(entry, values[0]); exit = Math.min(exit, values[1]);
      if (entry >= exit) return false;
    }
  }
  return entry < exit && entry < 1 && exit > 0;
}

function clearSegment(a, b, obstacles) {
  return !obstacles.some(rectangle => crossesRectangle(a, b, rectangle));
}

function segmentCrosses(a, b, c, d) {
  const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  return cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;
}

function choosePosition(node, positions, neighbours, graphEdges, width, preferred = null) {
  const placed = Object.values(positions);
  const connected = neighbours.map(id => positions[id]).filter(Boolean);
  const minX = MARGIN + NODE_WIDTH / 2, maxX = width - minX;
  const minY = MARGIN + NODE_HEIGHT / 2;
  const desired = preferred ?? (connected.length
    ? { x: connected.reduce((sum, position) => sum + position.x, 0) / connected.length,
      y: connected.reduce((sum, position) => sum + position.y, 0) / connected.length }
    : { x: width / 2 + ((hash(node.id) % 3) - 1) * 42, y: minY + 16 });
  const candidates = [];
  const add = (x, y) => {
    if (x >= minX && x <= maxX && y >= minY) candidates.push(nodePosition(node, x, y));
  };
  if (!placed.length) add(clamp(desired.x, minX, maxX), minY + 26);
  add(desired.x, desired.y);
  if (preferred) {
    const exact = nodePosition(node, preferred.x, preferred.y);
    if (preferred.x >= minX && preferred.x <= maxX && preferred.y >= minY && !placed.some(p => boxesOverlap(exact, p, GAP))) return exact;
  }
  const angleOffset = (hash(node.id) % 19) / 19 * Math.PI * 2;
  for (let ring = 0; ring < 13; ring += 1) {
    const radius = 178 + ring * 66;
    for (let index = 0; index < 32; index += 1) {
      const angle = angleOffset + index / 32 * Math.PI * 2;
      add(desired.x + Math.cos(angle) * radius, desired.y + Math.sin(angle) * radius * 0.77);
    }
  }
  // Existing edges of occupied boxes define candidate holes. A new addition
  // can reuse those holes even when a regular sampling lattice would miss one.
  for (const position of placed) {
    for (const dx of [-NODE_WIDTH - GAP - 1, 0, NODE_WIDTH + GAP + 1]) {
      for (const dy of [-NODE_HEIGHT - GAP - 1, 0, NODE_HEIGHT + GAP + 1]) {
        if (dx || dy) add(position.x + dx, position.y + dy);
      }
    }
  }
  const columns = Math.max(1, Math.floor((width - MARGIN * 2 + GAP) / (NODE_WIDTH + GAP)));
  const currentBottom = Math.max(minY + 26, ...placed.map(position => position.y));
  const bottom = Math.max(minY, ...placed.map(position => position.y)) + NODE_HEIGHT + GAP;
  for (let row = 0; row <= Math.ceil((bottom - minY) / (NODE_HEIGHT + GAP)) + 1; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      add(columns === 1 ? width / 2 : minX + column * (maxX - minX) / (columns - 1), minY + 26 + row * (NODE_HEIGHT + GAP + 1));
    }
  }
  for (let y = minY + 18; y <= bottom + 200; y += 64) {
    for (let x = minX + ((Math.floor(y / 64) % 2) * 19); x <= maxX; x += 64) add(x, y);
  }
  // Always keep an unoccupied escape row. The canvas grows; text never shrinks.
  add(clamp(desired.x, minX, maxX), bottom);
  let best = null, bestScore = Infinity;
  for (const candidate of candidates) {
    if (placed.some(position => boxesOverlap(candidate, position, GAP))) continue;
    const linkDistance = connected.reduce((sum, position) => sum + distance(candidate, position), 0);
    const isolationDistance = placed.length ? Math.min(...placed.map(position => distance(candidate, position))) : 0;
    let crossings = 0, occlusions = 0;
    for (const neighbour of connected) {
      for (const edge of graphEdges) {
        const a = positions[edge.from], b = positions[edge.to];
        if (a && b && a !== neighbour && b !== neighbour && segmentCrosses(candidate, neighbour, a, b)) crossings += 1;
      }
      for (const position of placed) {
        if (position !== neighbour && crossesRectangle(candidate, neighbour, bounds(position, ROUTE_CLEARANCE))) occlusions += 1;
      }
    }
    const extentGrowth = Math.max(0, candidate.y - currentBottom);
    const preferredCost = preferred ? distance(candidate, preferred) * 5 : 0;
    const score = preferredCost + (connected.length
      ? linkDistance / connected.length + crossings * 55 + occlusions * 35 + candidate.y * 0.32 + extentGrowth * 2.2
      : candidate.y * 0.9 + Math.abs(candidate.x - width / 2) * 0.13 + Math.max(0, 230 - isolationDistance) * 1.7 + extentGrowth);
    if (score < bestScore) { best = candidate; bestScore = score; }
  }
  return best ?? nodePosition(node, clamp(desired.x, minX, maxX), bottom);
}

function routeObstacles(positions, edge) {
  return Object.entries(positions).filter(([id, position]) => !position.isJunction || (id !== edge.from && id !== edge.to)).map(([id, position]) => {
    const rectangle = bounds(position, ROUTE_CLEARANCE);
    // Endpoints connect at their glyph. Their own text remains an obstacle.
    if (id === edge.from || id === edge.to) rectangle.top = position.y - 15 - ROUTE_CLEARANCE;
    return { ...rectangle, id };
  });
}

/** Shortest visibility path around known-node rectangles. */
function route(start, end, obstacles) {
  if (clearSegment(start, end, obstacles)) return [start, end];
  const vertices = [start, end];
  const seen = new Set([`${start.x},${start.y}`, `${end.x},${end.y}`]);
  for (const rectangle of obstacles) {
    for (const [x, y] of [[rectangle.left, rectangle.top], [rectangle.left, rectangle.bottom], [rectangle.right, rectangle.top], [rectangle.right, rectangle.bottom]]) {
      const point = { x, y }, key = `${x},${y}`;
      if (!seen.has(key) && !obstacles.some(other => interior(point, other))) { seen.add(key); vertices.push(point); }
    }
  }
  const costs = vertices.map(() => Infinity), previous = vertices.map(() => -1), closed = new Set();
  costs[0] = 0;
  while (closed.size < vertices.length) {
    let next = -1, nextScore = Infinity;
    for (let index = 0; index < vertices.length; index += 1) {
      const score = costs[index] + distance(vertices[index], end);
      if (!closed.has(index) && score < nextScore) { next = index; nextScore = score; }
    }
    if (next < 0) break;
    if (next === 1) {
      const result = [];
      for (let index = 1; index !== -1; index = previous[index]) result.unshift(vertices[index]);
      return result;
    }
    closed.add(next);
    for (let index = 1; index < vertices.length; index += 1) {
      if (closed.has(index)) continue;
      const cost = costs[next] + distance(vertices[next], vertices[index]);
      if (cost < costs[index] && clearSegment(vertices[next], vertices[index], obstacles)) {
        costs[index] = cost; previous[index] = next;
      }
    }
  }
  // Disconnected visibility graph is reported, never silently declared clear.
  return [start, end];
}

export function pathData(points) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${round(points[0].x)} ${round(points[0].y)}`;
  // Rounded bends stay outside original boxes because routing uses a 10px moat.
  if (points.length < 3) return `M ${round(points[0].x)} ${round(points[0].y)} L ${round(points[1].x)} ${round(points[1].y)}`;
  let path = `M ${round(points[0].x)} ${round(points[0].y)}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const a = points[index - 1], b = points[index], c = points[index + 1];
    const radius = Math.min(7, distance(a, b) / 4, distance(b, c) / 4);
    const nearA = { x: b.x + (a.x - b.x) / distance(a, b) * radius, y: b.y + (a.y - b.y) / distance(a, b) * radius };
    const nearC = { x: b.x + (c.x - b.x) / distance(b, c) * radius, y: b.y + (c.y - b.y) / distance(b, c) * radius };
    path += ` L ${round(nearA.x)} ${round(nearA.y)} Q ${round(b.x)} ${round(b.y)} ${round(nearC.x)} ${round(nearC.y)}`;
  }
  const last = points.at(-1);
  return `${path} L ${round(last.x)} ${round(last.y)}`;
}

function insetRoad(points) {
  const result = points.map(point => ({ ...point }));
  const insetStart = (amount) => {
    while (result.length > 1) {
      const first = result[0], next = result[1], length = distance(first, next);
      if (length <= amount && result.length > 2) { amount -= length; result.shift(); continue; }
      if (length > 0) {
        const fraction = Math.min(amount, length / 2) / length;
        result[0] = { x: first.x + (next.x - first.x) * fraction, y: first.y + (next.y - first.y) * fraction };
      }
      break;
    }
  };
  // Glyphs have an opaque 12px body. Stop the road outside that body so
  // the SVG marker tip remains visible instead of ending under the glyph.
  insetStart(ROAD_START_INSET);
  result.reverse(); insetStart(ROAD_END_INSET); result.reverse();
  return result;
}

function edgeLabel(points, positions) {
  const segments = points.slice(1).map((point, index) => ({ a: points[index], b: point, length: distance(points[index], point) })).sort((a, b) => b.length - a.length);
  for (const segment of segments) {
    for (const fraction of [0.5, 0.35, 0.65]) {
      const point = { x: segment.a.x + (segment.b.x - segment.a.x) * fraction, y: segment.a.y + (segment.b.y - segment.a.y) * fraction };
      const labelBox = { ...point, width: 138, height: 24 };
      if (!Object.values(positions).some(position => boxesOverlap(position, labelBox, 8))) return point;
    }
  }
  const segment = segments[0];
  return { x: (segment.a.x + segment.b.x) / 2, y: (segment.a.y + segment.b.y) / 2 };
}

const FRONTIER_HEIGHT = 100;
function frontierPosition(frontier, position) {
  return { ...position, height: FRONTIER_HEIGHT, kind: frontier.kind, frontierId: frontier.id,
    lines: splitTitle(frontier.title), titleLines: splitTitle(frontier.title) };
}

function polylineMidpoint(points) {
  const lengths = points.slice(1).map((point, index) => distance(points[index], point));
  let remaining = lengths.reduce((sum, length) => sum + length, 0) / 2;
  for (let index = 0; index < lengths.length; index += 1) {
    if (remaining <= lengths[index]) {
      const fraction = lengths[index] ? remaining / lengths[index] : 0;
      return { x: points[index].x + (points[index + 1].x - points[index].x) * fraction,
        y: points[index].y + (points[index + 1].y - points[index].y) * fraction };
    }
    remaining -= lengths[index];
  }
  return points.at(-1);
}

// The question occupies the middle of an endpoint-to-endpoint route. Its
// invisible label box may need to move beside that route when the two known
// labels leave too little room. It never moves either known endpoint.
function gapPreferredPosition(frontier, positions) {
  const [fromId, toId] = frontier.anchorIds;
  const from = positions[fromId], to = positions[toId];
  const middle = polylineMidpoint(route({ x: from.anchorX, y: from.anchorY },
    { x: to.anchorX, y: to.anchorY }, routeObstacles(positions, { from: fromId, to: toId })));
  return { x: middle.x, y: middle.y + 32 };
}

function joinGapBranches(frontier, branches, edge) {
  if (frontier.kind !== 'gap' || frontier.anchorIds.length !== 2) return null;
  const source = branches.find(branch => branch.from === edge.from);
  const target = branches.find(branch => branch.from === edge.to);
  if (!source || !target) return null;
  // Branch endpoints are already outside their glyphs. Keep those visible
  // portions exactly and bridge only the old open middle.
  return [...source.points, ...[...target.points].reverse()].map(point => ({ ...point }));
}

function continueRememberedRoad(memory, start, end, obstacles) {
  const preferred = memory.points.map(point => ({ ...point }));
  preferred[0] = start; preferred[preferred.length - 1] = end;
  const points = [preferred[0]];
  for (let index = 1; index < preferred.length; index += 1) {
    // A newly obtained node may occupy a former question cell. Preserve every
    // still-clear segment, but skip blocked intermediate waypoints and route
    // the affected stretch around the new visible content.
    if (index < preferred.length - 1 && obstacles.some(rectangle => interior(preferred[index], rectangle))) continue;
    const section = route(points.at(-1), preferred[index], obstacles);
    points.push(...section.slice(1));
  }
  return points.filter((point, index) => !index || distance(point, points[index - 1]) > 0.001);
}

/**
 * Known positions are spatial memory, including across viewport changes. The
 * canvas retains its previous width on narrowing; the caller scrolls it instead
 * of moving old information. Frontiers are public questions, never graph nodes.
 */
export function layoutGraph(graph, { width = 960, height = 680, previous = null } = {}) {
  width = Math.max(400, Number.isFinite(width) ? width : 960, previous?.width ?? 0);
  height = Math.max(240, Number.isFinite(height) ? height : 680);
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const rawEdges = Array.isArray(graph?.edges) ? graph.edges : [];
  const knownIds = new Set(nodes.map(node => node.id));
  if (knownIds.size !== nodes.length) throw new Error('layoutGraph requires unique node IDs');
  const edges = rawEdges.filter(edge => knownIds.has(edge.from) && knownIds.has(edge.to) && edge.from !== edge.to);
  const frontiers = (graph?.frontiers ?? []).map(frontier => ({ ...frontier,
    anchorIds: [...new Set(frontier.anchorIds ?? [])].filter(id => knownIds.has(id))
  })).filter(frontier => frontier.anchorIds.length);
  if (new Set(frontiers.map(item => item.id)).size !== frontiers.length) throw new Error('layoutGraph requires unique frontier IDs');
  const oldPositions = previous?.positions ?? previous ?? {};
  const oldQuestions = previous?.frontiers ?? [];
  const oldFrontierPositions = previous?.frontierPositions ?? {};
  const currentFrontierIds = new Set(frontiers.map(item => item.id));
  const supportGroups = (graph?.supportGroups ?? []).filter(group => knownIds.has(group.targetId));
  const geometryKey = JSON.stringify([width, nodes.map(item => [item.id, item.title, item.layoutAnchorIds]), edges.map(item => [item.id, item.from, item.to]),
    frontiers.map(item => [item.id, item.kind, item.title, item.anchorIds, item.continuation]), supportGroups]);
  // Focus does not change geometry. Reuse paths for an unchanged spatial graph,
  // but replace edge metadata because a same-ID relationship may have matured.
  if (previous?.geometryKey === geometryKey) {
    const currentEdges = new Map(edges.map(edge => [edge.id, edge]));
    const routedEdges = previous.edges.map(edge => ({ ...edge, ...currentEdges.get(edge.semanticEdgeId ?? edge.id), id: edge.id }));
    return { ...previous, edges: routedEdges, routes: Object.fromEntries(routedEdges.map(edge => [edge.id, edge])),
      frontiers, height: Math.max(previous.height, height), diagnostics: { ...previous.diagnostics,
        movements: nodes.map(node => ({ id: node.id, distance: 0, from: oldPositions[node.id], to: oldPositions[node.id] })), maxMovement: 0 } };
  }
  const positions = {}, frontierPositions = {}, adjacency = new Map(nodes.map(node => [node.id, []]));
  for (const edge of edges) { adjacency.get(edge.from).push(edge.to); adjacency.get(edge.to).push(edge.from); }
  // Placement anchors do not participate in proof, selection, or graph
  // components. Only obtained node IDs can guide a new label's location.
  const placementNeighbours = new Map(nodes.map(node => [node.id,
    [...new Set([...adjacency.get(node.id), ...(node.layoutAnchorIds ?? []).filter(id => knownIds.has(id) && id !== node.id)])]]));
  const pending = [];
  for (const node of nodes) {
    const old = oldPositions[node.id];
    if (old && Number.isFinite(old.x) && Number.isFinite(old.y)) positions[node.id] = nodePosition(node, old.x, old.y);
    else pending.push(node);
  }
  // Retain open question cells while placing acquired nodes. A resolved
  // question only yields its cell to an explicitly named acquired continuation.
  const reservations = Object.fromEntries(frontiers.filter(item => oldFrontierPositions[item.id])
    .map(item => [item.id, oldFrontierPositions[item.id]]));
  const continuations = new Map();
  for (const frontier of oldQuestions) {
    if (currentFrontierIds.has(frontier.id) || !oldFrontierPositions[frontier.id]) continue;
    for (const id of frontier.continuation?.nodeIds ?? []) {
      if (knownIds.has(id) && !oldPositions[id] && !continuations.has(id)) continuations.set(id, oldFrontierPositions[frontier.id]);
    }
  }
  while (pending.length) {
    let nextIndex = 0, mostPlaced = -1;
    for (let index = 0; index < pending.length; index += 1) {
      const count = placementNeighbours.get(pending[index].id).filter(id => positions[id]).length + (continuations.has(pending[index].id) ? 1000 : 0);
      if (count > mostPlaced) { mostPlaced = count; nextIndex = index; }
    }
    const [node] = pending.splice(nextIndex, 1);
    positions[node.id] = choosePosition(node, { ...positions, ...reservations }, placementNeighbours.get(node.id), edges, width, continuations.get(node.id));
  }
  for (const frontier of frontiers) {
    const old = oldFrontierPositions[frontier.id];
    const occupied = { ...positions, ...frontierPositions };
    const anchors = frontier.anchorIds.map(id => positions[id]);
    const midpoint = { x: anchors.reduce((sum, p) => sum + p.x, 0) / anchors.length,
      y: anchors.reduce((sum, p) => sum + p.y, 0) / anchors.length + (frontier.kind === 'gap' ? 0 : NODE_HEIGHT + GAP) };
    const preferred = old ?? (frontier.kind === 'gap' && frontier.anchorIds.length === 2
      ? gapPreferredPosition(frontier, occupied) : midpoint);
    frontierPositions[frontier.id] = frontierPosition(frontier,
      choosePosition(frontier, occupied, frontier.anchorIds, edges, width, preferred));
  }
  const allPositions = { ...positions, ...frontierPositions };
  const junctionPositions = {}, groupJunctions = new Map();
  for (const group of supportGroups) {
    const target = positions[group.targetId];
    const id = `junction:${group.id}`, old = previous?.junctionPositions?.[id];
    const candidatePoints = old ? [{ x: old.x, y: old.y }] : [];
    for (let ring = 0; ring < 15; ring += 1) for (const angle of [-Math.PI / 2, -Math.PI / 3, -Math.PI * 2 / 3, 0, Math.PI, Math.PI / 3, Math.PI * 2 / 3, Math.PI / 2]) {
      const radius = 70 + ring * 28;
      candidatePoints.push({ x: round(target.x + Math.cos(angle) * radius), y: round(target.anchorY + Math.sin(angle) * radius) });
    }
    const free = candidatePoints.find(point => point.x >= 20 && point.x <= width - 20 && point.y >= 20
      && !Object.values({ ...allPositions, ...junctionPositions }).some(position => boxesOverlap({ ...point, width: 20, height: 20 }, position, 16)));
    const point = free ?? { x: target.x, y: Math.max(...Object.values(allPositions).map(position => position.y + position.height / 2)) + 40 + groupJunctions.size * 36 };
    junctionPositions[id] = { ...point, width: 16, height: 16, anchorX: point.x, anchorY: point.y, isJunction: true };
    groupJunctions.set(group.id, id);
  }
  Object.assign(allPositions, junctionPositions);
  const roadMemories = Object.fromEntries(Object.entries(previous?.roadMemories ?? {}).filter(([id, memory]) =>
    edges.some(edge => edge.id === id && edge.from === memory.from && edge.to === memory.to)));
  for (const frontier of oldQuestions) {
    if (currentFrontierIds.has(frontier.id)) continue;
    const branches = previous?.frontierRoutes?.[frontier.id] ?? [];
    for (const id of frontier.continuation?.edgeIds ?? []) {
      const edge = edges.find(item => item.id === id);
      if (!edge || roadMemories[id]) continue;
      const points = joinGapBranches(frontier, branches, edge);
      if (points) roadMemories[id] = { from: edge.from, to: edge.to, frontierId: frontier.id, points };
    }
  }
  const entries = Object.entries(allPositions), movements = [], overlaps = [], routeNodeIntersections = [];
  for (let i = 0; i < entries.length; i += 1) {
    const [id, position] = entries[i], old = oldPositions[id];
    if (knownIds.has(id) && old && Number.isFinite(old.x)) movements.push({ id, distance: round(distance(old, position)), from: { x: old.x, y: old.y }, to: { x: position.x, y: position.y } });
    for (let j = i + 1; j < entries.length; j += 1) if (boxesOverlap(position, entries[j][1])) overlaps.push([id, entries[j][0]]);
  }
  const makeRoute = (edge, targetOffset = 0, routeTo = edge.to) => {
    const from = allPositions[edge.from], to = allPositions[routeTo];
    const obstacles = routeObstacles(allPositions, { from: edge.from, to: routeTo });
    const directPoints = insetRoad(route({ x: from.anchorX, y: from.anchorY }, { x: to.anchorX + targetOffset, y: to.anchorY }, obstacles));
    const memory = routeTo === edge.to ? roadMemories[edge.semanticEdgeId ?? edge.id] : null;
    // Remembered paths already include the visible glyph insets; do not inset
    // them a second time. Their source/target coordinates stay stable.
    const points = memory ? continueRememberedRoad(memory, memory.points[0], memory.points.at(-1), obstacles) : directPoints;
    for (let index = 1; index < points.length; index += 1) for (const rectangle of obstacles) {
      if (crossesRectangle(points[index - 1], points[index], rectangle)) routeNodeIntersections.push({ edge: edge.id, node: rectangle.id, segment: index - 1 });
    }
    const label = edgeLabel(points, allPositions);
    return { ...edge, routeFrom: edge.from, routeTo, ...(memory ? { gapFrontierId: memory.frontierId } : {}),
      path: pathData(points), points, labelX: round(label.x), labelY: round(label.y) };
  };
  const routedEdges = edges.flatMap(edge => {
    const groups = supportGroups.filter(group => (group.edgeIds ?? []).includes(edge.id) && group.targetId === edge.to);
    return groups.length ? groups.map(group => makeRoute({ ...edge,
      id: groups.length > 1 ? `${edge.id}@${group.id}` : edge.id, semanticEdgeId: edge.id, supportGroupId: group.id
    }, 0, groupJunctions.get(group.id))) : [makeRoute(edge)];
  });
  const supportJunctions = supportGroups.map(group => {
    const id = groupJunctions.get(group.id), position = junctionPositions[id];
    const trunk = makeRoute({ id: `trunk:${group.id}`, from: id, to: group.targetId, kind: 'support', supportGroupId: group.id });
    return { ...group, id, groupId: group.id, x: position.x, y: position.y, ...trunk, id };
  });
  const frontierRoutes = Object.fromEntries(frontiers.map(frontier => [frontier.id,
    frontier.anchorIds.map((anchorId, index) => makeRoute({ id: `${frontier.id}:branch:${anchorId}`, from: anchorId, to: frontier.id,
      kind: frontier.kind, frontierId: frontier.id, openEnd: true, directed: false },
    frontier.kind === 'gap' ? (index % 2 ? 24 : -24) : 0))]));
  const bottom = Math.max(height, ...entries.map(([, position]) => position.y + position.height / 2 + MARGIN));
  const lengths = routedEdges.map(edge => edge.points.slice(1).reduce((sum, point, index) => sum + distance(edge.points[index], point), 0));
  const components = [], visited = new Set();
  for (const node of nodes) {
    if (visited.has(node.id)) continue;
    const component = [], queue = [node.id]; visited.add(node.id);
    for (let index = 0; index < queue.length; index += 1) {
      const id = queue[index]; component.push(id);
      for (const neighbour of adjacency.get(id)) if (!visited.has(neighbour)) { visited.add(neighbour); queue.push(neighbour); }
    }
    components.push(component);
  }
  return { positions, edges: routedEdges, routes: Object.fromEntries(routedEdges.map(edge => [edge.id, edge])),
    frontiers, frontierPositions, frontierRoutes, junctionPositions, supportJunctions, roadMemories, geometryKey, width, height: Math.ceil(bottom), diagnostics: {
      overlaps, routeNodeIntersections, movements, maxMovement: Math.max(0, ...movements.map(item => item.distance)), relocated: [],
      components, ignoredEdges: rawEdges.filter(edge => !edges.includes(edge)).map(edge => edge.id),
      algorithm: 'experimental-stable-known-nodes-continuing-roads', nodeWidth: NODE_WIDTH, nodeHeight: NODE_HEIGHT,
      nodeBoxAreaRatio: round(nodes.length * NODE_WIDTH * NODE_HEIGHT / (width * Math.ceil(bottom))),
      averageRoadLength: round(lengths.length ? lengths.reduce((sum, length) => sum + length, 0) / lengths.length : 0),
      maxRoadLength: round(Math.max(0, ...lengths)), roadEndpointInsets: { start: ROAD_START_INSET, end: ROAD_END_INSET },
      labelPolicy: 'questions occupy reserved boxes; edge labels belong in selected detail panel',
    } };
}
