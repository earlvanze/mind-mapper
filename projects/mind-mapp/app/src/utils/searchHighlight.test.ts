import { describe, expect, it } from 'vitest';
import { computeHighlightRanges, foldSearchText } from './searchHighlight';

describe('foldSearchText', () => {
  it('normalizes diacritics and whitespace', () => {
    expect(foldSearchText('  Café   Résumé  ').text).toBe('cafe resume');
  });
});

describe('computeHighlightRanges', () => {
  it('matches direct substrings', () => {
    expect(computeHighlightRanges('Alpha Review', ['review'])).toEqual([{ start: 6, end: 12 }]);
  });

  it('matches diacritic-insensitive phrases', () => {
    expect(computeHighlightRanges('Café Résumé', ['cafe resume'])).toEqual([{ start: 0, end: 11 }]);
  });

  it('matches phrases across irregular whitespace', () => {
    expect(computeHighlightRanges('Alpha   Review', ['alpha review'])).toEqual([{ start: 0, end: 14 }]);
  });

  it('merges overlapping ranges', () => {
    expect(computeHighlightRanges('alpha', ['al', 'pha'])).toEqual([{ start: 0, end: 5 }]);
  });

  it('returns empty ranges for empty terms', () => {
    expect(computeHighlightRanges('alpha', [])).toEqual([]);
  });
});
