import { describe, expect, it } from 'vitest';
import { normalizeNonNegativeInt, normalizeNonNegativeIntOrDefault } from './countNormalize';

describe('normalizeNonNegativeInt', () => {
  it('normalizes finite values to truncated non-negative ints', () => {
    expect(normalizeNonNegativeInt(3.9)).toBe(3);
    expect(normalizeNonNegativeInt(-3.9)).toBe(0);
  });

  it('normalizes non-finite values to zero', () => {
    expect(normalizeNonNegativeInt(Number.NaN)).toBe(0);
    expect(normalizeNonNegativeInt(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('normalizeNonNegativeIntOrDefault', () => {
  it('returns normalized value when finite', () => {
    expect(normalizeNonNegativeIntOrDefault(12.8, 5)).toBe(12);
    expect(normalizeNonNegativeIntOrDefault(-12.8, 5)).toBe(0);
  });

  it('falls back to normalized default when value is non-finite', () => {
    expect(normalizeNonNegativeIntOrDefault(Number.NaN, 20.9)).toBe(20);
    expect(normalizeNonNegativeIntOrDefault(Number.POSITIVE_INFINITY, -5)).toBe(0);
  });
});
