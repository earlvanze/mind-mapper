import type { Node } from '../store/useMindMapStore';

/**
 * Get all visible nodes in presentation order (BFS traversal)
 */
export function getPresentationOrder(
  nodes: Record<string, Node>,
  startId: string,
): Node[] {
  const result: Node[] = [];
  const queue: string[] = [startId];
  const visited = new Set<string>();

  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = nodes[id];
    if (!node) continue;

    result.push(node);

    // Add children in order
    for (const childId of node.children) {
      if (!visited.has(childId) && nodes[childId]) {
        queue.push(childId);
      }
    }
  }

  return result;
}

/**
 * Get root node ID from any node in the tree
 */
export function getRootId(
  nodes: Record<string, Node>,
  focusId: string,
): string {
  let current = nodes[focusId];
  while (current?.parentId && nodes[current.parentId]) {
    current = nodes[current.parentId];
  }
  return current?.id ?? focusId;
}

/**
 * Get child nodes of current node for preview
 */
export function getNodePreviews(
  nodes: Record<string, Node>,
  nodeId: string,
  maxPreviews = 6,
): Node[] {
  const node = nodes[nodeId];
  if (!node) return [];

  return node.children
    .filter(id => !!nodes[id])
    .slice(0, maxPreviews)
    .map(id => nodes[id]);
}

/**
 * Get progress info
 */
export function getPresentationProgress(
  currentIndex: number,
  total: number,
): { current: number; total: number; percent: number } {
  return {
    current: currentIndex + 1,
    total,
    percent: total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0,
  };
}
