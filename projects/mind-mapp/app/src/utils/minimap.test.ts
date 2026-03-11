import { describe, expect, it } from 'vitest';
import { getMapBounds, mapToMini } from './minimap';
import type { Node } from '../store/useMindMapStore';

describe('minimap utils', () => {
  it('computes non-zero bounds', () => {
    const nodes: Record<string, Node> = {
      a: { id: 'a', text: 'A', x: 100, y: 200, parentId: null, children: [] },
      b: { id: 'b', text: 'B', x: 400, y: 500, parentId: 'a', children: [] },
    };

    const bounds = getMapBounds(nodes, 20);
    expect(bounds.minX).toBe(80);
    expect(bounds.minY).toBe(180);
    expect(bounds.width).toBe(340);
    expect(bounds.height).toBe(340);
  });

  it('maps coordinates into mini-map space', () => {
    const p = mapToMini(50, 75, { minX: 0, minY: 0, width: 100, height: 100 }, 200, 120);
    expect(p).toEqual({ x: 100, y: 90 });
  });
});
