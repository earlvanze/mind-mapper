import { Node } from '../store/useMindMapStore';

// ---------------------------------------------------------------------------
// Layout algorithms for mind maps
// ---------------------------------------------------------------------------

export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 36;
export const H_GAP = 80;        // horizontal gap between parent right and child left
export const V_GAP = 60;        // vertical gap between depth levels
export const MIN_SIBLING_GAP = 24;

export type LayoutMode = 'tree' | 'radial' | 'force';

interface LayoutNode {
  id: string;
  children: string[];
}

type LayoutState = Map<string, { x: number; y: number; width: number; height: number }>;

// ---------------------------------------------------------------------------
// Tree layout — Reingold-Tilford compact tree
// Depth on Y axis, sibling spread on X axis
// ---------------------------------------------------------------------------

function subtreeBounds(nodeId: string, state: LayoutState, children: Record<string, LayoutNode>) {
  const r = state.get(nodeId)!;
  const ch = children[nodeId]?.children ?? [];
  if (ch.length === 0) return { left: r.x, right: r.x + r.width, width: r.width };
  let leftMost = Infinity, rightMost = -Infinity;
  for (const c of ch) {
    const b = subtreeBounds(c, state, children);
    leftMost = Math.min(leftMost, b.left);
    rightMost = Math.max(rightMost, b.right);
  }
  return { left: leftMost, right: rightMost, width: rightMost - leftMost };
}

function shiftTree(nodeId: string, offset: number, state: LayoutState, children: Record<string, LayoutNode>): void {
  const rec = state.get(nodeId);
  if (!rec) return;
  state.set(nodeId, { ...rec, x: rec.x + offset });
  for (const c of children[nodeId]?.children ?? []) shiftTree(c, offset, state, children);
}

function firstWalk(nodeId: string, state: LayoutState, children: Record<string, LayoutNode>): void {
  const ch = children[nodeId]?.children ?? [];
  if (ch.length === 0) { state.set(nodeId, { x: 0, y: 0, width: NODE_WIDTH, height: NODE_HEIGHT }); return; }
  for (const c of ch) firstWalk(c, state, children);
  const positions = ch.map(c => ({ id: c, bounds: subtreeBounds(c, state, children) }));
  let curRight = positions[0].bounds.right;
  for (let i = 1; i < positions.length; i++) {
    const { id, bounds } = positions[i];
    const neededGap = curRight + MIN_SIBLING_GAP - bounds.left;
    if (neededGap > 0) shiftTree(id, neededGap, state, children);
    curRight = subtreeBounds(id, state, children).right;
  }
  const childrenLeft = subtreeBounds(ch[0], state, children).left;
  const groupOffset = NODE_WIDTH + H_GAP - childrenLeft;
  if (groupOffset !== 0) shiftTree(ch[0], groupOffset, state, children);
  const firstBounds = subtreeBounds(ch[0], state, children);
  state.set(nodeId, { x: firstBounds.left - NODE_WIDTH - H_GAP, y: 0, width: NODE_WIDTH, height: NODE_HEIGHT });
}

function secondWalk(
  nodeId: string, depth: number, state: LayoutState,
  children: Record<string, LayoutNode>, results: Record<string, { x: number; y: number }>,
): void {
  const r = state.get(nodeId)!;
  results[nodeId] = { x: r.x, y: depth * (NODE_HEIGHT + V_GAP) };
  for (const c of children[nodeId]?.children ?? []) secondWalk(c, depth + 1, state, children, results);
}

export function computeTreeLayout(
  rootId: string, nodes: Record<string, Node>,
): Record<string, { x: number; y: number }> {
  const children: Record<string, LayoutNode> = {};
  for (const [id, node] of Object.entries(nodes)) children[id] = { id, children: [...node.children] };
  if (!children[rootId]) return {};
  const state: LayoutState = new Map();
  firstWalk(rootId, state, children);
  const results: Record<string, { x: number; y: number }> = {};
  secondWalk(rootId, 0, state, children, results);
  return results;
}

// ---------------------------------------------------------------------------
// Radial layout — descendants spread in concentric circles
// Root at centre, depth = radius
// ---------------------------------------------------------------------------

const RADIAL_RADIUS = 180;   // pixels between depth levels
const RADIAL_GAP = 16;       // arc gap between siblings

function computeRadialLayout(
  rootId: string, nodes: Record<string, Node>,
): Record<string, { x: number; y: number }> {
  const children: Record<string, string[]> = {};
  for (const [id, node] of Object.entries(nodes)) children[id] = [...node.children];

  const results: Record<string, { x: number; y: number }> = {};
  if (!children[rootId]) return results;

  // BFS to assign (angleRange, depth) to each node
  interface RadialInfo { angleStart: number; angleEnd: number; depth: number; radius: number }
  const info: Record<string, RadialInfo> = {};

  // Root gets full circle
  info[rootId] = { angleStart: 0, angleEnd: 2 * Math.PI, depth: 0, radius: 0 };

  const queue: string[] = [rootId];
  while (queue.length) {
    const parentId = queue.shift()!;
    const pinfo = info[parentId];
    if (!pinfo) continue;
    const ch = children[parentId] ?? [];
    if (!ch.length) continue;
    const totalAngle = pinfo.angleEnd - pinfo.angleStart;
    const perChild = totalAngle / ch.length;
    ch.forEach((childId, i) => {
      const angleStart = pinfo.angleStart + i * perChild + RADIAL_GAP / pinfo.radius;
      const angleEnd = pinfo.angleStart + (i + 1) * perChild - RADIAL_GAP / pinfo.radius;
      const depth = pinfo.depth + 1;
      info[childId] = {
        angleStart, angleEnd, depth,
        radius: depth * RADIAL_RADIUS,
      };
      queue.push(childId);
    });
  }

  for (const [id, inf] of Object.entries(info)) {
    const midAngle = (inf.angleStart + inf.angleEnd) / 2;
    results[id] = {
      x: Math.cos(midAngle) * inf.radius,
      y: Math.sin(midAngle) * inf.radius,
    };
  }
  return results;
}


// ---------------------------------------------------------------------------
// Force-directed layout — Fruchterman-Reingold variant
// ---------------------------------------------------------------------------

const FORCE_ITERS      = 60;
const FORCE_TEMP_INIT  = 200.0;
const FORCE_TEMP_FINAL = 1.0;
const REPULSION        = 8000.0;
const SPRING_LENGTH   = 200.0;
const SPRING_K         = 0.05;
const DAMPING          = 0.85;

interface FPos { x: number; y: number; vx: number; vy: number }

function computeForceLayout(
  rootId: string, nodes: Record<string, Node>,
): Record<string, { x: number; y: number }> {
  const ids = Object.keys(nodes);
  if (ids.length === 0) return {};

  // adjacency
  const children: Record<string, string[]> = {};
  for (const [id, node] of Object.entries(nodes)) children[id] = [...node.children];
  const edges: [string, string][] = [];
  for (const [parent, ch] of Object.entries(children)) ch.forEach(c => edges.push([parent, c]));

  // initialise positions — random ring
  const pos: Record<string, FPos> = {};
  let seed = ids.length * 7 + 13;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };
  for (const id of ids) {
    const angle = rng() * 2 * Math.PI;
    const r = 80 + rng() * 120;
    pos[id] = { x: Math.cos(angle) * r, y: Math.sin(angle) * r, vx: 0, vy: 0 };
  }

  // centre at origin
  const vals = Object.values(pos);
  const cx = vals.reduce((s, p) => s + p.x, 0) / vals.length;
  const cy = vals.reduce((s, p) => s + p.y, 0) / vals.length;
  for (const p of vals) { p.x -= cx; p.y -= cy; }

  const tempStep = (FORCE_TEMP_INIT - FORCE_TEMP_FINAL) / FORCE_ITERS;
  let temp = FORCE_TEMP_INIT;

  for (let iter = 0; iter < FORCE_ITERS; iter++) {
    // repulsive
    for (const a of ids) {
      let fx = 0, fy = 0;
      for (const b of ids) {
        if (a === b) continue;
        const dx = pos[a].x - pos[b].x;
        const dy = pos[a].y - pos[b].y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const f = REPULSION / (dist * dist);
        fx += (dx / dist) * f;
        fy += (dy / dist) * f;
      }
      pos[a].vx += fx; pos[a].vy += fy;
    }
    // attractive
    for (const [a, b] of edges) {
      const dx = pos[b].x - pos[a].x;
      const dy = pos[b].y - pos[a].y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const f = SPRING_K * (dist - SPRING_LENGTH);
      const fx = (dx / dist) * f, fy = (dy / dist) * f;
      pos[a].vx += fx; pos[a].vy += fy;
      pos[b].vx -= fx; pos[b].vy -= fy;
    }
    // gravity
    for (const p of Object.values(pos)) {
      p.vx -= p.x * 0.005; p.vy -= p.y * 0.005;
    }
    // move + damp
    for (const p of Object.values(pos)) {
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > temp) { p.vx = (p.vx / speed) * temp; p.vy = (p.vy / speed) * temp; }
      p.x += p.vx; p.y += p.vy;
      p.vx *= DAMPING; p.vy *= DAMPING;
    }
    temp -= tempStep;
  }

  return Object.fromEntries(Object.entries(pos).map(([id, p]) => [id, { x: p.x, y: p.y }]));
}

// ---------------------------------------------------------------------------
// Normalise positions so bounding box centres at (0, 0)
// ---------------------------------------------------------------------------

function normalise(positions: Record<string, { x: number; y: number }>) {
  const vals = Object.values(positions);
  if (!vals.length) return positions;
  const xs = vals.map(p => p.x), ys = vals.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const out: Record<string, { x: number; y: number }> = {};
  for (const [id, p] of Object.entries(positions)) {
    out[id] = { x: p.x - cx, y: p.y - cy };
  }
  return out;
}

/** Compute layout positions for the subtree rooted at rootId.
 *  mode 'tree'   — Reingold-Tilford horizontal tree
 *  mode 'radial' — concentric circles (root at centre) */
export function computeLayout(
  rootId: string, nodes: Record<string, Node>, mode: LayoutMode,
): Record<string, { x: number; y: number }> {
  const raw = mode === 'force'
    ? computeForceLayout(rootId, nodes)
    : mode === 'radial'
      ? computeRadialLayout(rootId, nodes)
      : computeTreeLayout(rootId, nodes);
  return normalise(raw);
}
