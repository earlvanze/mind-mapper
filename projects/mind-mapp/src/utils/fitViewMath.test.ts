import { describe, expect, it } from 'vitest';
import { computeFitView } from './fitViewMath';

describe('computeFitView', () => {
  it('returns default view when empty', () => {
    expect(computeFitView([], { width: 1000, height: 600 })).toEqual({
      originX: 0,
      originY: 0,
      scale: 1,
    });
  });

  it('computes bounded scale and origin', () => {
    const result = computeFitView(
      [
        { x: 100, y: 120 },
        { x: 500, y: 380 },
      ],
      { width: 900, height: 600 },
      { padding: 100, minScale: 0.4, maxScale: 1.6 },
    );

    expect(result.originX).toBe(-50);
    expect(result.originY).toBe(-70);
    expect(result.scale).toBeGreaterThanOrEqual(0.4);
    expect(result.scale).toBeLessThanOrEqual(1.6);
  });
});
