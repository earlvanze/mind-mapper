import { describe, expect, it } from 'vitest';
import { canStepFocus, createFocusHistory, findEdgeFocus, findStepFocus, pruneFocusHistory, recordFocus, resetFocusHistory, stepFocus } from './focusHistory';

describe('focusHistory', () => {
  it('creates initial history from focused id', () => {
    expect(createFocusHistory('n_root')).toEqual({ entries: ['n_root'], index: 0 });
  });

  it('records new focus ids and truncates forward history', () => {
    let state = createFocusHistory('a');
    state = recordFocus(state, 'b');
    state = recordFocus(state, 'c');

    const movedBack = stepFocus(state, -1);
    expect(movedBack.focusId).toBe('b');

    state = recordFocus(movedBack.state, 'd');
    expect(state).toEqual({ entries: ['a', 'b', 'd'], index: 2 });
  });

  it('does not duplicate consecutive same focus ids', () => {
    const state = recordFocus(createFocusHistory('x'), 'x');
    expect(state).toEqual({ entries: ['x'], index: 0 });
  });

  it('supports back/forward stepping when available', () => {
    let state = createFocusHistory('a');
    state = recordFocus(state, 'b');
    state = recordFocus(state, 'c');

    expect(canStepFocus(state, -1)).toBe(true);
    expect(canStepFocus(state, 1)).toBe(false);

    const back = stepFocus(state, -1);
    expect(back.focusId).toBe('b');
    expect(canStepFocus(back.state, 1)).toBe(true);

    const forward = stepFocus(back.state, 1);
    expect(forward.focusId).toBe('c');
  });

  it('caps history entries to configured max', () => {
    let state = createFocusHistory('a');
    state = recordFocus(state, 'b', 2);
    state = recordFocus(state, 'c', 2);
    expect(state).toEqual({ entries: ['b', 'c'], index: 1 });
  });

  it('resets history to current focus id', () => {
    let state = createFocusHistory('a');
    state = recordFocus(state, 'b');
    state = recordFocus(state, 'c');

    expect(resetFocusHistory(state, 'b')).toEqual({ entries: ['b'], index: 0 });
  });
});

describe('findStepFocus', () => {
  it('skips invalid ids while stepping backward', () => {
    const state = { entries: ['a', 'missing', 'b'], index: 2 };
    const stepped = findStepFocus(state, -1, id => id !== 'missing');
    expect(stepped.focusId).toBe('a');
    expect(stepped.state.index).toBe(0);
  });

  it('returns null when no valid target exists in direction', () => {
    const state = { entries: ['a', 'missing'], index: 1 };
    const stepped = findStepFocus(state, -1, id => id !== 'a');
    expect(stepped.focusId).toBeNull();
    expect(stepped.state.index).toBe(0);
  });
});

describe('pruneFocusHistory', () => {
  it('removes invalid ids and keeps index aligned', () => {
    const state = { entries: ['a', 'missing', 'b', 'gone'], index: 2 };
    expect(pruneFocusHistory(state, id => id !== 'missing' && id !== 'gone')).toEqual({
      entries: ['a', 'b'],
      index: 1,
    });
  });

  it('adds current focus when missing from pruned entries', () => {
    const state = { entries: ['a', 'missing'], index: 1 };
    expect(pruneFocusHistory(state, id => id !== 'missing', 'b')).toEqual({
      entries: ['a', 'b'],
      index: 1,
    });
  });

  it('moves index to current focus when present', () => {
    const state = { entries: ['a', 'b', 'c'], index: 0 };
    expect(pruneFocusHistory(state, () => true, 'c')).toEqual({
      entries: ['a', 'b', 'c'],
      index: 2,
    });
  });
});

describe('findEdgeFocus', () => {
  it('returns first/last valid focus targets', () => {
    const state = { entries: ['old', 'mid', 'new'], index: 1 };
    expect(findEdgeFocus(state, 'start').focusId).toBe('old');
    expect(findEdgeFocus(state, 'end').focusId).toBe('new');
  });

  it('skips invalid entries on edge search', () => {
    const state = { entries: ['missing', 'a', 'b', 'gone'], index: 2 };
    expect(findEdgeFocus(state, 'start', id => id !== 'missing' && id !== 'gone').focusId).toBe('a');
    expect(findEdgeFocus(state, 'end', id => id !== 'missing' && id !== 'gone').focusId).toBe('b');
  });

  it('returns null when no valid edge target exists', () => {
    const state = { entries: ['missing'], index: 0 };
    expect(findEdgeFocus(state, 'start', () => false).focusId).toBeNull();
  });
});
