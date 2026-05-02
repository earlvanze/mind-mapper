import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getPresets,
  getPresetById,
  applyPreset,
  savePreset,
  loadSavedPreset,
  DEFAULT_PRESET,
} from './themePresets';

describe('themePresets', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
    });
  });

  describe('getPresets', () => {
    it('returns all presets', () => {
      const presets = getPresets();
      expect(presets.length).toBeGreaterThan(0);
      expect(presets.some(p => p.id === 'light')).toBe(true);
      expect(presets.some(p => p.id === 'dark')).toBe(true);
    });

    it('each preset has required fields', () => {
      for (const p of getPresets()) {
        expect(typeof p.id).toBe('string');
        expect(typeof p.name).toBe('string');
        expect(typeof p.isDark).toBe('boolean');
        expect(typeof p.vars).toBe('object');
        expect(p.vars['--color-accent']).toBeTruthy();
        expect(p.vars['--color-bg']).toBeTruthy();
      }
    });
  });

  describe('getPresetById', () => {
    it('returns light preset', () => {
      const p = getPresetById('light');
      expect(p?.name).toBe('Light');
      expect(p?.isDark).toBe(false);
    });

    it('returns dark preset', () => {
      const p = getPresetById('dark');
      expect(p?.name).toBe('Dark');
      expect(p?.isDark).toBe(true);
    });

    it('returns undefined for unknown id', () => {
      expect(getPresetById('nonexistent')).toBeUndefined();
    });
  });

  describe('savePreset / loadSavedPreset', () => {
    it('saves and loads a preset id', () => {
      savePreset('nord');
      expect(loadSavedPreset()).toBe('nord');
    });

    it('falls back to default when nothing saved', () => {
      expect(loadSavedPreset()).toBe(DEFAULT_PRESET);
    });

    it('falls back to default for invalid preset id', () => {
      // Write directly to localStorage with invalid value
      const store = new Map<string, string>();
      store.set('mindmapp.v0.2.theme', 'invalid-preset');
      vi.stubGlobal('localStorage', {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => { store.set(key, value); },
        removeItem: (key: string) => { store.delete(key); },
        clear: () => { store.clear(); },
      });
      // No v0.2 key stored in our mocked store here, so it falls back to v0.1
      // which doesn't exist in this mock either, so defaults to 'light'
      expect(loadSavedPreset()).toBe('light');
    });
  });

  describe('applyPreset', () => {
    it('sets all CSS vars on documentElement', () => {
      const styleProps: Record<string, string> = {};
      const setAttribute = vi.fn();
      vi.stubGlobal('document', {
        documentElement: {
          style: {
            setProperty: (k: string, v: string) => { styleProps[k] = v; },
          },
          setAttribute,
        },
      });

      const p = getPresetById('paper')!;
      applyPreset(p);

      expect(styleProps['--color-bg']).toBe('#f5f0e8');
      expect(styleProps['--color-accent']).toBe('#b45309');
      expect(setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    it('sets data-theme=dark for dark presets', () => {
      const setAttribute = vi.fn();
      vi.stubGlobal('document', {
        documentElement: {
          style: { setProperty: () => {} },
          setAttribute,
        },
      });

      const p = getPresetById('nord')!;
      applyPreset(p);

      expect(setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });
  });
});
