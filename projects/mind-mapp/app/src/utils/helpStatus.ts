export function getHelpPendingMessage(pending: boolean): string | undefined {
  return pending ? 'Filtering shortcuts…' : undefined;
}

function normalizeHelpCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export function getHelpEmptyMessage(shown: number, pending = false): string | undefined {
  if (pending) return 'Filtering shortcuts…';

  const safeShown = normalizeHelpCount(shown);
  if (safeShown === 0) return 'No shortcuts match your filter.';

  return undefined;
}

export function formatHelpSummary(shown: number, total: number, pending = false): string {
  const safeShown = normalizeHelpCount(shown);
  const safeTotal = normalizeHelpCount(total);

  let summary = `${safeShown} / ${safeTotal} shown`;
  if (pending) {
    summary += ' • updating…';
  }

  return summary;
}
