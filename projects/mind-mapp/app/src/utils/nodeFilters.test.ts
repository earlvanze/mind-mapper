import { describe, it, expect } from 'vitest';
import { shouldFadeNode, getUniqueShapes, getUniqueColors, getUniqueIcons } from './nodeFilters';
import type { Node } from '../store/useMindMapStore';

const makeNode = (overrides: Partial<Node> = {}): Node =>
  ({ id: 'n1', text: 'Test', x: 0, y: 0, parentId: null, children: [], createdAt: Date.now(), updatedAt: Date.now(), ...overrides });

const NO_FILTERS = { activeTagFilters: [], matchMode: 'any' as const, styleFilterShapes: [], styleFilterColors: [], styleFilterIcons: [], styleFilterDateMode: undefined, styleFilterDateFrom: undefined, styleFilterDateTo: undefined };

describe('shouldFadeNode', () => {
  describe('no filters', () => {
    it('returns false when nothing is filtered', () => {
      expect(shouldFadeNode(makeNode(), NO_FILTERS)).toBe(false);
    });
  });

  describe('tag filters', () => {
    it('fades node without matching tag in any mode', () => {
      const node = makeNode({ tags: ['done'] });
      const opts = { ...NO_FILTERS, activeTagFilters: ['urgent'], matchMode: 'any' };
      expect(shouldFadeNode(node, opts)).toBe(true);
    });

    it('does not fade node with matching tag in any mode', () => {
      const node = makeNode({ tags: ['urgent'] });
      const opts = { ...NO_FILTERS, activeTagFilters: ['urgent'], matchMode: 'any' };
      expect(shouldFadeNode(node, opts)).toBe(false);
    });

    it('fades node missing one tag in all mode', () => {
      const node = makeNode({ tags: ['urgent'] });
      const opts = { ...NO_FILTERS, activeTagFilters: ['urgent', 'review'], matchMode: 'all' };
      expect(shouldFadeNode(node, opts)).toBe(true);
    });

    it('does not fade node with all tags in all mode', () => {
      const node = makeNode({ tags: ['urgent', 'review'] });
      const opts = { ...NO_FILTERS, activeTagFilters: ['urgent', 'review'], matchMode: 'all' };
      expect(shouldFadeNode(node, opts)).toBe(false);
    });
  });

  describe('shape filters', () => {
    it('fades node that does not match shape filter', () => {
      const node = makeNode({ style: { shape: 'ellipse' } });
      const opts = { ...NO_FILTERS, styleFilterShapes: ['rectangle'] };
      expect(shouldFadeNode(node, opts)).toBe(true);
    });

    it('does not fade node matching shape filter', () => {
      const node = makeNode({ style: { shape: 'rectangle' } });
      const opts = { ...NO_FILTERS, styleFilterShapes: ['rectangle', 'ellipse'] };
      expect(shouldFadeNode(node, opts)).toBe(false);
    });

    it('treats no shape as rectangle default', () => {
      const node = makeNode({ style: {} });
      const opts = { ...NO_FILTERS, styleFilterShapes: ['rectangle'] };
      expect(shouldFadeNode(node, opts)).toBe(false);
    });
  });

  describe('color filters', () => {
    it('fades node without matching color', () => {
      const node = makeNode({ style: { backgroundColor: '#ff0000' } });
      const opts = { ...NO_FILTERS, styleFilterColors: ['#0000ff'] };
      expect(shouldFadeNode(node, opts)).toBe(true);
    });

    it('does not fade node with matching color', () => {
      const node = makeNode({ style: { backgroundColor: '#ff0000' } });
      const opts = { ...NO_FILTERS, styleFilterColors: ['#ff0000'] };
      expect(shouldFadeNode(node, opts)).toBe(false);
    });

    it('matches color substring case-insensitively', () => {
      // '255' is a substring of 'rgba(255,0,0,0.5)' and matches case-insensitively
      const node = makeNode({ style: { backgroundColor: 'rgba(255,0,0,0.5)' } });
      const opts = { ...NO_FILTERS, styleFilterColors: ['255'] };
      expect(shouldFadeNode(node, opts)).toBe(false);
    });

    it('fades node without any background color', () => {
      const node = makeNode({ style: {} });
      const opts = { ...NO_FILTERS, styleFilterColors: ['#ff0000'] };
      expect(shouldFadeNode(node, opts)).toBe(true);
    });
  });

  describe('icon filters', () => {
    it('fades node without icon when icon filter active', () => {
      const node = makeNode({ style: {} });
      const opts = { ...NO_FILTERS, styleFilterIcons: ['🔥'] };
      expect(shouldFadeNode(node, opts)).toBe(true);
    });

    it('does not fade node with matching icon', () => {
      const node = makeNode({ style: { icon: '🔥' } });
      const opts = { ...NO_FILTERS, styleFilterIcons: ['🔥'] };
      expect(shouldFadeNode(node, opts)).toBe(false);
    });
  });

  describe('date filters', () => {
    it('fades node when createdAt is before from date', () => {
      const oldDate = Date.now() - 86400000 * 30; // 30 days ago
      const node = makeNode({ createdAt: oldDate });
      const fromDate = Date.now() - 86400000 * 7; // 7 days ago
      const opts = { ...NO_FILTERS, styleFilterDateMode: 'created', styleFilterDateFrom: fromDate };
      expect(shouldFadeNode(node, opts)).toBe(true);
    });

    it('does not fade node within date range', () => {
      const recentDate = Date.now() - 86400000 * 2; // 2 days ago
      const node = makeNode({ createdAt: recentDate });
      const fromDate = Date.now() - 86400000 * 7;
      const opts = { ...NO_FILTERS, styleFilterDateMode: 'created', styleFilterDateFrom: fromDate };
      expect(shouldFadeNode(node, opts)).toBe(false);
    });

    it('fades node when updatedAt is after to date', () => {
      const node = makeNode({ updatedAt: Date.now() + 86400000 }); // tomorrow
      const toDate = Date.now();
      const opts = { ...NO_FILTERS, styleFilterDateMode: 'updated', styleFilterDateTo: toDate };
      expect(shouldFadeNode(node, opts)).toBe(true);
    });
  });

  describe('combined filters', () => {
    it('fades node when one category fails', () => {
      const node = makeNode({ tags: ['urgent'], style: { shape: 'ellipse' } });
      const opts = { ...NO_FILTERS, activeTagFilters: ['urgent'], styleFilterShapes: ['rectangle'] };
      expect(shouldFadeNode(node, opts)).toBe(true);
    });

    it('does not fade node when all categories pass', () => {
      const node = makeNode({ tags: ['urgent'], style: { shape: 'rectangle' } });
      const opts = { ...NO_FILTERS, activeTagFilters: ['urgent'], styleFilterShapes: ['rectangle'] };
      expect(shouldFadeNode(node, opts)).toBe(false);
    });
  });
});

describe('getUniqueShapes', () => {
  it('returns rectangle for nodes with empty style (default shape)', () => {
    // Nodes without explicit shape default to 'rectangle'
    const nodes = { n1: makeNode({ style: {} }) };
    expect(getUniqueShapes(nodes)).toEqual(['rectangle']);
  });

  it('returns rectangle for nodes without style property (default shape)', () => {
    // Nodes without style property default to 'rectangle'
    const nodes = { n1: makeNode() };
    expect(getUniqueShapes(nodes)).toEqual(['rectangle']);
  });

  it('returns sorted unique shapes', () => {
    const nodes = {
      n1: makeNode({ id: 'n1', style: { shape: 'diamond' } }),
      n2: makeNode({ id: 'n2', style: { shape: 'rectangle' } }),
      n3: makeNode({ id: 'n3', style: { shape: 'ellipse' } }),
    };
    expect(getUniqueShapes(nodes)).toEqual(['diamond', 'ellipse', 'rectangle']);
  });
});

describe('getUniqueColors', () => {
  it('returns empty array for nodes with no colors', () => {
    const nodes = { n1: makeNode({ style: {} }) };
    expect(getUniqueColors(nodes)).toEqual([]);
  });

  it('returns sorted unique colors', () => {
    const nodes = {
      n1: makeNode({ id: 'n1', style: { backgroundColor: '#red' } }),
      n2: makeNode({ id: 'n2', style: { backgroundColor: '#blue' } }),
      n3: makeNode({ id: 'n3', style: { backgroundColor: '#red' } }),
    };
    expect(getUniqueColors(nodes)).toEqual(['#blue', '#red']);
  });
});

describe('getUniqueIcons', () => {
  it('returns empty array for nodes with no icons', () => {
    const nodes = { n1: makeNode({ style: {} }) };
    expect(getUniqueIcons(nodes)).toEqual([]);
  });

  it('returns sorted unique icons', () => {
    const nodes = {
      n1: makeNode({ id: 'n1', style: { icon: '🔥' } }),
      n2: makeNode({ id: 'n2', style: { icon: '⭐' } }),
      n3: makeNode({ id: 'n3', style: { icon: '🔥' } }),
    };
    expect(getUniqueIcons(nodes)).toEqual(['⭐', '🔥']);
  });
});
