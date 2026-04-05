/**
 * Viewport-based node virtualization
 * Only renders nodes visible in the current viewport
 */

import { Node } from '../store/useMindMapStore';

export type Viewport = {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
};

export type VisibilityResult = {
  visibleNodes: string[];
  visibleEdges: Array<{ parentId: string; childId: string }>;
};

/**
 * Calculate which nodes are visible in the viewport
 * Includes small buffer zone to prevent pop-in during pan
 */
export function getVisibleNodes(
  nodes: Record<string, Node>,
  viewport: Viewport,
  bufferFactor = 1.2
): VisibilityResult {
  const visibleNodes: string[] = [];
  const visibleEdges: Array<{ parentId: string; childId: string }> = [];

  // Convert viewport to world coordinates
  const viewLeft = -viewport.x / viewport.scale;
  const viewTop = -viewport.y / viewport.scale;
  const viewRight = viewLeft + viewport.width / viewport.scale;
  const viewBottom = viewTop + viewport.height / viewport.scale;

  // Add buffer zone
  const buffer = Math.max(viewport.width, viewport.height) / viewport.scale * (bufferFactor - 1) / 2;
  const minX = viewLeft - buffer;
  const minY = viewTop - buffer;
  const maxX = viewRight + buffer;
  const maxY = viewBottom + buffer;

  // Estimate node size (approximate)
  const nodeWidth = 120;
  const nodeHeight = 40;

  // Check each node
  Object.values(nodes).forEach((node) => {
    const nodeRight = node.x + nodeWidth;
    const nodeBottom = node.y + nodeHeight;

    // Check if node intersects viewport
    if (
      node.x <= maxX &&
      nodeRight >= minX &&
      node.y <= maxY &&
      nodeBottom >= minY
    ) {
      visibleNodes.push(node.id);
    }
  });

  // Find edges connecting visible nodes
  // Include edges where at least one endpoint is visible
  const visibleSet = new Set(visibleNodes);
  Object.values(nodes).forEach((node) => {
    node.children.forEach((childId) => {
      const child = nodes[childId];
      if (!child) return;

      // Edge is visible if either endpoint is visible
      // OR if the edge passes through the viewport
      const parentVisible = visibleSet.has(node.id);
      const childVisible = visibleSet.has(childId);

      if (parentVisible || childVisible) {
        visibleEdges.push({ parentId: node.id, childId });
      }
    });
  });

  return { visibleNodes, visibleEdges };
}

/**
 * Estimate bounds of all nodes (for minimap, fit-to-view, etc.)
 */
export function getNodeBounds(nodes: Record<string, Node>): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (Object.keys(nodes).length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  const nodeWidth = 120;
  const nodeHeight = 40;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  Object.values(nodes).forEach((node) => {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + nodeWidth);
    maxY = Math.max(maxY, node.y + nodeHeight);
  });

  return { minX, minY, maxX, maxY };
}
