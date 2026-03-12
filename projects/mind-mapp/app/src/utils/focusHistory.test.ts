import { describe, expect, it } from 'vitest';
import { canStepFocus, createFocusHistory, findStepFocus, recordFocus, resetFocusHistory, stepFocus } from './focusHistory';

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
