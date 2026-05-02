import type { FocusHistoryState } from './focusHistory';

export const FOCUS_HISTORY_KEY = 'mindmapp.v0.1.focusHistory';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

export function loadFocusHistory(): FocusHistoryState | null {
  try {
    const raw = localStorage.getItem(FOCUS_HISTORY_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<FocusHistoryState>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!isStringArray(parsed.entries)) return null;
    if (!parsed.entries.length) return null;
    if (typeof parsed.index !== 'number' || !Number.isInteger(parsed.index)) return null;

    const clampedIndex = Math.max(0, Math.min(parsed.entries.length - 1, parsed.index));

    return {
      entries: parsed.entries,
      index: clampedIndex,
    };
  } catch {
    return null;
  }
}

export function saveFocusHistory(state: FocusHistoryState) {
  try {
    localStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
