import { describe, expect, it } from 'vitest';
import { centerPointInView } from './viewMath';

describe('centerPointInView', () => {
  it('centers a point using current scale', () => {
    const centered = centerPointInView({ x: 200, y: 100 }, { width: 800, height: 600 }, 1.5);
    expect(centered).toEqual({ originX: 100, originY: 150 });
  });

  it('supports scale 1', () => {
    const centered = centerPointInView({ x: 50, y: 20 }, { width: 500, height: 300 }, 1);
    expect(centered).toEqual({ originX: 200, originY: 130 });
  });
});
