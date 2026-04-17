import type { Node } from '../store/useMindMapStore';

export type FocusPathSegment = {
  id: string;
  label: string;
};

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

export function getFocusPathSegments(nodes: Record<string, Node>, focusId?: string): FocusPathSegment[] {
  if (!focusId || !nodes[focusId]) return [];

  const chain: FocusPathSegment[] = [];
  const visited = new Set<string>();
  let currentId: string | null | undefined = focusId;

  while (currentId && !visited.has(currentId) && nodes[currentId]) {
    visited.add(currentId);
    const current: Node | undefined = nodes[currentId];
    chain.push({ id: current.id, label: nodeLabel(current) });
    currentId = current.parentId;
  }

  return chain.reverse();
}

const focusPathResolverCache = new WeakMap<Record<string, Node>, (focusId?: string) => string>();

export function createFocusPathResolver(nodes: Record<string, Node>): (focusId?: string) => string {
  const cachedResolver = focusPathResolverCache.get(nodes);
  if (cachedResolver) return cachedResolver;

  const cache: Record<string, string> = {};
  const visiting = new Set<string>();

  const resolve = (focusId?: string): string => {
    if (!focusId || !nodes[focusId]) return '';
    if (cache[focusId] !== undefined) return cache[focusId];

    const node = nodes[focusId];
    const label = nodeLabel(node);

    if (visiting.has(focusId)) {
      return '';
    }

    visiting.add(focusId);
    const parentPath = node.parentId ? resolve(node.parentId) : '';
    visiting.delete(focusId);

    cache[focusId] = parentPath ? `${parentPath} / ${label}` : label;
    return cache[focusId];
  };

  focusPathResolverCache.set(nodes, resolve);
  return resolve;
}

export function formatFocusPath(nodes: Record<string, Node>, focusId?: string): string {
  return createFocusPathResolver(nodes)(focusId);
}
