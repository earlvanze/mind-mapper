import { describe, expect, it } from 'vitest';
import type { Node } from '../store/useMindMapStore';
import { formatFocusPath, formatSelectionText, formatSubtreeOutline } from './selectionText';

const nodes: Record<string, Node> = {
  n_root: { id: 'n_root', text: 'Root', x: 0, y: 0, parentId: null, children: ['a', 'b'] },
  a: { id: 'a', text: 'Alpha', x: 100, y: 200, parentId: 'n_root', children: ['a1'] },
  a1: { id: 'a1', text: 'Alpha Child', x: 120, y: 240, parentId: 'a', children: [] },
  b: { id: 'b', text: 'Beta', x: 50, y: 100, parentId: 'n_root', children: [] },
  c: { id: 'c', text: '   ', x: 200, y: 300, parentId: 'n_root', children: [] },
};

describe('formatSelectionText', () => {
  it('orders selected nodes by y then x', () => {
    expect(formatSelectionText(nodes, ['a', 'b'])).toBe('Beta\nAlpha');
  });

  it('falls back to focused node when selection is empty', () => {
    expect(formatSelectionText(nodes, [], 'n_root')).toBe('Root');
  });

  it('uses placeholder for blank labels and ignores unknown ids', () => {
    expect(formatSelectionText(nodes, ['missing', 'c'])).toBe('(untitled)');
  });
});

describe('formatSubtreeOutline', () => {
  it('formats focused subtree as indented outline preserving child order', () => {
    expect(formatSubtreeOutline(nodes, 'n_root')).toBe('- Root\n  - Alpha\n    - Alpha Child\n  - Beta');
  });

  it('returns empty string when root does not exist', () => {
    expect(formatSubtreeOutline(nodes, 'missing')).toBe('');
  });
});

describe('formatFocusPath', () => {
  it('formats focus ancestry from root to focused node', () => {
    expect(formatFocusPath(nodes, 'a1')).toBe('Root / Alpha / Alpha Child');
  });

  it('returns empty string when focus node does not exist', () => {
    expect(formatFocusPath(nodes, 'missing')).toBe('');
  });
});
