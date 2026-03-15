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
