import { describe, expect, it } from 'vitest';
import { isHelpToggleEvent } from './helpToggle';

describe('isHelpToggleEvent', () => {
  it('supports plain ? as help toggle', () => {
    expect(isHelpToggleEvent({ key: '?', shiftKey: true }, false)).toBe(true);
  });

  it('supports cmd/ctrl + / as help toggle', () => {
    expect(isHelpToggleEvent({ key: '/', metaKey: true }, false)).toBe(true);
    expect(isHelpToggleEvent({ key: '/', ctrlKey: true }, false)).toBe(true);
  });

  it('ignores help toggle when typing target is active', () => {
    expect(isHelpToggleEvent({ key: '?' }, true)).toBe(false);
    expect(isHelpToggleEvent({ key: '/', ctrlKey: true }, true)).toBe(false);
  });

  it('ignores non-matching combinations', () => {
    expect(isHelpToggleEvent({ key: '/', altKey: true }, false)).toBe(false);
    expect(isHelpToggleEvent({ key: '/', ctrlKey: true, shiftKey: true }, false)).toBe(false);
    expect(isHelpToggleEvent({ key: 'h' }, false)).toBe(false);
  });
});
