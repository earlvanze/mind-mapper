import { describe, expect, it } from 'vitest';
import { FOCUS_NAV_HISTORY_SHORTCUT_KEYS, pickShortcutsByKeys, SHORTCUTS } from './shortcuts';

describe('shortcuts registry', () => {
  it('maps focus-navigation/history keys to concrete shortcuts', () => {
    const picked = pickShortcutsByKeys(SHORTCUTS, FOCUS_NAV_HISTORY_SHORTCUT_KEYS);

    expect(picked.map(shortcut => shortcut.key)).toEqual(FOCUS_NAV_HISTORY_SHORTCUT_KEYS);
  });

  it('keeps shortcut keys unique', () => {
    const keys = SHORTCUTS.map(shortcut => shortcut.key);
    const unique = new Set(keys);

    expect(unique.size).toBe(keys.length);
  });

  it('includes dialog clear/focus/select shortcuts for search and help', () => {
    expect(SHORTCUTS.some(shortcut => shortcut.key === 'Search: Cmd/Ctrl+Shift+K')).toBe(true);
    expect(SHORTCUTS.some(shortcut => shortcut.key === 'Search: Cmd/Ctrl+F')).toBe(true);
    expect(SHORTCUTS.some(shortcut => shortcut.key === 'Search: Cmd/Ctrl+A')).toBe(true);
    expect(SHORTCUTS.some(shortcut => shortcut.key === 'Help: Cmd/Ctrl+Shift+K')).toBe(true);
    expect(SHORTCUTS.some(shortcut => shortcut.key === 'Help: Cmd/Ctrl+F')).toBe(true);
    expect(SHORTCUTS.some(shortcut => shortcut.key === 'Help: Cmd/Ctrl+A')).toBe(true);
  });
});
