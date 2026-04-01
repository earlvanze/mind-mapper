import { describe, expect, it } from 'vitest';
import { getAllTagsWithCounts, getSortedTags, nodeHasTag, allNodesHaveTag } from './tags';
import type { Node } from '../store/useMindMapStore';

const makeNode = (id: string, tags?: string[]): Node =>
  ({ id, text: id, x: 0, y: 0, parentId: null, children: [], tags } as Node);

describe('getAllTagsWithCounts', () => {
  it('returns empty map for no nodes', () => {
    expect(getAllTagsWithCounts({})).toEqual(new Map());
  });

  it('counts tags across multiple nodes', () => {
    const nodes: Record<string, Node> = {
      n1: makeNode('n1', ['urgent', 'work']),
      n2: makeNode('n2', ['urgent']),
      n3: makeNode('n3', ['work']),
    };
    const result = getAllTagsWithCounts(nodes);
    expect(result.get('urgent')).toBe(2);
    expect(result.get('work')).toBe(2);
  });

  it('ignores nodes without tags', () => {
    const nodes: Record<string, Node> = {
      n1: makeNode('n1', ['label']),
      n2: makeNode('n2'),
    };
    expect(getAllTagsWithCounts(nodes).get('label')).toBe(1);
  });

  it('handles duplicate tags on same node', () => {
    const nodes: Record<string, Node> = {
      n1: { ...makeNode('n1'), tags: ['a', 'a', 'a'] } as Node,
    };
    expect(getAllTagsWithCounts(nodes).get('a')).toBe(3);
  });

  it('handles empty tags arrays', () => {
    const nodes: Record<string, Node> = {
      n1: makeNode('n1', []),
    };
    expect(getAllTagsWithCounts(nodes)).toEqual(new Map());
  });
});

describe('getSortedTags', () => {
  it('returns empty array for no tags', () => {
    expect(getSortedTags({})).toEqual([]);
  });

  it('sorts by count descending then alphabetically', () => {
    const nodes: Record<string, Node> = {
      n1: makeNode('n1', ['zebra', 'apple']),
      n2: makeNode('n2', ['zebra', 'banana']),
      n3: makeNode('n3', ['apple']),
    };
    const result = getSortedTags(nodes);
    // zebra:2, apple:2, banana:1; apple < zebra alphabetically
    expect(result).toEqual(['apple', 'zebra', 'banana']);
  });

  it('returns unique tags only', () => {
    const nodes: Record<string, Node> = {
      n1: makeNode('n1', ['x', 'y']),
      n2: makeNode('n2', ['x', 'z']),
    };
    const result = getSortedTags(nodes);
    expect(result).toHaveLength(3);
  });
});

describe('nodeHasTag', () => {
  it('returns true when node has tag', () => {
    expect(nodeHasTag(makeNode('n1', ['important']), 'important')).toBe(true);
  });

  it('returns false when node lacks tag', () => {
    expect(nodeHasTag(makeNode('n1', ['work']), 'play')).toBe(false);
  });

  it('returns false when node has no tags', () => {
    expect(nodeHasTag(makeNode('n1'), 'anything')).toBe(false);
  });

  it('returns false for empty tags array', () => {
    expect(nodeHasTag(makeNode('n1', []), 'x')).toBe(false);
  });
});

describe('allNodesHaveTag', () => {
  it('returns true for empty array', () => {
    expect(allNodesHaveTag([], 'x')).toBe(true);
  });

  it('returns true when all nodes have tag', () => {
    const nodes = [makeNode('n1', ['a']), makeNode('n2', ['a'])];
    expect(allNodesHaveTag(nodes, 'a')).toBe(true);
  });

  it('returns false when any node lacks tag', () => {
    const nodes = [makeNode('n1', ['a']), makeNode('n2', ['b'])];
    expect(allNodesHaveTag(nodes, 'a')).toBe(false);
  });

  it('returns false when all nodes lack tag', () => {
    const nodes = [makeNode('n1', ['x']), makeNode('n2', ['y'])];
    expect(allNodesHaveTag(nodes, 'z')).toBe(false);
  });

  it('handles mixed undefined/empty tags', () => {
    const nodes: Node[] = [
      { ...makeNode('n1'), tags: ['x'] } as Node,
      makeNode('n2'),
    ];
    expect(allNodesHaveTag(nodes, 'x')).toBe(false);
  });
});
