import { describe, expect, it } from 'vitest';
import { foldSearchCharacter, normalizeSearchText, shouldInsertSearchBoundary } from './searchNormalize';

describe('searchNormalize', () => {
  it('inserts boundaries for camelCase and alnum transitions', () => {
    expect(shouldInsertSearchBoundary('o', 'S')).toBe(true);
    expect(shouldInsertSearchBoundary('e', '2')).toBe(true);
    expect(shouldInsertSearchBoundary('2', 'a')).toBe(true);
    expect(shouldInsertSearchBoundary('A', 'B')).toBe(false);
  });

  it('returns false for empty and non-alnum transitions', () => {
    expect(shouldInsertSearchBoundary('', 'A')).toBe(false);
    expect(shouldInsertSearchBoundary('a', '')).toBe(false);
    expect(shouldInsertSearchBoundary('-', 'A')).toBe(false);
    expect(shouldInsertSearchBoundary('A', '-')).toBe(false);
  });

  it('folds characters with diacritics and punctuation', () => {
    expect(foldSearchCharacter('é')).toBe('e');
    expect(foldSearchCharacter('-')).toBe(' ');
  });

  it('normalizes full strings consistently', () => {
    expect(normalizeSearchText('AutoScaleV2 / Café')).toBe('auto scale v 2 cafe');
  });
});
