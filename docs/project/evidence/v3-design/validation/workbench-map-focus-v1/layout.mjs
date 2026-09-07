/* Deterministic, conclusion-attracted constellation layout for this probe. */
import { EXPERIMENTAL_PARAMS } from "./params.mjs";

const P = EXPERIMENTAL_PARAMS;

export const CANVAS = P.canvas;

const EDGE_KINDS = new Set(["latent", "prereq", "caught", "supports"]);
const DIRECTED_KINDS = new Set(["prereq", "caught", "supports"]);

/*
 * The large-scale shape is a dependency constellation, not a timeline.  These
 * values describe invisible semantic bands; nodes remain free to move inside
 * each band and no band is rendered by the UI.
 */
const HIERARCHY = Object.freeze({
  rankGap: 116,
  bandSlack: 16,
  bandExtent: 48,
  minimumDirectedDrop: 48,
  rankForce: 0.090,
  topicForce: 0.030,
  topicIdeal: 104,
  oldAnchorScale: 0.12,
  minimumOldMobility: 0.58,
  orderingSweeps: 10,
});

function allNodes(graph) {
  /* Topics are semantic group labels, not graph vertices.  Keeping them out of
     the position set is what prevents the old yellow hub-and-spoke geometry
     from reappearing under a different name. */
  return [...(graph.nodes ?? []), ...(graph.axioms ?? [])];
}

/*
 * The workbench's first animation beat temporarily stages newly-created nodes
 * beside the clicked action. Only ids that existed in the previous graph may
 * become soft anchors for the second-beat solve.
 */
export function previousPositionsForGraph(previousPositions = {}, previousGraph = null) {
  if (!previousGraph) return {};
  const previousIds = new Set(allNodes(previousGraph).map((node) => node.id));
  return Object.fromEntries(
    Object.entries(previousPositions).filter(([id]) => previousIds.has(id)),
  );
}

function edgeKey(edge) {
  return `${edge.kind}:${edge.from}>${edge.to}`;
}

function hash32(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hashAngle(value) {
  return (hash32(value) / 0xffffffff) * Math.PI * 2;
}

function estimatedTextWidth(text) {
  let width = 0;
  for (const character of String(text)) {
    width += character.codePointAt(0) > 255
      ? P.labels.chineseGlyphWidth
      : P.labels.latinGlyphWidth;
  }
  return width;
}

export function wrapLabel(node) {
  const limit = node.type === "obs"
    ? P.labels.obsWrap
    : node.type === "finding"
      ? P.labels.findingWrap
      : P.labels.axiomWrap;
  const characters = [...String(node.short)];
  const lines = [];
  for (let index = 0; index < characters.length; index += limit) {
    lines.push(characters.slice(index, index + limit).join(""));
  }
  return lines.length ? lines : [""];
}

export function nodeFootprint(node) {
  const labelLines = wrapLabel(node);
  const labelWidth = Math.max(...labelLines.map(estimatedTextWidth), 28);
  const labelY = -18 - (labelLines.length - 1) * P.labels.lineHeight;
  const top = labelY - 11;
  const bottom = node.type === "finding" ? 13 : 12;
  const width = Math.max(
    node.type === "axiom" ? 30 : 28,
    labelWidth + P.labels.horizontalPadding,
  );
  const height = bottom - top + P.labels.collisionPadding;
  return {
    width,
    height,
    boxOffsetX: 0,
    boxOffsetY: (top + bottom) / 2,
    labelLines,
    labelY,
  };
}

function collisionCenter(point) {
  return {
    x: point.x + (point.boxOffsetX ?? 0),
    y: point.y + (point.boxOffsetY ?? 0),
  };
}

function bounds(point, padding = 0) {
  const center = collisionCenter(point);
  return {
    left: center.x - point.width / 2 - padding,
    right: center.x + point.width / 2 + padding,
    top: center.y - point.height / 2 - padding,
    bottom: center.y + point.height / 2 + padding,
  };
}

export function rectanglesOverlap(a, b, padding = P.labels.collisionPadding) {
  const aa = bounds(a, padding / 2);
  const bb = bounds(b, padding / 2);
  return !(aa.right <= bb.left || bb.right <= aa.left || aa.bottom <= bb.top || bb.bottom <= aa.top);
}

function clonePositions(input = {}) {
  return new Map(Object.entries(input).map(([id, point]) => [id, { ...point }]));
}

function clampPoint(point, width, height) {
  const box = bounds(point);
  if (box.left < P.canvas.margin) point.x += P.canvas.margin - box.left;
  if (box.right > width - P.canvas.margin) point.x -= box.right - (width - P.canvas.margin);
  if (box.top < P.canvas.margin) point.y += P.canvas.margin - box.top;
  if (box.bottom > height - P.canvas.margin) point.y -= box.bottom - (height - P.canvas.margin);
}

function sortedGraph(graph) {
  return {
    nodes: allNodes(graph).slice().sort((a, b) => a.id.localeCompare(b.id)),
    edges: graph.edges.slice().sort((a, b) => edgeKey(a).localeCompare(edgeKey(b))),
  };
}

function adjacencyFor(nodes, edges) {
  const adjacency = new Map(nodes.map((node) => [node.id, new Set()]));
  for (const edge of edges) {
    adjacency.get(edge.from)?.add(edge.to);
    adjacency.get(edge.to)?.add(edge.from);
  }
  return adjacency;
}

function supportDegrees(edges) {
  const degrees = new Map();
  for (const edge of edges) {
    if (edge.kind !== "supports") continue;
    degrees.set(edge.from, (degrees.get(edge.from) ?? 0) + 1);
    degrees.set(edge.to, (degrees.get(edge.to) ?? 0) + 1);
  }
  return degrees;
}

function supportScale(edge, degrees) {
  /* A conclusion with many supporters is exactly the place where weakening
     every spring creates the objectionable long spokes.  Each visible support
     therefore keeps full strength; conclusion placement is balanced by the
     rank and non-overlap constraints instead. */
  return 1;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function validDirectedEdges(nodes, edges) {
  const ids = new Set(nodes.map((node) => node.id));
  return edges.filter((edge) => DIRECTED_KINDS.has(edge.kind)
    && ids.has(edge.from) && ids.has(edge.to));
}

/* Tarjan condensation keeps future cyclic evidence models safe without
   pretending that an arbitrary member of a cycle comes first. */
function stronglyConnectedComponents(nodes, edges) {
  const outgoing = new Map(nodes.map((node) => [node.id, []]));
  for (const edge of edges) outgoing.get(edge.from)?.push(edge.to);
  for (const neighbours of outgoing.values()) neighbours.sort();
  let nextIndex = 0;
  const index = new Map();
  const low = new Map();
  const stack = [];
  const onStack = new Set();
  const components = [];

  const visit = (id) => {
    index.set(id, nextIndex);
    low.set(id, nextIndex);
    nextIndex += 1;
    stack.push(id);
    onStack.add(id);
    for (const target of outgoing.get(id) ?? []) {
      if (!index.has(target)) {
        visit(target);
        low.set(id, Math.min(low.get(id), low.get(target)));
      } else if (onStack.has(target)) {
        low.set(id, Math.min(low.get(id), index.get(target)));
      }
    }
    if (low.get(id) !== index.get(id)) return;
    const component = [];
    while (stack.length) {
      const member = stack.pop();
      onStack.delete(member);
      component.push(member);
      if (member === id) break;
    }
    components.push(component.sort());
  };
  for (const node of nodes) if (!index.has(node.id)) visit(node.id);
  return components.sort((a, b) => a[0].localeCompare(b[0]));
}

function semanticRanks(nodes, edges) {
  const directed = validDirectedEdges(nodes, edges);
  const components = stronglyConnectedComponents(nodes, directed);
  const componentOf = new Map();
  components.forEach((component, index) => {
    for (const id of component) componentOf.set(id, index);
  });
  const outgoing = new Map(components.map((_, index) => [index, new Set()]));
  const incoming = new Map(components.map((_, index) => [index, new Set()]));
  const indegree = new Map(components.map((_, index) => [index, 0]));
  for (const edge of directed) {
    const from = componentOf.get(edge.from);
    const to = componentOf.get(edge.to);
    if (from === to || outgoing.get(from).has(to)) continue;
    outgoing.get(from).add(to);
    incoming.get(to).add(from);
    indegree.set(to, indegree.get(to) + 1);
  }
  const queue = [...indegree.entries()].filter(([, degree]) => degree === 0)
    .map(([id]) => id).sort((a, b) => components[a][0].localeCompare(components[b][0]));
  const topological = [];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const from = queue[cursor];
    topological.push(from);
    const targets = [...outgoing.get(from)].sort((a, b) => components[a][0].localeCompare(components[b][0]));
    for (const to of targets) {
      indegree.set(to, indegree.get(to) - 1);
      if (indegree.get(to) === 0) queue.push(to);
    }
  }

  /* Work backwards from conclusions.  Every item is placed at the latest
     feasible level: a direct supporter sits one level above its conclusion,
     while a prerequisite moves upward only as far as the longest remaining
     dependency path requires.  This minimizes the long support spokes that a
     source-first rank creates, without turning discovery order into geometry. */
  const remainingDepth = new Map(components.map((_, index) => [index, 0]));
  for (const from of topological.slice().reverse()) {
    for (const to of outgoing.get(from)) {
      remainingDepth.set(from, Math.max(remainingDepth.get(from), remainingDepth.get(to) + 1));
    }
  }
  const maxDepth = Math.max(0, ...remainingDepth.values());
  const rank = new Map(nodes.map((node) => {
    const component = componentOf.get(node.id);
    return [node.id, maxDepth - (remainingDepth.get(component) ?? 0)];
  }));
  const isolated = new Set();
  components.forEach((component, index) => {
    if (!outgoing.get(index).size && !incoming.get(index).size) {
      for (const id of component) isolated.add(id);
    }
  });
  return { rank, directed, maxRank: maxDepth, isolated };
}

function permutations(values) {
  if (values.length < 2) return [values.slice()];
  const output = [];
  values.forEach((value, index) => {
    const rest = [...values.slice(0, index), ...values.slice(index + 1)];
    for (const tail of permutations(rest)) output.push([value, ...tail]);
  });
  return output;
}

/* Conclusions are few (four in the full probe), so exhaustive seriation is
   both cheap and deterministic.  Shared direct supporters want adjacent sinks;
   previous x order is only a tie-breaker, never a hard pin. */
function seriateVisibleSinks(nodes, edges, previousPositions) {
  const sinks = nodes.filter((node) => node.type === "axiom").map((node) => node.id).sort();
  if (sinks.length > 7) return sinks;
  const supporters = new Map(sinks.map((id) => [id, new Set()]));
  for (const edge of edges) if (edge.kind === "supports" && supporters.has(edge.to)) {
    supporters.get(edge.to).add(edge.from);
  }
  const previousOrder = sinks.filter((id) => previousPositions[id])
    .sort((a, b) => previousPositions[a].x - previousPositions[b].x);
  const oldIndex = new Map(previousOrder.map((id, index) => [id, index]));
  let best = null;
  for (const order of permutations(sinks)) {
    const at = new Map(order.map((id, index) => [id, index]));
    let affinityCost = 0;
    for (let left = 0; left < sinks.length; left += 1) {
      for (let right = left + 1; right < sinks.length; right += 1) {
        let shared = 0;
        for (const id of supporters.get(sinks[left])) if (supporters.get(sinks[right]).has(id)) shared += 1;
        affinityCost += shared * Math.abs(at.get(sinks[left]) - at.get(sinks[right]));
      }
    }
    let stabilityCost = 0;
    for (const id of previousOrder) stabilityCost += Math.abs(at.get(id) - oldIndex.get(id));
    const lexical = order.join("|");
    const candidate = { order, affinityCost, stabilityCost, lexical };
    if (!best
      || candidate.affinityCost < best.affinityCost
      || (candidate.affinityCost === best.affinityCost && candidate.stabilityCost < best.stabilityCost)
      || (candidate.affinityCost === best.affinityCost && candidate.stabilityCost === best.stabilityCost
        && candidate.lexical < best.lexical)) best = candidate;
  }
  return best?.order ?? sinks;
}

function reachableSinks(nodes, directed, sinkIds) {
  const sinks = new Set(sinkIds);
  const outgoing = new Map(nodes.map((node) => [node.id, []]));
  for (const edge of directed) outgoing.get(edge.from)?.push(edge.to);
  const memo = new Map();
  const visit = (id, active = new Set()) => {
    if (memo.has(id)) return memo.get(id);
    if (active.has(id)) return new Set();
    const nextActive = new Set(active).add(id);
    const result = new Set(sinks.has(id) ? [id] : []);
    for (const target of outgoing.get(id) ?? []) for (const sink of visit(target, nextActive)) result.add(sink);
    memo.set(id, result);
    return result;
  };
  for (const node of nodes) visit(node.id);
  return memo;
}

function topicPairs(graph, nodeIds) {
  const output = [];
  for (const topic of graph.topics ?? []) {
    const members = (topic.memberIds ?? []).filter((id) => nodeIds.has(id)).sort();
    for (let left = 0; left < members.length; left += 1) {
      for (let right = left + 1; right < members.length; right += 1) {
        output.push([members[left], members[right], topic.id]);
      }
    }
  }
  return output;
}

function hierarchyModel(graph, nodes, edges, previousPositions, width, height) {
  const ranked = semanticRanks(nodes, edges);
  const { rank, directed, maxRank, isolated } = ranked;
  const ids = new Set(nodes.map((node) => node.id));
  const topics = topicPairs(graph, ids);
  for (const id of isolated) {
    const relatedRanks = topics
      .filter(([left, right]) => left === id || right === id)
      .map(([left, right]) => left === id ? right : left)
      .filter((other) => !isolated.has(other))
      .map((other) => rank.get(other));
    rank.set(id, relatedRanks.length ? Math.round(median(relatedRanks)) : Math.max(0, maxRank - 1));
  }
  const sinkOrder = seriateVisibleSinks(nodes, directed, previousPositions);
  const sinkX = new Map();
  const left = Math.max(P.canvas.margin + 90, width * 0.26);
  const right = Math.min(width - P.canvas.margin - 90, width * 0.74);
  sinkOrder.forEach((id, index) => {
    const fraction = sinkOrder.length < 2 ? 0.5 : index / (sinkOrder.length - 1);
    sinkX.set(id, left + (right - left) * fraction);
  });
  const reachable = reachableSinks(nodes, directed, sinkOrder);
  const directSinks = new Map(nodes.map((node) => [node.id, []]));
  for (const edge of directed) if (edge.kind === "supports" && sinkX.has(edge.to)) {
    directSinks.get(edge.from)?.push(edge.to);
  }
  const centreY = height / 2 + 34;
  const span = maxRank * HIERARCHY.rankGap;
  const firstY = centreY - span / 2;
  const targetY = new Map(nodes.map((node) => [node.id, firstY + rank.get(node.id) * HIERARCHY.rankGap]));
  const targetX = new Map();
  for (const node of nodes) {
    if (sinkX.has(node.id)) {
      targetX.set(node.id, sinkX.get(node.id));
      continue;
    }
    const targets = directSinks.get(node.id)?.length
      ? directSinks.get(node.id)
      : [...(reachable.get(node.id) ?? [])];
    targetX.set(node.id, targets.length
      ? median(targets.map((id) => sinkX.get(id)))
      : width * (0.22 + (hash32(`${node.id}:column`) % 5600) / 10000));
  }

  /* Barycentric sweeps use only visible directed adjacency plus topic
     membership.  They alter order inside a semantic band, never the band. */
  const neighbours = new Map(nodes.map((node) => [node.id, new Set()]));
  for (const edge of directed) {
    neighbours.get(edge.from)?.add(edge.to);
    neighbours.get(edge.to)?.add(edge.from);
  }
  for (const [a, b] of topics) {
    neighbours.get(a)?.add(b);
    neighbours.get(b)?.add(a);
  }
  const ranks = new Map();
  for (const node of nodes) {
    const value = rank.get(node.id);
    if (!ranks.has(value)) ranks.set(value, []);
    ranks.get(value).push(node.id);
  }
  for (const members of ranks.values()) members.sort((a, b) => targetX.get(a) - targetX.get(b) || a.localeCompare(b));
  for (let sweep = 0; sweep < HIERARCHY.orderingSweeps; sweep += 1) {
    const order = sweep % 2 === 0
      ? [...ranks.keys()].sort((a, b) => a - b)
      : [...ranks.keys()].sort((a, b) => b - a);
    for (const value of order) {
      const members = ranks.get(value);
      const oldIndex = new Map(members.map((id, index) => [id, index]));
      const bars = new Map();
      for (const id of members) {
        const values = [...neighbours.get(id)].map((other) => targetX.get(other)).filter(Number.isFinite);
        bars.set(id, values.length ? median(values) : targetX.get(id));
      }
      members.sort((a, b) => {
        return bars.get(a) - bars.get(b) || oldIndex.get(a) - oldIndex.get(b) || a.localeCompare(b);
      });
      members.forEach((id, index) => {
        if (sinkX.has(id)) return;
        const orderNudge = (index - (members.length - 1) / 2) * 2.5;
        targetX.set(id, targetX.get(id) * 0.70 + bars.get(id) * 0.30 + orderNudge);
      });
    }
  }
  return { rank, maxRank, directed, targetX, targetY, topics };
}

function changedNeighbourhood(nodes, edges, previousGraph, newIds) {
  const changed = new Set(newIds);
  const oldEdges = new Set((previousGraph?.edges ?? []).map(edgeKey));
  const currentEdges = new Set(edges.map(edgeKey));
  for (const edge of edges) {
    if (oldEdges.has(edgeKey(edge))) continue;
    changed.add(edge.from);
    changed.add(edge.to);
  }
  for (const edge of previousGraph?.edges ?? []) {
    if (currentEdges.has(edgeKey(edge))) continue;
    changed.add(edge.from);
    changed.add(edge.to);
  }
  const adjacency = adjacencyFor(nodes, edges);
  const neighbours = new Set();
  for (const id of changed) {
    for (const neighbour of adjacency.get(id) ?? []) {
      if (!changed.has(neighbour)) neighbours.add(neighbour);
    }
  }
  return { changed, neighbours, adjacency };
}

function seedPoint(node, positions, edges, width, height) {
  const neighbours = [];
  const supportTargets = [];
  for (const edge of edges) {
    let other = null;
    if (edge.from === node.id) other = edge.to;
    else if (edge.to === node.id) other = edge.from;
    if (!other || !positions.has(other)) continue;
    const point = positions.get(other);
    neighbours.push(point);
    if (edge.kind === "supports") supportTargets.push(point);
  }
  const preferred = supportTargets.length ? supportTargets : neighbours;
  const angle = hashAngle(node.id);
  if (preferred.length) {
    const center = preferred.reduce(
      (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
      { x: 0, y: 0 },
    );
    center.x /= preferred.length;
    center.y /= preferred.length;
    const radius = P.springs.supports.ideal * (supportTargets.length ? 0.58 : 0.72);
    return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
  }
  const radius = Math.min(width, height) * (0.12 + (hash32(`${node.id}:radius`) % 100) / 500);
  return {
    x: width / 2 + Math.cos(angle) * radius,
    y: height / 2 + Math.sin(angle) * radius,
  };
}

function rankedSeedPoint(node, model, width, height) {
  const angle = hashAngle(`${node.id}:rank-seed`);
  const xJitter = Math.cos(angle) * 54;
  const yJitter = Math.sin(angle) * HIERARCHY.bandSlack;
  return {
    x: Math.max(P.canvas.margin, Math.min(width - P.canvas.margin,
      (model.targetX.get(node.id) ?? width / 2) + xJitter)),
    y: Math.max(P.canvas.margin, Math.min(height - P.canvas.margin,
      (model.targetY.get(node.id) ?? height / 2) + yJitter)),
  };
}

function addForce(forceX, forceY, id, x, y) {
  forceX.set(id, forceX.get(id) + x);
  forceY.set(id, forceY.get(id) + y);
}

function projectDirectedConstraints(model, positions, mobility, width, height) {
  for (let pass = 0; pass < Math.max(2, model.maxRank + 1); pass += 1) {
    let changed = false;
    for (const edge of model.directed) {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      if (!from || !to) continue;
      const missing = HIERARCHY.minimumDirectedDrop - (to.y - from.y);
      if (missing <= 0) continue;
      changed = true;
      const fromMobility = Math.max(0.1, mobility.get(edge.from) ?? 1);
      const toMobility = Math.max(0.1, mobility.get(edge.to) ?? 1);
      const total = fromMobility + toMobility;
      from.y -= missing * (fromMobility / total);
      to.y += missing * (toMobility / total);
      clampPoint(from, width, height);
      clampPoint(to, width, height);
    }
    if (!changed) break;
  }
}

function directedViolationCount(model, positions) {
  let violations = 0;
  for (const edge of model.directed) {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (from && to && to.y - from.y < HIERARCHY.minimumDirectedDrop - 0.01) violations += 1;
  }
  return violations;
}

function projectRankBands(model, positions, width, height) {
  for (const [id, target] of model.targetY) {
    const point = positions.get(id);
    if (!point) continue;
    point.y = Math.max(target - HIERARCHY.bandExtent,
      Math.min(target + HIERARCHY.bandExtent, point.y));
    clampPoint(point, width, height);
  }
}

function rankBandViolationCount(model, positions) {
  let violations = 0;
  for (const [id, target] of model.targetY) {
    const point = positions.get(id);
    if (point && Math.abs(point.y - target) > HIERARCHY.bandExtent + 0.01) violations += 1;
  }
  return violations;
}

function settleConstraints(nodes, model, positions, mobility, width, height) {
  for (let pass = 0; pass < 8; pass += 1) {
    projectRankBands(model, positions, width, height);
    projectDirectedConstraints(model, positions, mobility, width, height);
    resolveCollisions(nodes, positions, mobility, width, height);
  }
  projectRankBands(model, positions, width, height);
  projectDirectedConstraints(model, positions, mobility, width, height);
}

/* A dense semantic rank may contain more labels than fit on one horizontal
   line.  The free collision solver used to solve that by throwing members far
   above or below their logical band, which made direct evidence look several
   steps away from its conclusion.  Pack each rank into the minimum number of
   unpainted sub-rows instead.  These are collision rows, not gameplay lanes:
   they have no labels and never use acquisition order. */
function packRankBands(nodes, model, positions, width, height) {
  const margin = P.canvas.margin;
  const usableWidth = Math.max(1, width - margin * 2);
  const gap = Math.max(12, P.labels.collisionPadding + 4);
  const byRank = new Map();
  for (const node of nodes) {
    const rank = model.rank.get(node.id) ?? 0;
    if (!byRank.has(rank)) byRank.set(rank, []);
    byRank.get(rank).push(node);
  }

  const layouts = [];
  for (const [rank, members] of [...byRank].sort(([left], [right]) => left - right)) {
    members.sort((left, right) => {
      const leftTarget = model.targetX.get(left.id) ?? positions.get(left.id)?.x ?? width / 2;
      const rightTarget = model.targetX.get(right.id) ?? positions.get(right.id)?.x ?? width / 2;
      return leftTarget - rightTarget || left.id.localeCompare(right.id);
    });
    const requiredWidth = members.reduce((sum, node) => sum + positions.get(node.id).width, 0)
      + gap * Math.max(0, members.length - 1);
    const rowCount = Math.max(1, Math.min(members.length, Math.ceil(requiredWidth / usableWidth)));
    const rows = Array.from({ length: rowCount }, () => []);
    const packedWidth = (row) => row.reduce((sum, node) => sum + positions.get(node.id).width, 0)
      + gap * Math.max(0, row.length - 1);
    for (const node of members) {
      const row = rows.reduce((best, candidate) =>
        packedWidth(candidate) < packedWidth(best) ? candidate : best, rows[0]);
      row.push(node);
    }
    for (let pass = 0; pass < members.length * 2; pass += 1) {
      const widths = rows.map(packedWidth);
      const heavy = widths.indexOf(Math.max(...widths));
      const light = widths.indexOf(Math.min(...widths));
      if (widths[heavy] <= usableWidth || heavy === light || rows[heavy].length < 2) break;
      let bestIndex = -1;
      let bestMaximum = widths[heavy];
      rows[heavy].forEach((node, index) => {
        const nodeWidth = positions.get(node.id).width;
        const nextHeavy = widths[heavy] - nodeWidth - gap;
        const nextLight = widths[light] + nodeWidth + (rows[light].length ? gap : 0);
        const nextMaximum = Math.max(nextHeavy, nextLight);
        if (nextMaximum < bestMaximum) { bestMaximum = nextMaximum; bestIndex = index; }
      });
      if (bestIndex < 0) break;
      rows[light].push(rows[heavy].splice(bestIndex, 1)[0]);
    }
    for (const row of rows) row.sort((left, right) =>
      (model.targetX.get(left.id) ?? 0) - (model.targetX.get(right.id) ?? 0) || left.id.localeCompare(right.id));
    layouts.push({ rank, rows: rows.filter((row) => row.length) });
  }

  /* The number of invisible collision rows is derived from available width.
     Rank blocks are then stacked top-to-bottom as one continuous sequence, so
     a narrow desktop receives more rows without letting adjacent semantic
     ranks occupy the same vertical space. */
  const allRows = layouts.flatMap((layout) => layout.rows);
  const topExtent = Math.max(0, ...nodes.map((node) => {
    const point = positions.get(node.id);
    return point.height / 2 - (point.boxOffsetY ?? 0);
  }));
  const bottomExtent = Math.max(0, ...nodes.map((node) => {
    const point = positions.get(node.id);
    return point.height / 2 + (point.boxOffsetY ?? 0);
  }));
  const top = margin + topExtent;
  const bottom = height - margin - bottomExtent;
  const desiredRowStep = Math.max(
    HIERARCHY.minimumDirectedDrop,
    Math.max(...nodes.map((node) => positions.get(node.id).height)) + P.labels.collisionPadding + 4,
  );
  const rowStep = allRows.length < 2
    ? 0
    : Math.max(
      HIERARCHY.minimumDirectedDrop,
      Math.min(desiredRowStep, (bottom - top) / (allRows.length - 1)),
    );
  const span = rowStep * Math.max(0, allRows.length - 1);
  let nextY = top + Math.max(0, (bottom - top - span) / 2);

  for (const { rows } of layouts) {
    rows.forEach((row) => {
      if (!row.length) return;
      let cursor = margin;
      for (const node of row) {
        const point = positions.get(node.id);
        const desiredX = model.targetX.get(node.id) ?? point.x;
        const half = point.width / 2;
        point.x = Math.max(desiredX, cursor + half);
        cursor = point.x + half + gap;
        point.y = nextY;
      }
      cursor = width - margin;
      for (const node of row.slice().reverse()) {
        const point = positions.get(node.id);
        const half = point.width / 2;
        point.x = Math.min(point.x, cursor - half);
        cursor = point.x - half - gap;
      }
      cursor = margin;
      for (const node of row) {
        const point = positions.get(node.id);
        const half = point.width / 2;
        point.x = Math.max(point.x, cursor + half);
        cursor = point.x + half + gap;
      }
      for (const node of row) clampPoint(positions.get(node.id), width, height);
      nextY += rowStep;
    });
  }
  projectDirectedConstraints(model, positions, new Map(nodes.map((node) => [node.id, 1])), width, height);
}

function settlePackedGeometry(graph, nodes, model, positions, width, height) {
  const mobility = new Map(nodes.map((node) => [node.id, 1]));
  for (let pass = 0; pass < 64; pass += 1) {
    resolveCollisions(nodes, positions, mobility, width, height);
    projectDirectedConstraints(model, positions, mobility, width, height);
    const geometry = collectGeometry(graph, Object.fromEntries(positions));
    if (geometry.overlaps === 0 && directedViolationCount(model, positions) === 0) break;
  }
}

function segmentOrientation(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function properSegmentsCross(a, b, c, d) {
  const abC = segmentOrientation(a, b, c);
  const abD = segmentOrientation(a, b, d);
  const cdA = segmentOrientation(c, d, a);
  const cdB = segmentOrientation(c, d, b);
  return ((abC > 0 && abD < 0) || (abC < 0 && abD > 0))
    && ((cdA > 0 && cdB < 0) || (cdA < 0 && cdB > 0));
}

function crossingAngle(a, b, c, d) {
  const first = { x: b.x - a.x, y: b.y - a.y };
  const second = { x: d.x - c.x, y: d.y - c.y };
  const denominator = Math.hypot(first.x, first.y) * Math.hypot(second.x, second.y) || 1;
  const cosine = Math.max(-1, Math.min(1, Math.abs((first.x * second.x + first.y * second.y) / denominator)));
  return Math.acos(cosine);
}

function segmentIntersectsBox(a, b, box) {
  if ((a.x >= box.left && a.x <= box.right && a.y >= box.top && a.y <= box.bottom)
    || (b.x >= box.left && b.x <= box.right && b.y >= box.top && b.y <= box.bottom)) return true;
  const topLeft = { x: box.left, y: box.top };
  const topRight = { x: box.right, y: box.top };
  const bottomLeft = { x: box.left, y: box.bottom };
  const bottomRight = { x: box.right, y: box.bottom };
  return properSegmentsCross(a, b, topLeft, topRight)
    || properSegmentsCross(a, b, topRight, bottomRight)
    || properSegmentsCross(a, b, bottomRight, bottomLeft)
    || properSegmentsCross(a, b, bottomLeft, topLeft);
}

function crossingWeight(first, second) {
  if (first.kind === "supports" && second.kind === "supports") return 0.72;
  if (first.kind === "supports" || second.kind === "supports") return 1;
  return 1.28;
}

function collectGeometry(graph, positions) {
  const edges = graph.edges.filter((edge) => positions[edge.from] && positions[edge.to]);
  let crossings = 0;
  let weightedCrossings = 0;
  let shallowCrossings = 0;
  const crossingPairs = [];
  for (let left = 0; left < edges.length; left += 1) {
    for (let right = left + 1; right < edges.length; right += 1) {
      const first = edges[left];
      const second = edges[right];
      if (first.from === second.from || first.from === second.to
        || first.to === second.from || first.to === second.to) continue;
      const a = positions[first.from];
      const b = positions[first.to];
      const c = positions[second.from];
      const d = positions[second.to];
      if (!properSegmentsCross(a, b, c, d)) continue;
      crossings += 1;
      crossingPairs.push([edgeKey(first), edgeKey(second)]);
      const weight = crossingWeight(first, second);
      weightedCrossings += weight;
      const angle = crossingAngle(a, b, c, d);
      if (angle < Math.PI / 4) shallowCrossings += (Math.PI / 4 - angle) / (Math.PI / 4);
    }
  }

  const nodes = allNodes(graph);
  let edgeLabelIntersections = 0;
  const edgeLabelPairs = [];
  for (const edge of edges) {
    const from = positions[edge.from];
    const to = positions[edge.to];
    for (const node of nodes) {
      if (node.id === edge.from || node.id === edge.to) continue;
      const point = positions[node.id];
      if (point && segmentIntersectsBox(from, to, bounds(point, 2))) {
        edgeLabelIntersections += 1;
        edgeLabelPairs.push([edgeKey(edge), node.id]);
      }
    }
  }

  let overlaps = 0;
  for (let left = 0; left < nodes.length; left += 1) {
    for (let right = left + 1; right < nodes.length; right += 1) {
      if (rectanglesOverlap(positions[nodes[left].id], positions[nodes[right].id])) overlaps += 1;
    }
  }
  return {
    crossings,
    weightedCrossings,
    shallowCrossings,
    edgeLabelIntersections,
    overlaps,
    crossingPairs,
    edgeLabelPairs,
  };
}

export function layoutDiagnostics(graph, positions) {
  return collectGeometry(graph, positions);
}

function percentile(values, fraction) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction));
  return sorted[index];
}

export function layoutMetrics(graph, positions, previousPositions = null) {
  const supportLengths = graph.edges
    .filter((edge) => edge.kind === "supports" && positions[edge.from] && positions[edge.to])
    .map((edge) => Math.hypot(
      positions[edge.to].x - positions[edge.from].x,
      positions[edge.to].y - positions[edge.from].y,
    ));
  const geometry = collectGeometry(graph, positions);
  const movement = [];
  if (previousPositions) {
    for (const [id, before] of Object.entries(previousPositions)) {
      const after = positions[id];
      if (after) movement.push(Math.hypot(after.x - before.x, after.y - before.y));
    }
  }
  const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  return {
    support: {
      count: supportLengths.length,
      mean: Number(mean(supportLengths).toFixed(1)),
      median: Number(percentile(supportLengths, 0.5).toFixed(1)),
      max: Number(Math.max(0, ...supportLengths).toFixed(1)),
    },
    crossings: geometry.crossings,
    weightedCrossings: Number(geometry.weightedCrossings.toFixed(2)),
    shallowCrossings: Number(geometry.shallowCrossings.toFixed(2)),
    edgeLabelIntersections: geometry.edgeLabelIntersections,
    overlaps: geometry.overlaps,
    movement: {
      common: movement.length,
      mean: Number(mean(movement).toFixed(1)),
      median: Number(percentile(movement, 0.5).toFixed(1)),
      max: Number(Math.max(0, ...movement).toFixed(1)),
      overThreshold: movement.filter((value) => value > P.stability.movementMetricThreshold).length,
    },
  };
}

function stressScore(graph, positions, anchors, anchorStrength) {
  const degrees = supportDegrees(graph.edges);
  let score = 0;
  for (const edge of graph.edges) {
    const from = positions[edge.from];
    const to = positions[edge.to];
    if (!from || !to) continue;
    const config = P.springs[edge.kind];
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const delta = distance - config.ideal;
    score += delta * delta * config.strength * supportScale(edge, degrees);
    if (edge.kind === "supports" && distance > config.longThreshold) {
      const long = distance - config.longThreshold;
      score += long * long * config.longStrength;
    }
  }
  const nodes = allNodes(graph);
  for (let left = 0; left < nodes.length; left += 1) {
    for (let right = left + 1; right < nodes.length; right += 1) {
      const a = positions[nodes[left].id];
      const b = positions[nodes[right].id];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance < P.objective.unrelatedCrowdingDistance) {
        const deficit = P.objective.unrelatedCrowdingDistance - distance;
        score += deficit * deficit * P.objective.unrelatedCrowdingPenalty;
      }
    }
  }
  for (const [id, anchor] of anchors) {
    const point = positions[id];
    if (!point) continue;
    const distanceSquared = (point.x - anchor.x) ** 2 + (point.y - anchor.y) ** 2;
    score += distanceSquared * (anchorStrength.get(id) ?? 0) * P.objective.stabilityPenaltyScale;
  }
  const geometry = collectGeometry(graph, positions);
  score += geometry.weightedCrossings * P.objective.crossingPenalty;
  score += geometry.shallowCrossings * P.objective.shallowCrossingPenalty;
  score += geometry.edgeLabelIntersections * P.objective.edgeLabelPenalty;
  score += geometry.overlaps * P.objective.overlapPenalty;
  return score;
}

function resolveCollisions(nodes, positions, mobility, width, height) {
  for (let pass = 0; pass < P.solve.collisionPasses; pass += 1) {
    let collisions = 0;
    for (let left = 0; left < nodes.length; left += 1) {
      for (let right = left + 1; right < nodes.length; right += 1) {
        const a = positions.get(nodes[left].id);
        const b = positions.get(nodes[right].id);
        const ac = collisionCenter(a);
        const bc = collisionCenter(b);
        const collisionGap = P.labels.collisionPadding + P.labels.roundingSafety;
        const overlapX = (a.width + b.width) / 2 + collisionGap - Math.abs(ac.x - bc.x);
        const overlapY = (a.height + b.height) / 2 + collisionGap - Math.abs(ac.y - bc.y);
        if (overlapX <= 0 || overlapY <= 0) continue;
        collisions += 1;
        const aMobility = Math.max(0.08, mobility.get(nodes[left].id) ?? 1);
        const bMobility = Math.max(0.08, mobility.get(nodes[right].id) ?? 1);
        const total = aMobility + bMobility;
        if (overlapX < overlapY) {
          const direction = ac.x <= bc.x ? -1 : 1;
          a.x += direction * overlapX * (aMobility / total);
          b.x -= direction * overlapX * (bMobility / total);
        } else {
          const direction = ac.y <= bc.y ? -1 : 1;
          a.y += direction * overlapY * (aMobility / total);
          b.y -= direction * overlapY * (bMobility / total);
        }
        clampPoint(a, width, height);
        clampPoint(b, width, height);
      }
    }
    if (!collisions) break;
  }
}

function positionsObject(nodes, positions) {
  const output = {};
  for (const node of nodes) {
    const point = positions.get(node.id);
    output[node.id] = {
      ...point,
      x: Number(point.x.toFixed(2)),
      y: Number(point.y.toFixed(2)),
      role: node.type,
    };
  }
  return output;
}

function criticalCrossings(graph, geometry) {
  const edgeByKey = new Map(graph.edges.map((edge) => [edgeKey(edge), edge]));
  return geometry.crossingPairs.filter(([left, right]) => {
    const a = edgeByKey.get(left);
    const b = edgeByKey.get(right);
    return a && b && (a.kind === "prereq" || a.kind === "caught"
      || b.kind === "prereq" || b.kind === "caught");
  }).length;
}

function geometryQuality(graph, positions, anchors, anchorStrength) {
  const object = Object.fromEntries(positions);
  const geometry = collectGeometry(graph, object);
  const supportLengths = graph.edges.filter((edge) => edge.kind === "supports")
    .map((edge) => {
      const from = object[edge.from];
      const to = object[edge.to];
      return from && to ? Math.hypot(to.x - from.x, to.y - from.y) : 0;
    });
  return {
    tuple: [
      geometry.overlaps,
      geometry.edgeLabelIntersections,
      supportLengths.reduce((sum, value) => sum + value, 0),
      Math.max(0, ...supportLengths),
      criticalCrossings(graph, geometry),
      geometry.crossings,
      stressScore(graph, object, anchors, anchorStrength),
    ],
    geometry,
  };
}

function tupleLess(left, right) {
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    if (left[index] !== right[index]) return left[index] < right[index];
  }
  return left.length < right.length;
}

/* The continuous solver cannot pass two labelled nodes through one another,
   so it gets trapped in a bad left/right order.  Adjacent transposition is the
   small-graph Sugiyama step that lets it cross that barrier deliberately. */
function refineRankOrder(graph, nodes, model, positions, anchors, anchorStrength, width, height) {
  let best = geometryQuality(graph, positions, anchors, anchorStrength);
  const ranks = [...new Set(nodes.map((node) => model.rank.get(node.id)))].sort((a, b) => a - b);
  for (let pass = 0; pass < 40; pass += 1) {
    let bestMove = null;
    for (const rank of ranks) {
      const ordered = nodes.filter((node) => model.rank.get(node.id) === rank)
        .sort((a, b) => positions.get(a.id).x - positions.get(b.id).x || a.id.localeCompare(b.id));
      for (let leftIndex = 0; leftIndex < ordered.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < ordered.length; rightIndex += 1) {
          const left = positions.get(ordered[leftIndex].id);
          const right = positions.get(ordered[rightIndex].id);
          const leftX = left.x;
          const rightX = right.x;
          left.x = rightX;
          right.x = leftX;
          clampPoint(left, width, height);
          clampPoint(right, width, height);
          const candidate = geometryQuality(graph, positions, anchors, anchorStrength);
          left.x = leftX;
          right.x = rightX;
          const threshold = bestMove?.quality ?? best;
          if (tupleLess(candidate.tuple, threshold.tuple)) {
            bestMove = {
              leftId: ordered[leftIndex].id,
              rightId: ordered[rightIndex].id,
              leftX,
              rightX,
              quality: candidate,
            };
          }
        }
      }
    }
    if (!bestMove) break;
    positions.get(bestMove.leftId).x = bestMove.rightX;
    positions.get(bestMove.rightId).x = bestMove.leftX;
    best = bestMove.quality;
  }
}

function refineCrossings(graph, nodes, positions, mobility, anchors, anchorStrength, width, height) {
  const directions = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, 0.7071], [-0.7071, -0.7071],
  ];
  for (const step of P.solve.localStepSizes) {
    for (let pass = 0; pass < P.solve.crossingPassesPerStep; pass += 1) {
      let anyImprovement = false;
      for (const node of nodes) {
        const point = positions.get(node.id);
        const start = { x: point.x, y: point.y };
        let best = start;
        let bestQuality = geometryQuality(graph, positions, anchors, anchorStrength);
        for (const [dx, dy] of directions) {
          point.x = start.x + dx * step * (0.55 + 0.45 * mobility.get(node.id));
          point.y = start.y + dy * step * (0.55 + 0.45 * mobility.get(node.id));
          clampPoint(point, width, height);
          const candidate = geometryQuality(graph, positions, anchors, anchorStrength);
          if (tupleLess(candidate.tuple, bestQuality.tuple)) {
            bestQuality = candidate;
            best = { x: point.x, y: point.y };
          }
        }
        point.x = best.x;
        point.y = best.y;
        if (best.x !== start.x || best.y !== start.y) anyImprovement = true;
      }
      resolveCollisions(nodes, positions, mobility, width, height);
      if (!anyImprovement) break;
    }
  }
}

function rigidAlignToPrevious(nodes, positions, previousPositions, width, height) {
  const common = nodes.filter((node) => previousPositions[node.id]);
  if (common.length < 2) return;
  const currentCenter = common.reduce(
    (sum, node) => ({ x: sum.x + positions.get(node.id).x, y: sum.y + positions.get(node.id).y }),
    { x: 0, y: 0 },
  );
  const previousCenter = common.reduce(
    (sum, node) => ({ x: sum.x + previousPositions[node.id].x, y: sum.y + previousPositions[node.id].y }),
    { x: 0, y: 0 },
  );
  currentCenter.x /= common.length;
  currentCenter.y /= common.length;
  previousCenter.x /= common.length;
  previousCenter.y /= common.length;
  const alignmentX = previousCenter.x - currentCenter.x;
  const alignmentY = previousCenter.y - currentCenter.y;
  for (const node of nodes) {
    const point = positions.get(node.id);
    point.x += alignmentX;
    point.y += alignmentY;
  }

  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const node of nodes) {
    const box = bounds(positions.get(node.id));
    left = Math.min(left, box.left);
    right = Math.max(right, box.right);
    top = Math.min(top, box.top);
    bottom = Math.max(bottom, box.bottom);
  }
  let shiftX = 0;
  let shiftY = 0;
  if (left < P.canvas.margin) shiftX = P.canvas.margin - left;
  if (right + shiftX > width - P.canvas.margin) shiftX -= right + shiftX - (width - P.canvas.margin);
  if (top < P.canvas.margin) shiftY = P.canvas.margin - top;
  if (bottom + shiftY > height - P.canvas.margin) shiftY -= bottom + shiftY - (height - P.canvas.margin);
  for (const node of nodes) {
    const point = positions.get(node.id);
    point.x += shiftX;
    point.y += shiftY;
  }
}

function repairEdgeLabelIntersections(graph, nodes, model, positions, anchors, anchorStrength, width, height) {
  const edgeByKey = new Map(graph.edges.map((edge) => [edgeKey(edge), edge]));
  const repairOrigin = new Map([...positions].map(([id, point]) => [id, { x: point.x, y: point.y }]));
  const maximumRepairDisplacement = 168;
  const supportProfile = (object) => {
    const lengths = graph.edges
      .filter((edge) => edge.kind === "supports" && object[edge.from] && object[edge.to])
      .map((edge) => Math.hypot(
        object[edge.to].x - object[edge.from].x,
        object[edge.to].y - object[edge.from].y,
      ));
    return {
      total: lengths.reduce((sum, length) => sum + length, 0),
      max: Math.max(0, ...lengths),
    };
  };
  const referenceSupport = supportProfile(Object.fromEntries(positions));
  for (let pass = 0; pass < P.solve.edgeLabelRepairPasses; pass += 1) {
    const startObject = Object.fromEntries(positions);
    const startGeometry = collectGeometry(graph, startObject);
    if (!startGeometry.edgeLabelPairs.length) break;
    let best = null;
    for (const [problemEdgeKey, obstacleId] of startGeometry.edgeLabelPairs) {
      const edge = edgeByKey.get(problemEdgeKey);
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy) || 1;
      const directions = [
        { x: -dy / distance, y: dx / distance },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ];
      for (const id of [obstacleId, edge.from, edge.to]) {
        const point = positions.get(id);
        const origin = { x: point.x, y: point.y };
        for (const vector of directions) {
          for (const step of [...P.solve.edgeLabelRepairSteps, 88, 112]) {
            for (const direction of [-1, 1]) {
              point.x = origin.x + vector.x * step * direction;
              point.y = origin.y + vector.y * step * direction;
              clampPoint(point, width, height);
              const firstPosition = repairOrigin.get(id);
              if (firstPosition && Math.hypot(
                point.x - firstPosition.x,
                point.y - firstPosition.y,
              ) > maximumRepairDisplacement) continue;
              const candidateObject = Object.fromEntries(positions);
              const geometry = collectGeometry(graph, candidateObject);
              if (geometry.overlaps > 0 || directedViolationCount(model, positions) > 0) continue;
              const candidateSupport = supportProfile(candidateObject);
              if (candidateSupport.total > referenceSupport.total * 1.05
                || candidateSupport.max > referenceSupport.max * 1.08) continue;
              const candidate = {
                id,
                x: point.x,
                y: point.y,
                geometry,
                score: stressScore(graph, candidateObject, anchors, anchorStrength),
              };
              const better = !best
                || candidate.geometry.edgeLabelIntersections < best.geometry.edgeLabelIntersections
                || (candidate.geometry.edgeLabelIntersections === best.geometry.edgeLabelIntersections
                  && candidate.geometry.crossings < best.geometry.crossings)
                || (candidate.geometry.edgeLabelIntersections === best.geometry.edgeLabelIntersections
                  && candidate.geometry.crossings === best.geometry.crossings
                  && candidate.score < best.score);
              if (better) best = candidate;
            }
          }
        }
        point.x = origin.x;
        point.y = origin.y;
      }
    }
    if (!best || best.geometry.edgeLabelIntersections >= startGeometry.edgeLabelIntersections) break;
    const point = positions.get(best.id);
    point.x = best.x;
    point.y = best.y;
  }
}

export function constellationLayoutStep(
  graph,
  previousPositions = {},
  previousGraph = null,
  { width = CANVAS.width, height = CANVAS.height } = {},
) {
  const { nodes, edges } = sortedGraph(graph);
  const layoutGraph = { ...graph, edges };
  const model = hierarchyModel(layoutGraph, nodes, edges, previousPositions, width, height);
  const ids = new Set(nodes.map((node) => node.id));
  const positions = clonePositions(previousPositions);
  for (const id of [...positions.keys()]) if (!ids.has(id)) positions.delete(id);
  const previousIds = new Set(Object.keys(previousPositions));
  const newIds = new Set(nodes.filter((node) => !previousIds.has(node.id)).map((node) => node.id));
  const currentEdgeKeys = new Set(edges.map(edgeKey));
  const sameGraph = previousGraph
    && allNodes(previousGraph).length === nodes.length
    && allNodes(previousGraph).every((node) => ids.has(node.id))
    && previousGraph.edges.length === edges.length
    && previousGraph.edges.every((edge) => currentEdgeKeys.has(edgeKey(edge)));
  for (const node of nodes) {
    const footprint = nodeFootprint(node);
    const ranked = rankedSeedPoint(node, model, width, height);
    if (!positions.has(node.id)) {
      positions.set(node.id, { ...ranked, ...footprint });
    } else {
      const point = positions.get(node.id);
      if (!sameGraph) {
        point.x = point.x * 0.16 + ranked.x * 0.84;
        point.y = point.y * 0.16 + ranked.y * 0.84;
      }
      Object.assign(point, footprint);
    }
    clampPoint(positions.get(node.id), width, height);
  }

  if (sameGraph) {
    const stable = positionsObject(nodes, positions);
    return {
      positions: stable,
      newNodeIds: [],
      changedNodeIds: [],
      neighbourNodeIds: [],
      usedEdgeKeys: edges.map(edgeKey),
      metrics: layoutMetrics(layoutGraph, stable, previousPositions),
    };
  }

  const { changed, neighbours } = changedNeighbourhood(nodes, edges, previousGraph, newIds);
  const mobility = new Map();
  const anchorStrength = new Map();
  for (const node of nodes) {
    if (newIds.has(node.id)) {
      mobility.set(node.id, P.stability.newNodeMobility);
      anchorStrength.set(node.id, 0);
    } else if (changed.has(node.id)) {
      mobility.set(node.id, Math.max(HIERARCHY.minimumOldMobility, P.stability.changedNodeMobility));
      anchorStrength.set(node.id, P.stability.changedAnchor * HIERARCHY.oldAnchorScale);
    } else if (neighbours.has(node.id)) {
      mobility.set(node.id, Math.max(HIERARCHY.minimumOldMobility, P.stability.neighbourMobility));
      anchorStrength.set(node.id, P.stability.neighbourAnchor * HIERARCHY.oldAnchorScale);
    } else {
      mobility.set(node.id, Math.max(HIERARCHY.minimumOldMobility, P.stability.remoteNodeMobility));
      anchorStrength.set(node.id, P.stability.remoteAnchor * HIERARCHY.oldAnchorScale);
    }
  }
  const anchors = new Map(
    nodes
      .filter((node) => previousIds.has(node.id))
      .map((node) => [node.id, { x: previousPositions[node.id].x, y: previousPositions[node.id].y }]),
  );
  const degrees = supportDegrees(edges);

  for (let iteration = 0; iteration < P.solve.forceIterations; iteration += 1) {
    const progress = iteration / P.solve.forceIterations;
    const temperature = 0.06 + 0.94 * (1 - progress);
    const maxForceStep = P.solve.finalMaximumForceStep
      + (P.solve.maximumForceStep - P.solve.finalMaximumForceStep) * (1 - progress);
    const forceX = new Map(nodes.map((node) => [node.id, 0]));
    const forceY = new Map(nodes.map((node) => [node.id, 0]));

    for (let left = 0; left < nodes.length; left += 1) {
      for (let right = left + 1; right < nodes.length; right += 1) {
        const aNode = nodes[left];
        const bNode = nodes[right];
        const a = positions.get(aNode.id);
        const b = positions.get(bNode.id);
        const ac = collisionCenter(a);
        const bc = collisionCenter(b);
        let dx = ac.x - bc.x;
        let dy = ac.y - bc.y;
        let distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < 1) {
          const angle = hashAngle(`${aNode.id}:${bNode.id}`);
          dx = Math.cos(angle);
          dy = Math.sin(angle);
          distanceSquared = 1;
        }
        const distance = Math.sqrt(distanceSquared);
        const magnitude = (P.spacing.repulsion * 0.52) / distanceSquared;
        addForce(forceX, forceY, aNode.id, (dx / distance) * magnitude, (dy / distance) * magnitude);
        addForce(forceX, forceY, bNode.id, -(dx / distance) * magnitude, -(dy / distance) * magnitude);

        const overlapX = (a.width + b.width) / 2 + P.labels.collisionPadding - Math.abs(dx);
        const overlapY = (a.height + b.height) / 2 + P.labels.collisionPadding - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          if (overlapX < overlapY) {
            const direction = dx <= 0 ? -1 : 1;
            const push = overlapX * P.spacing.overlapPush;
            addForce(forceX, forceY, aNode.id, direction * push, 0);
            addForce(forceX, forceY, bNode.id, -direction * push, 0);
          } else {
            const direction = dy <= 0 ? -1 : 1;
            const push = overlapY * P.spacing.overlapPush;
            addForce(forceX, forceY, aNode.id, 0, direction * push);
            addForce(forceX, forceY, bNode.id, 0, -direction * push);
          }
        }
      }
    }

    for (const edge of edges) {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      const config = P.springs[edge.kind];
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy) || 1;
      let magnitude = (distance - config.ideal) * config.strength * supportScale(edge, degrees);
      if (edge.kind === "supports" && distance > config.longThreshold) {
        magnitude += (distance - config.longThreshold) * config.longStrength;
      }
      addForce(forceX, forceY, edge.from, (dx / distance) * magnitude, (dy / distance) * magnitude);
      addForce(forceX, forceY, edge.to, -(dx / distance) * magnitude, -(dy / distance) * magnitude);
    }

    for (const node of nodes) {
      const point = positions.get(node.id);
      addForce(
        forceX,
        forceY,
        node.id,
        (model.targetX.get(node.id) - point.x) * HIERARCHY.rankForce * 0.34,
        (model.targetY.get(node.id) - point.y) * HIERARCHY.rankForce,
      );
    }

    for (const [leftId, rightId] of model.topics) {
      const left = positions.get(leftId);
      const right = positions.get(rightId);
      if (!left || !right) continue;
      const dx = right.x - left.x;
      const dy = right.y - left.y;
      const distance = Math.hypot(dx, dy) || 1;
      const magnitude = (distance - HIERARCHY.topicIdeal) * HIERARCHY.topicForce;
      addForce(forceX, forceY, leftId, (dx / distance) * magnitude, (dy / distance) * magnitude);
      addForce(forceX, forceY, rightId, -(dx / distance) * magnitude, -(dy / distance) * magnitude);
    }

    for (const node of nodes) {
      const point = positions.get(node.id);
      const anchor = anchors.get(node.id);
      if (anchor) {
        addForce(
          forceX,
          forceY,
          node.id,
          (anchor.x - point.x) * anchorStrength.get(node.id),
          (anchor.y - point.y) * anchorStrength.get(node.id),
        );
      }
      addForce(forceX, forceY, node.id, (width / 2 - point.x) * P.spacing.centreGravity, (height / 2 - point.y) * P.spacing.centreGravity);
      const moveX = Math.max(-maxForceStep, Math.min(maxForceStep, forceX.get(node.id)));
      const moveY = Math.max(-maxForceStep, Math.min(maxForceStep, forceY.get(node.id)));
      point.x += moveX * temperature * mobility.get(node.id);
      point.y += moveY * temperature * mobility.get(node.id);
      clampPoint(point, width, height);
    }
    projectDirectedConstraints(model, positions, mobility, width, height);
  }

  settleConstraints(nodes, model, positions, mobility, width, height);
  refineRankOrder(layoutGraph, nodes, model, positions, anchors, anchorStrength, width, height);
  refineCrossings(layoutGraph, nodes, positions, mobility, anchors, anchorStrength, width, height);
  settleConstraints(nodes, model, positions, mobility, width, height);
  refineRankOrder(layoutGraph, nodes, model, positions, anchors, anchorStrength, width, height);
  packRankBands(nodes, model, positions, width, height);
  settlePackedGeometry(layoutGraph, nodes, model, positions, width, height);
  repairEdgeLabelIntersections(
    layoutGraph, nodes, model, positions, anchors, anchorStrength, width, height,
  );
  const output = positionsObject(nodes, positions);
  return {
    positions: output,
    newNodeIds: [...newIds].sort(),
    changedNodeIds: [...changed].sort(),
    neighbourNodeIds: [...neighbours].sort(),
    usedEdgeKeys: edges.map(edgeKey),
    metrics: layoutMetrics(layoutGraph, output, previousPositions),
  };
}

export function assertSupportedEdgeKinds(graph) {
  const unknown = graph.edges.filter((edge) => !EDGE_KINDS.has(edge.kind));
  if (unknown.length) throw new Error(`未知关系类型：${unknown.map(edgeKey).join(", ")}`);
}
