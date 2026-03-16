import { normalizeNonNegativeInt } from './countNormalize';

export function getHelpPendingMessage(pending: boolean): string | undefined {
  return pending ? 'Filtering shortcuts…' : undefined;
}

export function getHelpEmptyMessage(shown: number, pending = false): string | undefined {
  if (pending) return 'Filtering shortcuts…';

  const safeShown = normalizeNonNegativeInt(shown);
  if (safeShown === 0) return 'No shortcuts match your filter.';

  return undefined;
}

export function formatHelpSummary(shown: number, total: number, pending = false): string {
  const safeShown = normalizeNonNegativeInt(shown);
  const safeTotal = normalizeNonNegativeInt(total);
  const base = `${safeShown} / ${safeTotal} shown`;

  if (pending) {
    return `${base} • updating…`;
  }

  return base;
}
