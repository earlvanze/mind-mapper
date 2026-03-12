export type FocusHistoryState = {
  entries: string[];
  index: number;
};

export function createFocusHistory(initialId: string): FocusHistoryState {
  return {
    entries: [initialId],
    index: 0,
  };
}

export function recordFocus(
  state: FocusHistoryState,
  focusId: string,
  maxEntries = 300,
): FocusHistoryState {
  if (!focusId) return state;
  if (state.entries[state.index] === focusId) return state;

  const truncated = state.entries.slice(0, state.index + 1);
  truncated.push(focusId);

  if (truncated.length > maxEntries) {
    const sliced = truncated.slice(truncated.length - maxEntries);
    return {
      entries: sliced,
      index: sliced.length - 1,
    };
  }

  return {
    entries: truncated,
    index: truncated.length - 1,
  };
}

export function canStepFocus(state: FocusHistoryState, direction: -1 | 1): boolean {
  if (!state.entries.length) return false;
  const nextIndex = state.index + direction;
  return nextIndex >= 0 && nextIndex < state.entries.length;
}

export function stepFocus(
  state: FocusHistoryState,
  direction: -1 | 1,
): { state: FocusHistoryState; focusId: string | null } {
  if (!canStepFocus(state, direction)) {
    return { state, focusId: null };
  }

  const nextIndex = state.index + direction;
  return {
    state: {
      entries: state.entries,
      index: nextIndex,
    },
    focusId: state.entries[nextIndex] ?? null,
  };
}
