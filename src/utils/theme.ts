export type Theme = 'light' | 'dark';

const THEME_KEY_V2 = 'mindmapp.v0.2.theme';
const THEME_KEY_V1 = 'mindmapp.v0.1.theme';

// Built-in preset IDs whose isDark flag we can read from themePresets
const PRESET_DARK = new Set(['dark', 'nord', 'solarized']);

export function loadTheme(): Theme {
  // Try new preset key first
  try {
    const raw = localStorage.getItem(THEME_KEY_V2);
    if (raw && !raw.includes(':')) {
      // It's a preset ID string
      return PRESET_DARK.has(raw) ? 'dark' : 'light';
    }
  } catch {
    // ignore
  }
  // Fall back to legacy v0.1 key (stores 'light'/'dark' directly)
  try {
    const raw = localStorage.getItem(THEME_KEY_V1);
    if (raw === 'dark' || raw === 'light') return raw;
  } catch {
    // ignore
  }
  // System preference
  try {
    if (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // ignore
  }
  return 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}
