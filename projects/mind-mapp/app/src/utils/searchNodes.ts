import type { Node } from '../store/useMindMapStore';

export type SearchToken = {
  value: string;
  negated: boolean;
};

function normalizeSearchText(value: string): string {
  const pieces: string[] = [];

  for (let i = 0; i < value.length; i += 1) {
    const current = value[i];
    const previous = i > 0 ? value[i - 1] : '';

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
      pieces.push(' ');
    }

    pieces.push(
      current
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[-_./:]+/g, ' '),
    );
  }

  return pieces
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

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

function rankSearchMatches(
  nodes: Record<string, Node>,
  query: string,
): Array<{ node: Node; rank: number }> {
  const tokens = tokenizeSearchQuery(query);
  if (!tokens.length) return [];

  const positiveTerms = tokens.filter(token => !token.negated).map(token => token.value);
  const negativeTerms = tokens.filter(token => token.negated).map(token => token.value);
  const phrase = positiveTerms.join(' ');
  const pathCache = buildSearchPathCache(nodes);

  const scored = Object.values(nodes)
    .map((node) => {
      const label = normalizeSearchText(node.text);
      const id = normalizeSearchText(node.id);
      const path = pathCache[node.id] ?? label;
      const searchable = `${label} ${id} ${path}`;

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
  query: string,
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
  query: string,
  limit = 20,
): Node[] {
  return searchNodesWithTotal(nodes, query, limit).results;
}
