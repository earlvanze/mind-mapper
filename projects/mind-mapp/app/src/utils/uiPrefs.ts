const UI_PREFS_KEY = 'mindmapp.v0.1.ui';

export type UiPrefs = {
  showGrid: boolean;
  showAdvancedActions: boolean;
  showMiniMap: boolean;
};

export function loadUiPrefs(): Partial<UiPrefs> | null {
  try {
    const raw = localStorage.getItem(UI_PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UiPrefs>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function saveUiPrefs(prefs: UiPrefs) {
  try {
    localStorage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}
