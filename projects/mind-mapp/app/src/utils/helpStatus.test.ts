import { describe, expect, it } from 'vitest';
import { formatHelpSummary, getHelpPendingMessage } from './helpStatus';

describe('getHelpPendingMessage', () => {
  it('returns pending helper copy only while updating', () => {
    expect(getHelpPendingMessage(true)).toBe('Filtering shortcuts…');
    expect(getHelpPendingMessage(false)).toBeUndefined();
  });
});

describe('formatHelpSummary', () => {
  it('formats shown/total values', () => {
    expect(formatHelpSummary(12, 42)).toBe('12 / 42 shown');
  });

  it('adds updating marker while pending', () => {
    expect(formatHelpSummary(12, 42, true)).toBe('12 / 42 shown • updating…');
  });

  it('normalizes invalid values', () => {
    expect(formatHelpSummary(-3.7, Number.NaN)).toBe('0 / 0 shown');
  });
});
