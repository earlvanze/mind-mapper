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

export function resetFocusHistory(
  state: FocusHistoryState,
  focusId: string,
): FocusHistoryState {
  if (!focusId) return state;
  return {
    entries: [focusId],
    index: 0,
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

export function findStepFocus(
  state: FocusHistoryState,
  direction: -1 | 1,
  isValid?: (focusId: string) => boolean,
): { state: FocusHistoryState; focusId: string | null } {
  let cursor = state;

  while (canStepFocus(cursor, direction)) {
    const stepped = stepFocus(cursor, direction);
    cursor = stepped.state;

    if (!stepped.focusId) continue;
    if (!isValid || isValid(stepped.focusId)) {
      return { state: cursor, focusId: stepped.focusId };
    }
  }

  return { state: cursor, focusId: null };
}

export function pruneFocusHistory(
  state: FocusHistoryState,
  isValid: (focusId: string) => boolean,
  currentFocusId?: string,
): FocusHistoryState {
  const pruned: string[] = [];
  let nextIndex = 0;

  for (let i = 0; i < state.entries.length; i += 1) {
    const id = state.entries[i];
    if (!isValid(id)) continue;
    pruned.push(id);
    if (i <= state.index) {
      nextIndex = pruned.length - 1;
    }
  }

  const currentIsValid = !!currentFocusId && isValid(currentFocusId);

  if (!pruned.length) {
    if (currentIsValid && currentFocusId) {
      return { entries: [currentFocusId], index: 0 };
    }
    return state;
  }

  if (currentIsValid && currentFocusId) {
    const currentLastIndex = pruned.lastIndexOf(currentFocusId);
    if (currentLastIndex >= 0) {
      nextIndex = currentLastIndex;
    } else {
      pruned.push(currentFocusId);
      nextIndex = pruned.length - 1;
    }
  }

  if (
    pruned.length === state.entries.length
    && nextIndex === state.index
    && pruned.every((id, i) => id === state.entries[i])
  ) {
    return state;
  }

  return {
    entries: pruned,
    index: nextIndex,
  };
}

export function findEdgeFocus(
  state: FocusHistoryState,
  edge: 'start' | 'end',
  isValid?: (focusId: string) => boolean,
): { state: FocusHistoryState; focusId: string | null } {
  if (!state.entries.length) return { state, focusId: null };

  const direction = edge === 'start' ? 1 : -1;
  let index = edge === 'start' ? 0 : state.entries.length - 1;

  while (index >= 0 && index < state.entries.length) {
    const focusId = state.entries[index];
    if (!isValid || isValid(focusId)) {
      return {
        state: {
          entries: state.entries,
          index,
        },
        focusId,
      };
    }
    index += direction;
  }

  return { state, focusId: null };
}
