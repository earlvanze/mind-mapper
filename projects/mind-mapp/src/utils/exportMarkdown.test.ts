import { describe, expect, it } from 'vitest';
import { toMarkdown } from './exportMarkdown';
import type { Node } from '../store/useMindMapStore';

describe('toMarkdown', () => {
  it('renders hierarchical bullets from root', () => {
    const nodes: Record<string, Node> = {
      n_root: { id: 'n_root', text: 'Root', x: 0, y: 0, parentId: null, children: ['n_a'] },
      n_a: { id: 'n_a', text: 'Alpha', x: 120, y: 0, parentId: 'n_root', children: ['n_b'] },
      n_b: { id: 'n_b', text: 'Beta', x: 240, y: 0, parentId: 'n_a', children: [] },
    };

    const md = toMarkdown(nodes);
    expect(md).toContain('# Mind Mapp');
    expect(md).toContain('- Root');
    expect(md).toContain('  - Alpha');
    expect(md).toContain('    - Beta');
  });

  it('includes unlinked nodes section when needed', () => {
    const nodes: Record<string, Node> = {
      n_root: { id: 'n_root', text: 'Root', x: 0, y: 0, parentId: null, children: [] },
      n_orphan: { id: 'n_orphan', text: 'Orphan', x: 10, y: 10, parentId: 'missing', children: [] },
    };

    const md = toMarkdown(nodes);
    expect(md).toContain('## Unlinked Nodes');
    expect(md).toContain('- Orphan');
  });
});
