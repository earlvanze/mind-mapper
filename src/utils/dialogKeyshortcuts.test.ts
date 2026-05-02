import { describe, it, expect } from 'vitest';
import {
  SEARCH_TOGGLE_ARIA_KEYSHORTCUTS,
  HELP_TOGGLE_ARIA_KEYSHORTCUTS,
  SEARCH_DIALOG_CLOSE_ARIA_KEYSHORTCUTS,
  HELP_DIALOG_CLOSE_ARIA_KEYSHORTCUTS,
  SEARCH_INPUT_ARIA_KEYSHORTCUTS,
  HELP_INPUT_ARIA_KEYSHORTCUTS,
  SEARCH_DIALOG_ARIA_KEYSHORTCUTS,
  HELP_DIALOG_ARIA_KEYSHORTCUTS,
} from './dialogKeyshortcuts';

describe('dialogKeyshortcuts', () => {
  describe('ARIA shortcut string exports', () => {
    it('exports SEARCH_TOGGLE_ARIA_KEYSHORTCUTS', () => {
      expect(SEARCH_TOGGLE_ARIA_KEYSHORTCUTS).toBe('Control+K Meta+K');
    });

    it('exports HELP_TOGGLE_ARIA_KEYSHORTCUTS', () => {
      expect(HELP_TOGGLE_ARIA_KEYSHORTCUTS).toBe('Shift+Slash Control+Slash Meta+Slash');
    });

    it('exports SEARCH_DIALOG_CLOSE_ARIA_KEYSHORTCUTS', () => {
      expect(SEARCH_DIALOG_CLOSE_ARIA_KEYSHORTCUTS).toBe('Escape Control+K Meta+K');
    });

    it('exports HELP_DIALOG_CLOSE_ARIA_KEYSHORTCUTS', () => {
      expect(HELP_DIALOG_CLOSE_ARIA_KEYSHORTCUTS).toBe('Escape Shift+Slash Control+Slash Meta+Slash');
    });

    it('exports SEARCH_INPUT_ARIA_KEYSHORTCUTS', () => {
      expect(SEARCH_INPUT_ARIA_KEYSHORTCUTS).toBe(
        'Control+F Meta+F Control+A Meta+A Control+Shift+K Meta+Shift+K',
      );
    });

    it('exports HELP_INPUT_ARIA_KEYSHORTCUTS', () => {
      expect(HELP_INPUT_ARIA_KEYSHORTCUTS).toBe(
        'Control+F Meta+F Control+A Meta+A Control+Shift+K Meta+Shift+K',
      );
    });

    it('exports SEARCH_DIALOG_ARIA_KEYSHORTCUTS as composed string', () => {
      const expected = 'Escape Control+K Meta+K Control+F Meta+F Control+A Meta+A Control+Shift+K Meta+Shift+K Enter Tab Shift+Tab PageUp PageDown Home End';
      expect(SEARCH_DIALOG_ARIA_KEYSHORTCUTS).toBe(expected);
    });

    it('exports HELP_DIALOG_ARIA_KEYSHORTCUTS as composed string', () => {
      const expected = 'Escape Shift+Slash Control+Slash Meta+Slash Control+F Meta+F Control+A Meta+A Control+Shift+K Meta+Shift+K';
      expect(HELP_DIALOG_ARIA_KEYSHORTCUTS).toBe(expected);
    });

    it('composes SEARCH_DIALOG_ARIA_KEYSHORTCUTS from close + input constants', () => {
      expect(SEARCH_DIALOG_ARIA_KEYSHORTCUTS).toBe(
        `${SEARCH_DIALOG_CLOSE_ARIA_KEYSHORTCUTS} ${SEARCH_INPUT_ARIA_KEYSHORTCUTS} Enter Tab Shift+Tab PageUp PageDown Home End`,
      );
    });

    it('composes HELP_DIALOG_ARIA_KEYSHORTCUTS from close + input constants', () => {
      expect(HELP_DIALOG_ARIA_KEYSHORTCUTS).toBe(
        `${HELP_DIALOG_CLOSE_ARIA_KEYSHORTCUTS} ${HELP_INPUT_ARIA_KEYSHORTCUTS}`,
      );
    });
  });
});
