import type { Node } from '../store/useMindMapStore';

export type MapBounds = {
  minX: number;
  minY: number;
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
