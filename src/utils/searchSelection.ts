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

export function navigateSearchSelectionByKey(
  index: number,
  total: number,
  key: string,
  shiftKey = false,
): number | null {
  if (total <= 0) return null;

  if (key === 'ArrowDown') return moveSearchSelection(index, total, 1);
  if (key === 'ArrowUp') return moveSearchSelection(index, total, -1);
  if (key === 'PageDown') return moveSearchSelection(index, total, 5);
  if (key === 'PageUp') return moveSearchSelection(index, total, -5);
  if (key === 'Home') return edgeSearchSelection(total, 'start');
  if (key === 'End') return edgeSearchSelection(total, 'end');
  if (key === 'Tab') return cycleSearchSelection(index, total, shiftKey ? -1 : 1);

  return null;
}
