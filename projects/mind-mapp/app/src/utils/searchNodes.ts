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

function rankSearchMatches(
  nodes: Record<string, Node>,
  query: SearchQueryInput,
): Array<{ node: Node; rank: number }> {
  const tokens = normalizeTokens(query);
  if (!tokens.length) return [];

  const positiveTerms = tokens.filter(token => !token.negated).map(token => token.value);
  const negativeTerms = tokens.filter(token => token.negated).map(token => token.value);
  const phrase = positiveTerms.join(' ');
  const searchIndex = getSearchIndex(nodes);

  const scored = searchIndex
    .map(({ node, label, id, path, searchable }) => {
      if (positiveTerms.length && !positiveTerms.every(term => searchable.includes(term))) {
        return null;
      }

      if (negativeTerms.some(term => searchable.includes(term))) {
        return null;
      }

      const rank =
        positiveTerms.length === 0 ? 4
          : phrase && label.startsWith(phrase) ? 0
            : positiveTerms.every(term => label.includes(term)) ? 1
              : positiveTerms.every(term => id.includes(term)) ? 2
                : positiveTerms.every(term => path.includes(term)) ? 3
                  : 4;

      return { node, rank };
    })
    .filter(Boolean) as Array<{ node: Node; rank: number }>;

  return scored.sort((a, b) => a.rank - b.rank || a.node.text.localeCompare(b.node.text) || a.node.id.localeCompare(b.node.id));
}

export function searchNodesWithTotal(
  nodes: Record<string, Node>,
  query: SearchQueryInput,
  limit = 20,
): { results: Node[]; total: number } {
  const scored = rankSearchMatches(nodes, query);
  return {
    results: scored.slice(0, limit).map(item => item.node),
    total: scored.length,
  };
}

export function searchNodes(
  nodes: Record<string, Node>,
  query: SearchQueryInput,
  limit = 20,
): Node[] {
  return searchNodesWithTotal(nodes, query, limit).results;
}
