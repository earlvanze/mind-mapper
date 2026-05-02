import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadTheme, applyTheme } from './theme';

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

  it('returns light when v0.2 preset key is a light preset', () => {
    // Simulate v0.2 preset being stored
    const store = new Map<string, string>();
    store.set('mindmapp.v0.2.theme', 'light');
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
    });
    expect(loadTheme()).toBe('light');
  });

  it('returns dark when v0.2 preset key is a dark preset', () => {
    const store = new Map<string, string>();
    store.set('mindmapp.v0.2.theme', 'dark');
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
    });
    expect(loadTheme()).toBe('dark');
  });

  it('falls back to v0.1 dark key when no v0.2 key present', () => {
    const store = new Map<string, string>();
    store.set('mindmapp.v0.1.theme', 'dark');
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
    });
    expect(loadTheme()).toBe('dark');
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
