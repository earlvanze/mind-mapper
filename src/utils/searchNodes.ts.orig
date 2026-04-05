import type { Node } from '../store/useMindMapStore';
import { normalizeNonNegativeIntOrDefault } from './countNormalize';
import { normalizeSearchText } from './searchNormalize';

export type SearchToken = {
  value: string;
  negated: boolean;
};

export type SearchQueryInput = string | readonly SearchToken[];

const NORMALIZED_SEARCH_TOKEN_ARRAY = Symbol('mindmapp.normalizedSearchTokenArray');
type NormalizedSearchTokenArray = readonly SearchToken[] & { [NORMALIZED_SEARCH_TOKEN_ARRAY]: true };

function markNormalizedSearchTokens(tokens: SearchToken[]): NormalizedSearchTokenArray {
  Object.defineProperty(tokens, NORMALIZED_SEARCH_TOKEN_ARRAY, {
    value: true,
  });
  return Object.freeze(tokens) as NormalizedSearchTokenArray;
}

function buildNormalizedSearchTokens(
  input: readonly SearchToken[],
): NormalizedSearchTokenArray {
  const normalizedTokens: SearchToken[] = [];

  for (let i = 0; i < input.length; i += 1) {
    const token = input[i];
    const value = hasRegex(token.value) ? token.value : normalizeSearchText(token.value);
    if (!value) continue;

    normalizedTokens.push(Object.freeze({
      value,
      negated: !!token.negated,
    }));
  }

  return normalizedTokens.length
    ? markNormalizedSearchTokens(normalizedTokens)
    : EMPTY_SEARCH_TOKENS;
}

const EMPTY_SEARCH_TOKENS = markNormalizedSearchTokens([]);
const SEARCH_QUERY_TOKEN_PATTERN = /([-−–—]?)"([^"]*)"|([-−–—]?)(\S+)/g;

let lastSearchTokenQuery = '';
let lastSearchTokenResult: NormalizedSearchTokenArray = EMPTY_SEARCH_TOKENS;

function isSearchNegationPrefix(value: string): boolean {
  if (value.length !== 1) return false;

  return value === '-' || value === '−' || value === '–' || value === '—';
}

export function tokenizeSearchQuery(query: string): readonly SearchToken[] {
  const trimmedQuery = query.trim();
  if (trimmedQuery === lastSearchTokenQuery) {
    return lastSearchTokenResult;
  }

  if (!trimmedQuery) {
    lastSearchTokenQuery = trimmedQuery;
    lastSearchTokenResult = EMPTY_SEARCH_TOKENS;
    return lastSearchTokenResult;
  }

  const tokens: SearchToken[] = [];
  const pattern = SEARCH_QUERY_TOKEN_PATTERN;
  pattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  let pendingNegation = false;

  while ((match = pattern.exec(trimmedQuery)) !== null) {
    const prefix = match[1] || match[3] || '';
    const rawToken = match[2] || match[4] || '';

    if (!prefix && isSearchNegationPrefix(rawToken)) {
      pendingNegation = true;
      continue;
    }

    const value = hasRegex(rawToken) ? rawToken : normalizeSearchText(rawToken);
    if (!value) {
      if (isSearchNegationPrefix(rawToken)) {
        pendingNegation = true;
      }
      continue;
    }

    tokens.push(Object.freeze({
      value,
      negated: isSearchNegationPrefix(prefix) || pendingNegation,
    }));
    pendingNegation = false;
  }

  lastSearchTokenQuery = trimmedQuery;
  lastSearchTokenResult = tokens.length
    ? markNormalizedSearchTokens(tokens)
    : EMPTY_SEARCH_TOKENS;

  return lastSearchTokenResult;
}

function buildSearchPathCache(nodes: Record<string, Node>): Record<string, string> {
  const cache: Record<string, string> = {};
  const visiting = new Set<string>();

  const getPath = (id: string): string => {
    if (cache[id] !== undefined) return cache[id];

    const node = nodes[id];
    if (!node) return '';

    const label = normalizeSearchText(node.text);

    if (visiting.has(id)) {
      cache[id] = label;
      return cache[id];
    }

    visiting.add(id);
    const parentPath = node.parentId ? getPath(node.parentId) : '';
    visiting.delete(id);

    cache[id] = parentPath ? `${parentPath} ${label}` : label;
    return cache[id];
  };

  Object.keys(nodes).forEach((id) => {
    getPath(id);
  });

  return cache;
}

type SearchIndexEntry = {
  node: Node;
  label: string;
  id: string;
  path: string;
  searchable: string;
};

const searchIndexCache = new WeakMap<Record<string, Node>, SearchIndexEntry[]>();

type PartitionedSearchTerms = {
  positiveTerms: string[];
  negativeTerms: string[];
  hasOverlap: boolean;
  phrase: string;
  hasWildcardTerms: boolean;
  hasRegexTerms: boolean;
};

const searchTermPartitionCache = new WeakMap<readonly SearchToken[], PartitionedSearchTerms>();

function getPositiveTermsPhrase(positiveTerms: readonly string[]): string {
  if (positiveTerms.length === 0) return '';
  if (positiveTerms.length === 1) return positiveTerms[0];

  return positiveTerms.join(' ');
}

function buildSearchIndex(nodes: Record<string, Node>): SearchIndexEntry[] {
  const pathCache = buildSearchPathCache(nodes);

  return Object.values(nodes).map((node) => {
    const label = normalizeSearchText(node.text);
    const id = normalizeSearchText(node.id);
    const path = pathCache[node.id] ?? label;

    return {
      node,
      label,
      id,
      path,
      searchable: `${id} ${path}`,
    };
  });
}

function getSearchIndex(nodes: Record<string, Node>): SearchIndexEntry[] {
  const cached = searchIndexCache.get(nodes);
  if (cached) return cached;

  const index = buildSearchIndex(nodes);
  searchIndexCache.set(nodes, index);
  return index;
}

function normalizeTokens(input: SearchQueryInput): readonly SearchToken[] {
  if (!Array.isArray(input)) return tokenizeSearchQuery(input);

  // Fast path: if already normalized, return as-is
  const arr = input as NormalizedSearchTokenArray;
  // @ts-expect-error -- NormalizedSearchTokenArray has NORMALIZED_SEARCH_TOKEN_ARRAY property marker
  if (arr[NORMALIZED_SEARCH_TOKEN_ARRAY] === true) return input;
  return buildNormalizedSearchTokens(arr as unknown as readonly SearchToken[]);
}

// Wildcard support: * matches any sequence, ? matches single character
const WILDCARD_PATTERN = /[*:?]/;
// Regex support: /pattern/flags syntax (e.g., /node|leaf/i)
const REGEX_LITERAL_PATTERN = /^\/(.+)\/([gimsuvy]*)$/;

export function hasRegex(value: string): boolean { return REGEX_LITERAL_PATTERN.test(value); }

export function hasWildcards(value: string): boolean {
  const result = WILDCARD_PATTERN.test(value);
  return result;
}

// Normalize a string segment (non-wildcard part) for matching
function normalizeSegment(str: string): string {
  return normalizeSearchText(str).trim().toLowerCase();
}

function escapeRegex(str: string): string {
  return str.replace(/[.+^${}()|[\]\\]/g, '\\$&');
}

// Build a regex from a glob pattern, normalizing non-wildcard segments
// and preserving * (zero-or-more) and ? (single-char) wildcards.
function globToRegex(pattern: string): RegExp {
  // Protect wildcards with temp placeholders before normalization
  const STAR = '\x00STAR\x00';
  const QM = '\x00QM\x00';
  const protected_ = pattern.replace(/\*/g, STAR).replace(/\?/g, QM);

  // Split on placeholder positions using direct string search (more reliable than regex)
  const parts2: string[] = [];
  let remaining = protected_;
  while (remaining.length > 0) {
    const starIdx = remaining.indexOf(STAR);
    const qmIdx = remaining.indexOf(QM);
    if (starIdx === -1 && qmIdx === -1) {
      parts2.push(remaining);
      break;
    }
    if (starIdx !== -1 && (qmIdx === -1 || starIdx < qmIdx)) {
      if (starIdx > 0) parts2.push(remaining.slice(0, starIdx));
      parts2.push(STAR);
      remaining = remaining.slice(starIdx + STAR.length);
    } else {
      if (qmIdx > 0) parts2.push(remaining.slice(0, qmIdx));
      parts2.push(QM);
      remaining = remaining.slice(qmIdx + QM.length);
    }
  }

  const parts: string[] = [];
  for (let i = 0; i < parts2.length; i += 1) {
    const seg = parts2[i]!;
    if (seg === STAR) {
      parts.push('*');
    } else if (seg === QM) {
      parts.push('?');
    } else if (seg.length > 0) {
      parts.push(escapeRegex(normalizeSegment(seg)));
    }
  }

  // No anchors - this is used for substring matching.
  // Anchors are applied by callers that need exact boundaries.
  const regexStr = parts.join('').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(regexStr, 'i');
}


function matchWithRegex(haystack: string, pattern: string): boolean {
  try {
    const match = REGEX_LITERAL_PATTERN.exec(pattern);
    if (!match) return false;
    const [, regexPattern, flags] = match;
    const regex = new RegExp(regexPattern, flags.includes('i') ? flags : flags + 'i');
    return regex.test(haystack);
  } catch {
    return false;
  }
}

function matchWithWildcard(haystack: string, pattern: string): boolean {
  try {
    const regex = globToRegex(pattern);
    return regex.test(haystack);
  } catch {
    // Fallback to contains if pattern is invalid
    return haystack.includes(pattern.replace(/[*?]/g, ''));
  }
}

function termMatches(term: string, haystack: string): boolean {
  if (hasRegex(term)) return matchWithRegex(haystack, term);
  if (hasWildcards(term)) return matchWithWildcard(haystack, term);
  return haystack.includes(term);
}

function includesAllTerms(haystack: string, terms: readonly string[]): boolean {
  if (terms.length === 1) {
    return termMatches(terms[0]!, haystack);
  }

  if (terms.length === 2) {
    return termMatches(terms[0]!, haystack) && termMatches(terms[1]!, haystack);
  }

  for (let i = 0; i < terms.length; i += 1) {
    if (!termMatches(terms[i]!, haystack)) {
      return false;
    }
  }

  return true;
}

function includesAnyTerm(haystack: string, terms: readonly string[]): boolean {
  if (terms.length === 1) {
    return termMatches(terms[0]!, haystack);
  }

  if (terms.length === 2) {
    return termMatches(terms[0]!, haystack) || termMatches(terms[1]!, haystack);
  }

  for (let i = 0; i < terms.length; i += 1) {
    if (termMatches(terms[i]!, haystack)) {
      return true;
    }
  }

  return false;
}

function shouldSkipEntryByTerms(
  searchable: string,
  positiveTerms: readonly string[],
  negativeTerms: readonly string[],
): boolean {
  if (positiveTerms.length === 0) {
    return includesAnyTerm(searchable, negativeTerms);
  }

  if (negativeTerms.length === 0) {
    return !includesAllTerms(searchable, positiveTerms);
  }

  return !includesAllTerms(searchable, positiveTerms)
    || includesAnyTerm(searchable, negativeTerms);
}

function compareNodesByTextThenId(a: Node, b: Node): number {
  return a.text.localeCompare(b.text) || a.id.localeCompare(b.id);
}

function splitSearchTerms(tokens: readonly SearchToken[]): PartitionedSearchTerms {
  const cached = searchTermPartitionCache.get(tokens);
  if (cached) return cached;

  const positiveTerms: string[] = [];
  const negativeTerms: string[] = [];
  const positiveSeen = new Set<string>();
  const negativeSeen = new Set<string>();
  let hasOverlap = false;
  let hasWildcardTerms = false;
  let hasRegexTerms = false;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (token.negated) {
      if (positiveSeen.has(token.value)) {
        hasOverlap = true;
      }
      if (negativeSeen.has(token.value)) continue;

      negativeSeen.add(token.value);
      negativeTerms.push(token.value);
      if (hasWildcards(token.value)) hasWildcardTerms = true;
      if (hasRegex(token.value)) hasRegexTerms = true;
      continue;
    }

    if (negativeSeen.has(token.value)) {
      hasOverlap = true;
    }
    if (positiveSeen.has(token.value)) continue;

    positiveSeen.add(token.value);
    positiveTerms.push(token.value);
    if (hasWildcards(token.value)) hasWildcardTerms = true;
    if (hasRegex(token.value)) hasRegexTerms = true;
  }

  const partitioned: PartitionedSearchTerms = {
    positiveTerms,
    negativeTerms,
    hasOverlap,
    phrase: getPositiveTermsPhrase(positiveTerms),
    hasWildcardTerms,
    hasRegexTerms,
  };
  searchTermPartitionCache.set(tokens, partitioned);

  return partitioned;
}

function flattenRankBuckets(rankBuckets: readonly Node[][]): Node[] {
  let total = 0;
  for (let i = 0; i < rankBuckets.length; i += 1) {
    total += rankBuckets[i].length;
  }

  if (total === 0) return [];

  const flattened = new Array<Node>(total);
  let cursor = 0;

  for (let i = 0; i < rankBuckets.length; i += 1) {
    const bucket = rankBuckets[i];
    for (let j = 0; j < bucket.length; j += 1) {
      flattened[cursor] = bucket[j];
      cursor += 1;
    }
  }

  return flattened;
}

// Check if a string matches a pattern with wildcards, with optional prefix-strict mode
function matchesWildcardPattern(haystack: string, pattern: string, prefixStrict: boolean): boolean {
  if (!hasWildcards(pattern)) {
    return prefixStrict ? haystack.startsWith(pattern) : haystack.includes(pattern);
  }
  // For wildcard patterns, use matchWithWildcard (substring match)
  return matchWithWildcard(haystack, pattern);
}

function rankSearchMatches(
  nodes: Record<string, Node>,
  query: SearchQueryInput,
): Node[] {
  const tokens = normalizeTokens(query);
  if (!tokens.length) return [];

  const { positiveTerms, negativeTerms, hasOverlap, phrase, hasWildcardTerms, hasRegexTerms } = splitSearchTerms(tokens);
  if (hasOverlap) return [];
  const searchIndex = getSearchIndex(nodes);
  const rankBuckets: [Node[], Node[], Node[], Node[], Node[]] = [[], [], [], [], []];

  for (let i = 0; i < searchIndex.length; i += 1) {
    const { node, label, id, path, searchable } = searchIndex[i];

    if (shouldSkipEntryByTerms(hasRegexTerms ? label : searchable, positiveTerms, negativeTerms)) {
      continue;
    }

    let rank: number;

    if (hasRegexTerms) {
      // Regex terms: label match > id match > path match > no match
      const allLabelMatch = includesAllTerms(label, positiveTerms);
      const allIdMatch = includesAllTerms(id, positiveTerms);
      const allPathMatch = includesAllTerms(path, positiveTerms);
      rank = allLabelMatch ? 0 : allIdMatch ? 1 : allPathMatch ? 2 : 3;
    } else if (positiveTerms.length === 0) {
      rank = 4;
    } else if (hasWildcardTerms) {
      // With wildcards, adjust ranking: exact prefix match still preferred
      const labelMatchesPhrase = phrase && matchesWildcardPattern(label, phrase, true);
      const allLabelMatch = includesAllTerms(label, positiveTerms);
      const allIdMatch = includesAllTerms(id, positiveTerms);
      const allPathMatch = includesAllTerms(path, positiveTerms);

      rank = labelMatchesPhrase ? 0 : allLabelMatch ? 1 : allIdMatch ? 2 : allPathMatch ? 3 : 4;
    } else {
      // Original ranking logic
      rank =
        phrase && label.startsWith(phrase)
          ? 0
          : includesAllTerms(label, positiveTerms)
            ? 1
            : includesAllTerms(id, positiveTerms)
              ? 2
              : includesAllTerms(path, positiveTerms)
                ? 3
                : 4;
    }

    rankBuckets[rank].push(node);
  }

  for (let i = 0; i < rankBuckets.length; i += 1) {
    if (rankBuckets[i].length > 1) {
      rankBuckets[i].sort(compareNodesByTextThenId);
    }
  }

  return flattenRankBuckets(rankBuckets);
}

export const DEFAULT_SEARCH_RESULT_LIMIT = 20;

function normalizeSearchLimit(limit: number): number {
  return normalizeNonNegativeIntOrDefault(limit, DEFAULT_SEARCH_RESULT_LIMIT);
}

export function searchNodesWithTotal(
  nodes: Record<string, Node>,
  query: SearchQueryInput,
  limit = DEFAULT_SEARCH_RESULT_LIMIT,
): { results: Node[]; total: number } {
  const normalizedLimit = normalizeSearchLimit(limit);
  const rankedNodes = rankSearchMatches(nodes, query);
  if (normalizedLimit === 0) {
    return {
      results: [],
      total: rankedNodes.length,
    };
  }

  return {
    results: rankedNodes.slice(0, normalizedLimit),
    total: rankedNodes.length,
  };
}

export function searchNodes(
  nodes: Record<string, Node>,
  query: SearchQueryInput,
  limit = DEFAULT_SEARCH_RESULT_LIMIT,
): Node[] {
  const normalizedLimit = normalizeSearchLimit(limit);
  if (normalizedLimit === 0) return [];

  const rankedNodes = rankSearchMatches(nodes, query);
  return rankedNodes.slice(0, normalizedLimit);
}
