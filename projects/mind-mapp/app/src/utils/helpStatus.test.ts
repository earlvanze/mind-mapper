import { describe, expect, it } from 'vitest';
import { formatHelpSummary, getHelpEmptyMessage, getHelpPendingMessage } from './helpStatus';

describe('getHelpPendingMessage', () => {
  it('returns pending helper copy only while updating', () => {
    expect(getHelpPendingMessage(true)).toBe('Filtering shortcuts…');
    expect(getHelpPendingMessage(false)).toBeUndefined();
  });
});

describe('getHelpEmptyMessage', () => {
  it('shows filtering copy while pending', () => {
    expect(getHelpEmptyMessage(0, true)).toBe('Filtering shortcuts…');
    expect(getHelpEmptyMessage(42, true)).toBe('Filtering shortcuts…');
  });

  it('shows no-match copy when settled with zero shown', () => {
    expect(getHelpEmptyMessage(0)).toBe('No shortcuts match your filter.');
    expect(getHelpEmptyMessage(Number.NaN)).toBe('No shortcuts match your filter.');
  });

  it('returns undefined when filtered shortcuts exist', () => {
    expect(getHelpEmptyMessage(1)).toBeUndefined();
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
