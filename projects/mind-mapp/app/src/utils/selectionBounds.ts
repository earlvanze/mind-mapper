import type { Node } from '../store/useMindMapStore';

export type SelectionBounds = {
  width: number;
  height: number;
};

export function computeSelectionBounds(
  nodes: Record<string, Node>,
  selectedIds: string[],
): SelectionBounds | null {
  const selected = selectedIds
    .map(id => nodes[id])
    .filter(Boolean);

  if (!selected.length) return null;

  const minX = Math.min(...selected.map(n => n.x));
  const maxX = Math.max(...selected.map(n => n.x));
  const minY = Math.min(...selected.map(n => n.y));
  const maxY = Math.max(...selected.map(n => n.y));

  return {
    width: Math.max(0, Math.round(maxX - minX)),
    height: Math.max(0, Math.round(maxY - minY)),
  };
}
