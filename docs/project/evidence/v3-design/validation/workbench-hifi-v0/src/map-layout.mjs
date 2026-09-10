/** Fixed desktop map; route geometry is independent of labels and acquisition order. */
import { NAMES, POSITIONS, LABELS, GROUPS, GUIDES, SCALE, WORLD_WIDTH, WORLD_HEIGHT } from './fixed-map-schema.mjs';
const FONT = 21, LINE = 31.5, LABEL_WIDTH = 264;
const CLAIM_BOX = { w: 249, h: 93 };
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
function shape(item, padding = 0) {
  const w = item.box?.w ?? (item.isJunction ? 16.5 : 22.5), h = item.box?.h ?? (item.isJunction ? 16.5 : 22.5);
  return { id: item.id, left: item.x - w / 2 - padding, right: item.x + w / 2 + padding,
    top: item.y - h / 2 - padding, bottom: item.y + h / 2 + padding };
}

const EXTRA = {
  'obs.object.continuity': [315, 170],
  'obs.archive.t2.object-attribution': [355, 515],
  'obs.archive.t2.current-corroboration': [500, 500],
  'obs.archive.t3.object-attribution': [580, 900],
  'obs.archive.t3.current-corroboration': [680, 865],
  'obs.corpus.identity.repeat': [55, 470],
};
const aliases = new Map(Object.entries(NAMES).map(([key, id]) => [id, key]));
const knownShapeIds = [...Object.values(NAMES), ...Object.keys(EXTRA)];
const canonicalEnds = {
  'photo:object': [NAMES.B, NAMES.P],
  'archive:t2:object': [NAMES.T2, NAMES.W],
  'archive:t3:object': [NAMES.T3, NAMES.W],
  'support:obs.surface.point-layering:obs.surface.resolved': [NAMES.POINT, NAMES.SURF],
};
const archiveRange = key => key === 'attribution' ? [0, .485] : [.515, 1];
const lerp = (a, b, t) => point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
function coordinates(id) {
  const key = aliases.get(id) ?? id;
  const xy = POSITIONS[key] ?? EXTRA[id] ?? Object.values(GROUPS).find(g => g.key === key)?.xy;
  if (xy) return point(round(xy[0] * SCALE), round(xy[1] * SCALE));
  // Explicitly flagged overflow keeps a genuinely new graph node visible. It
  // is not a seed and cannot move any authored slot or route.
  const number = hash(id);
  return point(100 + (number % 6) * 180, WORLD_HEIGHT + 160 + Math.floor(number / 6) % 32 * 120);
}
function glyph(id) {
  return { id, ...coordinates(id), ...(id.startsWith('claim:') ? { box: CLAIM_BOX } : {}),
    isJunction: Object.values(GROUPS).some(g => g.key === id) };
}
function endpoint(from, toward) {
  const dx = toward.x - from.x, dy = toward.y - from.y, length = Math.hypot(dx, dy) || 1;
  const t = from.box ? Math.min(from.box.w / 2 / Math.max(.001, Math.abs(dx)),
    from.box.h / 2 / Math.max(.001, Math.abs(dy))) : (from.isJunction ? 9 : 13.5) / length;
  return point(round(from.x + dx * t), round(from.y + dy * t));
}
function splitBezier(c, t) {
  const a = lerp(c[0], c[1], t), b = lerp(c[1], c[2], t), d = lerp(c[2], c[3], t);
  const e = lerp(a, b, t), f = lerp(b, d, t), p = lerp(e, f, t);
  return [[c[0], a, e, p], [p, f, d, c[3]]];
}
function bezierPoint(c, t) { return splitBezier(c, t)[0][3]; }
function pathData(curves) {
  if (!curves.length) return '';
  const p = curves[0][0];
  return `M ${round(p.x)} ${round(p.y)}` + curves.map(c => ` C ${c.slice(1).flatMap(p => [round(p.x), round(p.y)]).join(' ')}`).join('');
}
function geometryFromCurves(curves) {
  const samples = [], lengths = [], lookup = [];
  let total = 0;
  curves.forEach((c, index) => {
    const n = Math.max(20, Math.ceil((distance(c[0], c[1]) + distance(c[1], c[2]) + distance(c[2], c[3])) / 3));
    for (let i = 0; i <= n; i++) {
      const p = bezierPoint(c, i / n);
      if (samples.length) total += distance(samples.at(-1), p);
      samples.push(p); lengths.push(total); lookup.push({ index, t: i / n });
    }
  });
  function parameter(fraction) {
    const wanted = Math.max(0, Math.min(1, fraction)) * total;
    let at = lengths.findIndex(x => x >= wanted);
    if (at < 0) at = lengths.length - 1;
    const prev = Math.max(0, at - 1), a = lookup[prev], b = lookup[at];
    if (!a || !b) return { index: 0, t: 0 };
    const t = (wanted - lengths[prev]) / (lengths[at] - lengths[prev] || 1);
    return a.index === b.index ? { index: b.index, t: a.t + (b.t - a.t) * t } : b;
  }
  function slice(from = 0, to = 1) {
    const a = parameter(from), b = parameter(to), result = [];
    for (let i = a.index; i <= b.index; i++) {
      let c = curves[i], end = i === b.index ? b.t : 1, start = i === a.index ? a.t : 0;
      if (end <= start) continue;
      if (end < 1) c = splitBezier(c, end)[0];
      if (start > 0) c = splitBezier(c, start / end)[1];
      result.push(c);
    }
    return result;
  }
  const halfway = parameter(.5);
  return { d: pathData(curves), samples, curves, length: total, points: curves.length ? [curves[0][0], ...curves.map(c => c[3])] : [],
    midpoint: curves.length ? bezierPoint(curves[halfway.index], halfway.t) : point(0, 0),
    fractionPoint: f => { const q = parameter(f); return bezierPoint(curves[q.index], q.t); }, slice };
}
const geometryCache = new Map();
function roadGeometry(fromId, toId) {
  const key = `${fromId}>${toId}`;
  if (geometryCache.has(key)) return geometryCache.get(key);
  const a = aliases.get(fromId) ?? fromId, b = aliases.get(toId) ?? toId;
  const from = glyph(fromId), to = glyph(toId);
  const points = [from, ...(GUIDES[`${a}>${b}`] ?? []).map(([x, y]) => point(x * SCALE, y * SCALE)), to];
  points[0] = endpoint(from, points[1]);
  points[points.length - 1] = endpoint(to, points.at(-2));
  const curves = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
    curves.push([p1, point(p1.x + (p2.x - p0.x) * .14, p1.y + (p2.y - p0.y) * .14),
      point(p2.x - (p3.x - p1.x) * .14, p2.y - (p3.y - p1.y) * .14), p2]);
  }
  const result = { ...geometryFromCurves(curves), endpointFrom: coordinates(fromId), endpointTo: coordinates(toId) };
  geometryCache.set(key, result);
  return result;
}
function publicGeometry(g) {
  return { d: g.d, samples: g.samples, points: g.points, midpoint: g.midpoint,
    endpointFrom: g.endpointFrom, endpointTo: g.endpointTo };
}
function openGeometry(anchorId, questionId) {
  const a = glyph(anchorId), sign = hash(questionId) % 2 ? 1 : -1;
  // Open questions have no promised answer road. They remain separate short
  // boundary strokes, even when several observations raise the same question.
  const dx = a.x > WORLD_WIDTH - 140 ? -65 : a.x < 140 ? 65 : 65 * sign;
  const end = point(a.x + dx, a.y + 86), start = endpoint(a, end);
  return geometryFromCurves([[start, point(a.x + dx * .28, a.y + 33), point(a.x + dx * .9, a.y + 55), end]]);
}

/** Fixed obtained-graph projection; previousLayout is comparison evidence only.
 * @param {any} graph
 * @param {any} previousLayout
 */
export function layoutMap(graph, previousLayout = null) {
  const sourceNodes = graph?.nodes ?? [], known = new Set(sourceNodes.map(n => n.id));
  if (known.size !== sourceNodes.length) throw new Error('Obtained map node IDs must be unique');
  const nodes = sourceNodes.map(n => {
    const box = n.kind === 'claim' ? { ...CLAIM_BOX } : undefined, p = coordinates(n.id);
    const lines = n.state === 'contested' ? wrap(n.title, box ? box.w - 24 : LABEL_WIDTH, FONT)
      : LABELS[aliases.get(n.id)] ?? wrap(n.title, box ? box.w - 24 : LABEL_WIDTH, FONT);
    return { ...n, ...p, lines, labelX: p.x - LABEL_WIDTH / 2, labelY: p.y + 20, labelWidth: LABEL_WIDTH,
      fontSize: FONT, lineHeight: LINE, ...(box ? { box } : {}) };
  }).sort((a, b) => a.id.localeCompare(b.id));
  const allEdges = (graph?.edges ?? []).filter(e => known.has(e.from) && known.has(e.to) && e.from !== e.to);
  const hidden = allEdges.filter(e => ['reference', 'context'].includes(e.kind));
  const edges = allEdges.filter(e => !hidden.includes(e));
  const groups = (graph?.supportGroups ?? []).filter(g => known.has(g.targetId)).map(g => ({ ...g,
    memberNodeIds: unique(g.memberNodeIds ?? []).filter(id => known.has(id) && id !== g.targetId),
    edgeIds: unique(g.edgeIds ?? []).filter(id => edges.some(e => e.id === id && e.to === g.targetId)),
  })).filter(g => g.memberNodeIds.length && g.edgeIds.length).sort((a, b) => a.id.localeCompare(b.id));
  const covered = new Set(), routes = [], junctions = [];
  function pushRoute(meta, fromKey = meta.from, toKey = meta.to) {
    routes.push({ ...meta, ...publicGeometry(roadGeometry(fromKey, toKey)) });
  }
  for (const g of groups) {
    g.edgeIds.forEach(id => covered.add(id));
    if (g.memberNodeIds.length === 1) {
      pushRoute({ id: `direct:${g.id}`, groupId: g.id, edgeIds: [...g.edgeIds], from: g.memberNodeIds[0], to: g.targetId,
        kind: 'support', arrow: true, sourceIds: g.sourceIds, representationOnly: true });
      continue;
    }
    const schema = GROUPS[g.id];
    if (!schema) throw new Error(`Unmapped real support group: ${g.id}`);
    const id = `junction:${g.id}`, joint = { ...g, id, groupId: g.id, ...coordinates(schema.key), isJunction: true };
    junctions.push(joint);
    for (const memberId of [...g.memberNodeIds].sort()) {
      const actual = g.edgeIds.filter(id => edges.find(e => e.id === id)?.from === memberId);
      pushRoute({ id: `${g.id}:input:${memberId}`, edgeIds: actual.length ? actual : [...g.edgeIds], groupId: g.id,
        sourceIds: g.sourceIds, representationOnly: true, from: memberId, to: id, kind: 'support', arrow: false }, memberId, schema.key);
    }
    pushRoute({ id: `trunk:${g.id}`, edgeIds: [...g.edgeIds], groupId: g.id, from: id, to: g.targetId,
      kind: 'support', arrow: true }, schema.key, g.targetId);
  }
  for (const edge of edges) if (!covered.has(edge.id)) pushRoute({ ...edge, edgeIds: [edge.id],
    arrow: edge.directed !== false && !['attribution', 'corroboration', 'same-object'].includes(edge.kind) });
  routes.sort((a, b) => a.id.localeCompare(b.id));
  const frontierRoads = {}, roadLabels = [];
  const frontiers = (graph?.frontiers ?? []).map(f => ({ ...f, anchorIds: unique(f.anchorIds ?? []).filter(id => known.has(id)) }))
    .filter(f => f.anchorIds.length).sort((a, b) => a.id.localeCompare(b.id)).map(f => {
      const id = (f.continuation?.edgeIds ?? []).find(id => canonicalEnds[id] || edges.some(e => e.id === id));
      const edge = edges.find(e => e.id === id), ends = edge ? [edge.from, edge.to] : canonicalEnds[id];
      const segments = [], records = [];
      if (ends) {
        const g = roadGeometry(...ends), archive = /^question:archive:t[23]:(attribution|corroboration)$/.exec(f.id);
        let spans;
        if (archive) spans = [archiveRange(archive[1])];
        else if (f.kind === 'gap' && f.anchorIds.length === 2) spans = [[0, .43], [.57, 1]];
        else spans = f.anchorIds.includes(ends[0]) ? [[0, .68]] : [[.32, 1]];
        // A one-ended frontier must not disclose a distant unacquired endpoint.
        const unseenEnd = ends.find(endpointId => endpointId !== f.anchorIds[0]);
        if (f.anchorIds.length === 1 && !known.has(unseenEnd) && !(f.continuation?.nodeIds ?? []).includes(unseenEnd)) {
          const range = f.anchorIds[0] === ends[0] ? [0, Math.min(.24, 100 / g.length)] : [Math.max(.76, 1 - 100 / g.length), 1];
          spans = [range];
        }
        for (const [from, to] of spans) {
          segments.push({ d: g.d, from, to, canonicalRouteId: id, edgeIds: [id] });
          const sliced = geometryFromCurves(g.slice(from, to));
          records.push({ from: f.anchorIds[0], ...publicGeometry(sliced) });
        }
      } else {
        for (const anchorId of f.anchorIds) {
          const g = openGeometry(anchorId, f.id);
          segments.push({ d: g.d, from: 0, to: 1, canonicalRouteId: null, edgeIds: [] });
          records.push({ from: anchorId, ...publicGeometry(g) });
        }
      }
      frontierRoads[f.id] = records;
      const location = records[0]?.midpoint ?? coordinates(f.anchorIds[0]);
      return { ...f, ...location, labelX: location.x, labelY: location.y + 18, labelWidth: LABEL_WIDTH,
        fontSize: 18, lineHeight: 30, lines: wrap(f.title, LABEL_WIDTH, 18), segments,
        paths: records.map(r => r.d), openBoundary: !ends, canonicalRouteId: id ?? null };
    });
  for (const route of routes) {
    route.pendingFrontierIds = frontiers.filter(f => f.canonicalRouteId === route.id).map(f => f.id);
    if (route.id === 'photo:object') {
      const location = roadGeometry(route.from, route.to).midpoint, text = '照片对应已核实';
      const label = { id: 'road-label:photo:object:attribution', routeId: route.id, relationKey: 'attribution', ...location,
        text, title: text, lines: [text], fontSize: 16.5, lineHeight: 25.5, labelWidth: LABEL_WIDTH, labelX: location.x, labelY: location.y + 16 };
      route.labels = [label]; roadLabels.push(label);
    }
    if (!/^archive:t[23]:object$/.test(route.id)) continue;
    const g = roadGeometry(route.from, route.to), states = new Map((route.relations ?? []).map(r => [r.key, r.status]));
    const established = ['attribution', 'corroboration'].filter(key => states.get(key) === 'established');
    route.visibleSegments = established.length === 2 ? [{ from: 0, to: 1 }]
      : established.map(key => { const [from, to] = archiveRange(key); return { from, to }; });
    route.labels = established.map(key => {
      const location = g.fractionPoint(key === 'attribution' ? .25 : .75);
      const text = key === 'attribution' ? '归属已核实' : '记载处理已有实物印证';
      const label = { id: `road-label:${route.id}:${key}`, routeId: route.id, relationKey: key, ...location,
        text, title: text, lines: [text], fontSize: 16.5, lineHeight: 25.5, labelWidth: LABEL_WIDTH, labelX: location.x, labelY: location.y + 16 };
      roadLabels.push(label); return label;
    });
  }
  const maxNodeMovement = Math.max(0, ...nodes.map(n => { const old = previousLayout?.nodes?.find(p => p.id === n.id); return old ? distance(old, n) : 0; }));
  const layout = { width: WORLD_WIDTH, height: Math.max(WORLD_HEIGHT, ...nodes.map(n => n.y + 140)), nodes, routes, junctions, frontiers, roadLabels,
    _state: { frontierRoads, fixedSchema: 'reviewed-skeleton-v2', roadMemories: {} },
    diagnostics: { maxNodeMovement, routingPolicy: 'fixed-reviewed-control-points-roads-first', hiddenRelationEdgeIds: hidden.map(e => e.id),
      ignoredEdgeIds: (graph?.edges ?? []).filter(e => !allEdges.includes(e)).map(e => e.id),
      unmappedNodeIds: nodes.filter(n => !knownShapeIds.includes(n.id)).map(n => n.id) } };
  return placeMapLabels(layout, null, null);
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
  const roadLabels = (layout.roadLabels ?? []).map(label => ({ ...label }));
  const boxes = [...nodes, ...layout.junctions].map(n => shape(n, 9));
  const samples = [...layout.routes.map(r => r.samples), ...Object.values(layout._state.frontierRoads).flat().map(r => r.samples)].filter(Boolean);
  const segments = samples.flatMap(path => path.slice(1).map((p, i) => [path[i], p]));
  const labelRects = [], remoteLabelIds = [];
  const maxRoadY = Math.max(0, ...samples.flatMap(path => path.map(p => p.y)));
  const getMeasurement = id => measurements instanceof Map ? measurements.get(id) : measurements?.[id];
  const frontierIds = new Set(frontiers.map(f => f.id));
  const labels = [...nodes.filter(n => !n.box), ...frontiers, ...roadLabels].sort((a, b) =>
    Number(frontierIds.has(a.id)) - Number(frontierIds.has(b.id)) ||
    a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));
  for (const n of labels) {
    const measured = getMeasurement(n.id), lineHeight = n.lineHeight ?? LINE;
    const estimatedWidth = Math.min(LABEL_WIDTH, Math.max(48, ...n.lines.map(line => textWidth(line, n.fontSize)), n.subline ? textWidth(n.subline, n.sublineFontSize ?? 19.5) : 0));
    let width = Math.min(layout.width - 40, Math.max(24, measured?.width ?? estimatedWidth));
    let height = Math.max(lineHeight, measured?.height ?? n.lines.length * lineHeight + (n.subline ? 33 : 0));
    const rect = (x, y) => ({ id: n.id, left: x, right: x + width, top: y, bottom: y + height });
    const free = r => r.left >= 20 && r.right <= layout.width - 20 && r.top >= 20 &&
      !boxes.some(b => overlaps(r, b, 3)) && !labelRects.some(b => overlaps(r, b, 10)) &&
      !segments.some(([a, b]) => crosses(a, b, { left: r.left - 4, right: r.right + 4, top: r.top - 4, bottom: r.bottom + 4 }));
    const candidates = [];
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
  const byLabelId = new Map(roadLabels.map(label => [label.id, label]));
  const routes = layout.routes.map(route => ({ ...route,
    ...(route.labels ? { labels: route.labels.map(label => byLabelId.get(label.id)) } : {}) }));
  return { ...layout, nodes, frontiers, routes, roadLabels, height: Math.ceil(Math.max(layout.height, ...labelRects.map(r => r.bottom + 40))),
    diagnostics: { ...layout.diagnostics, labelOverlaps: overlapsFound, remoteLabelIds,
      labelMeasurement: measurements ? 'rendered-dimensions' : 'estimated-21px-text', labelsMoveRoads: false } };
}
