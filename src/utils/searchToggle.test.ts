import { describe, expect, it } from 'vitest';
import { isSearchToggleEvent } from './searchToggle';

describe('isSearchToggleEvent', () => {
  it('matches cmd/ctrl + k', () => {
    expect(isSearchToggleEvent({ key: 'k', ctrlKey: true })).toBe(true);
    expect(isSearchToggleEvent({ key: 'K', metaKey: true })).toBe(true);
  });

  it('ignores combos with extra modifiers', () => {
    expect(isSearchToggleEvent({ key: 'k', ctrlKey: true, shiftKey: true })).toBe(false);
    expect(isSearchToggleEvent({ key: 'k', ctrlKey: true, altKey: true })).toBe(false);
  });

  it('ignores non-k keys', () => {
    expect(isSearchToggleEvent({ key: 'f', ctrlKey: true })).toBe(false);
  });
});
