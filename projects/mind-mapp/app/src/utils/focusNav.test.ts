import { describe, expect, it } from 'vitest';
import type { Node } from '../store/useMindMapStore';
import { getFirstLeafId, getWrappedSiblingId } from './focusNav';

const nodes: Record<string, Node> = {
  n_root: { id: 'n_root', text: 'Root', x: 0, y: 0, parentId: null, children: ['a', 'b', 'c'] },
  a: { id: 'a', text: 'A', x: 0, y: 0, parentId: 'n_root', children: ['a1'] },
  a1: { id: 'a1', text: 'A1', x: 0, y: 0, parentId: 'a', children: [] },
  b: { id: 'b', text: 'B', x: 0, y: 0, parentId: 'n_root', children: [] },
  c: { id: 'c', text: 'C', x: 0, y: 0, parentId: 'n_root', children: [] },
};

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
