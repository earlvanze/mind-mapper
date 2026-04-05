import { describe, it, expect } from 'vitest';
import { computeFitView } from './fitViewMath';

describe('fitViewMath', () => {
  describe('computeFitView', () => {
    it('returns default when nodes array is empty', () => {
      const result = computeFitView([], { width: 800, height: 600 });
      expect(result).toEqual({ originX: 0, originY: 0, scale: 1 });
    });

    it('returns default when viewport width is zero', () => {
      const result = computeFitView([{ x: 100, y: 100 }], { width: 0, height: 600 });
      expect(result).toEqual({ originX: 0, originY: 0, scale: 1 });
    });

    it('returns default when viewport height is zero', () => {
      const result = computeFitView([{ x: 100, y: 100 }], { width: 800, height: 0 });
      expect(result).toEqual({ originX: 0, originY: 0, scale: 1 });
    });

    it('scales content to fit viewport with padding', () => {
      // Two nodes far apart: bounding box 400x300
      // padding=100 → width=500, height=400
      // scaleX = 800/500 = 1.6, scaleY = 600/400 = 1.5 → min = 1.5, clamped to maxScale 1.6 → 1.5
      const result = computeFitView(
        [{ x: 0, y: 0 }, { x: 400, y: 300 }],
        { width: 800, height: 600 },
        { padding: 100, minScale: 0.1, maxScale: 1.6 }
      );
      expect(result.scale).toBeCloseTo(1.5);
      expect(result.originX).toBe(50);  // -0 + 50
      expect(result.originY).toBe(50);  // -0 + 50
    });

    it('clamps scale to minScale when content is very large', () => {
      // Nodes at 0 and (5000, 4000): bounding box 5000x4000
      // padding=100 → width=5100, height=4100
      // scaleX = 800/5100 ≈ 0.157, scaleY = 600/4100 ≈ 0.146 → min ≈ 0.146, clamped to minScale 0.4
      const result = computeFitView(
        [{ x: 0, y: 0 }, { x: 5000, y: 4000 }],
        { width: 800, height: 600 },
        { minScale: 0.4, maxScale: 1.6 }
      );
      expect(result.scale).toBe(0.4); // clamped to minScale
    });

    it('clamps scale to maxScale when content is very small', () => {
      // Nodes at (0,0) and (10,10): bounding box 10x10
      // padding=100 → width=110, height=110
      // scaleX = 800/110 ≈ 7.27, scaleY = 600/110 ≈ 5.45 → min ≈ 5.45, clamped to maxScale 1.6
      const result = computeFitView(
        [{ x: 0, y: 0 }, { x: 10, y: 10 }],
        { width: 800, height: 600 },
        { minScale: 0.1, maxScale: 1.6 }
      );
      expect(result.scale).toBe(1.6); // clamped to maxScale
    });

    it('applies custom padding', () => {
      const result = computeFitView(
        [{ x: 0, y: 0 }, { x: 100, y: 100 }],
        { width: 800, height: 600 },
        { padding: 200, minScale: 0.1, maxScale: 1.6 }
      );
      // minX=0, maxX=100, minY=0, maxY=100
      // width = 100-0+200 = 300, height = 100-0+200 = 300
      // scaleX = 800/300 ≈ 2.67, scaleY = 600/300 = 2 → min=2, maxScale=1.6 → clamped to 1.6
      expect(result.scale).toBe(1.6);
      expect(result.originX).toBe(100); // -0 + 200/2
      expect(result.originY).toBe(100); // -0 + 200/2
    });

    it('handles negative coordinate ranges', () => {
      const result = computeFitView(
        [{ x: -500, y: -300 }, { x: -400, y: -200 }],
        { width: 800, height: 600 },
        { padding: 100, minScale: 0.1, maxScale: 1.6 }
      );
      // minX=-500, maxX=-400 → width = 100+100=200
      // minY=-300, maxY=-200 → height = 100+100=200
      // scaleX = 800/200 = 4, scaleY = 600/200 = 3 → min=3, maxScale=1.6 → clamped to 1.6
      expect(result.scale).toBe(1.6);
      expect(result.originX).toBe(550); // -minX + padding/2 = 500 + 50 = 550
      expect(result.originY).toBe(350); // -minY + padding/2 = 300 + 50 = 350
    });

    it('uses defaults when options not provided', () => {
      // With single node at (0,0) and default options: padding=100, minScale=0.4, maxScale=1.6
      // width=100, height=100, scaleX=8, scaleY=6 → min=6 → clamped to 1.6
      const result = computeFitView([{ x: 0, y: 0 }], { width: 800, height: 600 });
      expect(result.scale).toBeLessThanOrEqual(1.6);
      expect(result.scale).toBeGreaterThan(0);
    });

    it('returns {originX:0,originY:0,scale:1} for empty nodes regardless of viewport', () => {
      const result = computeFitView([], { width: 1920, height: 1080 });
      expect(result).toEqual({ originX: 0, originY: 0, scale: 1 });
    });
  });
});
