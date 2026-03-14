import { describe, expect, it } from 'vitest';
import {
  HELP_DIALOG_ARIA_KEYSHORTCUTS,
  HELP_DIALOG_CLOSE_ARIA_KEYSHORTCUTS,
  HELP_TOGGLE_ARIA_KEYSHORTCUTS,
  SEARCH_DIALOG_ARIA_KEYSHORTCUTS,
  SEARCH_DIALOG_CLOSE_ARIA_KEYSHORTCUTS,
  SEARCH_TOGGLE_ARIA_KEYSHORTCUTS,
} from './dialogKeyshortcuts';

describe('dialog keyshortcuts constants', () => {
  it('keeps search/help toggle strings in canonical order', () => {
    expect(SEARCH_TOGGLE_ARIA_KEYSHORTCUTS).toBe('Control+K Meta+K');
    expect(HELP_TOGGLE_ARIA_KEYSHORTCUTS).toBe('Shift+Slash Control+Slash Meta+Slash');
  });

  it('includes Escape + toggle shortcuts in close-button metadata', () => {
    expect(SEARCH_DIALOG_CLOSE_ARIA_KEYSHORTCUTS).toBe(`Escape ${SEARCH_TOGGLE_ARIA_KEYSHORTCUTS}`);
    expect(HELP_DIALOG_CLOSE_ARIA_KEYSHORTCUTS).toBe(`Escape ${HELP_TOGGLE_ARIA_KEYSHORTCUTS}`);
  });

  it('includes close + focus + select + clear keys in dialog metadata', () => {
    expect(SEARCH_DIALOG_ARIA_KEYSHORTCUTS).toContain(SEARCH_DIALOG_CLOSE_ARIA_KEYSHORTCUTS);
    expect(SEARCH_DIALOG_ARIA_KEYSHORTCUTS).toContain('Control+F Meta+F');
    expect(SEARCH_DIALOG_ARIA_KEYSHORTCUTS).toContain('Control+A Meta+A');
    expect(SEARCH_DIALOG_ARIA_KEYSHORTCUTS).toContain('Control+Shift+K Meta+Shift+K');

    expect(HELP_DIALOG_ARIA_KEYSHORTCUTS).toContain(HELP_DIALOG_CLOSE_ARIA_KEYSHORTCUTS);
    expect(HELP_DIALOG_ARIA_KEYSHORTCUTS).toContain('Control+F Meta+F');
    expect(HELP_DIALOG_ARIA_KEYSHORTCUTS).toContain('Control+A Meta+A');
    expect(HELP_DIALOG_ARIA_KEYSHORTCUTS).toContain('Control+Shift+K Meta+Shift+K');
  });
});
