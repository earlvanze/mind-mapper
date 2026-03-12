import { describe, expect, it } from 'vitest';
import { canStepFocus, createFocusHistory, recordFocus, stepFocus } from './focusHistory';

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
});
