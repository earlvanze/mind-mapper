import { describe, it, expect } from 'vitest';
import {
  getHelpPendingMessage,
  getHelpEmptyMessage,
  formatHelpSummary,
} from './helpStatus';

describe('helpStatus', () => {
  describe('getHelpPendingMessage', () => {
    it('returns pending message when pending is true', () => {
      expect(getHelpPendingMessage(true)).toBe('Filtering shortcuts…');
    });

    it('returns undefined when pending is false', () => {
      expect(getHelpPendingMessage(false)).toBeUndefined();
    });
  });

  describe('getHelpEmptyMessage', () => {
    it('returns pending message when pending is true', () => {
      expect(getHelpEmptyMessage(5, true)).toBe('Filtering shortcuts…');
    });

    it('returns empty state message when no shortcuts match', () => {
      expect(getHelpEmptyMessage(0, false)).toBe('No shortcuts match your filter.');
    });

    it('returns undefined when shortcuts are shown', () => {
      expect(getHelpEmptyMessage(5, false)).toBeUndefined();
    });

    it('handles negative shown values via normalizeNonNegativeInt', () => {
      expect(getHelpEmptyMessage(-5, false)).toBe('No shortcuts match your filter.');
    });

    it('handles NaN via normalizeNonNegativeInt', () => {
      expect(getHelpEmptyMessage(NaN, false)).toBe('No shortcuts match your filter.');
    });
  });

  describe('formatHelpSummary', () => {
    it('formats basic count string', () => {
      expect(formatHelpSummary(3, 10, false)).toBe('3 / 10 shown');
    });

    it('appends updating indicator when pending', () => {
      expect(formatHelpSummary(3, 10, true)).toBe('3 / 10 shown • updating…');
    });

    it('handles zero shown and total', () => {
      expect(formatHelpSummary(0, 0, false)).toBe('0 / 0 shown');
    });

    it('handles all shown', () => {
      expect(formatHelpSummary(10, 10, false)).toBe('10 / 10 shown');
    });

    it('normalizes negative values', () => {
      expect(formatHelpSummary(-3, -10, false)).toBe('0 / 0 shown');
    });

    it('normalizes NaN values', () => {
      expect(formatHelpSummary(NaN, NaN, false)).toBe('0 / 0 shown');
    });
  });
});
