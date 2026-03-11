import { describe, expect, it } from 'vitest';
import { computeSelectionBounds } from './selectionBounds';
import type { Node } from '../store/useMindMapStore';

describe('computeSelectionBounds', () => {
  const nodes: Record<string, Node> = {
    a: { id: 'a', text: 'A', x: 100, y: 100, parentId: null, children: [] },
    b: { id: 'b', text: 'B', x: 220, y: 180, parentId: 'a', children: [] },
    c: { id: 'c', text: 'C', x: 300, y: 260, parentId: 'a', children: [] },
  };

  it('returns null for empty selection', () => {
    expect(computeSelectionBounds(nodes, [])).toBeNull();
  });

  it('computes width and height across selected nodes', () => {
    expect(computeSelectionBounds(nodes, ['a', 'c'])).toEqual({ width: 200, height: 160 });
  });

  it('ignores unknown selection ids', () => {
    expect(computeSelectionBounds(nodes, ['missing', 'b'])).toEqual({ width: 0, height: 0 });
  });
}
