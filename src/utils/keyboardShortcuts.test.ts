import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DEFAULT_SHORTCUT_BINDINGS,
  matchesBinding,
  checkCustomBinding,
  findConflicts,
  loadShortcutsPrefs,
  saveShortcutsPrefs,
  resetAllBindings,
  getEffectiveBinding,
  getHandlerNameForAction,
} from './keyboardShortcuts';
import type { ShortcutsPrefs } from './keyboardShortcuts';

const STORAGE_KEY = 'mindmapp.v0.2.shortcuts';

const mockStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
});

function makeKeyboardEvent(overrides: Partial<KeyboardEventInit> & { key: string }): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    ...overrides,
  });
}

describe('keyboardShortcuts', () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  });

  describe('matchesBinding', () => {
    it('matches simple key', () => {
      expect(matchesBinding(makeKeyboardEvent({ key: 'f' }), 'F')).toBe(true);
    });

    it('does not match different key', () => {
      expect(matchesBinding(makeKeyboardEvent({ key: 'g' }), 'F')).toBe(false);
    });

    it('matches with Cmd modifier', () => {
      const e = makeKeyboardEvent({ key: 'k', metaKey: true });
      expect(matchesBinding(e, 'Cmd+K')).toBe(true);
    });

    it('matches with Ctrl modifier', () => {
      const e = makeKeyboardEvent({ key: 'k', ctrlKey: true });
      expect(matchesBinding(e, 'Ctrl+K')).toBe(true);
    });

    it('matches with Alt modifier', () => {
      const e = makeKeyboardEvent({ key: 'f', altKey: true });
      expect(matchesBinding(e, 'Alt+F')).toBe(true);
    });

    it('matches with Shift modifier', () => {
      const e = makeKeyboardEvent({ key: 'G', shiftKey: true });
      expect(matchesBinding(e, 'Shift+G')).toBe(true);
    });

    it('matches Cmd+Shift shortcut', () => {
      const e = makeKeyboardEvent({ key: 'M', metaKey: true, shiftKey: true });
      expect(matchesBinding(e, 'Cmd+Shift+M')).toBe(true);
    });

    it('does not match when metaKey missing', () => {
      const e = makeKeyboardEvent({ key: 'k' });
      expect(matchesBinding(e, 'Cmd+K')).toBe(false);
    });

    it('does not match when shiftKey missing for Shift binding', () => {
      const e = makeKeyboardEvent({ key: 'G' });
      expect(matchesBinding(e, 'Shift+G')).toBe(false);
    });

    it('handles equals as plus key', () => {
      const e = makeKeyboardEvent({ key: '+' });
      expect(matchesBinding(e, '=')).toBe(true);
    });

    it('returns false for empty binding', () => {
      expect(matchesBinding(makeKeyboardEvent({ key: 'a' }), '')).toBe(false);
    });

    it('matches ArrowUp key', () => {
      const e = makeKeyboardEvent({ key: 'ArrowUp' });
      expect(matchesBinding(e, 'ArrowUp')).toBe(true);
    });


    it('matches Home key', () => {
      const e = makeKeyboardEvent({ key: 'Home' });
      expect(matchesBinding(e, 'Home')).toBe(true);
    });

    it('matches case-insensitively', () => {
      const e = makeKeyboardEvent({ key: 'k', metaKey: true });
      // parseKey normalizes 'cmd' to 'Cmd' internally
      expect(matchesBinding(e, 'Cmd+K')).toBe(true);
    });
  });

  describe('checkCustomBinding', () => {
    it('returns null when no custom bindings', () => {
      const e = makeKeyboardEvent({ key: 'f', metaKey: true });
      expect(checkCustomBinding(e, {})).toBeNull();
    });

    it('returns action when custom binding matches', () => {
      const e = makeKeyboardEvent({ key: 's', metaKey: true });
      const prefs: ShortcutsPrefs = { search: 'Cmd+S' };
      expect(checkCustomBinding(e, prefs)).toBe('search');
    });

    it('does not return action when custom binding does not match', () => {
      const e = makeKeyboardEvent({ key: 'k', metaKey: true });
      const prefs: ShortcutsPrefs = { search: 'Cmd+Shift+K' };
      expect(checkCustomBinding(e, prefs)).toBeNull();
    });

    it('does not return action when default binding matches but no custom binding', () => {
      const e = makeKeyboardEvent({ key: 'k', metaKey: true });
      const prefs: ShortcutsPrefs = {};
      expect(checkCustomBinding(e, prefs)).toBeNull();
    });

    it('ignores bindings with empty keys', () => {
      const e = makeKeyboardEvent({ key: 'f' });
      const prefs: ShortcutsPrefs = { collapseAll: '' };
      expect(checkCustomBinding(e, prefs)).toBeNull();
    });
  });

  describe('findConflicts', () => {
    it('returns null when no conflict', () => {
      const prefs: ShortcutsPrefs = {};
      const conflict = findConflicts('search', 'Cmd+Shift+K', prefs);
      expect(conflict).toBeNull();
    });

    it('returns conflicting binding', () => {
      const prefs: ShortcutsPrefs = { fit: 'Cmd+Shift+K' };
      const conflict = findConflicts('search', 'Cmd+Shift+K', prefs);
      expect(conflict?.action).toBe('fit');
    });

    it('ignores own action', () => {
      const prefs: ShortcutsPrefs = { search: 'Cmd+Shift+K' };
      const conflict = findConflicts('search', 'Cmd+Shift+K', prefs);
      expect(conflict).toBeNull();
    });

    it('returns null for empty newKey', () => {
      const conflict = findConflicts('search', '', {});
      expect(conflict).toBeNull();
    });

    it('finds conflict in default bindings', () => {
      const conflict = findConflicts('exportPng', 'Cmd+Shift+M', {});
      expect(conflict?.action).toBe('exportMarkdown');
    });
  });

  describe('loadShortcutsPrefs / saveShortcutsPrefs', () => {
    it('loads empty prefs when nothing stored', () => {
      expect(loadShortcutsPrefs()).toEqual({});
    });

    it('saves and loads prefs', () => {
      const prefs: ShortcutsPrefs = { search: 'Cmd+Shift+K', fit: 'Alt+F' };
      saveShortcutsPrefs(prefs);
      expect(loadShortcutsPrefs()).toEqual(prefs);
    });

    it('handles corrupted JSON', () => {
      mockStorage[STORAGE_KEY] = 'not valid json';
      expect(loadShortcutsPrefs()).toEqual({});
    });
  });

  describe('resetAllBindings', () => {
    it('clears all custom bindings', () => {
      const prefs: ShortcutsPrefs = { search: 'Cmd+Shift+K' };
      saveShortcutsPrefs(prefs);
      resetAllBindings();
      expect(loadShortcutsPrefs()).toEqual({});
    });
  });

  describe('getEffectiveBinding', () => {
    it('returns custom binding when set', () => {
      const prefs: ShortcutsPrefs = { search: 'Cmd+Shift+K' };
      saveShortcutsPrefs(prefs);
      const binding = DEFAULT_SHORTCUT_BINDINGS.find(b => b.action === 'search')!;
      expect(getEffectiveBinding(binding)).toBe('Cmd+Shift+K');
    });

    it('returns default binding when no custom', () => {
      const binding = DEFAULT_SHORTCUT_BINDINGS.find(b => b.action === 'search')!;
      expect(getEffectiveBinding(binding)).toBe('Cmd+K');
    });
  });

  describe('getHandlerNameForAction', () => {
    it('returns handler name for search', () => {
      expect(getHandlerNameForAction('search')).toBe('onSearch');
    });

    it('returns handler name for help', () => {
      expect(getHandlerNameForAction('help')).toBe('onHelp');
    });

    it('returns handler name for undo', () => {
      expect(getHandlerNameForAction('undo')).toBe('onUndo');
    });

    it('returns handler name for redo', () => {
      expect(getHandlerNameForAction('redo')).toBe('onRedo');
    });

    it('covers all actions', () => {
      const allActions = DEFAULT_SHORTCUT_BINDINGS.map(b => b.action);
      for (const action of allActions) {
        expect(() => getHandlerNameForAction(action)).not.toThrow();
        expect(getHandlerNameForAction(action)).toBeTruthy();
      }
    });
  });

  describe('DEFAULT_SHORTCUT_BINDINGS', () => {
    it('has entries for key actions', () => {
      const allActions = DEFAULT_SHORTCUT_BINDINGS.map(b => b.action);
      expect(allActions).toContain('search');
      expect(allActions).toContain('help');
      expect(allActions).toContain('undo');
      expect(allActions).toContain('redo');
      expect(allActions).toContain('tagPicker');
      expect(allActions).toContain('tagFilter');
    });

    it('each binding has a non-empty description', () => {
      for (const binding of DEFAULT_SHORTCUT_BINDINGS) {
        expect(binding.desc.length).toBeGreaterThan(0);
      }
    });

    it('each binding has a valid defaultKey string', () => {
      for (const binding of DEFAULT_SHORTCUT_BINDINGS) {
        expect(typeof binding.defaultKey).toBe('string');
      }
    });
  });
});
