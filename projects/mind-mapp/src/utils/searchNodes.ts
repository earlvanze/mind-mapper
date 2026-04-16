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
    const value = normalizeSearchText(token.value);
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

    const value = normalizeSearchText(rawToken);
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

  const maybeNormalizedTokens = input as readonly SearchToken[] & { [NORMALIZED_SEARCH_TOKEN_ARRAY]?: true };
  if (maybeNormalizedTokens[NORMALIZED_SEARCH_TOKEN_ARRAY] === true) {
    return input;
  }

  return buildNormalizedSearchTokens(input);
}

function includesAllTerms(haystack: string, terms: readonly string[]): boolean {
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

function includesAnyTerm(haystack: string, terms: readonly string[]): boolean {
  if (terms.length === 1) {
    return haystack.includes(terms[0]);
  }

  if (terms.length === 2) {
    return haystack.includes(terms[0]) || haystack.includes(terms[1]);
  }

  for (let i = 0; i < terms.length; i += 1) {
    if (haystack.includes(terms[i])) {
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

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (token.negated) {
      if (positiveSeen.has(token.value)) {
        hasOverlap = true;
      }
      if (negativeSeen.has(token.value)) continue;

      negativeSeen.add(token.value);
      negativeTerms.push(token.value);
      continue;
    }

    if (negativeSeen.has(token.value)) {
      hasOverlap = true;
    }
    if (positiveSeen.has(token.value)) continue;

    positiveSeen.add(token.value);
    positiveTerms.push(token.value);
  }

  const partitioned: PartitionedSearchTerms = {
    positiveTerms,
    negativeTerms,
    hasOverlap,
    phrase: getPositiveTermsPhrase(positiveTerms),
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

function rankSearchMatches(
  nodes: Record<string, Node>,
  query: SearchQueryInput,
): Node[] {
  const tokens = normalizeTokens(query);
  if (!tokens.length) return [];

  const { positiveTerms, negativeTerms, hasOverlap, phrase } = splitSearchTerms(tokens);
  if (hasOverlap) return [];
  const searchIndex = getSearchIndex(nodes);
  const rankBuckets: [Node[], Node[], Node[], Node[], Node[]] = [[], [], [], [], []];

  for (let i = 0; i < searchIndex.length; i += 1) {
    const { node, label, id, path, searchable } = searchIndex[i];

    if (shouldSkipEntryByTerms(searchable, positiveTerms, negativeTerms)) {
      continue;
    }

    const rank =
      positiveTerms.length === 0
        ? 4
        : phrase && label.startsWith(phrase)
          ? 0
          : includesAllTerms(label, positiveTerms)
            ? 1
            : includesAllTerms(id, positiveTerms)
              ? 2
              : includesAllTerms(path, positiveTerms)
                ? 3
                : 4;

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
