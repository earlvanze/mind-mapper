export type ThemePreset = {
  id: string;
  name: string;
  isDark: boolean;
  vars: Record<string, string>;
};

const PRESETS: ThemePreset[] = [
  // ── Light presets ──────────────────────────────────────────
  {
    id: 'light',
    name: 'Light',
    isDark: false,
    vars: {
      '--color-text': '#111',
      '--color-text-secondary': '#666',
      '--color-text-muted': '#667085',
      '--color-text-dim': '#64748b',
      '--color-bg': '#f8f9fb',
      '--color-surface': '#fff',
      '--color-border': '#cfd6e4',
      '--color-border-light': '#e2e6ee',
      '--color-border-subtle': '#e5e7eb',
      '--color-accent': '#4f46e5',
      '--color-accent-bg': 'rgba(79, 70, 229, 0.15)',
      '--color-accent-deep': '#3730a3',
      '--color-accent-grid': 'rgba(79, 70, 229, 0.09)',
      '--color-overlay': 'rgba(0,0,0,0.2)',
      '--color-shadow': 'rgba(0,0,0,0.06)',
      '--color-shadow-heavy': 'rgba(0,0,0,0.12)',
      '--color-minimap-bg': 'rgba(255, 255, 255, 0.92)',
      '--color-minimap-view': 'rgba(79, 70, 229, 0.12)',
      '--color-minimap-stroke': 'rgba(79, 70, 229, 0.85)',
      '--color-search-hover': '#f1f5ff',
      '--color-search-disabled': '#f8fafc',
      '--color-highlight': '#fde68a',
      '--color-success-text': '#0f766e',
      '--color-success-bg': '#ecfdf5',
      '--color-success-border': '#a7f3d0',
      '--color-error-text': '#b91c1c',
      '--color-error-bg': '#fef2f2',
      '--color-error-border': '#fecaca',
      '--color-path-text': '#475467',
      '--color-path-hover': '#1d4ed8',
      '--color-path-current': '#111827',
      '--color-path-sep': '#98a2b3',
      '--color-help-section-bg': '#f8fafc',
      '--color-help-section-border': '#e5e7eb',
      '--color-help-heading': '#334155',
    },
  },
  {
    id: 'paper',
    name: 'Paper',
    isDark: false,
    vars: {
      '--color-text': '#3d3021',
      '--color-text-secondary': '#6b5c45',
      '--color-text-muted': '#8b7355',
      '--color-text-dim': '#9c8b70',
      '--color-bg': '#f5f0e8',
      '--color-surface': '#faf7f2',
      '--color-border': '#d4c5a9',
      '--color-border-light': '#e8dfc8',
      '--color-border-subtle': '#ede5d5',
      '--color-accent': '#b45309',
      '--color-accent-bg': 'rgba(180, 83, 9, 0.12)',
      '--color-accent-deep': '#92400e',
      '--color-accent-grid': 'rgba(180, 83, 9, 0.07)',
      '--color-overlay': 'rgba(61, 48, 33, 0.18)',
      '--color-shadow': 'rgba(61, 48, 33, 0.07)',
      '--color-shadow-heavy': 'rgba(61, 48, 33, 0.14)',
      '--color-minimap-bg': 'rgba(250, 247, 242, 0.92)',
      '--color-minimap-view': 'rgba(180, 83, 9, 0.10)',
      '--color-minimap-stroke': 'rgba(180, 83, 9, 0.75)',
      '--color-search-hover': '#f0e9db',
      '--color-search-disabled': '#f5f0e8',
      '--color-highlight': '#fde68a',
      '--color-success-text': '#065f46',
      '--color-success-bg': '#f0fdf4',
      '--color-success-border': '#bbf7d0',
      '--color-error-text': '#991b1b',
      '--color-error-bg': '#fef2f2',
      '--color-error-border': '#fecaca',
      '--color-path-text': '#6b5c45',
      '--color-path-hover': '#b45309',
      '--color-path-current': '#3d3021',
      '--color-path-sep': '#9c8b70',
      '--color-help-section-bg': '#f8f3eb',
      '--color-help-section-border': '#e8dfc8',
      '--color-help-heading': '#5c4a32',
    },
  },
  {
    id: 'mint',
    name: 'Mint',
    isDark: false,
    vars: {
      '--color-text': '#134e4a',
      '--color-text-secondary': '#0f766e',
      '--color-text-muted': '#115e59',
      '--color-text-dim': '#0d9488',
      '--color-bg': '#f0fdfa',
      '--color-surface': '#ccfbf1',
      '--color-border': '#99f6e4',
      '--color-border-light': '#d5faf2',
      '--color-border-subtle': '#e0fcf5',
      '--color-accent': '#0d9488',
      '--color-accent-bg': 'rgba(13, 148, 136, 0.15)',
      '--color-accent-deep': '#115e59',
      '--color-accent-grid': 'rgba(13, 148, 136, 0.08)',
      '--color-overlay': 'rgba(19, 78, 74, 0.15)',
      '--color-shadow': 'rgba(19, 78, 74, 0.07)',
      '--color-shadow-heavy': 'rgba(19, 78, 74, 0.14)',
      '--color-minimap-bg': 'rgba(204, 251, 241, 0.92)',
      '--color-minimap-view': 'rgba(13, 148, 136, 0.12)',
      '--color-minimap-stroke': 'rgba(13, 148, 136, 0.8)',
      '--color-search-hover': '#d5faf2',
      '--color-search-disabled': '#f0fdfa',
      '--color-highlight': '#fde68a',
      '--color-success-text': '#064e3b',
      '--color-success-bg': '#ecfdf5',
      '--color-success-border': '#6ee7b7',
      '--color-error-text': '#991b1b',
      '--color-error-bg': '#fef2f2',
      '--color-error-border': '#fca5a5',
      '--color-path-text': '#0f766e',
      '--color-path-hover': '#0d9488',
      '--color-path-current': '#134e4a',
      '--color-path-sep': '#5eead4',
      '--color-help-section-bg': '#f0fdfa',
      '--color-help-section-border': '#d5faf2',
      '--color-help-heading': '#115e59',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    isDark: false,
    vars: {
      '--color-text': '#881337',
      '--color-text-secondary': '#be123c',
      '--color-text-muted': '#e11d48',
      '--color-text-dim': '#f43f5e',
      '--color-bg': '#fff1f2',
      '--color-surface': '#ffe4e6',
      '--color-border': '#fecdd3',
      '--color-border-light': '#ffe4e6',
      '--color-border-subtle': '#fff1f2',
      '--color-accent': '#e11d48',
      '--color-accent-bg': 'rgba(225, 29, 72, 0.12)',
      '--color-accent-deep': '#881337',
      '--color-accent-grid': 'rgba(225, 29, 72, 0.07)',
      '--color-overlay': 'rgba(136, 19, 55, 0.15)',
      '--color-shadow': 'rgba(136, 19, 55, 0.07)',
      '--color-shadow-heavy': 'rgba(136, 19, 55, 0.14)',
      '--color-minimap-bg': 'rgba(255, 228, 230, 0.92)',
      '--color-minimap-view': 'rgba(225, 29, 72, 0.12)',
      '--color-minimap-stroke': 'rgba(225, 29, 72, 0.75)',
      '--color-search-hover': '#ffe4e6',
      '--color-search-disabled': '#fff1f2',
      '--color-highlight': '#fde68a',
      '--color-success-text': '#064e3b',
      '--color-success-bg': '#ecfdf5',
      '--color-success-border': '#6ee7b7',
      '--color-error-text': '#7f1d1d',
      '--color-error-bg': '#fef2f2',
      '--color-error-border': '#fca5a5',
      '--color-path-text': '#be123c',
      '--color-path-hover': '#e11d48',
      '--color-path-current': '#881337',
      '--color-path-sep': '#fb7185',
      '--color-help-section-bg': '#fff1f2',
      '--color-help-section-border': '#ffe4e6',
      '--color-help-heading': '#881337',
    },
  },
  // ── Dark presets ───────────────────────────────────────────
  {
    id: 'dark',
    name: 'Dark',
    isDark: true,
    vars: {
      '--color-text': '#e2e8f0',
      '--color-text-secondary': '#94a3b8',
      '--color-text-muted': '#94a3b8',
      '--color-text-dim': '#94a3b8',
      '--color-bg': '#0f172a',
      '--color-surface': '#1e293b',
      '--color-border': '#334155',
      '--color-border-light': '#1e293b',
      '--color-border-subtle': '#334155',
      '--color-accent': '#818cf8',
      '--color-accent-bg': 'rgba(129, 140, 248, 0.18)',
      '--color-accent-deep': '#a5b4fc',
      '--color-accent-grid': 'rgba(129, 140, 248, 0.1)',
      '--color-overlay': 'rgba(0,0,0,0.5)',
      '--color-shadow': 'rgba(0,0,0,0.2)',
      '--color-shadow-heavy': 'rgba(0,0,0,0.4)',
      '--color-minimap-bg': 'rgba(30, 41, 59, 0.95)',
      '--color-minimap-view': 'rgba(129, 140, 248, 0.15)',
      '--color-minimap-stroke': 'rgba(129, 140, 248, 0.85)',
      '--color-search-hover': '#1e293b',
      '--color-search-disabled': '#1e293b',
      '--color-highlight': '#854d0e',
      '--color-success-text': '#34d399',
      '--color-success-bg': 'rgba(52, 211, 153, 0.1)',
      '--color-success-border': 'rgba(52, 211, 153, 0.3)',
      '--color-error-text': '#f87171',
      '--color-error-bg': 'rgba(248, 113, 113, 0.1)',
      '--color-error-border': 'rgba(248, 113, 113, 0.3)',
      '--color-path-text': '#94a3b8',
      '--color-path-hover': '#818cf8',
      '--color-path-current': '#e2e8f0',
      '--color-path-sep': '#64748b',
      '--color-help-section-bg': '#1e293b',
      '--color-help-section-border': '#334155',
      '--color-help-heading': '#cbd5e1',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    isDark: true,
    vars: {
      '--color-text': '#eceff4',
      '--color-text-secondary': '#d8dee9',
      '--color-text-muted': '#d8dee9',
      '--color-text-dim': '#d8dee9',
      '--color-bg': '#2e3440',
      '--color-surface': '#3b4252',
      '--color-border': '#4c566a',
      '--color-border-light': '#3b4252',
      '--color-border-subtle': '#4c566a',
      '--color-accent': '#88c0d0',
      '--color-accent-bg': 'rgba(136, 192, 208, 0.15)',
      '--color-accent-deep': '#a3d8e4',
      '--color-accent-grid': 'rgba(136, 192, 208, 0.08)',
      '--color-overlay': 'rgba(0,0,0,0.4)',
      '--color-shadow': 'rgba(0,0,0,0.2)',
      '--color-shadow-heavy': 'rgba(0,0,0,0.4)',
      '--color-minimap-bg': 'rgba(59, 66, 82, 0.95)',
      '--color-minimap-view': 'rgba(136, 192, 208, 0.12)',
      '--color-minimap-stroke': 'rgba(136, 192, 208, 0.8)',
      '--color-search-hover': '#434c5e',
      '--color-search-disabled': '#2e3440',
      '--color-highlight': '#ebcb8b',
      '--color-success-text': '#a3d8e4',
      '--color-success-bg': 'rgba(136, 192, 208, 0.1)',
      '--color-success-border': 'rgba(136, 192, 208, 0.3)',
      '--color-error-text': '#bf616a',
      '--color-error-bg': 'rgba(191, 97, 106, 0.1)',
      '--color-error-border': 'rgba(191, 97, 106, 0.3)',
      '--color-path-text': '#d8dee9',
      '--color-path-hover': '#88c0d0',
      '--color-path-current': '#eceff4',
      '--color-path-sep': '#81a1c1',
      '--color-help-section-bg': '#3b4252',
      '--color-help-section-border': '#4c566a',
      '--color-help-heading': '#eceff4',
    },
  },
  {
    id: 'solarized',
    name: 'Solarized',
    isDark: true,
    vars: {
      '--color-text': '#839496',
      '--color-text-secondary': '#93a1a1',
      '--color-text-muted': '#93a1a1',
      '--color-text-dim': '#93a1a1',
      '--color-bg': '#002b36',
      '--color-surface': '#073642',
      '--color-border': '#586e75',
      '--color-border-light': '#073642',
      '--color-border-subtle': '#586e75',
      '--color-accent': '#268bd2',
      '--color-accent-bg': 'rgba(38, 139, 210, 0.15)',
      '--color-accent-deep': '#1e6caa',
      '--color-accent-grid': 'rgba(38, 139, 210, 0.08)',
      '--color-overlay': 'rgba(0,0,0,0.4)',
      '--color-shadow': 'rgba(0,0,0,0.2)',
      '--color-shadow-heavy': 'rgba(0,0,0,0.4)',
      '--color-minimap-bg': 'rgba(7, 54, 66, 0.95)',
      '--color-minimap-view': 'rgba(38, 139, 210, 0.12)',
      '--color-minimap-stroke': 'rgba(38, 139, 210, 0.8)',
      '--color-search-hover': '#073642',
      '--color-search-disabled': '#002b36',
      '--color-highlight': '#b58900',
      '--color-success-text': '#2aa198',
      '--color-success-bg': 'rgba(42, 161, 152, 0.1)',
      '--color-success-border': 'rgba(42, 161, 152, 0.3)',
      '--color-error-text': '#dc322f',
      '--color-error-bg': 'rgba(220, 50, 47, 0.1)',
      '--color-error-border': 'rgba(220, 50, 47, 0.3)',
      '--color-path-text': '#93a1a1',
      '--color-path-hover': '#268bd2',
      '--color-path-current': '#839496',
      '--color-path-sep': '#657b83',
      '--color-help-section-bg': '#073642',
      '--color-help-section-border': '#586e75',
      '--color-help-heading': '#93a1a1',
    },
  },
];

export const THEME_STORAGE_KEY = 'mindmapp.v0.2.theme';

export const DEFAULT_PRESET = 'light';

export function getPresets(): ThemePreset[] {
  return PRESETS;
}

export function getPresetById(id: string): ThemePreset | undefined {
  return PRESETS.find(p => p.id === id);
}

export function applyPreset(preset: ThemePreset): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(preset.vars)) {
    root.style.setProperty(key, value);
  }
  root.setAttribute('data-theme', preset.isDark ? 'dark' : 'light');
}

export function savePreset(presetId: string): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, presetId);
  } catch {
    // ignore
  }
}

export function loadSavedPreset(): string {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && PRESETS.some(p => p.id === saved)) return saved;
  } catch {
    // ignore
  }
  // Fall back to legacy v0.1 theme key
  try {
    const raw = localStorage.getItem('mindmapp.v0.1.theme');
    if (raw === 'dark') return 'dark';
  } catch {
    // ignore
  }
  return DEFAULT_PRESET;
}

export function resetToPreset(): void {
  const preset = loadSavedPreset();
  const p = getPresetById(preset) ?? PRESETS[0];
  applyPreset(p);
}
