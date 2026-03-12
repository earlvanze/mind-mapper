import { describe, expect, it } from 'vitest';
import type { Node } from '../store/useMindMapStore';
import { searchNodes } from './searchNodes';

const nodes: Record<string, Node> = {
  n_root: { id: 'n_root', text: 'Root', x: 0, y: 0, parentId: null, children: ['n_alpha', 'n_beta', 'n_alpine'] },
  n_alpha: { id: 'n_alpha', text: 'Alpha', x: 0, y: 0, parentId: 'n_root', children: ['n_review'] },
  n_beta: { id: 'n_beta', text: 'Beta', x: 0, y: 0, parentId: 'n_root', children: [] },
  n_alpine: { id: 'n_alpine', text: 'Alpine', x: 0, y: 0, parentId: 'n_root', children: [] },
  n_review: { id: 'n_review', text: 'Review', x: 0, y: 0, parentId: 'n_alpha', children: [] },
  node_x1: { id: 'node_x1', text: 'Gamma', x: 0, y: 0, parentId: 'n_root', children: [] },
};

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

  it('can match descendants by ancestor path terms', () => {
    const results = searchNodes(nodes, 'alpha');
    expect(results.map(node => node.id)).toEqual(['n_alpha', 'n_review']);
  });

  it('applies result limit after ranking', () => {
    const results = searchNodes(nodes, 'a', 2);
    expect(results).toHaveLength(2);
  });
});
