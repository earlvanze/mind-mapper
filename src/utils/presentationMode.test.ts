import { describe, it, expect } from 'vitest';
import { getPresentationOrder, getRootId, getNodePreviews, getPresentationProgress } from './presentationMode';
import type { Node } from '../store/useMindMapStore';

const makeNode = (id: string, parentId: string | null, children: string[], text = id): Node =>
  ({ id, parentId, children, text, x: 0, y: 0, createdAt: Date.now() });

describe('getPresentationOrder', () => {
  it('returns single node when no children', () => {
    const nodes: Record<string, Node> = {
      root: makeNode('root', null, []),
    };
    expect(getPresentationOrder(nodes, 'root')).toEqual([nodes.root]);
  });

  it('returns nodes in BFS order', () => {
    const nodes: Record<string, Node> = {
      root: makeNode('root', null, ['a', 'b']),
      a: makeNode('a', 'root', ['a1', 'a2']),
      b: makeNode('b', 'root', ['b1']),
      a1: makeNode('a1', 'a', []),
      a2: makeNode('a2', 'a', []),
      b1: makeNode('b1', 'b', []),
    };
    const order = getPresentationOrder(nodes, 'root');
    expect(order.map(n => n.id)).toEqual(['root', 'a', 'b', 'a1', 'a2', 'b1']);
  });

  it('skips missing nodes', () => {
    const nodes: Record<string, Node> = {
      root: makeNode('root', null, ['a', 'missing', 'b']),
      a: makeNode('a', 'root', []),
      b: makeNode('b', 'root', []),
    };
    const order = getPresentationOrder(nodes, 'root');
    expect(order.map(n => n.id)).toEqual(['root', 'a', 'b']);
  });
});

describe('getRootId', () => {
  it('returns same id if root', () => {
    const nodes: Record<string, Node> = {
      root: makeNode('root', null, ['a']),
    };
    expect(getRootId(nodes, 'root')).toBe('root');
  });

  it('traverses up to root', () => {
    const nodes: Record<string, Node> = {
      root: makeNode('root', null, ['a']),
      a: makeNode('a', 'root', ['b']),
      b: makeNode('b', 'a', []),
    };
    expect(getRootId(nodes, 'b')).toBe('root');
    expect(getRootId(nodes, 'a')).toBe('root');
  });
});

describe('getNodePreviews', () => {
  it('returns empty array for leaf node', () => {
    const nodes: Record<string, Node> = {
      root: makeNode('root', null, []),
    };
    expect(getNodePreviews(nodes, 'root')).toEqual([]);
  });

  it('returns child nodes up to maxPreviews', () => {
    const nodes: Record<string, Node> = {
      root: makeNode('root', null, ['a', 'b', 'c', 'd', 'e', 'f', 'g']),
      a: makeNode('a', 'root', []),
      b: makeNode('b', 'root', []),
      c: makeNode('c', 'root', []),
      d: makeNode('d', 'root', []),
      e: makeNode('e', 'root', []),
      f: makeNode('f', 'root', []),
      g: makeNode('g', 'root', []),
    };
    const previews = getNodePreviews(nodes, 'root', 3);
    expect(previews.length).toBe(3);
    expect(previews.map(n => n.id)).toEqual(['a', 'b', 'c']);
  });

  it('returns all children when fewer than maxPreviews', () => {
    const nodes: Record<string, Node> = {
      root: makeNode('root', null, ['a', 'b']),
      a: makeNode('a', 'root', []),
      b: makeNode('b', 'root', []),
    };
    const previews = getNodePreviews(nodes, 'root', 6);
    expect(previews.length).toBe(2);
  });
});

describe('getPresentationProgress', () => {
  it('returns correct progress values', () => {
    expect(getPresentationProgress(0, 10)).toEqual({ current: 1, total: 10, percent: 10 });
    expect(getPresentationProgress(4, 10)).toEqual({ current: 5, total: 10, percent: 50 });
    expect(getPresentationProgress(9, 10)).toEqual({ current: 10, total: 10, percent: 100 });
  });

  it('handles empty presentation', () => {
    expect(getPresentationProgress(0, 0)).toEqual({ current: 1, total: 0, percent: 0 });
  });
});
