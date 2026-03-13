export function clampSearchSelection(index: number, total: number): number {
  if (total <= 0) return 0;
  if (index < 0) return 0;
  if (index >= total) return total - 1;
  return index;
}

export function moveSearchSelection(index: number, total: number, delta: number): number {
  return clampSearchSelection(index + delta, total);
}

export function edgeSearchSelection(total: number, edge: 'start' | 'end'): number {
  if (total <= 0) return 0;
  return edge === 'start' ? 0 : total - 1;
}

export function cycleSearchSelection(index: number, total: number, direction: -1 | 1): number {
  if (total <= 0) return 0;

  const normalized = ((index % total) + total) % total;
  return (normalized + direction + total) % total;
}
