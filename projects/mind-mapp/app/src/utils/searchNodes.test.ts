import { describe, expect, it } from 'vitest';
import type { Node } from '../store/useMindMapStore';
import { DEFAULT_SEARCH_RESULT_LIMIT, searchNodes, searchNodesWithTotal, tokenizeSearchQuery } from './searchNodes';

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
      { value: 'id foo', negated: false },
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

  it('normalizes diacritics in tokens', () => {
    expect(tokenizeSearchQuery('"résumé café"')).toEqual([
      { value: 'resume cafe', negated: false },
    ]);
  });

  it('normalizes uppercase tokens without pre-lowercasing the full query', () => {
    expect(tokenizeSearchQuery('"Alpha REVIEW" -BETA')).toEqual([
      { value: 'alpha review', negated: false },
      { value: 'beta', negated: true },
    ]);
  });

  it('reuses frozen cached tokens for equivalent trimmed input', () => {
    const first = tokenizeSearchQuery(' alpha -beta ');
    const second = tokenizeSearchQuery('alpha -beta');

    expect(first).toBe(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first[0]!)).toBe(true);
  });

  it('supports whitespace-separated negation marker before quoted phrases', () => {
    expect(tokenizeSearchQuery('- "alpha review" beta')).toEqual([
      { value: 'alpha review', negated: true },
      { value: 'beta', negated: false },
    ]);
  });

  it('supports unicode dash negation markers', () => {
    expect(tokenizeSearchQuery('−alpha –"beta gamma"')).toEqual([
      { value: 'alpha', negated: true },
      { value: 'beta gamma', negated: true },
    ]);

    expect(tokenizeSearchQuery('—alpha')).toEqual([
      { value: 'alpha', negated: true },
    ]);

    expect(tokenizeSearchQuery('− "alpha review"')).toEqual([
      { value: 'alpha review', negated: true },
    ]);

    expect(tokenizeSearchQuery('— "alpha review"')).toEqual([
      { value: 'alpha review', negated: true },
    ]);
  });

  it('tokenizes distinct sequential queries correctly', () => {
    expect(tokenizeSearchQuery('alpha beta')).toEqual([
      { value: 'alpha', negated: false },
      { value: 'beta', negated: false },
    ]);

    expect(tokenizeSearchQuery('"gamma delta" -beta')).toEqual([
      { value: 'gamma delta', negated: false },
      { value: 'beta', negated: true },
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

  it('supports negated quoted phrases written with a separated minus token', () => {
    const results = searchNodes(nodes, '- "alpha review"');
    expect(results.some(node => node.id === 'n_review')).toBe(false);
  });

  it('accepts pre-tokenized query input', () => {
    const tokens = tokenizeSearchQuery('alpha review');
    const results = searchNodes(nodes, tokens);
    expect(results.map(node => node.id)).toEqual(['n_review']);
  });

  it('supports pre-tokenized positive and negative terms together', () => {
    const tokens = [
      { value: ' Alpha ', negated: false },
      { value: 'review', negated: true },
    ];
    const results = searchNodes(nodes, tokens);
    expect(results.map(node => node.id)).toEqual(['n_alpha']);
  });

  it('filters empty pre-tokenized entries after normalization', () => {
    const tokens = [
      { value: 'alpha', negated: false },
      { value: '---', negated: false },
      { value: 'review', negated: true },
    ];
    const results = searchNodes(nodes, tokens);
    expect(results.map(node => node.id)).toEqual(['n_alpha']);
  });

  it('supports negative terms for exclusion', () => {
    const results = searchNodes(nodes, 'alpha -review');
    expect(results.map(node => node.id)).toEqual(['n_alpha']);
  });

  it('supports unicode dash negation in search queries', () => {
    const minusResults = searchNodes(nodes, 'alpha −review');
    expect(minusResults.map(node => node.id)).toEqual(['n_alpha']);

    const emDashResults = searchNodes(nodes, 'alpha —review');
    expect(emDashResults.map(node => node.id)).toEqual(['n_alpha']);
  });

  it('supports multi-term include and multi-term exclude combinations', () => {
    const results = searchNodes(nodes, 'alpha root -review -beta');
    expect(results.map(node => node.id)).toEqual(['n_alpha']);
  });

  it('supports multi-term include queries without excludes', () => {
    const results = searchNodes(nodes, 'alpha root');
    expect(results.map(node => node.id)).toEqual(['n_alpha', 'n_review']);
  });

  it('deduplicates repeated positive/negative terms during ranking checks', () => {
    const deduped = searchNodes(nodes, 'alpha -review');
    const repeated = searchNodes(nodes, 'alpha alpha -review -review');

    expect(repeated).toEqual(deduped);
  });

  it('supports pure negative filtering', () => {
    const results = searchNodes(nodes, '-review');
    expect(results.some(node => node.id === 'n_review')).toBe(false);
    expect(results.length).toBe(Object.keys(nodes).length - 1);
  });

  it('short-circuits contradictory include/exclude terms', () => {
    expect(searchNodes(nodes, 'alpha -alpha')).toEqual([]);
    expect(searchNodes(nodes, 'alpha alpha -alpha -alpha')).toEqual([]);
    expect(searchNodes(nodes, [
      { value: 'alpha', negated: false },
      { value: 'alpha', negated: true },
      { value: 'alpha', negated: false },
      { value: 'alpha', negated: true },
    ])).toEqual([]);
  });

  it('can match descendants by ancestor path terms', () => {
    const results = searchNodes(nodes, 'alpha');
    expect(results.map(node => node.id)).toEqual(['n_alpha', 'n_review']);
  });

  it('applies result limit after ranking', () => {
    const results = searchNodes(nodes, 'a', 2);
    expect(results).toHaveLength(2);
  });

  it('normalizes non-integer/negative result limits', () => {
    expect(searchNodes(nodes, 'a', 2.9)).toHaveLength(2);
    expect(searchNodes(nodes, 'a', -5)).toHaveLength(0);
  });

  it('defaults non-finite result limits to 20', () => {
    const defaultLimited = searchNodes(nodes, 'a', DEFAULT_SEARCH_RESULT_LIMIT);

    expect(searchNodes(nodes, 'a', Number.NaN)).toEqual(defaultLimited);
    expect(searchNodes(nodes, 'a', Number.POSITIVE_INFINITY)).toEqual(defaultLimited);
    expect(searchNodes(nodes, 'a', Number.NEGATIVE_INFINITY)).toEqual(defaultLimited);
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

  it('matches diacritic-insensitive queries against labels and paths', () => {
    const accented: Record<string, Node> = {
      root: { id: 'root', text: 'Café', x: 0, y: 0, parentId: null, children: ['n1'] },
      n1: { id: 'n1', text: 'Résumé', x: 0, y: 0, parentId: 'root', children: [] },
    };

    const direct = searchNodes(accented, 'resume');
    expect(direct.map(node => node.id)).toEqual(['n1']);

    const pathAware = searchNodes(accented, 'cafe resume');
    expect(pathAware.map(node => node.id)).toEqual(['n1']);
  });

  it('matches punctuation-insensitive ids and labels', () => {
    const punct: Record<string, Node> = {
      root: { id: 'n_root', text: 'Root', x: 0, y: 0, parentId: null, children: ['n1'] },
      n1: { id: 'node-1', text: 'Auto-Scale', x: 0, y: 0, parentId: 'n_root', children: [] },
    };

    expect(searchNodes(punct, 'n-root').map(node => node.id)).toEqual(['n_root']);
    expect(searchNodes(punct, 'auto scale').map(node => node.id)).toEqual(['node-1']);
  });

  it('matches camelCase and mixed alnum boundaries', () => {
    const camel: Record<string, Node> = {
      root: { id: 'rootNode', text: 'Root', x: 0, y: 0, parentId: null, children: ['n1'] },
      n1: { id: 'autoScaleV2', text: 'BudgetTrackerV2', x: 0, y: 0, parentId: 'rootNode', children: [] },
    };

    expect(searchNodes(camel, 'auto scale v2').map(node => node.id)).toEqual(['autoScaleV2']);
    expect(searchNodes(camel, 'budget tracker v2').map(node => node.id)).toEqual(['autoScaleV2']);
  });

  it('keeps same-rank results deterministic by text then id', () => {
    const sameText: Record<string, Node> = {
      root: { id: 'root', text: 'Root', x: 0, y: 0, parentId: null, children: ['node_b', 'node_a'] },
      node_b: { id: 'node_b', text: 'Alpha', x: 0, y: 0, parentId: 'root', children: [] },
      node_a: { id: 'node_a', text: 'Alpha', x: 0, y: 0, parentId: 'root', children: [] },
    };

    expect(searchNodes(sameText, 'alpha').map(node => node.id)).toEqual(['node_a', 'node_b']);
  });
});
