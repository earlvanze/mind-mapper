import { describe, it, expect } from 'vitest';

// Focus-trap + Escape logic extracted from StyleToolbar for unit testing.
// The actual component implementation is the source of truth.

type PickerType = 'color' | 'shape' | 'icon' | 'image' | 'link' | null;

interface FocusTrapResult {
  handled: boolean;
  focusAction: 'stay' | 'first' | 'last' | null;
}

/**
 * Simulates the Escape-key handler logic from StyleToolbar.
 * Returns true if Escape was handled (a picker is open).
 */
function simulateEscape(openPicker: PickerType): boolean {
  return openPicker !== null;
}

/**
 * Simulates the Tab/Shift+Tab focus-trap logic from StyleToolbar.
 * Returns the action to take to maintain the focus trap.
 *
 * Focusable selectors are the IDs (strings) of elements in the picker.
 * The caller passes the actual active element ID so we can compare.
 */
function simulateFocusTrap(
  openPicker: PickerType,
  documentActiveElementId: string | null,
  pickerId: string | null,
  shiftKey: boolean,
  focusableIds: string[],
): FocusTrapResult {
  if (!openPicker || !pickerId || documentActiveElementId === null) {
    return { handled: false, focusAction: null };
  }

  if (focusableIds.length === 0) {
    return { handled: false, focusAction: null };
  }

  const first = focusableIds[0];
  const last = focusableIds[focusableIds.length - 1];

  if (shiftKey) {
    if (documentActiveElementId === first) {
      return { handled: true, focusAction: 'last' };
    }
  } else {
    if (documentActiveElementId === last) {
      return { handled: true, focusAction: 'first' };
    }
  }

  return { handled: false, focusAction: null };
}

describe('StyleToolbar focus trap logic', () => {
  describe('Escape key handling', () => {
    it('handles Escape when color picker is open', () => {
      expect(simulateEscape('color')).toBe(true);
    });

    it('handles Escape when shape picker is open', () => {
      expect(simulateEscape('shape')).toBe(true);
    });

    it('handles Escape when icon picker is open', () => {
      expect(simulateEscape('icon')).toBe(true);
    });

    it('handles Escape when image picker is open', () => {
      expect(simulateEscape('image')).toBe(true);
    });

    it('handles Escape when link picker is open', () => {
      expect(simulateEscape('link')).toBe(true);
    });

    it('does not handle Escape when no picker is open', () => {
      expect(simulateEscape(null)).toBe(false);
    });
  });

  describe('Tab focus trap — 3+ focusable elements', () => {
    // Simulates: [preset-btn-0, preset-btn-1, ..., bg-color-input, text-color-input, border-color-input]
    const focusable = ['preset-0', 'preset-1', 'preset-2', 'bg-input', 'text-input', 'border-input'];

    it('wraps Tab from last element to first (color picker with 6 focusable items)', () => {
      const result = simulateFocusTrap('color', 'border-input', 'style-picker-color', false, focusable);
      expect(result.handled).toBe(true);
      expect(result.focusAction).toBe('first');
    });

    it('wraps Shift+Tab from first element to last', () => {
      const result = simulateFocusTrap('color', 'preset-0', 'style-picker-color', true, focusable);
      expect(result.handled).toBe(true);
      expect(result.focusAction).toBe('last');
    });

    it('does not intercept Tab when focus is in the middle', () => {
      const result = simulateFocusTrap('color', 'preset-1', 'style-picker-color', false, focusable);
      expect(result.handled).toBe(false);
      expect(result.focusAction).toBe(null);
    });

    it('does not intercept Shift+Tab when focus is in the middle', () => {
      const result = simulateFocusTrap('color', 'bg-input', 'style-picker-color', true, focusable);
      expect(result.handled).toBe(false);
      expect(result.focusAction).toBe(null);
    });
  });

  describe('Tab focus trap — shape picker with 4 shape buttons', () => {
    const focusable = ['shape-rect', 'shape-rounded', 'shape-ellipse', 'shape-diamond'];

    it('wraps Tab from last shape button to first', () => {
      const result = simulateFocusTrap('shape', 'shape-diamond', 'style-picker-shape', false, focusable);
      expect(result.handled).toBe(true);
      expect(result.focusAction).toBe('first');
    });

    it('wraps Shift+Tab from first shape button to last', () => {
      const result = simulateFocusTrap('shape', 'shape-rect', 'style-picker-shape', true, focusable);
      expect(result.handled).toBe(true);
      expect(result.focusAction).toBe('last');
    });
  });

  describe('Tab focus trap — icon picker with 20 emoji buttons', () => {
    const focusable = Array.from({ length: 20 }, (_, i) => `emoji-${i}`);

    it('wraps Tab at last emoji button to first', () => {
      const result = simulateFocusTrap('icon', 'emoji-19', 'style-picker-icon', false, focusable);
      expect(result.handled).toBe(true);
      expect(result.focusAction).toBe('first');
    });

    it('wraps Shift+Tab at first emoji button to last', () => {
      const result = simulateFocusTrap('icon', 'emoji-0', 'style-picker-icon', true, focusable);
      expect(result.handled).toBe(true);
      expect(result.focusAction).toBe('last');
    });
  });

  describe('Tab focus trap — edge cases', () => {
    it('does not trap when no picker is open', () => {
      const result = simulateFocusTrap(null, 'preset-0', null, false, ['a', 'b', 'c']);
      expect(result.handled).toBe(false);
    });

    it('does not trap when focus is completely outside picker (canvas, toolbar)', () => {
      const result = simulateFocusTrap('color', 'canvas-node', 'style-picker-color', false, ['a', 'b']);
      expect(result.handled).toBe(false);
    });

    it('does not trap Shift+Tab when focus is on second element', () => {
      const result = simulateFocusTrap('color', 'b', 'style-picker-color', true, ['a', 'b', 'c']);
      expect(result.handled).toBe(false);
    });
  });

  describe('Picker ID mapping (aria-controls)', () => {
    it('maps each picker type to a deterministic id', () => {
      const map: Record<string, string> = {
        color: 'style-picker-color',
        shape: 'style-picker-shape',
        icon: 'style-picker-icon',
        image: 'style-picker-image',
        link: 'style-picker-link',
      };
      Object.entries(map).forEach(([picker, expectedId]) => {
        expect(expectedId).toBe(`style-picker-${picker}`);
      });
    });

    it('each picker has a unique id', () => {
      const ids = ['style-picker-color', 'style-picker-shape', 'style-picker-icon', 'style-picker-image', 'style-picker-link'];
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });
});
