import type { Node } from '../store/useMindMapStore';

export function getParentFocusId(
  nodes: Record<string, Node>,
  focusId: string,
): string | null {
  const current = nodes[focusId];
  if (!current?.parentId || !nodes[current.parentId]) return null;
  return current.parentId;
}

export function getFirstChildId(
  nodes: Record<string, Node>,
  focusId: string,
): string | null {
  const current = nodes[focusId];
  if (!current) return null;

  for (const childId of current.children) {
    if (nodes[childId]) return childId;
  }

  return null;
}

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

export function getLastLeafId(
  nodes: Record<string, Node>,
  rootId: string,
): string | null {
  const leaves = getLeafIdsInSubtree(nodes, rootId);
  return leaves.length ? leaves[leaves.length - 1] : null;
}

export function getLeafIdsInSubtree(
  nodes: Record<string, Node>,
  rootId: string,
): string[] {
  if (!nodes[rootId]) return [];

  const stack = [rootId];
  const visited = new Set<string>();
  const leaves: string[] = [];

  while (stack.length) {
    const id = stack.pop();
    if (!id || visited.has(id)) continue;
    visited.add(id);

    const node = nodes[id];
    if (!node) continue;

    const children = node.children.filter(childId => !!nodes[childId]);
    if (!children.length) {
      leaves.push(id);
      continue;
    }

    for (let i = children.length - 1; i >= 0; i -= 1) {
      stack.push(children[i]);
    }
  }

  return leaves;
}

export function getCycledLeafId(
  nodes: Record<string, Node>,
  rootId: string,
  currentId: string,
  direction: -1 | 1,
): string | null {
  const leaves = getLeafIdsInSubtree(nodes, rootId);
  if (!leaves.length) return null;

  const index = leaves.indexOf(currentId);
  if (index < 0) {
    return direction === 1 ? leaves[0] : leaves[leaves.length - 1];
  }

  if (leaves.length < 2) return null;

  const nextIndex = (index + direction + leaves.length) % leaves.length;
  if (nextIndex === index) return null;

  return leaves[nextIndex] ?? null;
}

export function getLeafCycleRootId(
  nodes: Record<string, Node>,
  focusId: string,
): string | null {
  let currentId: string | null | undefined = focusId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId) && nodes[currentId]) {
    visited.add(currentId);
    const leaves = getLeafIdsInSubtree(nodes, currentId);
    if (leaves.length > 1) return currentId;
    currentId = nodes[currentId].parentId;
  }

  return null;
}
