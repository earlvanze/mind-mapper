import { describe, expect, it } from 'vitest';
import { edgePath } from './edgePath';

describe('edgePath', () => {
  it('returns cubic bezier path string', () => {
    const d = edgePath(10, 20, 110, 40);
    expect(d.startsWith('M 10 20 C')).toBe(true);
    expect(d.endsWith(', 110 40')).toBe(true);
  });

  it('clamps bend for very long edges', () => {
    const d = edgePath(0, 0, 1000, 0);
    expect(d).toContain('C 180 0, 820 0, 1000 0');
  });
});
