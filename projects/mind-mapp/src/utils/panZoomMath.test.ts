import { describe, expect, it } from 'vitest';
import { clampScale, distance, midpoint } from './panZoomMath';

describe('panZoomMath', () => {
  it('clamps scale into allowed range', () => {
    expect(clampScale(0.1)).toBe(0.4);
    expect(clampScale(1.25)).toBe(1.25);
    expect(clampScale(3)).toBe(2);
  });

  it('computes touch distance and midpoint', () => {
    const a = { x: 0, y: 0 };
    const b = { x: 6, y: 8 };
    expect(distance(a, b)).toBe(10);
    expect(midpoint(a, b)).toEqual({ x: 3, y: 4 });
  });
});
