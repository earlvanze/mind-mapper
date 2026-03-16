import type { Shortcut } from './shortcuts';

type ShortcutHaystackCacheEntry = {
  source: string;
  haystack: string;
};

const shortcutHaystackCache = new WeakMap<Shortcut, ShortcutHaystackCacheEntry>();

const SHORTCUT_NON_WHITESPACE_RE = /\S/;
const SHORTCUT_FORWARD_SLASH_RE = /\bforward\s+slash\b/g;
const SHORTCUT_QUESTION_MARK_RE = /\bquestion\s+mark\b/g;
const SHORTCUT_CMD_CTRL_RE = /\bcmd\/ctrl\b/g;
const SHORTCUT_CTRL_CMD_RE = /\bctrl\/cmd\b/g;
const SHORTCUT_SLASH_RE = /\//g;
const SHORTCUT_PLUS_RE = /\+/g;
const SHORTCUT_QUESTION_RE = /\?/g;
const SHORTCUT_LESS_RE = /</g;
const SHORTCUT_GREATER_RE = />/g;
const SHORTCUT_COMMA_RE = /,/g;
const SHORTCUT_DOT_RE = /\./g;
const SHORTCUT_CONTROL_RE = /\bcontrol\b/g;
const SHORTCUT_COMMAND_RE = /\bcommand\b/g;
const SHORTCUT_ESCAPE_RE = /\bescape\b/g;
const SHORTCUT_NON_ALNUM_RE = /[^a-z0-9]+/g;
const SHORTCUT_MULTI_SPACE_RE = /\s+/g;

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
    .replace(SHORTCUT_FORWARD_SLASH_RE, 'slash')
    .replace(SHORTCUT_QUESTION_MARK_RE, 'slash')
    .replace(SHORTCUT_CMD_CTRL_RE, 'cmd ctrl')
    .replace(SHORTCUT_CTRL_CMD_RE, 'cmd ctrl')
    .replace(SHORTCUT_SLASH_RE, ' slash ')
    .replace(SHORTCUT_PLUS_RE, ' plus ')
    .replace(SHORTCUT_QUESTION_RE, ' question ')
    .replace(SHORTCUT_LESS_RE, ' less ')
    .replace(SHORTCUT_GREATER_RE, ' greater ')
    .replace(SHORTCUT_COMMA_RE, ' comma ')
    .replace(SHORTCUT_DOT_RE, ' dot ')
    .replace(SHORTCUT_CONTROL_RE, 'ctrl')
    .replace(SHORTCUT_COMMAND_RE, 'cmd')
    .replace(SHORTCUT_ESCAPE_RE, 'esc')
    .replace(SHORTCUT_NON_ALNUM_RE, ' ')
    .replace(SHORTCUT_MULTI_SPACE_RE, ' ')
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
