import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadFromStorage, saveToStorage } from './storage';

describe('storage', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    });
  });

  describe('loadFromStorage', () => {
    it('returns null when key does not exist', () => {
      expect(loadFromStorage<{ name: string }>()).toBeNull();
    });

    it('returns null on JSON parse error', () => {
      store.set('mindmapp.v0.1.map', 'not valid json {{{');
      expect(loadFromStorage()).toBeNull();
    });

    it('returns parsed data when valid JSON', () => {
      const data = { name: 'test', value: 42 };
      store.set('mindmapp.v0.1.map', JSON.stringify(data));
      expect(loadFromStorage<typeof data>()).toEqual(data);
    });
  });

  describe('saveToStorage', () => {
    it('stores JSON stringified data', () => {
      saveToStorage({ name: 'test' });
      const saved = store.get('mindmapp.v0.1.map');
      expect(JSON.parse(saved!)).toEqual({ name: 'test' });
    });
  });
});
