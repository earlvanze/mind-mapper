import { describe, it, expect } from 'vitest';
import { isHelpToggleEvent } from './helpToggle';

describe('helpToggle', () => {
  describe('isHelpToggleEvent', () => {
    it('returns true for Cmd/Ctrl+Slash (/)', () => {
      const event = { key: '/', metaKey: true, ctrlKey: false, altKey: false, shiftKey: false };
      expect(isHelpToggleEvent(event, false)).toBe(true);
    });

    it('returns true for Ctrl+Slash', () => {
      const event = { key: '/', metaKey: false, ctrlKey: true, altKey: false, shiftKey: false };
      expect(isHelpToggleEvent(event, false)).toBe(true);
    });

    it('returns false when alt key is held with Cmd+Slash', () => {
      const event = { key: '/', metaKey: true, ctrlKey: false, altKey: true, shiftKey: false };
      expect(isHelpToggleEvent(event, false)).toBe(false);
    });

    it('returns false when shift key is held with Cmd+Slash', () => {
      const event = { key: '/', metaKey: true, ctrlKey: false, altKey: false, shiftKey: true };
      expect(isHelpToggleEvent(event, false)).toBe(false);
    });

    it('returns true for question mark without modifiers', () => {
      const event = { key: '?', metaKey: false, ctrlKey: false, altKey: false, shiftKey: false };
      expect(isHelpToggleEvent(event, false)).toBe(true);
    });

    it('returns false for question mark with meta key', () => {
      const event = { key: '?', metaKey: true, ctrlKey: false, altKey: false, shiftKey: false };
      expect(isHelpToggleEvent(event, false)).toBe(false);
    });

    it('returns false for question mark with ctrl key', () => {
      const event = { key: '?', metaKey: false, ctrlKey: true, altKey: false, shiftKey: false };
      expect(isHelpToggleEvent(event, false)).toBe(false);
    });

    it('returns false when typingTarget is true (even with ?)', () => {
      const event = { key: '?', metaKey: false, ctrlKey: false, altKey: false, shiftKey: false };
      expect(isHelpToggleEvent(event, true)).toBe(false);
    });

    it('returns false for unrelated keys', () => {
      const event = { key: 'a', metaKey: false, ctrlKey: false, altKey: false, shiftKey: false };
      expect(isHelpToggleEvent(event, false)).toBe(false);
    });

    it('prefers Cmd/Ctrl+/ over ? when both are possible', () => {
      // Cmd+/ should match the Cmd/Ctrl branch first
      const event = { key: '/', metaKey: true, ctrlKey: false, altKey: false, shiftKey: false };
      expect(isHelpToggleEvent(event, false)).toBe(true);
    });
  });
});
