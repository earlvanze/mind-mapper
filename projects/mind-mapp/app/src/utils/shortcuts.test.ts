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
});
