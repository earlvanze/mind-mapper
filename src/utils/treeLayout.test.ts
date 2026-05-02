import { describe, it, expect } from 'vitest';
import { computeTreeLayout } from './treeLayout';
import { Node } from '../store/useMindMapStore';

function makeNode(id: string, children: string[] = []): Node {
  return { id, text: id, x: 0, y: 0, parentId: null, children };
}

function makeNodes(map: Record<string, string[]>): Record<string, Node> {
  const nodes: Record<string, Node> = {};
  for (const [id, children] of Object.entries(map)) {
    nodes[id] = makeNode(id, children);
  }
  for (const [id, children] of Object.entries(map)) {
    for (const c of children) {
      if (nodes[c]) nodes[c].parentId = id;
    }
  }
  return nodes;
}

describe('treeLayout', () => {
  it('positions root at (0,0)', () => {
    const nodes = makeNodes({ root: [] });
    const result = computeTreeLayout('root', nodes);
    expect(result.root).toEqual({ x: 0, y: 0 });
  });

  it('places child to the right of parent (greater x)', () => {
    const nodes = makeNodes({ root: ['a'], a: [] });
    const result = computeTreeLayout('root', nodes);
    expect(result.a.x).toBeGreaterThan(result.root.x);
  });

  it('places multiple children spread horizontally with equal y', () => {
    const nodes = makeNodes({ root: ['a', 'b', 'c'], a: [], b: [], c: [] });
    const result = computeTreeLayout('root', nodes);
    // All children at same depth → same y
    expect(result.a.y).toBe(result.b.y);
    expect(result.b.y).toBe(result.c.y);
    // Spread horizontally — xs span a range wider than a single node
    const childXs = [result.a.x, result.b.x, result.c.x];
    expect(Math.max(...childXs)).toBeGreaterThan(Math.min(...childXs));
  });

  it('places grandchildren on next depth level (greater y)', () => {
    const nodes = makeNodes({ root: ['a'], a: ['b'], b: [] });
    const result = computeTreeLayout('root', nodes);
    expect(result.b.y).toBeGreaterThan(result.a.y);
    expect(result.a.y).toBeGreaterThan(result.root.y);
  });

  it('produces valid positions for every node', () => {
    const nodes = makeNodes({
      root: ['a', 'b'],
      a: ['c', 'd'],
      b: ['e'],
      c: [], d: [], e: []
    });
    const result = computeTreeLayout('root', nodes);
    for (const id of Object.keys(nodes)) {
      expect(result[id]).toBeDefined();
      expect(typeof result[id].x).toBe('number');
      expect(typeof result[id].y).toBe('number');
    }
  });

  it('returns empty object for non-existent root', () => {
    const nodes = makeNodes({ root: [] });
    expect(computeTreeLayout('nonexistent', nodes)).toEqual({});
  });

  it('handles deep chains (depth-first)', () => {
    const nodes = makeNodes({
      root: ['a'],
      a: ['b'],
      b: ['c'],
      c: ['d'],
      d: []
    });
    const result = computeTreeLayout('root', nodes);
    expect(result.d.y).toBeGreaterThan(result.c.y);
    expect(result.c.y).toBeGreaterThan(result.b.y);
    expect(result.b.y).toBeGreaterThan(result.a.y);
    expect(result.a.y).toBeGreaterThan(result.root.y);
  });

  it('subtrees do not overlap (all nodes have valid positions)', () => {
    const nodes = makeNodes({
      root: ['a', 'b', 'c'],
      a: ['a1', 'a2'],
      b: ['b1'],
      c: ['c1', 'c2', 'c3'],
      a1: [], a2: [], b1: [], c1: [], c2: [], c3: []
    });
    const result = computeTreeLayout('root', nodes);
    // Every node gets a position
    expect(Object.keys(result).sort()).toEqual(Object.keys(nodes).sort());
    // Depth-1 children same y, depth-2 children greater y
    const depth1 = [result.a, result.b, result.c];
    const depth2 = [result.a1, result.a2, result.b1, result.c1, result.c2, result.c3];
    expect(depth1.every(p => p.y === depth1[0].y)).toBe(true);
    expect(depth2.every(p => p.y > depth1[0].y)).toBe(true);
  });
});
