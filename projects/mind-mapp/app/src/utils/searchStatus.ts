const SEARCH_SELECTION_NAVIGATION_KEYS = new Set([
  'ArrowDown',
  'ArrowUp',
  'PageDown',
  'PageUp',
  'Home',
  'End',
  'Tab',
]);

export function canExecuteSearchJump(pending: boolean): boolean {
  return !pending;
}

export function canNavigateSearchSelection(pending: boolean): boolean {
  return !pending;
}

export function isSearchSelectionNavigationKey(key: string): boolean {
  return SEARCH_SELECTION_NAVIGATION_KEYS.has(key);
}

export function getSearchPendingTooltip(pending: boolean): string | undefined {
  return pending ? 'Search results are updating…' : undefined;
}

export function shouldDisplaySearchEmptyState(query: string): boolean {
  return query.trim().length > 0;
}

export function getSearchEmptyMessage(total: number, pending = false): string | undefined {
  if (pending) return 'Searching nodes…';

  const safeTotal = Number.isFinite(total) ? Math.max(0, Math.trunc(total)) : 0;
  if (safeTotal === 0) return 'No nodes match your query.';

  return undefined;
}

export function formatSearchSummary(shown: number, total: number, pending = false): string {
  const safeShown = Number.isFinite(shown) ? Math.max(0, Math.trunc(shown)) : 0;
  const safeTotal = Number.isFinite(total) ? Math.max(0, Math.trunc(total)) : 0;

  let summary = `${safeShown} shown / ${safeTotal} matches`;
  if (safeTotal > safeShown) {
    summary += ' (refine to narrow)';
  }
  if (pending) {
    summary += ' • updating…';
  }

  return summary;
}
