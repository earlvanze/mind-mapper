import { describe, expect, it } from 'vitest';
import { clampScale, distance, midpoint, type Point } from './panZoomMath';

describe('panZoomMath', () => {
  describe('clampScale', () => {
    it('returns value within default bounds [0.4, 2]', () => {
      expect(clampScale(1)).toBe(1);
      expect(clampScale(0.5)).toBe(0.5);
      expect(clampScale(1.5)).toBe(1.5);
    });

    it('clamps below min to 0.4', () => {
      expect(clampScale(0)).toBe(0.4);
      expect(clampScale(-1)).toBe(0.4);
      expect(clampScale(0.3)).toBe(0.4);
    });

    it('clamps above max to 2', () => {
      expect(clampScale(3)).toBe(2);
      expect(clampScale(100)).toBe(2);
      expect(clampScale(2.1)).toBe(2);
    });
  });

  describe('distance', () => {
    it('returns 0 for identical points', () => {
      const p: Point = { x: 10, y: 20 };
      expect(distance(p, p)).toBe(0);
    });

    it('computes horizontal distance', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3);
    });

    it('computes vertical distance', () => {
      expect(distance({ x: 0, y: 0 }, { x: 0, y: 4 })).toBe(4);
    });

    it('computes diagonal distance (3-4-5 triangle)', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });

    it('is symmetric', () => {
      const a: Point = { x: 1, y: 2 };
      const b: Point = { x: 4, y: 6 };
      expect(distance(a, b)).toBe(distance(b, a));
    });

    it('handles negative coordinates', () => {
      expect(distance({ x: -3, y: -4 }, { x: 0, y: 0 })).toBe(5);
    });
  });

  describe('midpoint', () => {
    it('returns midpoint of two points', () => {
      expect(midpoint({ x: 0, y: 0 }, { x: 10, y: 20 })).toEqual({ x: 5, y: 10 });
    });

    it('handles identical points', () => {
      const p: Point = { x: 7, y: 7 };
      expect(midpoint(p, p)).toEqual({ x: 7, y: 7 });
    });

    it('handles negative coordinates', () => {
      expect(midpoint({ x: -10, y: -20 }, { x: 10, y: 20 })).toEqual({ x: 0, y: 0 });
    });

    it('is symmetric', () => {
      const a: Point = { x: 2, y: 3 };
      const b: Point = { x: 8, y: 11 };
      expect(midpoint(a, b)).toEqual(midpoint(b, a));
    });
  });
});
