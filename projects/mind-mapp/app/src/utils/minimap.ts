import type { Node } from '../store/useMindMapStore';

export type MapBounds = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};

export type WorldRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MiniRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function getMapBounds(nodes: Record<string, Node>, pad = 80): MapBounds {
  const values = Object.values(nodes);
  if (!values.length) return { minX: 0, minY: 0, width: 1, height: 1 };

  let minX = values[0].x;
  let minY = values[0].y;
  let maxX = values[0].x;
  let maxY = values[0].y;

  for (const n of values) {
    if (n.x < minX) minX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.x > maxX) maxX = n.x;
    if (n.y > maxY) maxY = n.y;
  }

  return {
    minX: minX - pad,
    minY: minY - pad,
    width: Math.max(1, maxX - minX + pad * 2),
    height: Math.max(1, maxY - minY + pad * 2),
  };
}

export function mapToMini(
  x: number,
  y: number,
  bounds: MapBounds,
  miniWidth: number,
  miniHeight: number,
): { x: number; y: number } {
  return {
    x: ((x - bounds.minX) / bounds.width) * miniWidth,
    y: ((y - bounds.minY) / bounds.height) * miniHeight,
  };
}

export function miniToWorld(
  x: number,
  y: number,
  bounds: MapBounds,
  miniWidth: number,
  miniHeight: number,
): { x: number; y: number } {
  return {
    x: bounds.minX + (x / Math.max(1, miniWidth)) * bounds.width,
    y: bounds.minY + (y / Math.max(1, miniHeight)) * bounds.height,
  };
}

export function worldRectToMini(
  rect: WorldRect,
  bounds: MapBounds,
  miniWidth: number,
  miniHeight: number,
  minSize = 8,
): MiniRect {
  const p1 = mapToMini(rect.x, rect.y, bounds, miniWidth, miniHeight);
  const p2 = mapToMini(rect.x + rect.width, rect.y + rect.height, bounds, miniWidth, miniHeight);

  let x = Math.min(p1.x, p2.x);
  let y = Math.min(p1.y, p2.y);
  let width = Math.max(0, Math.abs(p2.x - p1.x));
  let height = Math.max(0, Math.abs(p2.y - p1.y));

  width = Math.max(minSize, Math.min(miniWidth, width));
  height = Math.max(minSize, Math.min(miniHeight, height));

  x = Math.max(0, Math.min(miniWidth - width, x));
  y = Math.max(0, Math.min(miniHeight - height, y));

  return { x, y, width, height };
}

function miniViewportCenterBounds(
  viewRect: MiniRect,
  miniWidth: number,
  miniHeight: number,
): { minX: number; maxX: number; minY: number; maxY: number } {
  const halfWidth = viewRect.width / 2;
  const halfHeight = viewRect.height / 2;

  return {
    minX: Math.min(halfWidth, miniWidth - halfWidth),
    maxX: Math.max(halfWidth, miniWidth - halfWidth),
    minY: Math.min(halfHeight, miniHeight - halfHeight),
    maxY: Math.max(halfHeight, miniHeight - halfHeight),
  };
}

export function offsetMiniViewportCenter(
  viewRect: MiniRect,
  dx: number,
  dy: number,
  miniWidth: number,
  miniHeight: number,
): { x: number; y: number } {
  const halfWidth = viewRect.width / 2;
  const halfHeight = viewRect.height / 2;

  const currentX = viewRect.x + halfWidth;
  const currentY = viewRect.y + halfHeight;
  const bounds = miniViewportCenterBounds(viewRect, miniWidth, miniHeight);

  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, currentX + dx)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, currentY + dy)),
  };
}

export function edgeMiniViewportCenter(
  viewRect: MiniRect,
  edge: 'home' | 'end',
  miniWidth: number,
  miniHeight: number,
): { x: number; y: number } {
  const bounds = miniViewportCenterBounds(viewRect, miniWidth, miniHeight);

  if (edge === 'home') {
    return { x: bounds.minX, y: bounds.minY };
  }

  return { x: bounds.maxX, y: bounds.maxY };
}
