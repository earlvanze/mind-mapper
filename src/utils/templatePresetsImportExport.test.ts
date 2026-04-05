import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  importTemplatesFromJson,
  exportTemplatesToJson,
  getTemplatePresets,
  saveTemplatePreset,
  type TemplatePreset,
} from './templatePresets';

// ── In-memory localStorage mock ────────────────────────────────────────────────

let store: Map<string, string>;

beforeEach(() => {
  store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => { store.set(key, val); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
  });
});

// ── File helpers ──────────────────────────────────────────────────────────────

function makeJsonFile(obj: unknown, filename = 'templates.json'): File {
  return new File([JSON.stringify(obj)], filename, { type: 'application/json' });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('importTemplatesFromJson', () => {
  it('returns error for invalid JSON', async () => {
    const file = makeJsonFile('not json');
    const result = await importTemplatesFromJson(file);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Unrecognised');
    expect(result.imported).toBe(0);
  });

  it('returns error for unrecognised format (number)', async () => {
    const file = makeJsonFile(42);
    const result = await importTemplatesFromJson(file);
    expect(result.errors[0]).toContain('Unrecognised');
  });

  it('returns error for empty array', async () => {
    const file = makeJsonFile([]);
    const result = await importTemplatesFromJson(file);
    expect(result.errors[0]).toContain('no templates');
  });

  it('imports a valid flat-array template', async () => {
    const file = makeJsonFile([{
      name: 'Flat Array Import',
      theme: 'dark',
      defaultStyle: { backgroundColor: '#111', textColor: '#eee', borderColor: '#444', borderWidth: 2, shape: 'diamond', fontSize: 'small' },
      colorPresets: [],
    }]);
    const result = await importTemplatesFromJson(file);
    expect(result.imported).toBe(1);
    expect(result.errors).toHaveLength(0);
    const stored = getTemplatePresets().filter((p: TemplatePreset) => p.name === 'Flat Array Import');
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toMatch(/^tpl_/);
    expect(stored[0].theme).toBe('dark');
    expect(stored[0].defaultStyle.shape).toBe('diamond');
  });

  it('imports from wrapped { version, templates } format', async () => {
    const file = makeJsonFile({
      version: 1,
      exportedAt: new Date().toISOString(),
      templates: [{
        name: 'Wrapped Import',
        theme: 'light',
        defaultStyle: { backgroundColor: '#fff', textColor: '#000', borderColor: '#ccc', borderWidth: 1, shape: 'ellipse', fontSize: 'large', bold: true },
        colorPresets: [],
      }],
    });
    const result = await importTemplatesFromJson(file);
    expect(result.imported).toBe(1);
    const stored = getTemplatePresets().find((p: TemplatePreset) => p.name === 'Wrapped Import');
    expect(stored?.defaultStyle.bold).toBe(true);
  });

  it('skips duplicate names (case-insensitive)', async () => {
    const file1 = makeJsonFile([{
      name: 'Dupe Test', theme: 'light',
      defaultStyle: { backgroundColor: '#fff', textColor: '#000', borderColor: '#ccc', borderWidth: 1, shape: 'rounded', fontSize: 'medium' },
      colorPresets: [],
    }]);
    await importTemplatesFromJson(file1);

    const file2 = makeJsonFile([{
      name: 'DUPE TEST', theme: 'dark',
      defaultStyle: { backgroundColor: '#000', textColor: '#fff', borderColor: '#333', borderWidth: 1, shape: 'rounded', fontSize: 'medium' },
      colorPresets: [],
    }]);
    const result = await importTemplatesFromJson(file2);

    expect(result.imported).toBe(0);
    expect(result.duplicates).toBe(1);
    const all = getTemplatePresets().filter((p: TemplatePreset) => p.name === 'Dupe Test');
    expect(all).toHaveLength(1);
  });

  it('skips entries missing name', async () => {
    const file = makeJsonFile([
      { name: 'Valid', theme: 'light', defaultStyle: { backgroundColor: '#fff', textColor: '#000', borderColor: '#ccc', borderWidth: 1, shape: 'rounded', fontSize: 'medium' }, colorPresets: [] },
      { theme: 'light', defaultStyle: {}, colorPresets: [] },
    ]);
    const result = await importTemplatesFromJson(file);
    expect(result.imported).toBe(1);
    expect(result.errors.some((e: string) => e.includes('missing name'))).toBe(true);
  });

  it('normalises unknown theme to light', async () => {
    const file = makeJsonFile([{
      name: 'Bad Theme', theme: 'purple' as any,
      defaultStyle: { backgroundColor: '#fff', textColor: '#000', borderColor: '#ccc', borderWidth: 1, shape: 'rounded', fontSize: 'medium' },
      colorPresets: [],
    }]);
    await importTemplatesFromJson(file);
    const stored = getTemplatePresets().find((p: TemplatePreset) => p.name === 'Bad Theme');
    expect(stored?.theme).toBe('light');
  });

  it('preserves colorPresets array', async () => {
    const file = makeJsonFile([{
      name: 'Color Presets Test',
      theme: 'light',
      defaultStyle: { backgroundColor: '#fff', textColor: '#000', borderColor: '#ccc', borderWidth: 1, shape: 'rounded', fontSize: 'medium' },
      colorPresets: [
        { backgroundColor: 'primary', textColor: '#fff', borderColor: '#2563eb', shape: 'rounded' },
        { backgroundColor: 'danger', textColor: '#fff', borderColor: '#dc2626', shape: 'ellipse' },
      ],
    }]);
    await importTemplatesFromJson(file);
    const stored = getTemplatePresets().find((p: TemplatePreset) => p.name === 'Color Presets Test');
    expect(stored?.colorPresets).toHaveLength(2);
    expect(stored?.colorPresets?.[1].shape).toBe('ellipse');
  });
});

describe('exportTemplatesToJson', () => {
  it('creates a downloadable JSON blob', async () => {
    // Save a custom template first
    saveTemplatePreset({
      name: 'Export Test',
      theme: 'light',
      defaultStyle: { backgroundColor: '#fff', textColor: '#000', borderColor: '#ccc', borderWidth: 1, shape: 'rounded', fontSize: 'medium' },
      colorPresets: [],
    });

    const createdBlobs: Blob[] = [];
    const fakeUrl = 'blob:export-test';

    vi.stubGlobal('Blob', class extends Blob {
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        super(parts, opts);
        createdBlobs.push(this);
      }
    });

    const createObjectURL = vi.fn(() => fakeUrl);
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    // Mock document.createElement to return a clickable anchor
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const a = origCreateElement(tag) as HTMLAnchorElement;
        a.click = vi.fn();
        Object.defineProperty(a, 'href', { value: fakeUrl, writable: true });
        Object.defineProperty(a, 'download', { value: '', writable: true });
        return a;
      }
      return origCreateElement(tag);
    });

    exportTemplatesToJson();

    expect(createObjectURL).toHaveBeenCalled();
    const blobArg = createObjectURL.mock.calls[0]![0]! as Blob;
    const text = await blobArg.text();
    const parsed = JSON.parse(text);
    expect(parsed.version).toBe(1);
    expect(Array.isArray(parsed.templates)).toBe(true);
    expect(parsed.templates.some((t: TemplatePreset) => t.name === 'Export Test')).toBe(true);
  });
});
