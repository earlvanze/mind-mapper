export type HighlightRange = {
  start: number;
  end: number;
};

const DIACRITIC_RE = /[\u0300-\u036f]/g;

export function foldSearchText(source: string): { text: string; map: number[] } {
  const rawChars: string[] = [];
  const rawMap: number[] = [];

  for (let i = 0; i < source.length; i += 1) {
    const current = source[i];
    const previous = i > 0 ? source[i - 1] : '';

    const prevIsLower = /[a-z]/.test(previous);
    const prevIsLetter = /[A-Za-z]/.test(previous);
    const prevIsDigit = /\d/.test(previous);
    const currentIsUpper = /[A-Z]/.test(current);
    const currentIsLetter = /[A-Za-z]/.test(current);
    const currentIsDigit = /\d/.test(current);

    if (
      (prevIsLower && currentIsUpper)
      || (prevIsLetter && currentIsDigit)
      || (prevIsDigit && currentIsLetter)
    ) {
      rawChars.push(' ');
      rawMap.push(i);
    }

    const folded = current
      .normalize('NFD')
      .replace(DIACRITIC_RE, '')
      .toLowerCase()
      .replace(/[-_./:]+/g, ' ');

    for (let j = 0; j < folded.length; j += 1) {
      rawChars.push(folded[j]);
      rawMap.push(i);
    }
  }

  const chars: string[] = [];
  const map: number[] = [];
  let inWhitespace = false;

  for (let i = 0; i < rawChars.length; i += 1) {
    const char = rawChars[i];
    if (/\s/.test(char)) {
      if (!chars.length || inWhitespace) continue;
      chars.push(' ');
      map.push(rawMap[i]);
      inWhitespace = true;
      continue;
    }

    chars.push(char);
    map.push(rawMap[i]);
    inWhitespace = false;
  }

  if (chars[chars.length - 1] === ' ') {
    chars.pop();
    map.pop();
  }

  return {
    text: chars.join(''),
    map,
  };
}

export function computeHighlightRanges(source: string, terms: string[]): HighlightRange[] {
  if (!source) return [];
  if (!terms.length) return [];

  const foldedSource = foldSearchText(source);
  if (!foldedSource.text) return [];

  const normalizedTerms = [...new Set(
    terms
      .map(term => foldSearchText(term).text)
      .filter(Boolean),
  )];

  if (!normalizedTerms.length) return [];

  const ranges: HighlightRange[] = [];

  for (const term of normalizedTerms) {
    let cursor = 0;
    while (cursor < foldedSource.text.length) {
      const at = foldedSource.text.indexOf(term, cursor);
      if (at === -1) break;

      const start = foldedSource.map[at];
      const endAt = foldedSource.map[at + term.length - 1];
      const end = (endAt ?? start) + 1;
      ranges.push({ start, end });

      cursor = at + term.length;
    }
  }

  if (!ranges.length) return [];

  ranges.sort((a, b) => a.start - b.start || b.end - a.end);

  const merged: HighlightRange[] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (!last || range.start > last.end) {
      merged.push({ ...range });
      continue;
    }

    if (range.end > last.end) {
      last.end = range.end;
    }
  }

  return merged;
}
