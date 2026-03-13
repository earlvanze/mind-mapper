import { describe, expect, it } from 'vitest';
import { isTypingTarget } from './keyboardTarget';

describe('isTypingTarget', () => {
  it('returns false for nullish target', () => {
    expect(isTypingTarget(null)).toBe(false);
  });

  it('returns true when closest finds a text input ancestor', () => {
    const target = {
      closest: (selector: string) => (selector.includes('input') ? {} : null),
      isContentEditable: false,
    } as EventTarget;

    expect(isTypingTarget(target)).toBe(true);
  });

  it('returns true for contenteditable target', () => {
    const target = {
      closest: () => null,
      isContentEditable: true,
    } as EventTarget;

    expect(isTypingTarget(target)).toBe(true);
  });

  it('returns false for non-editable targets', () => {
    const target = {
      closest: () => null,
      isContentEditable: false,
    } as EventTarget;

    expect(isTypingTarget(target)).toBe(false);
  });
});
