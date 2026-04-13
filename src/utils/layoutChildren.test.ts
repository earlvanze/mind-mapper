import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock before importing
vi.mock('../store/useMindMapStore', () => ({
  useMindMapStore: {
    getState: vi.fn(),
  },
}));

import { useMindMapStore } from '../store/useMindMapStore';
import { layoutChildren } from './layoutChildren';

describe('layoutChildren', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when parent does not exist', () => {
    const moveNode = vi.fn();
    vi.mocked(useMindMapStore.getState).mockReturnValue({
      nodes: {},
      moveNode,
    } as any);

    layoutChildren('nonexistent');
    expect(moveNode).not.toHaveBeenCalled();
  });

  it('does nothing when parent has no children', () => {
    const moveNode = vi.fn();
    vi.mocked(useMindMapStore.getState).mockReturnValue({
      nodes: { parent: { id: 'parent', children: [], x: 0, y: 0 } },
      moveNode,
    } as any);

    layoutChildren('parent');
    expect(moveNode).not.toHaveBeenCalled();
  });

  it('arranges children vertically spaced', () => {
    const moveNode = vi.fn();
    vi.mocked(useMindMapStore.getState).mockReturnValue({
      nodes: {
        parent: { id: 'parent', children: ['c1', 'c2', 'c3'], x: 100, y: 200 },
        c1: { id: 'c1', parentId: 'parent', x: 0, y: 0 },
        c2: { id: 'c2', parentId: 'parent', x: 0, y: 0 },
        c3: { id: 'c3', parentId: 'parent', x: 0, y: 0 },
      },
      moveNode,
    } as any);

    layoutChildren('parent');

    // Children stacked vertically, 80px apart
    expect(moveNode).toHaveBeenCalledTimes(3);
    // c1 at y = 200 - (3-1)*40 = 120
    expect(moveNode).toHaveBeenCalledWith('c1', 280, 120);
    // c2 at y = 200 - (3-1)*40 + 1*80 = 200
    expect(moveNode).toHaveBeenCalledWith('c2', 280, 200);
    // c3 at y = 200 - (3-1)*40 + 2*80 = 280
    expect(moveNode).toHaveBeenCalledWith('c3', 280, 280);
  });

  it('skips children that do not exist in nodes map', () => {
    const moveNode = vi.fn();
    vi.mocked(useMindMapStore.getState).mockReturnValue({
      nodes: {
        parent: { id: 'parent', children: ['c1', 'missing', 'c2'], x: 100, y: 200 },
        c1: { id: 'c1', parentId: 'parent', x: 0, y: 0 },
        // missing is intentionally absent
        c2: { id: 'c2', parentId: 'parent', x: 0, y: 0 },
      },
      moveNode,
    } as any);

    layoutChildren('parent');

    // Only existing children are positioned
    expect(moveNode).toHaveBeenCalledTimes(2);
  });
});
