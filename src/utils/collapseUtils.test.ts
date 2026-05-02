import { describe, expect, it } from 'vitest';
import type { Node } from '../store/useMindMapStore';
import { getHiddenNodeIds, nodeHasVisibleChildren } from './collapseUtils';

const makeNode = (id: string, parentId: string | null, children: string[], isCollapsed?: boolean): Node =>
  ({ id, text: id, x: 0, y: 0, parentId, children, isCollapsed });

describe('getHiddenNodeIds', () => {
  it('returns empty set when no nodes are collapsed', () => {
    const nodes: Record<string, Node> = {
      root: makeNode('root', null, ['child1']),
      child1: makeNode('child1', 'root', []),
    };
    expect(getHiddenNodeIds(nodes)).toEqual(new Set());
  });

  it('hides children of a collapsed node', () => {
    const nodes: Record<string, Node> = {
      root: makeNode('root', null, ['child1'], true),
      child1: makeNode('child1', 'root', []),
    };
    const hidden = getHiddenNodeIds(nodes);
    expect(hidden.has('child1')).toBe(true);
    expect(hidden.has('root')).toBe(false);
  });

  it('hides deeply nested children of a collapsed node', () => {
    const nodes: Record<string, Node> = {
      root: makeNode('root', null, ['child1'], true),
      child1: makeNode('child1', 'root', ['grandchild']),
      grandchild: makeNode('grandchild', 'child1', []),
    };
    const hidden = getHiddenNodeIds(nodes);
    expect(hidden.has('child1')).toBe(true);
    expect(hidden.has('grandchild')).toBe(true);
    expect(hidden.has('root')).toBe(false);
  });

  it('hides grandchildren through non-collapsed intermediate nodes', () => {
    const nodes: Record<string, Node> = {
      root: makeNode('root', null, ['child1']),
      child1: makeNode('child1', 'root', ['grandchild'], true),
      grandchild: makeNode('grandchild', 'child1', []),
    };
    const hidden = getHiddenNodeIds(nodes);
    expect(hidden.has('child1')).toBe(false);
    expect(hidden.has('grandchild')).toBe(true);
    expect(hidden.has('root')).toBe(false);
  });

  it('handles multiple collapsed branches independently', () => {
    const nodes: Record<string, Node> = {
      root: makeNode('root', null, ['a', 'b']),
      a: makeNode('a', 'root', ['a1', 'a2'], true),
      a1: makeNode('a1', 'a', []),
      a2: makeNode('a2', 'a', []),
      b: makeNode('b', 'root', ['b1']),
      b1: makeNode('b1', 'b', []),
    };
    const hidden = getHiddenNodeIds(nodes);
    expect(hidden.has('a1')).toBe(true);
    expect(hidden.has('a2')).toBe(true);
    expect(hidden.has('b1')).toBe(false);
  });

  it('returns empty set for empty nodes', () => {
    expect(getHiddenNodeIds({})).toEqual(new Set());
  });
});

describe('nodeHasVisibleChildren', () => {
  it('returns true for node with visible children', () => {
    const nodes: Record<string, Node> = {
      root: makeNode('root', null, ['child1']),
      child1: makeNode('child1', 'root', []),
    };
    expect(nodeHasVisibleChildren(nodes.root, nodes)).toBe(true);
  });

  it('returns false for node with no children', () => {
    const nodes: Record<string, Node> = {
      leaf: makeNode('leaf', 'root', []),
    };
    expect(nodeHasVisibleChildren(nodes.leaf, nodes)).toBe(false);
  });

  it('returns false for collapsed node', () => {
    const nodes: Record<string, Node> = {
      root: makeNode('root', null, ['child1'], true),
      child1: makeNode('child1', 'root', []),
    };
    expect(nodeHasVisibleChildren(nodes.root, nodes)).toBe(false);
  });
});
