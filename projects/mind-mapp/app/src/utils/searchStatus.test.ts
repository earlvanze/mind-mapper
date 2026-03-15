import { describe, expect, it } from 'vitest';
import { canExecuteSearchJump, formatSearchSummary } from './searchStatus';

describe('canExecuteSearchJump', () => {
  it('allows jumps only when search is not pending', () => {
    expect(canExecuteSearchJump(false)).toBe(true);
    expect(canExecuteSearchJump(true)).toBe(false);
  });
});

describe('formatSearchSummary', () => {
  it('formats shown/total counts', () => {
    expect(formatSearchSummary(3, 3)).toBe('3 shown / 3 matches');
  });

  it('adds refine hint when total is greater than shown', () => {
    expect(formatSearchSummary(20, 120)).toBe('20 shown / 120 matches (refine to narrow)');
  });

  it('adds pending marker when search is updating', () => {
    expect(formatSearchSummary(20, 120, true)).toBe('20 shown / 120 matches (refine to narrow) • updating…');
  });

  it('normalizes invalid values to non-negative integers', () => {
    expect(formatSearchSummary(-3.7, Number.NaN, true)).toBe('0 shown / 0 matches • updating…');
  });
});
