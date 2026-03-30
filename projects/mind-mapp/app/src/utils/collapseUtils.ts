import type { Node } from '../store/useMindMapStore';

/**
 * Returns a Set of node IDs that should be hidden because an ancestor is collapsed.
 */
export function getHiddenNodeIds(nodes: Record<string, Node>): Set<string> {
  const hidden = new Set<string>();

  function isAncestorCollapsed(nodeId: string): boolean {
    const node = nodes[nodeId];
    if (!node) return false;
    if (node.parentId) {
      const parent = nodes[node.parentId];
      if (parent?.isCollapsed) return true;
      return isAncestorCollapsed(node.parentId);
    }
    return false;
  }

  for (const id of Object.keys(nodes)) {
    if (isAncestorCollapsed(id)) {
      hidden.add(id);
    }
  }

  return hidden;
}

/**
 * Returns whether a node has any visible (non-collapsed-ancestor) children.
 * Used to determine if the collapse chevron should appear.
 */
export function nodeHasVisibleChildren(node: Node, nodes: Record<string, Node>): boolean {
  return node.children.some(childId => {
    const child = nodes[childId];
    if (!child) return false;
    // If parent (this node) is collapsed, children aren't visible
    if (node.isCollapsed) return false;
    return true;
  });
}
