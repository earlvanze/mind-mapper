import type { Node } from '../store/useMindMapStore';
import { normalizeSearchText } from './searchNormalize';

export type SearchToken = {
  value: string;
  negated: boolean;
};

export type SearchQueryInput = string | SearchToken[];

export function tokenizeSearchQuery(query: string): SearchToken[] {
  const tokens: SearchToken[] = [];
  const normalized = query.trim().toLowerCase();
  if (!normalized) return tokens;

  const pattern = /(-?)"([^"]*)"|(-?)(\S+)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(normalized)) !== null) {
    const prefix = match[1] || match[3] || '';
    const raw = normalizeSearchText(match[2] || match[4] || '');
    if (!raw) continue;

    tokens.push({
      value: raw,
      negated: prefix === '-',
    });
  }

  return tokens;
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
      searchable: `${label} ${id} ${path}`,
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

function normalizeTokens(input: SearchQueryInput): SearchToken[] {
  if (!Array.isArray(input)) return tokenizeSearchQuery(input);

  return input
    .map((token) => ({
      value: normalizeSearchText(token.value),
      negated: !!token.negated,
    }))
    .filter((token) => !!token.value);
}

function includesAllTerms(haystack: string, terms: string[]): boolean {
  for (let i = 0; i < terms.length; i += 1) {
    if (!haystack.includes(terms[i])) {
      return false;
    }
  }

  return true;
}

function includesAnyTerm(haystack: string, terms: string[]): boolean {
  for (let i = 0; i < terms.length; i += 1) {
    if (haystack.includes(terms[i])) {
      return true;
    }
  }

  return false;
}

function rankSearchMatches(
  nodes: Record<string, Node>,
  query: SearchQueryInput,
): Node[] {
  const tokens = normalizeTokens(query);
  if (!tokens.length) return [];

  const positiveTerms = tokens.filter((token) => !token.negated).map((token) => token.value);
  const negativeTerms = tokens.filter((token) => token.negated).map((token) => token.value);
  const phrase = positiveTerms.join(' ');
  const searchIndex = getSearchIndex(nodes);
  const rankBuckets: [Node[], Node[], Node[], Node[], Node[]] = [[], [], [], [], []];

  for (let i = 0; i < searchIndex.length; i += 1) {
    const { node, label, id, path, searchable } = searchIndex[i];

    if (positiveTerms.length > 0 && !includesAllTerms(searchable, positiveTerms)) {
      continue;
    }

    if (includesAnyTerm(searchable, negativeTerms)) {
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
    rankBuckets[i].sort(
      (a, b) => a.text.localeCompare(b.text) || a.id.localeCompare(b.id),
    );
  }

  return rankBuckets.flat();
}

export const DEFAULT_SEARCH_RESULT_LIMIT = 20;

function normalizeSearchLimit(limit: number): number {
  if (!Number.isFinite(limit)) return DEFAULT_SEARCH_RESULT_LIMIT;
  return Math.max(0, Math.trunc(limit));
}

export function searchNodesWithTotal(
  nodes: Record<string, Node>,
  query: SearchQueryInput,
  limit = DEFAULT_SEARCH_RESULT_LIMIT,
): { results: Node[]; total: number } {
  const normalizedLimit = normalizeSearchLimit(limit);
  const rankedNodes = rankSearchMatches(nodes, query);
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
  return searchNodesWithTotal(nodes, query, limit).results;
}
