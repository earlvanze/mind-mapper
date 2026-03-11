import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadUiPrefs, saveUiPrefs } from './uiPrefs';

describe('uiPrefs', () => {
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

  it('saves and loads UI prefs', () => {
    saveUiPrefs({ showGrid: true, showAdvancedActions: false });
    const loaded = loadUiPrefs();
    expect(loaded).toEqual({ showGrid: true, showAdvancedActions: false });
  });

  it('returns null when storage has no value', () => {
    expect(loadUiPrefs()).toBeNull();
  });
});
