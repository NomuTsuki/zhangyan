/** Experimental desktop world geometry, backed by the current obtained graph.
 * Placement remembers obtained IDs. Roads depend on topology and real glyphs /
 * claim boxes only. Text is placed afterwards and can be remeasured by the DOM.
 * Neither placement anchors nor shared route trunks establish a game fact.
 */
import { layoutGraph as placeObtainedGraph } from '../../workbench-map-fusion-v0/layout.mjs';

const WORLD_WIDTH = 1120;
const WORLD_MIN_HEIGHT = 760;
const SIDE_SPACE = 70;
const VERTICAL_SPACE = 1.65;
const FONT = 16, LINE = 24, LABEL_WIDTH = 176;
const CLAIM_BOX = { w: 168, h: 76 };
const round = n => Math.round(n * 100) / 100;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const point = (x, y) => ({ x, y });
const hash = value => [...String(value)].reduce((n, c) => (n * 31 + c.codePointAt(0)) >>> 0, 7);
const unique = values => [...new Set(values)];
function textWidth(text, font = FONT) {
  return [...String(text)].reduce((sum, c) => sum + (c.codePointAt(0) > 255 ? font : font * .58), 0);
}
function wrap(text, width = LABEL_WIDTH, font = FONT) {
  const lines = [''];
  for (const c of String(text ?? '')) {
    if (c === '\n') { lines.push(''); continue; }
    if (lines.at(-1) && textWidth(lines.at(-1) + c, font) > width) lines.push(c);
    else lines[lines.length - 1] += c;
  }
  return lines;
}
function inside(p, r) { return p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom; }
function crosses(a, b, r) {
  if (inside(a, r) || inside(b, r)) return true;
  let enter = 0, leave = 1;
  for (const [origin, delta, low, high] of [[a.x, b.x - a.x, r.left, r.right], [a.y, b.y - a.y, r.top, r.bottom]]) {
    if (Math.abs(delta) < 1e-9) { if (origin <= low || origin >= high) return false; }
    else {
      const one = (low - origin) / delta, two = (high - origin) / delta;
      enter = Math.max(enter, Math.min(one, two)); leave = Math.min(leave, Math.max(one, two));
      if (enter >= leave) return false;
    }
  }
  return enter < leave && enter < 1 && leave > 0;
}
const clear = (a, b, obstacles) => !obstacles.some(r => crosses(a, b, r));
function shortest(start, end, obstacles) {
  if (clear(start, end, obstacles)) return [start, end];
  const vertices = [start, end], seen = new Set();
  for (const r of obstacles) for (const p of [point(r.left, r.top), point(r.right, r.top), point(r.right, r.bottom), point(r.left, r.bottom)]) {
    const key = `${p.x}:${p.y}`;
    if (!seen.has(key) && !obstacles.some(other => inside(p, other))) { vertices.push(p); seen.add(key); }
  }
  const costs = vertices.map(() => Infinity), previous = vertices.map(() => -1), closed = new Set();
  costs[0] = 0;
  while (closed.size < vertices.length) {
    let selected = -1, best = Infinity;
    vertices.forEach((p, index) => {
      const score = costs[index] + distance(p, end);
      if (!closed.has(index) && score < best) { best = score; selected = index; }
    });
    if (selected < 0) break;
    if (selected === 1) {
      const result = [];
      for (let index = 1; index !== -1; index = previous[index]) result.unshift(vertices[index]);
      return result;
    }
    closed.add(selected);
    vertices.forEach((p, index) => {
      const cost = costs[selected] + distance(vertices[selected], p);
      if (!closed.has(index) && cost < costs[index] && clear(vertices[selected], p, obstacles)) {
        costs[index] = cost; previous[index] = selected;
      }
    });
  }
  // A corrupt overlapping shape graph must be reported rather than silently
  // claiming a direct path through a judgment box is safe.
  throw new Error('No clear route between obtained map endpoints');
}
function shape(item, padding = 0) {
  const w = item.box?.w ?? (item.isJunction ? 11 : 15), h = item.box?.h ?? (item.isJunction ? 11 : 15);
  return { id: item.id, left: item.x - w / 2 - padding, right: item.x + w / 2 + padding,
    top: item.y - h / 2 - padding, bottom: item.y + h / 2 + padding };
}
function port(item, toward, radius = 9) {
  const dx = toward.x - item.x, dy = toward.y - item.y, length = Math.hypot(dx, dy) || 1;
  if (item.box) {
    const fraction = Math.min(Math.abs(dx) > 1e-9 ? item.box.w / 2 / Math.abs(dx) : Infinity,
      Math.abs(dy) > 1e-9 ? item.box.h / 2 / Math.abs(dy) : Infinity);
    return point(item.x + dx * fraction, item.y + dy * fraction);
  }
  return point(item.x + dx / length * (item.isJunction ? 6 : radius), item.y + dy / length * (item.isJunction ? 6 : radius));
}
function curve(points, key, shapeObstacles = []) {
  const clean = points.filter((p, index) => !index || distance(p, points[index - 1]) > .01);
  if (clean.length < 2) return { d: '', samples: [...clean], points: clean };
  let cursor = clean[0], d = `M ${round(cursor.x)} ${round(cursor.y)}`;
  const samples = [cursor];
  const sign = hash(key) % 2 ? 1 : -1;
  function cubic(end, index) {
    const from = cursor, dx = end.x - from.x, dy = end.y - from.y, length = Math.hypot(dx, dy);
    if (length < .01) return;
    // At the real 48–60% overview scale, a 4.5px control offset was practically
    // a straight chord. One same-side bow per segment remains visible without
    // becoming a periodic wave. Shapes may limit it; labels never do.
    const desired = (length < 90 ? Math.min(4.5, length * .05) : Math.min(26, length * .06)) * sign;
    const count = Math.max(16, Math.ceil(length / 3));
    let selected = null;
    for (const bend of [desired, -desired, desired * .66, -desired * .66, desired * .35, -desired * .35, 0]) {
      const nx = -dy / length * bend, ny = dx / length * bend;
      const a = point(from.x + dx * .32 + nx, from.y + dy * .32 + ny);
      const b = point(from.x + dx * .69 + nx * .65, from.y + dy * .69 + ny * .65);
      const candidate = [from];
      for (let i = 1; i <= count; i += 1) {
        const t = i / count, u = 1 - t;
        candidate.push(point(u ** 3 * from.x + 3 * u * u * t * a.x + 3 * u * t * t * b.x + t ** 3 * end.x,
          u ** 3 * from.y + 3 * u * u * t * a.y + 3 * u * t * t * b.y + t ** 3 * end.y));
      }
      if (candidate.every((p, i) => !i || clear(candidate[i - 1], p, shapeObstacles))) {
        selected = { a, b, candidate }; break;
      }
    }
    if (!selected) throw new Error(`No shape-safe map curve for ${key}, segment ${index}`);
    const { a, b, candidate } = selected;
    d += ` C ${round(a.x)} ${round(a.y)} ${round(b.x)} ${round(b.y)} ${round(end.x)} ${round(end.y)}`;
    samples.push(...candidate.slice(1));
    cursor = end;
  }
  for (let index = 1; index < clean.length - 1; index += 1) {
    const a = clean[index - 1], b = clean[index], c = clean[index + 1];
    const radius = Math.min(14, distance(a, b) / 4, distance(b, c) / 4);
    const before = point(b.x + (a.x - b.x) / distance(a, b) * radius, b.y + (a.y - b.y) / distance(a, b) * radius);
    const after = point(b.x + (c.x - b.x) / distance(b, c) * radius, b.y + (c.y - b.y) / distance(b, c) * radius);
    cubic(before, index);
    const from = cursor;
    d += ` Q ${round(b.x)} ${round(b.y)} ${round(after.x)} ${round(after.y)}`;
    for (let i = 1; i <= 10; i += 1) {
      const t = i / 10, u = 1 - t;
      samples.push(point(u * u * from.x + 2 * u * t * b.x + t * t * after.x,
        u * u * from.y + 2 * u * t * b.y + t * t * after.y));
    }
    cursor = after;
  }
  cubic(clean.at(-1), clean.length);
  return { d, samples, points: clean };
}
function midpoint(samples) {
  const lengths = samples.slice(1).map((p, index) => distance(samples[index], p));
  let remaining = lengths.reduce((a, b) => a + b, 0) / 2;
  for (let i = 0; i < lengths.length; i += 1) {
    if (remaining <= lengths[i]) {
      const t = lengths[i] ? remaining / lengths[i] : 0;
      return point(samples[i].x + (samples[i + 1].x - samples[i].x) * t, samples[i].y + (samples[i + 1].y - samples[i].y) * t);
    }
    remaining -= lengths[i];
  }
  return samples.at(-1) ?? point(0, 0);
}
function sublineFor(node) {
  if (node.id === 'obs.phase.t1' && node.interpretationState === 'established') return '照片与现器核验相符';
  if (node.relations?.length) {
    const attribution = node.relations.find(r => r.key === 'attribution')?.status === 'established';
    const corroboration = node.relations.find(r => r.key === 'corroboration')?.status === 'established';
    if (attribution && corroboration) return '归属、实物已核验';
    if (attribution) return '归属已核验 · 实物待核对';
  }
  return undefined;
}
function sameEndpoints(road, from, to) { return road?.from === from && road?.to === to; }

export function layoutMap(graph, previousLayout = null) {
  const graphNodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const known = new Set(graphNodes.map(n => n.id));
  if (known.size !== graphNodes.length) throw new Error('Obtained map node IDs must be unique');
  const edges = (graph?.edges ?? []).filter(e => known.has(e.from) && known.has(e.to) && e.from !== e.to);
  const groups = (graph?.supportGroups ?? []).filter(group => known.has(group.targetId))
    .map(group => {
      const edgeIds = unique(group.edgeIds ?? []).filter(id => edges.some(e => e.id === id && e.to === group.targetId));
      const memberNodeIds = unique(group.memberNodeIds ?? edgeIds.map(id => edges.find(e => e.id === id).from))
        .filter(id => known.has(id) && id !== group.targetId);
      return { ...group, edgeIds, memberNodeIds };
    }).filter(group => group.edgeIds.length && group.memberNodeIds.length >= 2);
  const frontiersInput = (graph?.frontiers ?? []).map(f => ({ ...f, anchorIds: unique(f.anchorIds ?? []).filter(id => known.has(id)) }))
    .filter(f => f.anchorIds.length);
  // The shared module supplies incremental coordinate memory only. Titles are
  // blank here: changing copy cannot alter placement or the road geometry.
  const oldSeed = previousLayout?._state?.seed;
  const seedPrevious = oldSeed ? { ...oldSeed, positions: { ...previousLayout._state.rememberedPositions, ...oldSeed.positions },
    junctionPositions: { ...previousLayout._state.rememberedJunctions, ...oldSeed.junctionPositions } } : null;
  const seed = placeObtainedGraph({ ...graph, nodes: graphNodes.map(n => ({ ...n, title: '',
    layoutAnchorIds: unique([...(n.layoutAnchorIds ?? []), ...groups.filter(g => g.targetId === n.id).flatMap(g => g.memberNodeIds)]) })), edges,
    frontiers: frontiersInput.map(f => ({ ...f, title: '' })), supportGroups: groups },
  { width: WORLD_WIDTH - SIDE_SPACE * 2, height: WORLD_MIN_HEIGHT, previous: seedPrevious });
  const nodes = graphNodes.map(node => {
    const p = seed.positions[node.id], box = node.kind === 'claim' ? { ...CLAIM_BOX } : undefined;
    const y = round(p.y * VERTICAL_SPACE + 20);
    const x = round(p.x + SIDE_SPACE);
    return { ...node, x, y, lines: wrap(node.title, box ? box.w - 24 : LABEL_WIDTH, box ? 15 : FONT),
      labelX: x - LABEL_WIDTH / 2, labelY: y + 20, labelWidth: LABEL_WIDTH,
      fontSize: box ? 15 : FONT, lineHeight: LINE, ...(box ? { box } : {}), ...(sublineFor(node) ? { subline: sublineFor(node) } : {}) };
  });
  const junctions = groups.map(group => {
    const id = `junction:${group.id}`, p = seed.junctionPositions[id];
    return { ...group, id, groupId: group.id, x: round(p.x + SIDE_SPACE), y: round(p.y * VERTICAL_SPACE + 20), isJunction: true };
  });
  const objects = new Map([...nodes, ...junctions].map(n => [n.id, n]));
  const obstacles = [...objects.values()].map(n => shape(n, 14));
  const oldRoads = new Map((previousLayout?.routes ?? []).map(r => [r.id, r]));
  const oldFrontierRoads = previousLayout?._state?.frontierRoads ?? {};
  const roadMemories = { ...(previousLayout?._state?.roadMemories ?? {}) };
  const currentFrontiers = new Set(frontiersInput.map(f => f.id));
  for (const f of previousLayout?.frontiers ?? []) {
    if (currentFrontiers.has(f.id) || f.kind !== 'gap' || f.anchorIds.length !== 2) continue;
    for (const edgeId of f.continuation?.edgeIds ?? []) {
      const edge = edges.find(e => e.id === edgeId), branches = oldFrontierRoads[f.id] ?? [];
      if (!edge || roadMemories[edgeId]) continue;
      const a = branches.find(r => r.from === edge.from), b = branches.find(r => r.from === edge.to);
      if (a && b) roadMemories[edgeId] = { from: edge.from, to: edge.to, points: [...a.points, ...[...b.points].reverse()] };
    }
  }
  function roadGeometry(id, fromId, toId, explicitTarget = null, semanticId = id) {
    const from = objects.get(fromId), to = explicitTarget ?? objects.get(toId);
    const blocked = obstacles.filter(r => r.id !== fromId && r.id !== toId);
    const old = oldRoads.get(id);
    // Strengthening a same-ID relationship keeps every clear old curve. A
    // genuinely new glyph can require a detour; text never can.
    const endpointFrom = point(from.x, from.y), endpointTo = point(to.x, to.y);
    if (!explicitTarget && sameEndpoints(old, fromId, toId) && old.samples?.length &&
      old.endpointFrom?.x === from.x && old.endpointFrom?.y === from.y && old.endpointTo?.x === to.x && old.endpointTo?.y === to.y &&
      old.samples.every((p, i) => !i || clear(old.samples[i - 1], p, blocked))) {
      return { d: old.d, samples: old.samples, points: old.points, midpoint: old.midpoint, endpointFrom, endpointTo };
    }
    const memory = !explicitTarget && roadMemories[semanticId];
    const preferred = memory && memory.from === fromId && memory.to === toId ? memory.points : [];
    const middle = preferred.slice(1, -1).filter(p => !blocked.some(r => inside(p, r)));
    const start = port(from, middle[0] ?? to), end = explicitTarget ? point(to.x, to.y) : port(to, middle.at(-1) ?? from);
    const stops = [start, ...middle, end], path = [start];
    for (let index = 1; index < stops.length; index += 1) path.push(...shortest(path.at(-1), stops[index], blocked).slice(1));
    const shapeObstacles = [...objects.values()]
      .filter(n => n.box || (n.id !== fromId && n.id !== toId))
      .map(n => shape(n, n.id === fromId || n.id === toId ? -.02 : 3));
    const result = curve(path, id, shapeObstacles);
    return { ...result, midpoint: midpoint(result.samples), endpointFrom, endpointTo };
  }
  const routes = [];
  for (const edge of edges) {
    const matching = groups.filter(group => group.targetId === edge.to && group.edgeIds.includes(edge.id));
    if (matching.length) continue;
    routes.push({ id: edge.id, edgeIds: [edge.id], from: edge.from, to: edge.to, kind: edge.kind,
      arrow: edge.directed !== false && !['attribution', 'corroboration', 'same-object'].includes(edge.kind),
      ...roadGeometry(edge.id, edge.from, edge.to) });
  }
  for (const junction of junctions) {
    // A compressed proof edge can carry a group with several displayed
    // members. Expanding that existing group adds render roads, never graph
    // edges. Every input remains traceable to the real bundled edge(s).
    for (const memberId of junction.memberNodeIds) {
      const actual = junction.edgeIds.filter(id => edges.find(e => e.id === id)?.from === memberId);
      const edgeIds = actual.length ? actual : [...junction.edgeIds];
      const id = `${junction.groupId}:input:${memberId}`;
      routes.push({ id, edgeIds, groupId: junction.groupId, sourceIds: junction.sourceIds,
        representationOnly: true, from: memberId, to: junction.id, kind: 'support', arrow: false,
        ...roadGeometry(id, memberId, junction.id) });
    }
    const id = `trunk:${junction.groupId}`;
    routes.push({ id, edgeIds: [...junction.edgeIds], groupId: junction.groupId, from: junction.id, to: junction.targetId,
      kind: 'support', arrow: true, ...roadGeometry(id, junction.id, junction.targetId) });
  }
  const frontierRoads = {};
  const frontiers = frontiersInput.map(f => {
    const p = seed.frontierPositions[f.id], x = round(p.x + SIDE_SPACE), y = round(p.y * VERTICAL_SPACE + 20);
    const records = f.anchorIds.map((anchorId, index) => ({ from: anchorId,
      ...roadGeometry(`${f.id}:branch:${anchorId}`, anchorId, f.id,
        point(x + (f.kind === 'gap' ? (index % 2 ? 15 : -15) : 0), y)) }));
    frontierRoads[f.id] = records;
    return { ...f, x, y, labelX: x - LABEL_WIDTH / 2, labelY: y + 18, labelWidth: LABEL_WIDTH,
      fontSize: 14, lineHeight: 22, lines: wrap(f.title, LABEL_WIDTH, 14), paths: records.map(r => r.d) };
  });
  const maxMovement = Math.max(0, ...nodes.map(n => {
    const old = previousLayout?.nodes.find(p => p.id === n.id);
    return old ? distance(old, n) : 0;
  }));
  const layout = { width: WORLD_WIDTH, height: Math.max(WORLD_MIN_HEIGHT, previousLayout?.height ?? 0,
    ...[...nodes, ...junctions, ...frontiers].map(n => n.y + 140)), nodes, routes, junctions, frontiers,
    _state: { seed, rememberedPositions: { ...previousLayout?._state?.rememberedPositions, ...seed.positions },
      rememberedJunctions: { ...previousLayout?._state?.rememberedJunctions, ...seed.junctionPositions }, frontierRoads, roadMemories }, diagnostics: { maxNodeMovement: maxMovement,
      routingPolicy: 'topology-and-glyphs-only', ignoredEdgeIds: (graph?.edges ?? []).filter(e => !edges.includes(e)).map(e => e.id) } };
  return placeMapLabels(layout, null, previousLayout);
}

function overlaps(a, b, margin = 0) {
  return a.left < b.right + margin && a.right > b.left - margin && a.top < b.bottom + margin && a.bottom > b.top - margin;
}
/** Remeasure one combined main-title/subline block per information ID and one
 * block per frontier ID. Sizes use world pixels; DOM callers divide by zoom.
 * This function only changes label coordinates / bounds and canvas height.
 * @param {any} layout
 * @param {Record<string,{width:number,height:number}> | Map<string,{width:number,height:number}> | null} measurements
 * @param {any} previousLayout
 */
export function placeMapLabels(layout, measurements = null, previousLayout = layout) {
  const nodes = layout.nodes.map(n => ({ ...n })), frontiers = layout.frontiers.map(f => ({ ...f }));
  const boxes = [...nodes, ...layout.junctions].map(n => shape(n, 9));
  const samples = [...layout.routes.map(r => r.samples), ...Object.values(layout._state.frontierRoads).flat().map(r => r.samples)].filter(Boolean);
  const segments = samples.flatMap(path => path.slice(1).map((p, i) => [path[i], p]));
  const oldLabels = new Map([...(previousLayout?.nodes ?? []), ...(previousLayout?.frontiers ?? [])].map(n => [n.id, n]));
  const labelRects = [], remoteLabelIds = [];
  const maxRoadY = Math.max(0, ...samples.flatMap(path => path.map(p => p.y)));
  const getMeasurement = id => measurements instanceof Map ? measurements.get(id) : measurements?.[id];
  const frontierIds = new Set(frontiers.map(f => f.id));
  const labels = [...nodes.filter(n => !n.box), ...frontiers].sort((a, b) =>
    Number(frontierIds.has(a.id)) - Number(frontierIds.has(b.id)) ||
    Number(oldLabels.has(b.id)) - Number(oldLabels.has(a.id)) || a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));
  for (const n of labels) {
    const measured = getMeasurement(n.id), lineHeight = n.lineHeight ?? LINE;
    const estimatedWidth = Math.min(LABEL_WIDTH, Math.max(48, ...n.lines.map(line => textWidth(line, n.fontSize)), n.subline ? textWidth(n.subline, 13) : 0));
    let width = Math.min(layout.width - 40, Math.max(24, measured?.width ?? estimatedWidth));
    let height = Math.max(lineHeight, measured?.height ?? n.lines.length * lineHeight + (n.subline ? 26 : 0));
    const rect = (x, y) => ({ id: n.id, left: x, right: x + width, top: y, bottom: y + height });
    const free = r => r.left >= 20 && r.right <= layout.width - 20 && r.top >= 20 &&
      !boxes.some(b => overlaps(r, b, 3)) && !labelRects.some(b => overlaps(r, b, 10)) &&
      !segments.some(([a, b]) => crosses(a, b, { left: r.left - 4, right: r.right + 4, top: r.top - 4, bottom: r.bottom + 4 }));
    const candidates = [], old = oldLabels.get(n.id);
    if (old) candidates.push(rect(old.labelX, old.labelY));
    for (const gap of [18, 36, 58, 84, 116, 156, 208]) {
      candidates.push(rect(n.x - width / 2, n.y - height - gap), rect(n.x + gap, n.y - height / 2),
        rect(n.x - width / 2, n.y + gap), rect(n.x - width - gap, n.y - height / 2),
        rect(n.x + gap, n.y - height - gap), rect(n.x - width - gap, n.y + gap),
        rect(n.x - width - gap, n.y - height - gap), rect(n.x + gap, n.y + gap));
    }
    let chosen = candidates.find(free);
    if (!chosen) {
      const search = [];
      for (let y = 24; y <= Math.max(layout.height, maxRoadY + 64); y += 28) {
        for (let x = 24; x + width < layout.width - 20; x += 36) search.push(rect(x, y));
      }
      search.sort((a, b) => distance(point((a.left + a.right) / 2, (a.top + a.bottom) / 2), n) - distance(point((b.left + b.right) / 2, (b.top + b.bottom) / 2), n));
      chosen = search.find(free);
    }
    if (!chosen) {
      let y = Math.max(layout.height, maxRoadY + 40, ...labelRects.map(r => r.bottom + 20));
      chosen = rect(Math.max(20, Math.min(layout.width - width - 20, n.x - width / 2)), y);
    }
    const separationOf = r => Math.hypot(Math.max(r.left - n.x, 0, n.x - r.right), Math.max(r.top - n.y, 0, n.y - r.bottom));
    if (!measured && !n.subline && separationOf(chosen) > 100) {
      const original = { width, height, lines: n.lines, chosen };
      let best = { ...original, separation: separationOf(chosen) };
      // A narrow text column is preferable to a distant caption. Keep the
      // same font size and move/reflow only text; the world graph stays fixed.
      for (const compactWidth of [144, 128, 112, 96]) {
        if (compactWidth >= original.width) continue;
        const lines = wrap(n.title, compactWidth, n.fontSize);
        width = compactWidth; height = lines.length * lineHeight;
        const local = [];
        for (let y = Math.max(20, n.y - height - 150); y <= n.y + 150; y += 12) {
          for (let x = Math.max(20, n.x - width - 150); x <= Math.min(layout.width - width - 20, n.x + 150); x += 12) local.push(rect(x, y));
        }
        local.sort((a, b) => separationOf(a) - separationOf(b) || distance(point((a.left + a.right) / 2, (a.top + a.bottom) / 2), n)
          - distance(point((b.left + b.right) / 2, (b.top + b.bottom) / 2), n));
        const match = local.find(free);
        if (match && separationOf(match) < best.separation) best = { width, height, lines, chosen: match, separation: separationOf(match) };
      }
      width = best.width; height = best.height; n.lines = best.lines; chosen = best.chosen;
    }
    n.labelX = round(chosen.left); n.labelY = round(chosen.top); n.labelWidth = round(width); n.labelHeight = round(height);
    n.labelBounds = { x: n.labelX, y: n.labelY, width: n.labelWidth, height: n.labelHeight };
    const separation = separationOf(chosen);
    if (separation > 100) remoteLabelIds.push(n.id);
    labelRects.push(chosen);
  }
  for (const n of nodes.filter(item => item.box)) {
    n.labelX = n.x - n.box.w / 2 + 12; n.labelY = n.y - n.lines.length * n.lineHeight / 2;
    n.labelWidth = n.box.w - 24; n.labelHeight = n.lines.length * n.lineHeight;
  }
  const overlapsFound = labelRects.flatMap((r, i) => labelRects.slice(i + 1).filter(other => overlaps(r, other)).map(other => [r.id, other.id]));
  return { ...layout, nodes, frontiers, height: Math.ceil(Math.max(layout.height, ...labelRects.map(r => r.bottom + 40))),
    diagnostics: { ...layout.diagnostics, labelOverlaps: overlapsFound, remoteLabelIds,
      labelMeasurement: measurements ? 'rendered-dimensions' : 'estimated-16px-text', labelsMoveRoads: false } };
}
