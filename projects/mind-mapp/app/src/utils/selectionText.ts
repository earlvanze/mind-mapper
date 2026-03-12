import type { Node } from '../store/useMindMapStore';

function nodeLabel(node: Node) {
  return node.text.trim() || '(untitled)';
}

export function formatSelectionText(
  nodes: Record<string, Node>,
  selectedIds: string[],
  fallbackId?: string,
): string {
  const ids = selectedIds.filter((id, index, arr) => arr.indexOf(id) === index && !!nodes[id]);

  if (!ids.length && fallbackId && nodes[fallbackId]) {
    ids.push(fallbackId);
  }

  if (!ids.length) return '';

  return ids
    .map(id => nodes[id])
    .sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id))
    .map(nodeLabel)
    .join('\n');
}

export function formatSubtreeOutline(nodes: Record<string, Node>, rootId?: string): string {
  if (!rootId || !nodes[rootId]) return '';

  const lines: string[] = [];
  const stack: Array<{ id: string; depth: number }> = [{ id: rootId, depth: 0 }];
  const visited = new Set<string>();

  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    const node = nodes[current.id];
    if (!node) continue;

    const indent = '  '.repeat(current.depth);
    lines.push(`${indent}- ${nodeLabel(node)}`);

    for (let i = node.children.length - 1; i >= 0; i -= 1) {
      const childId = node.children[i];
      if (nodes[childId]) {
        stack.push({ id: childId, depth: current.depth + 1 });
      }
    }
  }

  return lines.join('\n');
}

export function formatFocusPath(nodes: Record<string, Node>, focusId?: string): string {
  if (!focusId || !nodes[focusId]) return '';

  const chain: string[] = [];
  const visited = new Set<string>();
  let currentId: string | null | undefined = focusId;

  while (currentId && !visited.has(currentId) && nodes[currentId]) {
    visited.add(currentId);
    const current = nodes[currentId];
    chain.push(nodeLabel(current));
    currentId = current.parentId;
  }

  return chain.reverse().join(' / ');
}
