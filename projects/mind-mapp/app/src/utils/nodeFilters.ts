import type { Node, NodeStyle } from '../store/useMindMapStore';

/**
 * Determines if a node should be faded based on active filters.
 * Returns true if node should be dimmed (doesn't match filters).
 * Returns false if node should be fully visible.
 */
export function shouldFadeNode(
  node: Node,
  options: {
    activeTagFilters: string[];
    matchMode: 'any' | 'all';
    styleFilterShapes: string[];
    styleFilterColors: string[];
    styleFilterIcons: string[];
    styleFilterDateMode?: 'created' | 'updated';
    styleFilterDateFrom?: number;
    styleFilterDateTo?: number;
  }
): boolean {
  const {
    activeTagFilters,
    matchMode,
    styleFilterShapes,
    styleFilterColors,
    styleFilterIcons,
    styleFilterDateMode,
    styleFilterDateFrom,
    styleFilterDateTo,
  } = options;

  const hasTagFilters = activeTagFilters.length > 0;
  const hasShapeFilters = styleFilterShapes.length > 0;
  const hasColorFilters = styleFilterColors.length > 0;
  const hasIconFilters = styleFilterIcons.length > 0;
  const hasDateFilters = styleFilterDateMode != null && (styleFilterDateFrom != null || styleFilterDateTo != null);

  // No filters → no fading
  if (!hasTagFilters && !hasShapeFilters && !hasColorFilters && !hasIconFilters && !hasDateFilters) {
    return false;
  }

  // Check each filter category
  const tagPass = !hasTagFilters || checkTagFilter(node, activeTagFilters, matchMode);
  const shapePass = !hasShapeFilters || checkShapeFilter(node, styleFilterShapes);
  const colorPass = !hasColorFilters || checkColorFilter(node, styleFilterColors);
  const iconPass = !hasIconFilters || checkIconFilter(node, styleFilterIcons);
  const datePass = !hasDateFilters || checkDateFilter(node, styleFilterDateMode!, styleFilterDateFrom, styleFilterDateTo);

  // Node is faded if ANY category fails
  return !(tagPass && shapePass && colorPass && iconPass && datePass);
}

function checkTagFilter(node: Node, filters: string[], mode: 'any' | 'all'): boolean {
  const nodeTags = node.tags || [];
  if (mode === 'any') {
    return filters.some(f => nodeTags.includes(f));
  } else {
    return filters.every(f => nodeTags.includes(f));
  }
}

function checkShapeFilter(node: Node, shapes: string[]): boolean {
  const nodeShape = node.style?.shape || 'rectangle'; // default shape
  return shapes.includes(nodeShape);
}

function checkColorFilter(node: Node, colors: string[]): boolean {
  const bg = node.style?.backgroundColor;
  if (!bg) return false;
  const normalized = bg.toLowerCase();
  return colors.some(c => normalized.includes(c.toLowerCase()));
}

function checkIconFilter(node: Node, icons: string[]): boolean {
  const icon = node.style?.icon;
  if (!icon) return false;
  return icons.includes(icon);
}

function checkDateFilter(
  node: Node,
  mode: 'created' | 'updated',
  from?: number,
  to?: number
): boolean {
  const ts = mode === 'created' ? node.createdAt : node.updatedAt;
  if (ts == null) return false;
  if (from != null && ts < from) return false;
  if (to != null && ts > to) return false;
  return true;
}

/** Collect unique shapes from nodes */
export function getUniqueShapes(nodes: Record<string, Node>): string[] {
  const shapes = new Set<string>();
  Object.values(nodes).forEach(n => {
    if (n.style?.shape) shapes.add(n.style.shape);
    else shapes.add('rectangle'); // default
  });
  return Array.from(shapes).sort();
}

/** Collect unique background colors from nodes */
export function getUniqueColors(nodes: Record<string, Node>): string[] {
  const colors = new Set<string>();
  Object.values(nodes).forEach(n => {
    if (n.style?.backgroundColor) colors.add(n.style.backgroundColor);
  });
  return Array.from(colors).sort();
}

/** Collect unique icons from nodes */
export function getUniqueIcons(nodes: Record<string, Node>): string[] {
  const icons = new Set<string>();
  Object.values(nodes).forEach(n => {
    if (n.style?.icon) icons.add(n.style.icon);
  });
  return Array.from(icons).sort();
}
