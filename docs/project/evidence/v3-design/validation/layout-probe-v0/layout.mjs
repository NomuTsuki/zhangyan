/* Pure layout functions shared by build.mjs and check.mjs. */

export const CANVAS = { width: 1400, height: 920 };

/*
 * Experimental defaults for this validation probe only. They are deliberately
 * not product parameters. `supports` remains visible but contributes only a
 * degree-normalised trace of attraction, so a conclusion fan cannot collapse
 * otherwise independent evidence islands into one ball.
 */
export const LOGIC_EDGE_PHYSICS = Object.freeze({
  latent: Object.freeze({ ideal: 112, strength: 0.086, structural: true }),
  caught: Object.freeze({ ideal: 150, strength: 0.050, structural: true }),
  prereq: Object.freeze({ ideal: 166, strength: 0.038, structural: true }),
  supports: Object.freeze({ ideal: 250, strength: 0.010, structural: false, normaliseTargetDegree: true }),
});

const STRUCTURAL_KINDS = new Set(
  Object.entries(LOGIC_EDGE_PHYSICS)
    .filter(([, config]) => config.structural)
    .map(([kind]) => kind),
);

function allNodes(graph) {
  return [...graph.nodes, ...graph.findings, ...graph.axioms];
}

function clonePositionMap(input = {}) {
  return new Map(Object.entries(input).map(([id, value]) => [id, { ...value }]));
}

/*
 * A literal port of the workbench-map-v0 point-force primitive. It is here as
 * a comparison baseline, not as a recommended algorithm.
 */
export function forceLayoutStep(
  graph,
  previousPositions = {},
  previousPinned = [],
  { width = CANVAS.width, height = CANVAS.height, iters = 260 } = {},
) {
  const nodes = allNodes(graph);
  const ids = new Set(nodes.map((node) => node.id));
  const positions = clonePositionMap(previousPositions);
  const pinned = new Set(previousPinned);
  for (const id of [...positions.keys()]) if (!ids.has(id)) positions.delete(id);

  let seed = nodes.length * 7919;
  const random = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (const node of nodes) {
    if (!positions.has(node.id)) {
      positions.set(node.id, {
        x: width / 2 + (random() - 0.5) * 140,
        y: height / 2 + (random() - 0.5) * 140,
      });
    }
  }

  const edges = graph.edges.filter((edge) => positions.has(edge.from) && positions.has(edge.to));
  const ideal = Math.max(
    96,
    Math.min(190, Math.sqrt(((width - 150) * (height - 110)) / Math.max(3, nodes.length)) * 0.82),
  );
  const repulsion = ideal * ideal * 2.6;

  for (let iteration = 0; iteration < iters; iteration += 1) {
    const temperature = 1 - iteration / iters;
    const forceX = new Map(nodes.map((node) => [node.id, 0]));
    const forceY = new Map(nodes.map((node) => [node.id, 0]));

    for (let left = 0; left < nodes.length; left += 1) {
      for (let right = left + 1; right < nodes.length; right += 1) {
        const a = positions.get(nodes[left].id);
        const b = positions.get(nodes[right].id);
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < 1) {
          dx = random() - 0.5;
          dy = random() - 0.5;
          distanceSquared = 1;
        }
        const magnitude = repulsion / distanceSquared;
        const distance = Math.sqrt(distanceSquared);
        const x = (dx / distance) * magnitude;
        const y = (dy / distance) * magnitude;
        forceX.set(nodes[left].id, forceX.get(nodes[left].id) + x);
        forceY.set(nodes[left].id, forceY.get(nodes[left].id) + y);
        forceX.set(nodes[right].id, forceX.get(nodes[right].id) - x);
        forceY.set(nodes[right].id, forceY.get(nodes[right].id) - y);
      }
    }

    for (const edge of edges) {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy) || 1;
      const magnitude = (distance - ideal) * 0.055;
      forceX.set(edge.from, forceX.get(edge.from) + (dx / distance) * magnitude);
      forceY.set(edge.from, forceY.get(edge.from) + (dy / distance) * magnitude);
      forceX.set(edge.to, forceX.get(edge.to) - (dx / distance) * magnitude);
      forceY.set(edge.to, forceY.get(edge.to) - (dy / distance) * magnitude);
    }

    for (const node of nodes) {
      if (pinned.has(node.id)) continue;
      const point = positions.get(node.id);
      point.x += Math.max(-20, Math.min(20, forceX.get(node.id))) * temperature;
      point.y += Math.max(-20, Math.min(20, forceY.get(node.id))) * temperature;
      point.x += (width / 2 - point.x) * 0.0022;
      point.y += (height / 2 - point.y) * 0.0022;
      point.x = Math.max(84, Math.min(width - 84, point.x));
      point.y = Math.max(44, Math.min(height - 52, point.y));
    }
  }

  for (const axiom of graph.axioms) pinned.add(axiom.id);
  return {
    positions: Object.fromEntries([...positions].map(([id, point]) => [id, point])),
    pinned: [...pinned],
  };
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
    width += character.codePointAt(0) > 255 ? 11.6 : 6.4;
  }
  return width;
}

export function wrapLabel(node) {
  const limit = node.type === "obs" ? 12 : node.type === "finding" ? 15 : 18;
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
  const labelY = -18 - (labelLines.length - 1) * 14;
  const top = labelY - 11;
  const bottom = node.type === "finding" ? 13 : 12;
  const width = Math.max(node.type === "axiom" ? 30 : 28, labelWidth + 14);
  const height = bottom - top + 10;
  return {
    width,
    height,
    boxOffsetX: 0,
    boxOffsetY: (top + bottom) / 2,
    labelLines,
    labelY,
  };
}

function collisionCenter(rectangle) {
  return {
    x: rectangle.x + (rectangle.boxOffsetX ?? 0),
    y: rectangle.y + (rectangle.boxOffsetY ?? 0),
  };
}

export function rectanglesOverlap(a, b, padding = 4) {
  const ac = collisionCenter(a);
  const bc = collisionCenter(b);
  return !(
    ac.x + a.width / 2 + padding <= bc.x - b.width / 2
    || bc.x + b.width / 2 + padding <= ac.x - a.width / 2
    || ac.y + a.height / 2 + padding <= bc.y - b.height / 2
    || bc.y + b.height / 2 + padding <= ac.y - a.height / 2
  );
}

function clampPoint(point, width, height, margin = 18) {
  const halfWidth = point.width / 2;
  const halfHeight = point.height / 2;
  point.x = Math.max(
    margin + halfWidth - (point.boxOffsetX ?? 0),
    Math.min(width - margin - halfWidth - (point.boxOffsetX ?? 0), point.x),
  );
  point.y = Math.max(
    margin + halfHeight - (point.boxOffsetY ?? 0),
    Math.min(height - margin - halfHeight - (point.boxOffsetY ?? 0), point.y),
  );
}

function edgeKey(edge) {
  return `${edge.kind}:${edge.from}>${edge.to}`;
}

function structuralAdjacency(graph, ids) {
  const adjacency = new Map([...ids].map((id) => [id, new Set()]));
  for (const edge of graph.edges) {
    if (!STRUCTURAL_KINDS.has(edge.kind) || !adjacency.has(edge.from) || !adjacency.has(edge.to)) continue;
    adjacency.get(edge.from).add(edge.to);
    adjacency.get(edge.to).add(edge.from);
  }
  return adjacency;
}

function structuralComponents(nodes, adjacency) {
  const seen = new Set();
  const components = [];
  for (const node of nodes) {
    if (seen.has(node.id)) continue;
    const members = [];
    const queue = [node.id];
    seen.add(node.id);
    while (queue.length) {
      const id = queue.shift();
      members.push(id);
      for (const neighbour of adjacency.get(id) ?? []) {
        if (seen.has(neighbour)) continue;
        seen.add(neighbour);
        queue.push(neighbour);
      }
    }
    members.sort();
    components.push({ id: members[0], members });
  }
  components.sort((a, b) => b.members.length - a.members.length || a.id.localeCompare(b.id));
  return components;
}

function seedPoint(node, positions, graph, width, height) {
  const structuralNeighbours = [];
  const supportNeighbours = [];
  for (const edge of graph.edges) {
    let otherId = null;
    if (edge.from === node.id) otherId = edge.to;
    if (edge.to === node.id) otherId = edge.from;
    if (!otherId || !positions.has(otherId)) continue;
    const target = STRUCTURAL_KINDS.has(edge.kind) ? structuralNeighbours : supportNeighbours;
    target.push(positions.get(otherId));
  }
  const neighbours = structuralNeighbours.length ? structuralNeighbours : supportNeighbours;
  const angle = hashAngle(node.id);
  if (neighbours.length) {
    const x = neighbours.reduce((sum, point) => sum + point.x, 0) / neighbours.length;
    const y = neighbours.reduce((sum, point) => sum + point.y, 0) / neighbours.length;
    const radius = structuralNeighbours.length ? 86 : 156;
    return { x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius };
  }
  const radius = 92 + (hash32(`${node.id}:radius`) % 230);
  return {
    x: width / 2 + Math.cos(angle) * radius,
    y: height / 2 + Math.sin(angle) * radius * 0.72,
  };
}

function addForce(forceX, forceY, id, x, y) {
  forceX.set(id, forceX.get(id) + x);
  forceY.set(id, forceY.get(id) + y);
}

function componentTarget(component, index, width, height) {
  if (index === 0) return { x: width / 2, y: height / 2 };
  const angle = hashAngle(`island:${component.id}`);
  return {
    x: width / 2 + Math.cos(angle) * Math.min(455, width * 0.325),
    y: height / 2 + Math.sin(angle) * Math.min(285, height * 0.31),
  };
}

function resolveCollisions(nodes, positions, mobility, width, height) {
  for (let pass = 0; pass < 180; pass += 1) {
    let collisionCount = 0;
    for (let left = 0; left < nodes.length; left += 1) {
      for (let right = left + 1; right < nodes.length; right += 1) {
        const aNode = nodes[left];
        const bNode = nodes[right];
        const a = positions.get(aNode.id);
        const b = positions.get(bNode.id);
        const ac = collisionCenter(a);
        const bc = collisionCenter(b);
        const overlapX = (a.width + b.width) / 2 + 7 - Math.abs(ac.x - bc.x);
        const overlapY = (a.height + b.height) / 2 + 7 - Math.abs(ac.y - bc.y);
        if (overlapX <= 0 || overlapY <= 0) continue;
        collisionCount += 1;
        const aWeight = Math.max(0.04, mobility.get(aNode.id));
        const bWeight = Math.max(0.04, mobility.get(bNode.id));
        const weightTotal = aWeight + bWeight;
        if (overlapX < overlapY) {
          const direction = ac.x <= bc.x ? -1 : 1;
          a.x += direction * overlapX * (aWeight / weightTotal);
          b.x -= direction * overlapX * (bWeight / weightTotal);
        } else {
          const direction = ac.y <= bc.y ? -1 : 1;
          a.y += direction * overlapY * (aWeight / weightTotal);
          b.y -= direction * overlapY * (bWeight / weightTotal);
        }
        clampPoint(a, width, height);
        clampPoint(b, width, height);
      }
    }
    if (!collisionCount) break;
  }
}

/*
 * Incremental constrained force layout.
 *
 * - structure-bearing relations form islands and use strong local springs;
 * - supports is kept as an edge but is degree-normalised to a very weak spring;
 * - labels, rather than point glyphs alone, participate in collision handling;
 * - old nodes are pulled towards their previous coordinates with soft anchors;
 * - new nodes and the structural two-hop neighbourhood of a changed relation
 *   retain much more mobility; no observation is hard-pinned by age;
 * - an existing axiom receives the strongest soft anchor, but can still move.
 */
export function logicIslandLayoutStep(
  graph,
  previousPositions = {},
  previousGraph = null,
  { width = CANVAS.width, height = CANVAS.height, iters = 320 } = {},
) {
  const nodes = allNodes(graph).slice().sort((a, b) => a.id.localeCompare(b.id));
  const edges = graph.edges.slice().sort((a, b) => edgeKey(a).localeCompare(edgeKey(b)));
  const layoutGraph = { ...graph, edges };
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const ids = new Set(nodeById.keys());
  const positions = clonePositionMap(previousPositions);
  for (const id of [...positions.keys()]) if (!ids.has(id)) positions.delete(id);

  const previousIds = new Set(Object.keys(previousPositions));
  const newIds = new Set(nodes.filter((node) => !previousIds.has(node.id)).map((node) => node.id));
  for (const node of nodes) {
    const footprint = nodeFootprint(node);
    if (!positions.has(node.id)) positions.set(node.id, { ...seedPoint(node, positions, layoutGraph, width, height), ...footprint });
    else Object.assign(positions.get(node.id), footprint);
    clampPoint(positions.get(node.id), width, height);
  }

  const previousEdges = new Set((previousGraph?.edges ?? []).map(edgeKey));
  const currentEdges = new Set(edges.map(edgeKey));
  const adjacency = structuralAdjacency(layoutGraph, ids);
  const components = structuralComponents(nodes, adjacency);
  const componentById = new Map();
  for (const component of components) for (const id of component.members) componentById.set(id, component.id);
  const sameNodeSet = previousGraph
    && allNodes(previousGraph).length === nodes.length
    && allNodes(previousGraph).every((node) => ids.has(node.id));
  const sameEdgeSet = previousGraph
    && previousEdges.size === currentEdges.size
    && [...currentEdges].every((key) => previousEdges.has(key));
  if (sameNodeSet && sameEdgeSet) {
    const output = {};
    for (const node of nodes) {
      const point = positions.get(node.id);
      output[node.id] = { ...point, x: Number(point.x.toFixed(2)), y: Number(point.y.toFixed(2)), role: node.type };
    }
    return {
      positions: output,
      islands: components.map((component) => ({ ...component })),
      newNodeIds: [],
      affectedNodeIds: [],
      softAnchoredNodeIds: [...ids].sort(),
    };
  }
  for (const [componentIndex, component] of components.entries()) {
    if (!component.members.every((id) => newIds.has(id))) continue;
    const centroid = component.members.reduce(
      (total, id) => ({ x: total.x + positions.get(id).x, y: total.y + positions.get(id).y }),
      { x: 0, y: 0 },
    );
    centroid.x /= component.members.length;
    centroid.y /= component.members.length;
    const target = componentTarget(component, componentIndex, width, height);
    for (const id of component.members) {
      const point = positions.get(id);
      point.x += target.x - centroid.x;
      point.y += target.y - centroid.y;
      clampPoint(point, width, height);
    }
  }
  const structuralChanged = new Set(newIds);
  const supportChanged = new Set();
  for (const edge of edges) {
    if (previousEdges.has(edgeKey(edge))) continue;
    const target = STRUCTURAL_KINDS.has(edge.kind) ? structuralChanged : supportChanged;
    target.add(edge.from);
    target.add(edge.to);
  }
  for (const edge of previousGraph?.edges ?? []) {
    if (currentEdges.has(edgeKey(edge))) continue;
    const target = STRUCTURAL_KINDS.has(edge.kind) ? structuralChanged : supportChanged;
    target.add(edge.from);
    target.add(edge.to);
  }

  const affected = new Set(structuralChanged);
  let frontier = new Set(structuralChanged);
  for (let depth = 0; depth < 2; depth += 1) {
    const next = new Set();
    for (const id of frontier) {
      for (const neighbour of adjacency.get(id) ?? []) {
        if (affected.has(neighbour)) continue;
        affected.add(neighbour);
        next.add(neighbour);
      }
    }
    frontier = next;
  }

  const mobility = new Map();
  const anchorStrength = new Map();
  for (const node of nodes) {
    if (newIds.has(node.id)) {
      mobility.set(node.id, 1);
      anchorStrength.set(node.id, 0);
    } else if (node.type === "axiom") {
      mobility.set(node.id, 0.012);
      anchorStrength.set(node.id, 0.50);
    } else if (structuralChanged.has(node.id)) {
      mobility.set(node.id, 0.52);
      anchorStrength.set(node.id, 0.025);
    } else if (affected.has(node.id)) {
      mobility.set(node.id, 0.28);
      anchorStrength.set(node.id, 0.045);
    } else if (supportChanged.has(node.id)) {
      mobility.set(node.id, 0.13);
      anchorStrength.set(node.id, 0.080);
    } else {
      mobility.set(node.id, 0.050);
      anchorStrength.set(node.id, 0.120);
    }
  }

  const anchors = new Map(
    nodes
      .filter((node) => previousIds.has(node.id))
      .map((node) => [node.id, { x: previousPositions[node.id].x, y: previousPositions[node.id].y }]),
  );
  const supportDegree = new Map();
  for (const edge of edges) {
    if (edge.kind !== "supports") continue;
    supportDegree.set(edge.to, (supportDegree.get(edge.to) ?? 0) + 1);
  }
  const densityScale = 1.28;
  const repulsion = 36000;

  for (let iteration = 0; iteration < iters; iteration += 1) {
    const temperature = 0.08 + 0.92 * (1 - iteration / iters);
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
        const separateIslands = componentById.get(aNode.id) !== componentById.get(bNode.id);
        const magnitude = (repulsion * (separateIslands ? 1.65 : 1)) / distanceSquared;
        addForce(forceX, forceY, aNode.id, (dx / distance) * magnitude, (dy / distance) * magnitude);
        addForce(forceX, forceY, bNode.id, -(dx / distance) * magnitude, -(dy / distance) * magnitude);

        const overlapX = (a.width + b.width) / 2 + 8 - Math.abs(dx);
        const overlapY = (a.height + b.height) / 2 + 8 - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          if (overlapX < overlapY) {
            const direction = dx <= 0 ? -1 : 1;
            const push = (overlapX + 5) * 0.32;
            addForce(forceX, forceY, aNode.id, direction * push, 0);
            addForce(forceX, forceY, bNode.id, -direction * push, 0);
          } else {
            const direction = dy <= 0 ? -1 : 1;
            const push = (overlapY + 5) * 0.32;
            addForce(forceX, forceY, aNode.id, 0, direction * push);
            addForce(forceX, forceY, bNode.id, 0, -direction * push);
          }
        }
      }
    }

    for (const edge of edges) {
      const config = LOGIC_EDGE_PHYSICS[edge.kind];
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      if (!config || !from || !to) continue;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy) || 1;
      const normaliser = config.normaliseTargetDegree ? Math.max(1, supportDegree.get(edge.to) ?? 1) : 1;
      const ideal = config.ideal * densityScale;
      const magnitude = (distance - ideal) * (config.strength / normaliser);
      addForce(forceX, forceY, edge.from, (dx / distance) * magnitude, (dy / distance) * magnitude);
      addForce(forceX, forceY, edge.to, -(dx / distance) * magnitude, -(dy / distance) * magnitude);
    }

    for (const [componentIndex, component] of components.entries()) {
      const centroid = component.members.reduce(
        (total, id) => ({ x: total.x + positions.get(id).x, y: total.y + positions.get(id).y }),
        { x: 0, y: 0 },
      );
      centroid.x /= component.members.length;
      centroid.y /= component.members.length;
      const target = componentTarget(component, componentIndex, width, height);
      const packingStrength = componentIndex === 0 ? 0.008 : 0.003;
      for (const id of component.members) {
        const point = positions.get(id);
        if (component.members.length > 1) {
          addForce(forceX, forceY, id, (centroid.x - point.x) * 0.0022, (centroid.y - point.y) * 0.0022);
        }
        addForce(
          forceX,
          forceY,
          id,
          (target.x - centroid.x) * packingStrength,
          (target.y - centroid.y) * packingStrength,
        );
      }
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
      addForce(forceX, forceY, node.id, (width / 2 - point.x) * 0.00065, (height / 2 - point.y) * 0.00065);
      const maxStep = newIds.has(node.id) ? 19 : 13;
      point.x += Math.max(-maxStep, Math.min(maxStep, forceX.get(node.id))) * temperature * mobility.get(node.id);
      point.y += Math.max(-maxStep, Math.min(maxStep, forceY.get(node.id))) * temperature * mobility.get(node.id);
      clampPoint(point, width, height);
    }
  }

  for (const node of nodes) {
    if (node.type !== "axiom") continue;
    const anchor = anchors.get(node.id);
    if (!anchor) continue;
    const point = positions.get(node.id);
    const dx = point.x - anchor.x;
    const dy = point.y - anchor.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 2.5) {
      point.x = anchor.x + (dx / distance) * 2.5;
      point.y = anchor.y + (dy / distance) * 2.5;
      clampPoint(point, width, height);
    }
  }
  resolveCollisions(nodes, positions, mobility, width, height);
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
  return {
    positions: output,
    islands: components.map((component) => ({ ...component })),
    newNodeIds: [...newIds].sort(),
    affectedNodeIds: [...affected].sort(),
    softAnchoredNodeIds: [...anchors.keys()].sort(),
  };
}
