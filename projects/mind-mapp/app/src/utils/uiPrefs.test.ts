import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadKeyboardPrefs, saveKeyboardPrefs, DEFAULT_KEYBOARD_PREFS, getKeyboardPref, type KeyboardPrefs } from './uiPrefs';

const TEST_KEY = 'mindmapp.v0.1.keyboard';

describe('KeyboardPrefs', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
    });
  });

  describe('loadKeyboardPrefs', () => {
    it('returns empty object when nothing saved', () => {
      expect(loadKeyboardPrefs()).toEqual({});
    });

    it('loads saved prefs', () => {
      const prefs: KeyboardPrefs = { nudge: 25 };
      saveKeyboardPrefs(prefs);
      expect(loadKeyboardPrefs()).toEqual(prefs);
    });

    it('returns empty object for invalid JSON', () => {
      // @ts-expect-error – injecting bad value directly
      localStorage.getItem = () => 'not json';
      expect(loadKeyboardPrefs()).toEqual({});
    });
  });

  describe('getKeyboardPref', () => {
    it('returns default when nothing saved', () => {
      expect(getKeyboardPref('nudge')).toBe(10);
      expect(getKeyboardPref('nudgeLarge')).toBe(40);
      expect(getKeyboardPref('zoomIn')).toBe(1.15);
      expect(getKeyboardPref('zoomOut')).toBe(0.87);
    });

    it('returns saved value when set', () => {
      saveKeyboardPrefs({ nudge: 20 });
      expect(getKeyboardPref('nudge')).toBe(20);
      expect(getKeyboardPref('nudgeLarge')).toBe(40);
    });

    it('returns default when specific key not saved', () => {
      saveKeyboardPrefs({ nudge: 30 });
      expect(getKeyboardPref('zoomIn')).toBe(1.15);
    });
  });

  describe('saveKeyboardPrefs', () => {
    it('saves prefs to localStorage', () => {
      const prefs: KeyboardPrefs = { nudge: 15, nudgeLarge: 50, zoomIn: 1.2, zoomOut: 0.83 };
      saveKeyboardPrefs(prefs);
      expect(loadKeyboardPrefs()).toEqual(prefs);
    });

    it('can update individual values', () => {
      saveKeyboardPrefs({ nudge: 12 });
      saveKeyboardPrefs({ nudge: 18 });
      expect(loadKeyboardPrefs()).toEqual({ nudge: 18 });
    });

    it('handles replace semantics', () => {
      saveKeyboardPrefs({ nudge: 7 });
      saveKeyboardPrefs({ nudgeLarge: 55 }); // replaces entire prefs object
      expect(loadKeyboardPrefs()).toEqual({ nudgeLarge: 55 });
    });
  });

  describe('DEFAULT_KEYBOARD_PREFS', () => {
    it('has all expected keys', () => {
      expect(DEFAULT_KEYBOARD_PREFS).toEqual({
        nudge: 10,
        nudgeLarge: 40,
        zoomIn: 1.15,
        zoomOut: 0.87,
      });
    });

    it('zoomOut is less than 1 (zoom-out multiplier)', () => {
      expect(DEFAULT_KEYBOARD_PREFS.zoomOut).toBeLessThan(1);
    });

    it('zoomIn is greater than 1 (zoom-in multiplier)', () => {
      expect(DEFAULT_KEYBOARD_PREFS.zoomIn).toBeGreaterThan(1);
    });
  });
});
