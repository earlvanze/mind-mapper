import type { Node } from '../store/useMindMapStore';

export function getWrappedSiblingId(
  nodes: Record<string, Node>,
  focusId: string,
  direction: -1 | 1,
): string | null {
  const current = nodes[focusId];
  if (!current?.parentId) return null;

  const parent = nodes[current.parentId];
  if (!parent) return null;

  const siblings = parent.children.filter(id => !!nodes[id]);
  if (siblings.length < 2) return null;

  const index = siblings.indexOf(focusId);
  if (index < 0) return null;

  const nextIndex = (index + direction + siblings.length) % siblings.length;
  if (nextIndex === index) return null;

  return siblings[nextIndex] ?? null;
}

export function getFirstLeafId(
  nodes: Record<string, Node>,
  rootId: string,
): string | null {
  if (!nodes[rootId]) return null;

  const stack = [rootId];
  const visited = new Set<string>();

  while (stack.length) {
    const id = stack.pop();
    if (!id || visited.has(id)) continue;
    visited.add(id);

    const node = nodes[id];
    if (!node) continue;

    const children = node.children.filter(childId => !!nodes[childId]);
    if (!children.length) return id;

    for (let i = children.length - 1; i >= 0; i -= 1) {
      stack.push(children[i]);
    }
  }

  return null;
}
