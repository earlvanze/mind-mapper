import { describe, expect, it } from 'vitest';
import {
  shouldFadeNode,
  getUniqueShapes,
  getUniqueColors,
  getUniqueIcons,
} from './nodeFilters';
import type { Node } from '../store/useMindMapStore';

function makeNode(overrides: Partial<Node> = {}): Node {
  return {
    id: 'n1',
    text: 'Test Node',
    x: 0,
    y: 0,
    parentId: null,
    children: [],
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    ...overrides,
  };
}

const BASE_OPTS = {
  activeTagFilters: [] as string[],
  matchMode: 'any' as const,
  styleFilterShapes: [] as string[],
  styleFilterColors: [] as string[],
  styleFilterIcons: [] as string[],
  styleFilterDateMode: undefined as 'created' | 'updated' | undefined,
  styleFilterDateFrom: undefined as number | undefined,
  styleFilterDateTo: undefined as number | undefined,
};

describe('shouldFadeNode', () => {
  it('returns false when no filters are active', () => {
    const node = makeNode();
    expect(shouldFadeNode(node, BASE_OPTS)).toBe(false);
  });

  describe('tag filters', () => {
    const opts = { ...BASE_OPTS, activeTagFilters: ['urgent', 'review'] };

    it('returns false when node has one of the tags (any mode)', () => {
      const node = makeNode({ tags: ['urgent'] });
      expect(shouldFadeNode(node, opts)).toBe(false);
    });

    it('returns true when node has none of the tags (any mode)', () => {
      const node = makeNode({ tags: ['done'] });
      expect(shouldFadeNode(node, opts)).toBe(true);
    });

    it('returns false when node has all tags (all mode)', () => {
      const opts2 = { ...opts, matchMode: 'all' as const };
      const node = makeNode({ tags: ['urgent', 'review', 'done'] });
      expect(shouldFadeNode(node, opts2)).toBe(false);
    });

    it('returns true when node is missing one tag (all mode)', () => {
      const opts2 = { ...opts, matchMode: 'all' as const };
      const node = makeNode({ tags: ['urgent'] });
      expect(shouldFadeNode(node, opts2)).toBe(true);
    });

    it('treats missing tags array as empty', () => {
      const node = makeNode();
      expect(shouldFadeNode(node, opts)).toBe(true);
    });
  });

  describe('shape filters', () => {
    const opts = { ...BASE_OPTS, styleFilterShapes: ['ellipse', 'diamond'] };

    it('returns false when node shape matches', () => {
      const node = makeNode({ style: { shape: 'ellipse' } });
      expect(shouldFadeNode(node, opts)).toBe(false);
    });

    it('returns true when node shape does not match', () => {
      const node = makeNode({ style: { shape: 'rectangle' } });
      expect(shouldFadeNode(node, opts)).toBe(true);
    });

    it('treats missing shape as rectangle (default)', () => {
      const node = makeNode({ style: {} });
      expect(shouldFadeNode(node, opts)).toBe(true);
    });
  });

  describe('color filters', () => {
    const opts = { ...BASE_OPTS, styleFilterColors: ['primary', 'danger'] };

    it('returns false when node background color matches (substring)', () => {
      const node = makeNode({ style: { backgroundColor: 'primary' } });
      expect(shouldFadeNode(node, opts)).toBe(false);
    });

    it('returns false when node bg matches variant (lowercase)', () => {
      const node = makeNode({ style: { backgroundColor: '#DC2626' } });
      const opts2 = { ...BASE_OPTS, styleFilterColors: ['danger', 'dc2626'] };
      expect(shouldFadeNode(node, opts2)).toBe(false);
    });

    it('returns true when node color does not match', () => {
      const node = makeNode({ style: { backgroundColor: 'success' } });
      expect(shouldFadeNode(node, opts)).toBe(true);
    });

    it('treats missing backgroundColor as no match', () => {
      const node = makeNode({ style: {} });
      expect(shouldFadeNode(node, opts)).toBe(true);
    });
  });

  describe('icon filters', () => {
    const opts = { ...BASE_OPTS, styleFilterIcons: ['🔥', '⭐'] };

    it('returns false when node icon matches', () => {
      const node = makeNode({ style: { icon: '🔥' } });
      expect(shouldFadeNode(node, opts)).toBe(false);
    });

    it('returns true when node icon does not match', () => {
      const node = makeNode({ style: { icon: '💤' } });
      expect(shouldFadeNode(node, opts)).toBe(true);
    });

    it('treats missing icon as no match', () => {
      const node = makeNode({ style: {} });
      expect(shouldFadeNode(node, opts)).toBe(true);
    });
  });

  describe('date filters', () => {
    const created = 1700000000000;
    const node = makeNode({ createdAt: created, updatedAt: created + 1000 });

    it('returns false when node is within date range (created)', () => {
      const opts2 = { ...BASE_OPTS, styleFilterDateMode: 'created' as const, styleFilterDateFrom: created - 1000, styleFilterDateTo: created + 1000 };
      expect(shouldFadeNode(node, opts2)).toBe(false);
    });

    it('returns true when node is before date range (created)', () => {
      const opts2 = { ...BASE_OPTS, styleFilterDateMode: 'created' as const, styleFilterDateFrom: created + 1, styleFilterDateTo: undefined };
      expect(shouldFadeNode(node, opts2)).toBe(true);
    });

    it('returns true when node is after date range (created)', () => {
      const opts2 = { ...BASE_OPTS, styleFilterDateMode: 'created' as const, styleFilterDateFrom: undefined, styleFilterDateTo: created - 1 };
      expect(shouldFadeNode(node, opts2)).toBe(true);
    });

    it('returns false when node is within date range (updated)', () => {
      const opts2 = { ...BASE_OPTS, styleFilterDateMode: 'updated' as const, styleFilterDateFrom: created, styleFilterDateTo: created + 2000 };
      expect(shouldFadeNode(node, opts2)).toBe(false);
    });

    it('treats missing timestamp as no match', () => {
      const noTs = makeNode({ createdAt: undefined, updatedAt: undefined });
      const opts2 = { ...BASE_OPTS, styleFilterDateMode: 'created' as const, styleFilterDateFrom: 0, styleFilterDateTo: Date.now() };
      expect(shouldFadeNode(noTs, opts2)).toBe(true);
    });
  });

  describe('combined filters', () => {
    it('returns false only when all active filters pass', () => {
      const node = makeNode({
        tags: ['urgent'],
        style: { shape: 'ellipse', backgroundColor: 'primary', icon: '🔥' },
      });
      const opts = {
        ...BASE_OPTS,
        activeTagFilters: ['urgent'],
        styleFilterShapes: ['ellipse'],
        styleFilterColors: ['primary'],
        styleFilterIcons: ['🔥'],
      };
      expect(shouldFadeNode(node, opts)).toBe(false);
    });

    it('returns true if any single filter fails', () => {
      const node = makeNode({
        tags: ['urgent'],
        style: { shape: 'ellipse' }, // missing color and icon
      });
      const opts = {
        ...BASE_OPTS,
        activeTagFilters: ['urgent'],
        styleFilterShapes: ['ellipse'],
        styleFilterColors: ['primary'],
        styleFilterIcons: ['🔥'],
      };
      expect(shouldFadeNode(node, opts)).toBe(true);
    });
  });
});

describe('getUniqueShapes', () => {
  it('returns empty array for empty nodes', () => {
    expect(getUniqueShapes({})).toEqual([]);
  });

  it('extracts shape from styled nodes', () => {
    const nodes: Record<string, Node> = {
      n1: makeNode({ id: 'n1', style: { shape: 'ellipse' } }),
      n2: makeNode({ id: 'n2', style: { shape: 'ellipse' } }),
      n3: makeNode({ id: 'n3', style: { shape: 'diamond' } }),
      n4: makeNode({ id: 'n4', style: {} }), // default = rectangle
    };
    expect(getUniqueShapes(nodes)).toContain('ellipse');
    expect(getUniqueShapes(nodes)).toContain('diamond');
    expect(getUniqueShapes(nodes)).toContain('rectangle');
  });

  it('treats nodes without style as rectangle', () => {
    const nodes: Record<string, Node> = {
      n1: makeNode({ id: 'n1' }),
    };
    expect(getUniqueShapes(nodes)).toContain('rectangle');
  });

  it('returns sorted unique shapes', () => {
    const nodes: Record<string, Node> = {
      n1: makeNode({ id: 'n1', style: { shape: 'diamond' } }),
      n2: makeNode({ id: 'n2', style: { shape: 'ellipse' } }),
    };
    const result = getUniqueShapes(nodes);
    const diamondIdx = result.indexOf('diamond');
    const ellipseIdx = result.indexOf('ellipse');
    expect(diamondIdx).toBeLessThan(ellipseIdx);
  });
});

describe('getUniqueColors', () => {
  it('returns empty array for empty nodes', () => {
    expect(getUniqueColors({})).toEqual([]);
  });

  it('extracts backgroundColor from styled nodes', () => {
    const nodes: Record<string, Node> = {
      n1: makeNode({ id: 'n1', style: { backgroundColor: '#dc2626' } }),
      n2: makeNode({ id: 'n2', style: { backgroundColor: '#dc2626' } }),
      n3: makeNode({ id: 'n3', style: { backgroundColor: '#2563eb' } }),
      n4: makeNode({ id: 'n4', style: {} }),
    };
    expect(getUniqueColors(nodes)).toEqual(['#2563eb', '#dc2626']);
  });

  it('omits nodes without backgroundColor', () => {
    const nodes: Record<string, Node> = {
      n1: makeNode({ id: 'n1', style: {} }),
      n2: makeNode({ id: 'n2', style: { backgroundColor: 'primary' } }),
    };
    expect(getUniqueColors(nodes)).toEqual(['primary']);
  });
});

describe('getUniqueIcons', () => {
  it('returns empty array for empty nodes', () => {
    expect(getUniqueIcons({})).toEqual([]);
  });

  it('extracts icons from styled nodes', () => {
    const nodes: Record<string, Node> = {
      n1: makeNode({ id: 'n1', style: { icon: '🔥' } }),
      n2: makeNode({ id: 'n2', style: { icon: '🔥' } }),
      n3: makeNode({ id: 'n3', style: { icon: '⭐' } }),
      n4: makeNode({ id: 'n4', style: {} }),
    };
    expect(getUniqueIcons(nodes)).toEqual(['⭐', '🔥']);
  });

  it('omits nodes without icon', () => {
    const nodes: Record<string, Node> = {
      n1: makeNode({ id: 'n1', style: {} }),
      n2: makeNode({ id: 'n2', style: { icon: '💡' } }),
    };
    expect(getUniqueIcons(nodes)).toEqual(['💡']);
  });
});
