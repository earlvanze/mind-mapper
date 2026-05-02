import type { Node } from '../store/useMindMapStore';

/**
 * Get all unique tags across all nodes with their usage counts
 */
export function getAllTagsWithCounts(nodes: Record<string, Node>): Map<string, number> {
  const tagCounts = new Map<string, number>();
  
  Object.values(nodes).forEach(node => {
    node.tags?.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  
  return tagCounts;
}

/**
 * Get sorted list of all tags by usage count (descending) then alphabetically
 */
export function getSortedTags(nodes: Record<string, Node>): string[] {
  const tagCounts = getAllTagsWithCounts(nodes);
  
  return Array.from(tagCounts.entries())
    .sort((a, b) => {
      // Sort by count descending, then alphabetically
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(([tag]) => tag);
}

/**
 * Check if a node has a specific tag
 */
export function nodeHasTag(node: Node, tag: string): boolean {
  return node.tags?.includes(tag) ?? false;
}

/**
 * Check if all given nodes have a specific tag
 */
export function allNodesHaveTag(nodes: Node[], tag: string): boolean {
  return nodes.every(node => nodeHasTag(node, tag));
}
