import { describe, expect, it } from 'vitest';
import { canExecuteSearchJump, canNavigateSearchSelection, formatSearchSummary, getSearchEmptyMessage, getSearchPendingTooltip, isSearchSelectionNavigationKey, shouldDisplaySearchEmptyState } from './searchStatus';

describe('canExecuteSearchJump', () => {
  it('allows jumps only when search is not pending', () => {
    expect(canExecuteSearchJump(false)).toBe(true);
    expect(canExecuteSearchJump(true)).toBe(false);
  });
});

describe('canNavigateSearchSelection', () => {
  it('allows selection navigation only when search is not pending', () => {
    expect(canNavigateSearchSelection(false)).toBe(true);
    expect(canNavigateSearchSelection(true)).toBe(false);
  });
});

describe('isSearchSelectionNavigationKey', () => {
  it('recognizes supported selection navigation keys', () => {
    expect(isSearchSelectionNavigationKey('ArrowDown')).toBe(true);
    expect(isSearchSelectionNavigationKey('ArrowUp')).toBe(true);
    expect(isSearchSelectionNavigationKey('PageDown')).toBe(true);
    expect(isSearchSelectionNavigationKey('PageUp')).toBe(true);
    expect(isSearchSelectionNavigationKey('Home')).toBe(true);
    expect(isSearchSelectionNavigationKey('End')).toBe(true);
    expect(isSearchSelectionNavigationKey('Tab')).toBe(true);
    expect(isSearchSelectionNavigationKey('Enter')).toBe(false);
  });
});

describe('getSearchPendingTooltip', () => {
  it('returns pending tooltip only while updating', () => {
    expect(getSearchPendingTooltip(true)).toBe('Search results are updating…');
    expect(getSearchPendingTooltip(false)).toBeUndefined();
  });
});

describe('shouldDisplaySearchEmptyState', () => {
  it('returns false for blank and whitespace-only queries', () => {
    expect(shouldDisplaySearchEmptyState('', false)).toBe(false);
    expect(shouldDisplaySearchEmptyState('   ', false)).toBe(false);
    expect(shouldDisplaySearchEmptyState('\n\t', false)).toBe(false);
  });

  it('returns false when normalized tokens are absent', () => {
    expect(shouldDisplaySearchEmptyState('?', false)).toBe(false);
    expect(shouldDisplaySearchEmptyState('alpha', false)).toBe(false);
  });

  it('returns true when query has normalized tokens', () => {
    expect(shouldDisplaySearchEmptyState('alpha', true)).toBe(true);
    expect(shouldDisplaySearchEmptyState('  alpha  ', true)).toBe(true);
  });
});

describe('getSearchEmptyMessage', () => {
  it('shows searching copy while pending', () => {
    expect(getSearchEmptyMessage(0, 0, true)).toBe('Searching nodes…');
    expect(getSearchEmptyMessage(0, 100, true)).toBe('Searching nodes…');
  });

  it('shows no-results copy when settled with zero shown and zero total', () => {
    expect(getSearchEmptyMessage(0, 0)).toBe('No nodes match your query.');
    expect(getSearchEmptyMessage(Number.NaN, Number.NaN)).toBe('No nodes match your query.');
  });

  it('returns undefined when shown results exist', () => {
    expect(getSearchEmptyMessage(1, 1)).toBeUndefined();
  });

  it('shows refine-copy when total matches exist but none are currently shown', () => {
    expect(getSearchEmptyMessage(0, 5)).toBe('Matches exist, refine your query to reveal them.');
  });

  it('normalizes invalid/decimal counts before deciding copy', () => {
    expect(getSearchEmptyMessage(-2.7, 3.9)).toBe('Matches exist, refine your query to reveal them.');
    expect(getSearchEmptyMessage(Number.NaN, Number.NaN)).toBe('No nodes match your query.');
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
