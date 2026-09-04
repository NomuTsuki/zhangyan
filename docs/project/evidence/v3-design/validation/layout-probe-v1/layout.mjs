/* Deterministic, conclusion-attracted constellation layout for this probe. */
import { CANVAS, EXPERIMENTAL_PARAMS as P } from "./params.mjs";

const EDGE_KINDS = new Set(["latent", "prereq", "caught", "supports"]);

function allNodes(graph) {
  return [...graph.nodes, ...graph.findings, ...graph.axioms];
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
  if (edge.kind !== "supports") return 1;
  const product = Math.max(1, (degrees.get(edge.from) ?? 1) * (degrees.get(edge.to) ?? 1));
  return Math.max(P.springs.supports.degreeFloor, 1 / Math.sqrt(product));
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

function addForce(forceX, forceY, id, x, y) {
  forceX.set(id, forceX.get(id) + x);
  forceY.set(id, forceY.get(id) + y);
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
        const overlapX = (a.width + b.width) / 2 + P.labels.collisionPadding - Math.abs(ac.x - bc.x);
        const overlapY = (a.height + b.height) / 2 + P.labels.collisionPadding - Math.abs(ac.y - bc.y);
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
        let bestScore = stressScore(graph, Object.fromEntries(positions), anchors, anchorStrength);
        for (const [dx, dy] of directions) {
          point.x = start.x + dx * step * (0.55 + 0.45 * mobility.get(node.id));
          point.y = start.y + dy * step * (0.55 + 0.45 * mobility.get(node.id));
          clampPoint(point, width, height);
          const candidate = stressScore(graph, Object.fromEntries(positions), anchors, anchorStrength);
          if (candidate + 0.001 < bestScore) {
            bestScore = candidate;
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

function repairEdgeLabelIntersections(graph, nodes, positions, anchors, anchorStrength, width, height) {
  const edgeByKey = new Map(graph.edges.map((edge) => [edgeKey(edge), edge]));
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
          for (const step of P.solve.edgeLabelRepairSteps) {
            for (const direction of [-1, 1]) {
              point.x = origin.x + vector.x * step * direction;
              point.y = origin.y + vector.y * step * direction;
              clampPoint(point, width, height);
              const candidateObject = Object.fromEntries(positions);
              const geometry = collectGeometry(graph, candidateObject);
              if (geometry.overlaps > 0) continue;
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
  const ids = new Set(nodes.map((node) => node.id));
  const positions = clonePositions(previousPositions);
  for (const id of [...positions.keys()]) if (!ids.has(id)) positions.delete(id);
  const previousIds = new Set(Object.keys(previousPositions));
  const newIds = new Set(nodes.filter((node) => !previousIds.has(node.id)).map((node) => node.id));
  for (const node of nodes) {
    const footprint = nodeFootprint(node);
    if (!positions.has(node.id)) {
      positions.set(node.id, { ...seedPoint(node, positions, edges, width, height), ...footprint });
    } else {
      Object.assign(positions.get(node.id), footprint);
    }
    clampPoint(positions.get(node.id), width, height);
  }

  const currentEdgeKeys = new Set(edges.map(edgeKey));
  const sameGraph = previousGraph
    && allNodes(previousGraph).length === nodes.length
    && allNodes(previousGraph).every((node) => ids.has(node.id))
    && previousGraph.edges.length === edges.length
    && previousGraph.edges.every((edge) => currentEdgeKeys.has(edgeKey(edge)));
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
      mobility.set(node.id, P.stability.changedNodeMobility);
      anchorStrength.set(node.id, P.stability.changedAnchor);
    } else if (neighbours.has(node.id)) {
      mobility.set(node.id, P.stability.neighbourMobility);
      anchorStrength.set(node.id, P.stability.neighbourAnchor);
    } else {
      mobility.set(node.id, P.stability.remoteNodeMobility);
      anchorStrength.set(node.id, P.stability.remoteAnchor);
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
        const magnitude = P.spacing.repulsion / distanceSquared;
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
  }

  resolveCollisions(nodes, positions, mobility, width, height);
  refineCrossings(layoutGraph, nodes, positions, mobility, anchors, anchorStrength, width, height);
  resolveCollisions(nodes, positions, mobility, width, height);
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

export { CANVAS };
