import type { Shortcut } from './shortcuts';

type ShortcutHaystackCacheEntry = {
  source: string;
  haystack: string;
};

const shortcutHaystackCache = new WeakMap<Shortcut, ShortcutHaystackCacheEntry>();

const SHORTCUT_NON_WHITESPACE_RE = /\S/;
const EMPTY_SHORTCUT_QUERY_TERMS: readonly string[] = Object.freeze([] as string[]);

let lastShortcutQuery = '';
let lastShortcutQueryTerms: readonly string[] = EMPTY_SHORTCUT_QUERY_TERMS;

function dedupeNormalizedShortcutTerms(terms: string[]): readonly string[] {
  if (terms.length < 2) {
    return Object.freeze(terms);
  }

  if (terms.length === 2) {
    if (terms[0] === terms[1]) {
      return Object.freeze([terms[0]]);
    }

    return Object.freeze(terms);
  }

  const deduped: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < terms.length; i += 1) {
    const term = terms[i];
    if (seen.has(term)) continue;
    seen.add(term);
    deduped.push(term);
  }

  return Object.freeze(deduped);
}

function normalizeShortcutText(value: string): string {
  if (!value) return '';

  return value
    .toLowerCase()
    .replace(/\bforward\s+slash\b/g, 'slash')
    .replace(/\bquestion\s+mark\b/g, 'slash')
    .replace(/\bcmd\/ctrl\b/g, 'cmd ctrl')
    .replace(/\bctrl\/cmd\b/g, 'cmd ctrl')
    .replace(/\//g, ' slash ')
    .replace(/\+/g, ' plus ')
    .replace(/\?/g, ' question ')
    .replace(/</g, ' less ')
    .replace(/>/g, ' greater ')
    .replace(/,/g, ' comma ')
    .replace(/\./g, ' dot ')
    .replace(/\bcontrol\b/g, 'ctrl')
    .replace(/\bcommand\b/g, 'cmd')
    .replace(/\bescape\b/g, 'esc')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getShortcutHaystack(shortcut: Shortcut): string {
  const source = `${shortcut.key} ${shortcut.desc}`;
  const cached = shortcutHaystackCache.get(shortcut);
  if (cached && cached.source === source) {
    return cached.haystack;
  }

  const haystack = normalizeShortcutText(source);
  shortcutHaystackCache.set(shortcut, { source, haystack });
  return haystack;
}

export function tokenizeShortcutQuery(query: string): readonly string[] {
  if (!SHORTCUT_NON_WHITESPACE_RE.test(query)) {
    lastShortcutQuery = '';
    lastShortcutQueryTerms = EMPTY_SHORTCUT_QUERY_TERMS;
    return lastShortcutQueryTerms;
  }

  const normalizedQuery = normalizeShortcutText(query);
  if (normalizedQuery === lastShortcutQuery) {
    return lastShortcutQueryTerms;
  }

  if (!normalizedQuery) {
    lastShortcutQuery = normalizedQuery;
    lastShortcutQueryTerms = EMPTY_SHORTCUT_QUERY_TERMS;
    return lastShortcutQueryTerms;
  }

  const terms = normalizedQuery.split(' ');

  lastShortcutQuery = normalizedQuery;
  lastShortcutQueryTerms = dedupeNormalizedShortcutTerms(terms);
  return lastShortcutQueryTerms;
}

function matchesShortcutTerms(haystack: string, terms: readonly string[]): boolean {
  if (terms.length === 1) {
    return haystack.includes(terms[0]);
  }

  if (terms.length === 2) {
    return haystack.includes(terms[0]) && haystack.includes(terms[1]);
  }

  for (let i = 0; i < terms.length; i += 1) {
    if (!haystack.includes(terms[i])) {
      return false;
    }
  }

  return true;
}

export function filterShortcuts(shortcuts: Shortcut[], query: string): Shortcut[] {
  if (!shortcuts.length) return shortcuts;

  const terms = tokenizeShortcutQuery(query);
  if (!terms.length) return shortcuts;

  const filtered: Shortcut[] = [];

  for (let i = 0; i < shortcuts.length; i += 1) {
    const shortcut = shortcuts[i];
    const haystack = getShortcutHaystack(shortcut);
    if (matchesShortcutTerms(haystack, terms)) {
      filtered.push(shortcut);
    }
  }

  return filtered;
}
