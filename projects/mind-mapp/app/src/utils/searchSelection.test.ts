import { describe, expect, it } from 'vitest';
import { clampSearchSelection, cycleSearchSelection, edgeSearchSelection, moveSearchSelection, navigateSearchSelectionByKey } from './searchSelection';

describe('searchSelection', () => {
  it('clamps selection inside bounds', () => {
    expect(clampSearchSelection(-4, 5)).toBe(0);
    expect(clampSearchSelection(2, 5)).toBe(2);
    expect(clampSearchSelection(12, 5)).toBe(4);
  });

  it('defaults to zero when total is empty', () => {
    expect(clampSearchSelection(10, 0)).toBe(0);
    expect(moveSearchSelection(3, 0, 5)).toBe(0);
    expect(edgeSearchSelection(0, 'start')).toBe(0);
    expect(edgeSearchSelection(0, 'end')).toBe(0);
  });

  it('moves selection by delta and clamps', () => {
    expect(moveSearchSelection(2, 10, 5)).toBe(7);
    expect(moveSearchSelection(2, 10, -5)).toBe(0);
    expect(moveSearchSelection(8, 10, 5)).toBe(9);
  });

  it('jumps to start or end edge', () => {
    expect(edgeSearchSelection(8, 'start')).toBe(0);
    expect(edgeSearchSelection(8, 'end')).toBe(7);
  });

  it('cycles selection index with wrap-around', () => {
    expect(cycleSearchSelection(0, 5, -1)).toBe(4);
    expect(cycleSearchSelection(4, 5, 1)).toBe(0);
    expect(cycleSearchSelection(2, 5, 1)).toBe(3);
    expect(cycleSearchSelection(2, 5, -1)).toBe(1);
  });

  it('maps navigation keys to selection moves', () => {
    expect(navigateSearchSelectionByKey(2, 10, 'ArrowDown')).toBe(3);
    expect(navigateSearchSelectionByKey(2, 10, 'ArrowUp')).toBe(1);
    expect(navigateSearchSelectionByKey(2, 10, 'PageDown')).toBe(7);
    expect(navigateSearchSelectionByKey(6, 10, 'PageUp')).toBe(1);
    expect(navigateSearchSelectionByKey(6, 10, 'Home')).toBe(0);
    expect(navigateSearchSelectionByKey(6, 10, 'End')).toBe(9);
    expect(navigateSearchSelectionByKey(6, 10, 'Tab', false)).toBe(7);
    expect(navigateSearchSelectionByKey(6, 10, 'Tab', true)).toBe(5);
  });

  it('returns null for unsupported keys or empty totals', () => {
    expect(navigateSearchSelectionByKey(1, 10, 'Enter')).toBeNull();
    expect(navigateSearchSelectionByKey(1, 0, 'ArrowDown')).toBeNull();
  });
});
