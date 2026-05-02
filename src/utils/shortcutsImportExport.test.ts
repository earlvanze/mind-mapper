import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  exportShortcutsAsJson,
  importShortcutsFromJson,
  type ShortcutsExport,
} from './keyboardShortcuts';

const STORAGE_KEY = 'mindmapp.v0.2.shortcuts';

describe('shortcuts import/export', () => {
  // Shared in-memory store — re-created per describe block
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => { store.clear(); },
    });
  });

  it('exportShortcutsAsJson returns valid JSON with version and shortcuts', () => {
    const json = exportShortcutsAsJson();
    const data: ShortcutsExport = JSON.parse(json);
    expect(data.version).toBe(1);
    expect(typeof data.exportedAt).toBe('number');
    expect(typeof data.shortcuts).toBe('object');
  });

  it('exportShortcutsAsJson includes current stored prefs', () => {
    store.set(STORAGE_KEY, JSON.stringify({ search: 'Cmd+Shift+K' }));
    const json = exportShortcutsAsJson();
    const data = JSON.parse(json) as ShortcutsExport;
    expect(data.shortcuts.search).toBe('Cmd+Shift+K');
  });

  it('importShortcutsFromJson applies shortcuts on success', () => {
    const json = JSON.stringify({ version: 1, exportedAt: Date.now(), shortcuts: { search: 'Ctrl+F' } });
    const err = importShortcutsFromJson(json);
    expect(err).toBeNull();
    expect(JSON.parse(store.get(STORAGE_KEY)!)).toEqual({ search: 'Ctrl+F' });
  });

  it('importShortcutsFromJson returns error for invalid JSON', () => {
    expect(importShortcutsFromJson('not json')).toBe('Invalid JSON — could not parse file.');
  });

  it('importShortcutsFromJson returns error for missing version', () => {
    expect(importShortcutsFromJson('{"shortcuts":{}}')).toBe('Missing version field.');
  });

  it('importShortcutsFromJson returns error for missing shortcuts object', () => {
    expect(importShortcutsFromJson('{"version":1}')).toBe('Missing shortcuts object.');
  });

  it('importShortcutsFromJson returns error for unknown action', () => {
    const json = JSON.stringify({ version: 1, shortcuts: { notAnAction: 'Ctrl+X' } });
    expect(importShortcutsFromJson(json)).toBe('Unknown action "notAnAction" in imported shortcuts.');
  });

  it('importShortcutsFromJson returns null for empty shortcuts', () => {
    const json = JSON.stringify({ version: 1, shortcuts: {} });
    expect(importShortcutsFromJson(json)).toBeNull();
  });

  it('multiple imports overwrite previous', () => {
    importShortcutsFromJson(JSON.stringify({ version: 1, shortcuts: { search: 'Ctrl+A' } }));
    expect(JSON.parse(store.get(STORAGE_KEY)!).search).toBe('Ctrl+A');
    importShortcutsFromJson(JSON.stringify({ version: 1, shortcuts: { help: 'Ctrl+H' } }));
    expect(JSON.parse(store.get(STORAGE_KEY)!)).toEqual({ help: 'Ctrl+H' });
  });
});
