import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uid } from './id';

describe('uid', () => {
  it('generates prefixed IDs', () => {
    const id = uid('n');
    expect(id.startsWith('n_')).toBe(true);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => uid()));
    expect(ids.size).toBe(100);
  });

  it('uses default prefix when none provided', () => {
    const id = uid();
    expect(id.startsWith('n_')).toBe(true);
  });
});
