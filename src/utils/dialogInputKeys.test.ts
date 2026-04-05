import { describe, expect, it } from 'vitest';
import {
  isDialogClearInputEvent,
  isDialogFocusInputEvent,
  isDialogSelectInputEvent,
  shouldSkipDialogSelectShortcut,
  type DialogInputKeyState,
} from './dialogInputKeys';

function event(overrides: Partial<DialogInputKeyState>): DialogInputKeyState {
  return {
    key: '',
    ...overrides,
  };
}

describe('dialogInputKeys', () => {
  it('matches focus-input shortcut (Cmd/Ctrl+F)', () => {
    expect(isDialogFocusInputEvent(event({ key: 'f', metaKey: true }))).toBe(true);
    expect(isDialogFocusInputEvent(event({ key: 'F', ctrlKey: true }))).toBe(true);
    expect(isDialogFocusInputEvent(event({ key: 'f', ctrlKey: true, shiftKey: true }))).toBe(false);
  });

  it('matches select-input shortcut (Cmd/Ctrl+A)', () => {
    expect(isDialogSelectInputEvent(event({ key: 'a', ctrlKey: true }))).toBe(true);
    expect(isDialogSelectInputEvent(event({ key: 'A', metaKey: true }))).toBe(true);
    expect(isDialogSelectInputEvent(event({ key: 'a', ctrlKey: true, altKey: true }))).toBe(false);
  });

  it('matches clear-input shortcut (Cmd/Ctrl+Shift+K)', () => {
    expect(isDialogClearInputEvent(event({ key: 'k', ctrlKey: true, shiftKey: true }))).toBe(true);
    expect(isDialogClearInputEvent(event({ key: 'K', metaKey: true, shiftKey: true }))).toBe(true);
    expect(isDialogClearInputEvent(event({ key: 'k', ctrlKey: true }))).toBe(false);
  });

  it('skips select shortcut when target is already a text-entry field', () => {
    expect(shouldSkipDialogSelectShortcut(event({ target: { tagName: 'INPUT' } as unknown as EventTarget }))).toBe(true);
    expect(shouldSkipDialogSelectShortcut(event({ target: { tagName: 'textarea' } as unknown as EventTarget }))).toBe(true);
    expect(shouldSkipDialogSelectShortcut(event({ target: { isContentEditable: true } as unknown as EventTarget }))).toBe(true);
    expect(shouldSkipDialogSelectShortcut(event({ target: { tagName: 'div' } as unknown as EventTarget }))).toBe(false);
    expect(shouldSkipDialogSelectShortcut(event({ target: null }))).toBe(false);
  });
});
