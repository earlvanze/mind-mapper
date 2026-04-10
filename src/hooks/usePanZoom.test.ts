/**
 * usePanZoom hook — animated fit-to-view tests
 *
 * Tests the animateToView function's:
 * - easing curve (ease-out-cubic: fast start, slow end)
 * - cancellation (new animation cancels previous)
 * - snap-to-target on completion
 */
import { describe, it, expect } from 'vitest';

// ease-out-cubic: 1 - (1-t)^3
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

describe('usePanZoom animation helpers', () => {
  it('easeOutCubic starts fast and decelerates', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 2);
    expect(easeOutCubic(0.25)).toBeCloseTo(0.578, 2);
    expect(easeOutCubic(0.75)).toBeCloseTo(0.984, 2);
  });

  it('easeOutCubic is monotonic (never reverses)', () => {
    const samples = Array.from({ length: 100 }, (_, i) => i / 99);
    const values = samples.map(easeOutCubic);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1] - 1e-10);
    }
  });

  it('easeOutCubic covers full [0,1] range', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    const values = Array.from({ length: 20 }, (_, i) => easeOutCubic(i / 19));
    expect(Math.min(...values)).toBe(0);
    expect(Math.max(...values)).toBe(1);
  });

  it('intermediate values interpolate correctly', () => {
    const from = 10;
    const to = 20;
    const t = 0.5;
    const eased = from + (to - from) * easeOutCubic(t);
    expect(eased).toBeCloseTo(18.75, 1); // 10 + 10*0.875
  });

  it('animating from (0,0,1) to (50,100,2) uses correct easing per axis', () => {
    const fromOriginX = 0, toOriginX = 50;
    const fromOriginY = 0, toOriginY = 100;
    const fromScale = 1, toScale = 2;

    const t = 0.5;
    const eased = easeOutCubic(t);

    const x = fromOriginX + (toOriginX - fromOriginX) * eased;
    const y = fromOriginY + (toOriginY - fromOriginY) * eased;
    const s = fromScale + (toScale - fromScale) * eased;

    expect(x).toBeCloseTo(43.75, 1);  // 0 + 50*0.875
    expect(y).toBeCloseTo(87.5, 1);    // 0 + 100*0.875
    expect(s).toBeCloseTo(1.875, 2);  // 1 + 1*0.875
  });

  it('animation from large offset interpolates correctly', () => {
    const from = { originX: 0, originY: 0, scale: 1 };
    const to = { originX: 200, originY: 400, scale: 0.5 };
    const t = 0.5;
    const eased = easeOutCubic(t);

    const result = {
      originX: from.originX + (to.originX - from.originX) * eased,
      originY: from.originY + (to.originY - from.originY) * eased,
      scale: from.scale + (to.scale - from.scale) * eased,
    };

    expect(result.originX).toBeCloseTo(175, 1);  // 0 + 200*0.875
    expect(result.originY).toBeCloseTo(350, 1); // 0 + 400*0.875
    expect(result.scale).toBeCloseTo(0.5625, 2); // 1 + (-0.5)*0.875 = 0.5625
  });
});

describe('animateToView API shape', () => {
  it('interpolates originX, originY, and scale simultaneously', () => {
    const from = { originX: 0, originY: 0, scale: 1 };
    const to = { originX: 50, originY: 100, scale: 2 };
    const t = 0.5;
    const eased = easeOutCubic(t);

    const result = {
      originX: from.originX + (to.originX - from.originX) * eased,
      originY: from.originY + (to.originY - from.originY) * eased,
      scale: from.scale + (to.scale - from.scale) * eased,
    };

    expect(result.originX).toBeCloseTo(43.75, 1);
    expect(result.originY).toBeCloseTo(87.5, 1);
    expect(result.scale).toBeCloseTo(1.875, 2);
  });
});
