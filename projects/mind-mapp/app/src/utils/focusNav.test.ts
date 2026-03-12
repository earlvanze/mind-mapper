import { describe, expect, it } from 'vitest';
import type { Node } from '../store/useMindMapStore';
import { getCycledLeafId, getFirstChildId, getFirstLeafId, getLastLeafId, getLeafIdsInSubtree, getParentFocusId, getWrappedSiblingId } from './focusNav';

const nodes: Record<string, Node> = {
  n_root: { id: 'n_root', text: 'Root', x: 0, y: 0, parentId: null, children: ['a', 'b', 'c'] },
  a: { id: 'a', text: 'A', x: 0, y: 0, parentId: 'n_root', children: ['a1'] },
  a1: { id: 'a1', text: 'A1', x: 0, y: 0, parentId: 'a', children: [] },
  b: { id: 'b', text: 'B', x: 0, y: 0, parentId: 'n_root', children: [] },
  c: { id: 'c', text: 'C', x: 0, y: 0, parentId: 'n_root', children: [] },
};

describe('getParentFocusId', () => {
  it('returns parent id when parent exists', () => {
    expect(getParentFocusId(nodes, 'a1')).toBe('a');
  });

  it('returns null for root or missing node', () => {
    expect(getParentFocusId(nodes, 'n_root')).toBeNull();
    expect(getParentFocusId(nodes, 'missing')).toBeNull();
  });
});

describe('getFirstChildId', () => {
  it('returns first existing child id', () => {
    expect(getFirstChildId(nodes, 'n_root')).toBe('a');
  });

  it('skips missing children and returns null if none exist', () => {
    const sparse: Record<string, Node> = {
      ...nodes,
      n_root: { ...nodes.n_root, children: ['missing', 'b'] },
    };
    expect(getFirstChildId(sparse, 'n_root')).toBe('b');
    expect(getFirstChildId(nodes, 'b')).toBeNull();
  });
});

describe('getWrappedSiblingId', () => {
  it('wraps to last sibling when moving left from first', () => {
    expect(getWrappedSiblingId(nodes, 'a', -1)).toBe('c');
  });

  it('wraps to first sibling when moving right from last', () => {
    expect(getWrappedSiblingId(nodes, 'c', 1)).toBe('a');
  });

  it('returns null when no parent/siblings context exists', () => {
    expect(getWrappedSiblingId(nodes, 'n_root', 1)).toBeNull();
  });

  it('returns null for single-sibling branch', () => {
    expect(getWrappedSiblingId(nodes, 'a1', 1)).toBeNull();
  });
});

describe('getFirstLeafId', () => {
  it('returns first leaf in focused subtree (depth-first)', () => {
    expect(getFirstLeafId(nodes, 'n_root')).toBe('a1');
  });

  it('returns root when root is already a leaf', () => {
    expect(getFirstLeafId(nodes, 'b')).toBe('b');
  });

  it('returns null when no leaf is reachable (cycle guard)', () => {
    const cyclic: Record<string, Node> = {
      x: { id: 'x', text: 'X', x: 0, y: 0, parentId: null, children: ['y'] },
      y: { id: 'y', text: 'Y', x: 0, y: 0, parentId: 'x', children: ['x'] },
    };
    expect(getFirstLeafId(cyclic, 'x')).toBeNull();
  });
});

describe('getLastLeafId', () => {
  it('returns last leaf in focused subtree (depth-first)', () => {
    expect(getLastLeafId(nodes, 'n_root')).toBe('c');
  });

  it('returns root when root is already a leaf', () => {
    expect(getLastLeafId(nodes, 'b')).toBe('b');
  });

  it('returns null when no leaf is reachable (cycle guard)', () => {
    const cyclic: Record<string, Node> = {
      x: { id: 'x', text: 'X', x: 0, y: 0, parentId: null, children: ['y'] },
      y: { id: 'y', text: 'Y', x: 0, y: 0, parentId: 'x', children: ['x'] },
    };
    expect(getLastLeafId(cyclic, 'x')).toBeNull();
  });
});

describe('getLeafIdsInSubtree', () => {
  it('returns leaves in depth-first order', () => {
    expect(getLeafIdsInSubtree(nodes, 'n_root')).toEqual(['a1', 'b', 'c']);
  });

  it('returns empty list for missing root', () => {
    expect(getLeafIdsInSubtree(nodes, 'missing')).toEqual([]);
  });
});

describe('getCycledLeafId', () => {
  it('moves to next/prev leaf and wraps', () => {
    expect(getCycledLeafId(nodes, 'n_root', 'a1', 1)).toBe('b');
    expect(getCycledLeafId(nodes, 'n_root', 'c', 1)).toBe('a1');
    expect(getCycledLeafId(nodes, 'n_root', 'a1', -1)).toBe('c');
  });

  it('falls back to first/last leaf when current focus is not a leaf', () => {
    expect(getCycledLeafId(nodes, 'n_root', 'a', 1)).toBe('a1');
    expect(getCycledLeafId(nodes, 'n_root', 'a', -1)).toBe('c');
  });

  it('returns null when subtree has fewer than two leaves and current is already that leaf', () => {
    expect(getCycledLeafId(nodes, 'b', 'b', 1)).toBeNull();
  });
});
