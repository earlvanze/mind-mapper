import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FOCUS_HISTORY_KEY, loadFocusHistory, saveFocusHistory } from './focusHistoryStorage';

describe('focusHistoryStorage', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    });
  });

  it('saves and loads focus history state', () => {
    saveFocusHistory({ entries: ['a', 'b', 'c'], index: 1 });
    expect(loadFocusHistory()).toEqual({ entries: ['a', 'b', 'c'], index: 1 });
  });

  it('returns null for missing or invalid payloads', () => {
    expect(loadFocusHistory()).toBeNull();

    localStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify({ entries: [], index: 0 }));
    expect(loadFocusHistory()).toBeNull();

    localStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify({ entries: ['a'], index: 'x' }));
    expect(loadFocusHistory()).toBeNull();
  });

  it('clamps persisted index into valid bounds', () => {
    localStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify({ entries: ['a', 'b'], index: 99 }));
    expect(loadFocusHistory()).toEqual({ entries: ['a', 'b'], index: 1 });
  });
});
