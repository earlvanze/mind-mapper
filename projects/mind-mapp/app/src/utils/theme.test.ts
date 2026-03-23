import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadTheme, saveTheme, toggleTheme, applyTheme } from './theme';

describe('theme', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
    });
    // Default matchMedia to light
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('defaults to light when no stored value and prefers-color-scheme is light', () => {
    expect(loadTheme()).toBe('light');
  });

  it('defaults to dark when prefers-color-scheme is dark', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    expect(loadTheme()).toBe('dark');
  });

  it('returns stored theme', () => {
    saveTheme('dark');
    expect(loadTheme()).toBe('dark');
    saveTheme('light');
    expect(loadTheme()).toBe('light');
  });

  it('toggleTheme flips light to dark and vice versa', () => {
    expect(toggleTheme('light')).toBe('dark');
    expect(toggleTheme('dark')).toBe('light');
  });

  it('applyTheme sets data-theme attribute on documentElement', () => {
    const setAttribute = vi.fn();
    vi.stubGlobal('document', { documentElement: { setAttribute } });
    applyTheme('dark');
    expect(setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    applyTheme('light');
    expect(setAttribute).toHaveBeenCalledWith('data-theme', 'light');
  });
});
