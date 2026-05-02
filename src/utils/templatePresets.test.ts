import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getTemplatePresets,
  getPresetById,
  saveTemplatePreset,
  deleteTemplatePreset,
  renameTemplatePreset,
} from './templatePresets';

const STORAGE_KEY = 'mindmapp.v1.exportTemplates';

const clean = () => {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
  });
  localStorage.removeItem(STORAGE_KEY);
};

describe('templatePresets', () => {
  beforeEach(() => clean());

  it('returns default presets on first load', () => {
    const presets = getTemplatePresets();
    expect(presets.length).toBeGreaterThan(0);
    expect(presets.some(p => p.id === 'minimal-light')).toBe(true);
  });

  it('getPresetById returns correct preset', () => {
    const preset = getPresetById('minimal-light');
    expect(preset?.name).toBe('Minimal Light');
    expect(preset?.theme).toBe('light');
    expect(preset?.defaultStyle.shape).toBe('rounded');
  });

  it('getPresetById returns undefined for unknown id', () => {
    expect(getPresetById('nonexistent')).toBeUndefined();
  });

  it('saveTemplatePreset adds to list and returns full preset', () => {
    const saved = saveTemplatePreset({
      name: 'My Template',
      theme: 'light',
      defaultStyle: { backgroundColor: '#ff0000', shape: 'ellipse' },
    });
    expect(saved.id).toMatch(/^tpl_\d+_/);
    expect(saved.name).toBe('My Template');
    expect(saved.createdAt).toBeGreaterThan(0);
    const all = getTemplatePresets();
    expect(all.some(p => p.id === saved.id)).toBe(true);
  });

  it('renameTemplatePreset updates name', () => {
    const saved = saveTemplatePreset({
      name: 'Original',
      theme: 'dark',
      defaultStyle: {},
    });
    renameTemplatePreset(saved.id, 'Renamed');
    const updated = getPresetById(saved.id);
    expect(updated?.name).toBe('Renamed');
  });

  it('deleteTemplatePreset removes from list', () => {
    const saved = saveTemplatePreset({
      name: 'To Delete',
      theme: 'light',
      defaultStyle: {},
    });
    expect(getPresetById(saved.id)?.name).toBe('To Delete');
    deleteTemplatePreset(saved.id);
    expect(getPresetById(saved.id)).toBeUndefined();
  });

  it('presets have required fields', () => {
    const presets = getTemplatePresets();
    for (const p of presets) {
      expect(typeof p.id).toBe('string');
      expect(typeof p.name).toBe('string');
      expect(p.theme === 'light' || p.theme === 'dark').toBe(true);
      expect(p.defaultStyle).toBeDefined();
      expect(typeof p.createdAt).toBe('number');
    }
  });
});
