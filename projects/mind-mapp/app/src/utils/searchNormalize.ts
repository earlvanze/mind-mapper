const DIACRITIC_RE = /[\u0300-\u036f]/g;

function isAsciiLower(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 97 && code <= 122;
}

function isAsciiUpper(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 65 && code <= 90;
}

function isAsciiDigit(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 48 && code <= 57;
}

function isAsciiLetter(char: string): boolean {
  return isAsciiLower(char) || isAsciiUpper(char);
}

export function shouldInsertSearchBoundary(previous: string, current: string): boolean {
  if (!previous || !current) return false;

  const prevIsLower = isAsciiLower(previous);
  const prevIsLetter = isAsciiLetter(previous);
  const prevIsDigit = isAsciiDigit(previous);
  const currentIsUpper = isAsciiUpper(current);
  const currentIsLetter = isAsciiLetter(current);
  const currentIsDigit = isAsciiDigit(current);

  return (
    (prevIsLower && currentIsUpper)
    || (prevIsLetter && currentIsDigit)
    || (prevIsDigit && currentIsLetter)
  );
}

export function foldSearchCharacter(char: string): string {
  return char
    .normalize('NFD')
    .replace(DIACRITIC_RE, '')
    .toLowerCase()
    .replace(/[-_./:]+/g, ' ');
}

export function normalizeSearchText(value: string): string {
  const pieces: string[] = [];

  for (let i = 0; i < value.length; i += 1) {
    const current = value[i];
    const previous = i > 0 ? value[i - 1] : '';

    if (shouldInsertSearchBoundary(previous, current)) {
      pieces.push(' ');
    }

    pieces.push(foldSearchCharacter(current));
  }

  return pieces
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}
