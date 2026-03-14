import { describe, expect, it } from 'vitest';
import { edgeMiniViewportCenter, getMapBounds, mapToMini, miniToWorld, miniViewportPageStep, offsetMiniViewportCenter, worldRectToMini } from './minimap';
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

  it('maps world viewport rectangle into mini-map bounds', () => {
    const mini = worldRectToMini(
      { x: 100, y: 50, width: 200, height: 100 },
      { minX: 0, minY: 0, width: 1000, height: 500 },
      200,
      100,
    );

    expect(mini).toEqual({ x: 20, y: 10, width: 40, height: 20 });
  });

  it('maps mini-map clicks back into world coordinates', () => {
    const world = miniToWorld(100, 50, { minX: -200, minY: 100, width: 800, height: 400 }, 200, 100);
    expect(world).toEqual({ x: 200, y: 300 });
  });

  it('clamps tiny viewport rectangles to minimum size', () => {
    const mini = worldRectToMini(
      { x: 2, y: 2, width: 1, height: 1 },
      { minX: 0, minY: 0, width: 2000, height: 2000 },
      200,
      120,
      10,
    );

    expect(mini.width).toBe(10);
    expect(mini.height).toBe(10);
  });

  it('offsets viewport center and clamps to mini-map bounds', () => {
    const center = offsetMiniViewportCenter(
      { x: 20, y: 10, width: 60, height: 30 },
      -100,
      100,
      180,
      120,
    );

    expect(center).toEqual({ x: 30, y: 105 });
  });

  it('jumps viewport center to home/end edges', () => {
    const viewRect = { x: 20, y: 10, width: 60, height: 30 };

    expect(edgeMiniViewportCenter(viewRect, 'home', 180, 120)).toEqual({ x: 30, y: 15 });
    expect(edgeMiniViewportCenter(viewRect, 'end', 180, 120)).toEqual({ x: 150, y: 105 });
  });

  it('computes page steps with ratio + minimum clamp', () => {
    const viewRect = { x: 0, y: 0, width: 60, height: 30 };

    expect(miniViewportPageStep(viewRect, 'y')).toBe(24);
    expect(miniViewportPageStep(viewRect, 'x')).toBe(48);
  });
});
