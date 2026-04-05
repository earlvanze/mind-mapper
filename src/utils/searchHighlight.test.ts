import { describe, expect, it } from 'vitest';
import { computeHighlightRanges, foldSearchText } from './searchHighlight';

describe('foldSearchText', () => {
  it('normalizes diacritics and whitespace', () => {
    expect(foldSearchText('  Café   Résumé  ').text).toBe('cafe resume');
  });

  it('normalizes punctuation separators', () => {
    expect(foldSearchText('node-1 / auto_scale').text).toBe('node 1 auto scale');
  });

  it('normalizes camelCase and alnum boundaries', () => {
    expect(foldSearchText('AutoScaleV2').text).toBe('auto scale v 2');
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

  it('matches punctuation-insensitive phrases', () => {
    expect(computeHighlightRanges('Auto-Scale', ['auto scale'])).toEqual([{ start: 0, end: 10 }]);
  });

  it('matches camelCase phrases', () => {
    expect(computeHighlightRanges('AutoScaleV2', ['auto scale v2'])).toEqual([{ start: 0, end: 11 }]);
  });

  it('merges overlapping ranges', () => {
    expect(computeHighlightRanges('alpha', ['al', 'pha'])).toEqual([{ start: 0, end: 5 }]);
  });

  it('returns empty ranges for empty terms', () => {
    expect(computeHighlightRanges('alpha', [])).toEqual([]);
  });
});
