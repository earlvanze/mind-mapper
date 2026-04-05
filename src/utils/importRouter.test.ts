import { describe, it, expect } from 'vitest';
import { detectImportFormat, parseImportContent } from './importRouter';

describe('detectImportFormat', () => {
  it('detects MindMapp JSON by content', () => {
    const json = JSON.stringify({ nodes: { n_root: { id: 'n_root', text: 'Root', x: 0, y: 0, children: [], parentId: null } } });
    expect(detectImportFormat(json)).toBe('mindmapp-json');
  });

  it('detects XMind by content', () => {
    const xmind = `<?xml version="1.0"?><workbook><sheet><root-topic><title>Test</title></root-topic></sheet></workbook>`;
    expect(detectImportFormat(xmind)).toBe('xmind');
  });

  it('detects FreeMind by content', () => {
    const freemind = `<?xml version="1.0"?><map version="0.9.0"><node TEXT="Root"></node></map>`;
    expect(detectImportFormat(freemind)).toBe('freemind');
  });

  it('uses filename when provided', () => {
    expect(detectImportFormat('{}', 'test.xmind')).toBe('xmind');
    expect(detectImportFormat('{}', 'test.mm')).toBe('freemind');
    expect(detectImportFormat('{}', 'test.json')).toBe('mindmapp-json');
  });

  it('returns unknown for unrecognized content', () => {
    expect(detectImportFormat('hello world')).toBe('unknown');
  });
});

describe('parseImportContent', () => {
  it('parses MindMapp JSON', () => {
    const json = JSON.stringify({ nodes: { n_root: { id: 'n_root', text: 'Root', x: 0, y: 0, children: [], parentId: null } } });
    const result = parseImportContent(json);
    expect(result.format).toBe('mindmapp-json');
    expect(Object.keys(result.nodes).length).toBeGreaterThan(0);
  });

  it('parses XMind', () => {
    const xmind = `<?xml version="1.0"?><workbook><sheet><root-topic><title>Test</title></root-topic></sheet></workbook>`;
    const result = parseImportContent(xmind);
    expect(result.format).toBe('xmind');
    expect(Object.keys(result.nodes).length).toBeGreaterThan(0);
  });

  it('throws on unknown format', () => {
    expect(() => parseImportContent('hello world')).toThrow();
  });
});
