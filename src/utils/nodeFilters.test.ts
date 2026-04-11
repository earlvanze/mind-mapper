import { describe, expect, it } from 'vitest';
import type { Node, NodeStyle } from '../store/useMindMapStore';
import { shouldFadeNode, getUniqueShapes, getUniqueColors, getUniqueIcons } from './nodeFilters';

function makeNode(overrides: Partial<Node> = {}): Node {
  return {
    id: 'n1',
    text: 'Test Node',
    parentId: null,
    children: [],
    x: 0,
    y: 0,
    createdAt: 1000,
    updatedAt: 1000,
    tags: [],
    ...overrides,
  };
}

function makeStyle(overrides: Partial<NodeStyle> = {}): NodeStyle {
  return {
    backgroundColor: undefined,
    textColor: undefined,
    borderColor: undefined,
    shape: 'rectangle',
    icon: undefined,
    ...overrides,
  };
}

describe('nodeFilters', () => {
  describe('shouldFadeNode', () => {
    it('returns false when no filters active', () => {
      const node = makeNode();
      expect(shouldFadeNode(node, {
        activeTagFilters: [],
        matchMode: 'any',
        styleFilterShapes: [],
        styleFilterColors: [],
        styleFilterIcons: [],
      })).toBe(false);
    });

    describe('tag filters', () => {
      const node = makeNode({ tags: ['urgent', 'work'] });

      it('passes any-match tag filter when node has matching tag', () => {
        expect(shouldFadeNode(node, {
          activeTagFilters: ['urgent'],
          matchMode: 'any',
          styleFilterShapes: [],
          styleFilterColors: [],
          styleFilterIcons: [],
        })).toBe(false);
      });

      it('fails any-match tag filter when node has no matching tag', () => {
        expect(shouldFadeNode(node, {
          activeTagFilters: ['secret'],
          matchMode: 'any',
          styleFilterShapes: [],
          styleFilterColors: [],
          styleFilterIcons: [],
        })).toBe(true);
      });

      it('passes all-match tag filter when node has all filter tags', () => {
        expect(shouldFadeNode(node, {
          activeTagFilters: ['urgent', 'work'],
          matchMode: 'all',
          styleFilterShapes: [],
          styleFilterColors: [],
          styleFilterIcons: [],
        })).toBe(false);
      });

      it('fails all-match tag filter when node is missing one tag', () => {
        expect(shouldFadeNode(node, {
          activeTagFilters: ['urgent', 'work', 'missing'],
          matchMode: 'all',
          styleFilterShapes: [],
          styleFilterColors: [],
          styleFilterIcons: [],
        })).toBe(true);
      });
    });

    describe('shape filters', () => {
      it('passes when node shape matches filter', () => {
        const node = makeNode({ style: makeStyle({ shape: 'ellipse' }) });
        expect(shouldFadeNode(node, {
          activeTagFilters: [],
          matchMode: 'any',
          styleFilterShapes: ['ellipse'],
          styleFilterColors: [],
          styleFilterIcons: [],
        })).toBe(false);
      });

      it('fails when node shape does not match filter', () => {
        const node = makeNode({ style: makeStyle({ shape: 'rectangle' }) });
        expect(shouldFadeNode(node, {
          activeTagFilters: [],
          matchMode: 'any',
          styleFilterShapes: ['ellipse'],
          styleFilterColors: [],
          styleFilterIcons: [],
        })).toBe(true);
      });
    });

    describe('color filters', () => {
      it('passes when node background color matches filter', () => {
        const node = makeNode({ style: makeStyle({ backgroundColor: '#3b82f6' }) });
        expect(shouldFadeNode(node, {
          activeTagFilters: [],
          matchMode: 'any',
          styleFilterShapes: [],
          styleFilterColors: ['3b82f6'],
          styleFilterIcons: [],
        })).toBe(false);
      });

      it('fails when node has no background color', () => {
        const node = makeNode({ style: makeStyle({ backgroundColor: undefined }) });
        expect(shouldFadeNode(node, {
          activeTagFilters: [],
          matchMode: 'any',
          styleFilterShapes: [],
          styleFilterColors: ['3b82f6'],
          styleFilterIcons: [],
        })).toBe(true);
      });

      it('matches color substring (case-insensitive)', () => {
        const node = makeNode({ style: makeStyle({ backgroundColor: '#3B82F6' }) });
        expect(shouldFadeNode(node, {
          activeTagFilters: [],
          matchMode: 'any',
          styleFilterShapes: [],
          styleFilterColors: ['3b82f6'],
          styleFilterIcons: [],
        })).toBe(false);
      });
    });

    describe('icon filters', () => {
      it('passes when node icon matches filter', () => {
        const node = makeNode({ style: makeStyle({ icon: '🔥' }) });
        expect(shouldFadeNode(node, {
          activeTagFilters: [],
          matchMode: 'any',
          styleFilterShapes: [],
          styleFilterColors: [],
          styleFilterIcons: ['🔥'],
        })).toBe(false);
      });

      it('fails when node has no icon', () => {
        const node = makeNode({ style: makeStyle({ icon: undefined }) });
        expect(shouldFadeNode(node, {
          activeTagFilters: [],
          matchMode: 'any',
          styleFilterShapes: [],
          styleFilterColors: [],
          styleFilterIcons: ['🔥'],
        })).toBe(true);
      });
    });

    describe('date filters', () => {
      it('passes when createdAt within range', () => {
        const node = makeNode({ createdAt: 1000 });
        expect(shouldFadeNode(node, {
          activeTagFilters: [],
          matchMode: 'any',
          styleFilterShapes: [],
          styleFilterColors: [],
          styleFilterIcons: [],
          styleFilterDateMode: 'created',
          styleFilterDateFrom: 500,
          styleFilterDateTo: 2000,
        })).toBe(false);
      });

      it('fails when createdAt before from', () => {
        const node = makeNode({ createdAt: 100 });
        expect(shouldFadeNode(node, {
          activeTagFilters: [],
          matchMode: 'any',
          styleFilterShapes: [],
          styleFilterColors: [],
          styleFilterIcons: [],
          styleFilterDateMode: 'created',
          styleFilterDateFrom: 500,
          styleFilterDateTo: 2000,
        })).toBe(true);
      });

      it('fails when updatedAt after to', () => {
        const node = makeNode({ updatedAt: 3000 });
        expect(shouldFadeNode(node, {
          activeTagFilters: [],
          matchMode: 'any',
          styleFilterShapes: [],
          styleFilterColors: [],
          styleFilterIcons: [],
          styleFilterDateMode: 'updated',
          styleFilterDateFrom: 500,
          styleFilterDateTo: 2000,
        })).toBe(true);
      });

      it('passes when no bounds set', () => {
        const node = makeNode({ createdAt: 100 });
        expect(shouldFadeNode(node, {
          activeTagFilters: [],
          matchMode: 'any',
          styleFilterShapes: [],
          styleFilterColors: [],
          styleFilterIcons: [],
          styleFilterDateMode: 'created',
          styleFilterDateFrom: undefined,
          styleFilterDateTo: undefined,
        })).toBe(false);
      });
    });

    describe('multi-filter (AND logic across categories)', () => {
      it('fades node when one category fails even if others pass', () => {
        const node = makeNode({
          tags: ['urgent'],
          style: makeStyle({ shape: 'rectangle', backgroundColor: '#10b981' }),
        });
        // shape filter should fail (rectangle vs ellipse)
        expect(shouldFadeNode(node, {
          activeTagFilters: ['urgent'],
          matchMode: 'any',
          styleFilterShapes: ['ellipse'],
          styleFilterColors: [],
          styleFilterIcons: [],
        })).toBe(true);
      });
    });
  });

  describe('getUniqueShapes', () => {
    it('returns rectangle for unstyled nodes', () => {
      const nodes: Record<string, Node> = {
        n1: makeNode({ id: 'n1', style: undefined }),
        n2: makeNode({ id: 'n2', style: undefined }),
      };
      const shapes = getUniqueShapes(nodes);
      expect(shapes).toContain('rectangle');
    });

    it('returns unique shapes deduplicated', () => {
      const nodes: Record<string, Node> = {
        n1: makeNode({ id: 'n1', style: makeStyle({ shape: 'ellipse' }) }),
        n2: makeNode({ id: 'n2', style: makeStyle({ shape: 'ellipse' }) }),
        n3: makeNode({ id: 'n3', style: makeStyle({ shape: 'diamond' }) }),
      };
      const shapes = getUniqueShapes(nodes);
      expect(shapes.sort()).toEqual(['diamond', 'ellipse']);
    });
  });

  describe('getUniqueColors', () => {
    it('returns empty array when no nodes have colors', () => {
      const nodes: Record<string, Node> = {
        n1: makeNode({ id: 'n1', style: makeStyle({ backgroundColor: undefined }) }),
      };
      expect(getUniqueColors(nodes)).toEqual([]);
    });

    it('returns unique colors deduplicated', () => {
      const nodes: Record<string, Node> = {
        n1: makeNode({ id: 'n1', style: makeStyle({ backgroundColor: '#ef4444' }) }),
        n2: makeNode({ id: 'n2', style: makeStyle({ backgroundColor: '#ef4444' }) }),
        n3: makeNode({ id: 'n3', style: makeStyle({ backgroundColor: '#10b981' }) }),
      };
      const colors = getUniqueColors(nodes);
      expect(colors.sort()).toEqual(['#10b981', '#ef4444']);
    });
  });

  describe('getUniqueIcons', () => {
    it('returns empty array when no nodes have icons', () => {
      const nodes: Record<string, Node> = {
        n1: makeNode({ id: 'n1', style: makeStyle({ icon: undefined }) }),
      };
      expect(getUniqueIcons(nodes)).toEqual([]);
    });

    it('returns unique icons deduplicated', () => {
      const nodes: Record<string, Node> = {
        n1: makeNode({ id: 'n1', style: makeStyle({ icon: '🔴' }) }),
        n2: makeNode({ id: 'n2', style: makeStyle({ icon: '🔴' }) }),
        n3: makeNode({ id: 'n3', style: makeStyle({ icon: '🟢' }) }),
      };
      const icons = getUniqueIcons(nodes);
      expect(icons.sort()).toEqual(['🔴', '🟢']);
    });
  });

  describe('focus mode', () => {
    it('returns false when focusModeActive is false', () => {
      const node = makeNode({ id: 'n1' });
      expect(shouldFadeNode(node, {
        activeTagFilters: [],
        matchMode: 'any',
        styleFilterShapes: [],
        styleFilterColors: [],
        styleFilterIcons: [],
        focusModeActive: false,
        focusedSubtreeIds: new Set(['n1']),
      })).toBe(false);
    });

    it('dims node outside focused subtree when focusModeActive is true', () => {
      const root = makeNode({ id: 'root' });
      const child = makeNode({ id: 'child' });
      const unrelated = makeNode({ id: 'unrelated' });
      const subtree = new Set(['root', 'child']);
      expect(shouldFadeNode(root, {
        activeTagFilters: [],
        matchMode: 'any',
        styleFilterShapes: [],
        styleFilterColors: [],
        styleFilterIcons: [],
        focusModeActive: true,
        focusedSubtreeIds: subtree,
      })).toBe(false);
      expect(shouldFadeNode(child, {
        activeTagFilters: [],
        matchMode: 'any',
        styleFilterShapes: [],
        styleFilterColors: [],
        styleFilterIcons: [],
        focusModeActive: true,
        focusedSubtreeIds: subtree,
      })).toBe(false);
      expect(shouldFadeNode(unrelated, {
        activeTagFilters: [],
        matchMode: 'any',
        styleFilterShapes: [],
        styleFilterColors: [],
        styleFilterIcons: [],
        focusModeActive: true,
        focusedSubtreeIds: subtree,
      })).toBe(true);
    });

    it('dims all nodes when focusedSubtreeIds is undefined but focusModeActive is true', () => {
      const node = makeNode({ id: 'n1' });
      expect(shouldFadeNode(node, {
        activeTagFilters: [],
        matchMode: 'any',
        styleFilterShapes: [],
        styleFilterColors: [],
        styleFilterIcons: [],
        focusModeActive: true,
        focusedSubtreeIds: undefined,
      })).toBe(true);
    });

    it('combines focus mode dim with tag filter dim (union)', () => {
      const nodeInSubtree = makeNode({ id: 'n1', tags: ['work'] });
      const subtree = new Set(['n1']);
      // nodeInSubtree is in subtree so not dimmed by focus mode, but it doesn't match tag filter
      expect(shouldFadeNode(nodeInSubtree, {
        activeTagFilters: ['urgent'],
        matchMode: 'any',
        styleFilterShapes: [],
        styleFilterColors: [],
        styleFilterIcons: [],
        focusModeActive: true,
        focusedSubtreeIds: subtree,
      })).toBe(true); // faded: tag filter fails (work != urgent)
    });
  });
});
