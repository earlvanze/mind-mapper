export function getHelpPendingMessage(pending: boolean): string | undefined {
  return pending ? 'Filtering shortcuts…' : undefined;
}

export function formatHelpSummary(shown: number, total: number, pending = false): string {
  const safeShown = Number.isFinite(shown) ? Math.max(0, Math.trunc(shown)) : 0;
  const safeTotal = Number.isFinite(total) ? Math.max(0, Math.trunc(total)) : 0;

  let summary = `${safeShown} / ${safeTotal} shown`;
  if (pending) {
    summary += ' • updating…';
  }

  return summary;
}
