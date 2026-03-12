import type { Node } from '../store/useMindMapStore';

function nodePathLabels(nodes: Record<string, Node>, startId: string): string {
  const labels: string[] = [];
  const visited = new Set<string>();
  let currentId: string | null | undefined = startId;

  while (currentId && !visited.has(currentId) && nodes[currentId]) {
    visited.add(currentId);
    const node = nodes[currentId];
    labels.push(node.text.toLowerCase());
    currentId = node.parentId;
  }

  return labels.reverse().join(' ');
}

export function searchNodes(
  nodes: Record<string, Node>,
  query: string,
  limit = 20,
): Node[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const terms = q.split(/\s+/).filter(Boolean);

  const scored = Object.values(nodes)
    .map((node) => {
      const label = node.text.toLowerCase();
      const id = node.id.toLowerCase();
      const path = nodePathLabels(nodes, node.id);
      const searchable = `${label} ${id} ${path}`;

      const matchesAllTerms = terms.every(term => searchable.includes(term));
      if (!matchesAllTerms) return null;

      const rank =
        label.startsWith(q) ? 0
          : terms.every(term => label.includes(term)) ? 1
            : terms.every(term => id.includes(term)) ? 2
              : terms.every(term => path.includes(term)) ? 3
                : 4;

      return { node, rank };
    })
    .filter(Boolean) as Array<{ node: Node; rank: number }>;

  return scored
    .sort((a, b) => a.rank - b.rank || a.node.text.localeCompare(b.node.text) || a.node.id.localeCompare(b.node.id))
    .slice(0, limit)
    .map(item => item.node);
}
