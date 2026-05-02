import { describe, expect, it } from 'vitest';
import { parseImportPayload } from './importValidation';
import type { Node } from '../store/useMindMapStore';

function makeValidNodes(): Record<string, Node> {
  return {
    n_root: { id: 'n_root', text: 'Root', x: 0, y: 0, parentId: null, children: ['n_a'] },
    n_a: { id: 'n_a', text: 'A', x: 120, y: 0, parentId: 'n_root', children: ['n_b'] },
    n_b: { id: 'n_b', text: 'B', x: 240, y: 0, parentId: 'n_a', children: [] },
  };
}

describe('parseImportPayload', () => {
  it('accepts valid versioned payload', () => {
    const nodes = makeValidNodes();
    const parsed = parseImportPayload({ version: 1, nodes });
    expect(parsed).toEqual(nodes);
  });

  it('rejects payload without root', () => {
    const nodes = makeValidNodes();
    delete nodes.n_root;

    expect(() => parseImportPayload({ version: 1, nodes })).toThrow('missing root node "n_root"');
  });

  it('rejects parent/child mismatch', () => {
    const nodes = makeValidNodes();
    nodes.n_a.parentId = 'n_b';

    expect(() => parseImportPayload({ version: 1, nodes })).toThrow('parent mismatch');
  });

  it('rejects self-parent loops', () => {
    const nodes = makeValidNodes();
    nodes.n_b.parentId = 'n_b';

    expect(() => parseImportPayload({ version: 1, nodes })).toThrow('cannot parent itself');
  });

  it('rejects unreachable subgraphs', () => {
    const nodes = makeValidNodes();
    nodes.n_x = { id: 'n_x', text: 'X', x: 50, y: 50, parentId: 'n_y', children: ['n_y'] };
    nodes.n_y = { id: 'n_y', text: 'Y', x: 80, y: 80, parentId: 'n_x', children: ['n_x'] };

    expect(() => parseImportPayload({ version: 1, nodes })).toThrow('orphan/unreachable nodes');
  });

  it('accepts legacy bare nodes payload', () => {
    const nodes = makeValidNodes();
    const parsed = parseImportPayload(nodes);
    expect(parsed.n_root.id).toBe('n_root');
  });
});
