import { describe, expect, it } from 'vitest';
import type { Node } from '../store/useMindMapStore';
import { searchNodes, searchNodesWithTotal, tokenizeSearchQuery } from './searchNodes';

const nodes: Record<string, Node> = {
  n_root: { id: 'n_root', text: 'Root', x: 0, y: 0, parentId: null, children: ['n_alpha', 'n_beta', 'n_alpine'] },
  n_alpha: { id: 'n_alpha', text: 'Alpha', x: 0, y: 0, parentId: 'n_root', children: ['n_review'] },
  n_beta: { id: 'n_beta', text: 'Beta', x: 0, y: 0, parentId: 'n_root', children: [] },
  n_alpine: { id: 'n_alpine', text: 'Alpine', x: 0, y: 0, parentId: 'n_root', children: [] },
  n_review: { id: 'n_review', text: 'Review', x: 0, y: 0, parentId: 'n_alpha', children: [] },
  node_x1: { id: 'node_x1', text: 'Gamma', x: 0, y: 0, parentId: 'n_root', children: [] },
};

describe('tokenizeSearchQuery', () => {
  it('parses quoted and negated terms', () => {
    expect(tokenizeSearchQuery('"alpha review" -beta id:foo')).toEqual([
      { value: 'alpha review', negated: false },
      { value: 'beta', negated: true },
      { value: 'id:foo', negated: false },
    ]);
  });

  it('ignores empty tokens', () => {
    expect(tokenizeSearchQuery('   ""   ')).toEqual([]);
  });

  it('normalizes repeated whitespace inside tokens', () => {
    expect(tokenizeSearchQuery('"alpha   review"   beta')).toEqual([
      { value: 'alpha review', negated: false },
      { value: 'beta', negated: false },
    ]);
  });
});

describe('searchNodes', () => {
  it('returns empty array for blank query', () => {
    expect(searchNodes(nodes, '   ')).toEqual([]);
  });

  it('prioritizes label prefix matches over contains/id/path matches', () => {
    const results = searchNodes(nodes, 'al');
    expect(results.slice(0, 2).map(node => node.id)).toEqual(['n_alpha', 'n_alpine']);
  });

  it('can match by node id when label does not match', () => {
    const results = searchNodes(nodes, 'x1');
    expect(results.map(node => node.id)).toEqual(['node_x1']);
  });

  it('supports multi-term queries across node label and path', () => {
    const results = searchNodes(nodes, 'alpha review');
    expect(results.map(node => node.id)).toEqual(['n_review']);
  });

  it('supports quoted phrase queries', () => {
    const results = searchNodes(nodes, '"alpha review"');
    expect(results.map(node => node.id)).toEqual(['n_review']);
  });

  it('supports negative terms for exclusion', () => {
    const results = searchNodes(nodes, 'alpha -review');
    expect(results.map(node => node.id)).toEqual(['n_alpha']);
  });

  it('supports pure negative filtering', () => {
    const results = searchNodes(nodes, '-review');
    expect(results.some(node => node.id === 'n_review')).toBe(false);
    expect(results.length).toBe(Object.keys(nodes).length - 1);
  });

  it('can match descendants by ancestor path terms', () => {
    const results = searchNodes(nodes, 'alpha');
    expect(results.map(node => node.id)).toEqual(['n_alpha', 'n_review']);
  });

  it('applies result limit after ranking', () => {
    const results = searchNodes(nodes, 'a', 2);
    expect(results).toHaveLength(2);
  });

  it('reports total matches separately from capped results', () => {
    const { results, total } = searchNodesWithTotal(nodes, 'a', 2);
    expect(results).toHaveLength(2);
    expect(total).toBeGreaterThan(results.length);
  });

  it('handles cyclic parent chains without hanging', () => {
    const cyclic: Record<string, Node> = {
      a: { id: 'a', text: 'Alpha', x: 0, y: 0, parentId: 'b', children: [] },
      b: { id: 'b', text: 'Beta', x: 0, y: 0, parentId: 'a', children: [] },
    };

    const results = searchNodes(cyclic, 'alpha beta');
    expect(results.map(node => node.id)).toEqual(['a', 'b']);
  });

  it('matches phrases across irregular whitespace in node text', () => {
    const spaced: Record<string, Node> = {
      root: { id: 'root', text: 'Root', x: 0, y: 0, parentId: null, children: ['n1'] },
      n1: { id: 'n1', text: 'Alpha   Review', x: 0, y: 0, parentId: 'root', children: [] },
    };

    const results = searchNodes(spaced, '"alpha review"');
    expect(results.map(node => node.id)).toEqual(['n1']);
  });
});
