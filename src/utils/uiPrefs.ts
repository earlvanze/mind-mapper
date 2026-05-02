const UI_PREFS_KEY = 'mindmapp.v0.1.ui';

export type UiPrefs = {
  showGrid: boolean;
  showAdvancedActions: boolean;
  showMiniMap: boolean;
  rendererMode: 'svg' | 'canvas';
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

// ─── Keyboard shortcut customization ────────────────────────────────────────

export type ShortcutKey =
  | 'nudge'
  | 'nudgeLarge'
  | 'zoomIn'
  | 'zoomOut';

const KEYBOARD_PREFS_KEY = 'mindmapp.v0.1.keyboard';

export type KeyboardPrefs = Partial<Record<ShortcutKey, number>>;

export const DEFAULT_KEYBOARD_PREFS: Required<KeyboardPrefs> = {
  nudge: 10,
  nudgeLarge: 40,
  zoomIn: 1.15,
  zoomOut: 0.87,
};

export function loadKeyboardPrefs(): KeyboardPrefs {
  try {
    const raw = localStorage.getItem(KEYBOARD_PREFS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as KeyboardPrefs;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveKeyboardPrefs(prefs: KeyboardPrefs) {
  try {
    localStorage.setItem(KEYBOARD_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function getKeyboardPref(key: ShortcutKey): number {
  const prefs = loadKeyboardPrefs();
  if (prefs[key] !== undefined) return prefs[key]!;
  return DEFAULT_KEYBOARD_PREFS[key];
}
