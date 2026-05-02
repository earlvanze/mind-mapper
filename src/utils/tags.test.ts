import { describe, it, expect } from 'vitest';
import { getAllTagsWithCounts, getSortedTags, nodeHasTag, allNodesHaveTag } from './tags';
import type { Node } from '../store/useMindMapStore';

const makeNode = (overrides: Partial<Node> = {}): Node =>
  ({
    id: 'node-1',
    text: 'Test Node',
    x: 0,
    y: 0,
    children: [],
    ...overrides,
  }) as Node;

describe('tags', () => {
  describe('getAllTagsWithCounts', () => {
    it('returns empty map for empty nodes object', () => {
      const result = getAllTagsWithCounts({});
      expect(result.size).toBe(0);
    });

    it('counts a single tag on a single node', () => {
      const nodes = { 'n1': makeNode({ id: 'n1', tags: ['urgent'] }) };
      const result = getAllTagsWithCounts(nodes);
      expect(result.get('urgent')).toBe(1);
    });

    it('counts the same tag across multiple nodes', () => {
      const nodes = {
        'n1': makeNode({ id: 'n1', tags: ['urgent'] }),
        'n2': makeNode({ id: 'n2', tags: ['urgent'] }),
        'n3': makeNode({ id: 'n3', tags: ['urgent'] }),
      };
      const result = getAllTagsWithCounts(nodes);
      expect(result.get('urgent')).toBe(3);
    });

    it('counts multiple different tags', () => {
      const nodes = {
        'n1': makeNode({ id: 'n1', tags: ['urgent', 'work'] }),
        'n2': makeNode({ id: 'n2', tags: ['urgent', 'personal'] }),
      };
      const result = getAllTagsWithCounts(nodes);
      expect(result.get('urgent')).toBe(2);
      expect(result.get('work')).toBe(1);
      expect(result.get('personal')).toBe(1);
    });

    it('ignores nodes with no tags', () => {
      const nodes = {
        'n1': makeNode({ id: 'n1', tags: ['urgent'] }),
        'n2': makeNode({ id: 'n2', tags: undefined }),
        'n3': makeNode({ id: 'n3', tags: [] }),
      };
      const result = getAllTagsWithCounts(nodes);
      expect(result.get('urgent')).toBe(1);
      expect(result.size).toBe(1);
    });
  });

  describe('getSortedTags', () => {
    it('returns empty array for empty nodes', () => {
      expect(getSortedTags({})).toEqual([]);
    });

    it('sorts by count descending then alphabetically', () => {
      const nodes = {
        'n1': makeNode({ id: 'n1', tags: ['apple'] }),
        'n2': makeNode({ id: 'n2', tags: ['apple'] }),
        'n3': makeNode({ id: 'n3', tags: ['banana'] }),
      };
      const result = getSortedTags(nodes);
      // apple=2 (top), banana=1 (bottom) — within same count, alpha
      expect(result).toEqual(['apple', 'banana']);
    });

    it('sorts alphabetically within same count', () => {
      const nodes = {
        'n1': makeNode({ id: 'n1', tags: ['zebra'] }),
        'n2': makeNode({ id: 'n2', tags: ['apple'] }),
        'n3': makeNode({ id: 'n3', tags: ['banana'] }),
      };
      const result = getSortedTags(nodes);
      // All count=1, sorted alpha: apple, banana, zebra
      expect(result).toEqual(['apple', 'banana', 'zebra']);
    });
  });

  describe('nodeHasTag', () => {
    it('returns true when node has the tag', () => {
      const node = makeNode({ tags: ['urgent', 'work'] });
      expect(nodeHasTag(node, 'urgent')).toBe(true);
    });

    it('returns false when node does not have the tag', () => {
      const node = makeNode({ tags: ['work'] });
      expect(nodeHasTag(node, 'urgent')).toBe(false);
    });

    it('returns false when node has no tags', () => {
      const node = makeNode({ tags: undefined });
      expect(nodeHasTag(node, 'urgent')).toBe(false);
    });

    it('returns false when node has empty tags array', () => {
      const node = makeNode({ tags: [] });
      expect(nodeHasTag(node, 'urgent')).toBe(false);
    });
  });

  describe('allNodesHaveTag', () => {
    it('returns true for empty array', () => {
      expect(allNodesHaveTag([], 'urgent')).toBe(true);
    });

    it('returns true when all nodes have the tag', () => {
      const nodes = [
        makeNode({ tags: ['urgent'] }),
        makeNode({ tags: ['urgent', 'work'] }),
      ];
      expect(allNodesHaveTag(nodes, 'urgent')).toBe(true);
    });

    it('returns false when any node is missing the tag', () => {
      const nodes = [
        makeNode({ tags: ['urgent'] }),
        makeNode({ tags: ['work'] }),
      ];
      expect(allNodesHaveTag(nodes, 'urgent')).toBe(false);
    });

    it('returns false when any node has no tags', () => {
      const nodes = [
        makeNode({ tags: ['urgent'] }),
        makeNode({ tags: undefined }),
      ];
      expect(allNodesHaveTag(nodes, 'urgent')).toBe(false);
    });
  });
});
