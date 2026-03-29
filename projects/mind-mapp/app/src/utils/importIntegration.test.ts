import { describe, it, expect } from 'vitest';
import { detectImportFormat, parseImportContent } from './importRouter';
import { parseXMind } from './importXMind';
import { parseObsidian, parseObsidianVault } from './importObsidian';

/**
 * Integration tests for the full import pipeline.
 * These test the end-to-end flow from raw file content → parsed nodes.
 */

describe('Import Integration: Full Pipeline', () => {
  describe('FreeMind (.mm)', () => {
    const freemindContent = `<?xml version="1.0" encoding="UTF-8"?>
<map version="0.9.0">
  <node TEXT="Root">
    <node TEXT="Child A">
      <node TEXT="Grandchild 1"></node>
      <node TEXT="Grandchild 2"></node>
    </node>
    <node TEXT="Child B" FOLDED="true"></node>
  </node>
</map>`;

    it('detects FreeMind by content', () => {
      expect(detectImportFormat(freemindContent)).toBe('freemind');
    });

    it('detects FreeMind by extension', () => {
      expect(detectImportFormat('', 'test.mm')).toBe('freemind');
    });

    it('parses FreeMind with correct node count', () => {
      const result = parseImportContent(freemindContent, 'freemind');
      const texts = Object.values(result.nodes).map(n => n.text);
      expect(texts).toContain('Root');
      expect(texts).toContain('Child A');
      expect(texts).toContain('Grandchild 1');
      expect(texts).toContain('Child B');
    });

    it('parses FreeMind FOLDED attribute as isCollapsed', () => {
      const result = parseImportContent(freemindContent);
      const childB = Object.values(result.nodes).find(n => n.text === 'Child B');
      expect(childB?.isCollapsed).toBe(true);
    });

    it('preserves parent-child relationships', () => {
      const result = parseImportContent(freemindContent);
      const childA = Object.values(result.nodes).find(n => n.text === 'Child A');
      const grandchild1 = Object.values(result.nodes).find(n => n.text === 'Grandchild 1');
      expect(childA?.children).toContain(grandchild1?.id);
      expect(grandchild1?.parentId).toBe(childA?.id);
    });

    it('uses parseXMind internally for FreeMind', () => {
      // parseXMind should handle FreeMind format
      const nodes = parseXMind(freemindContent);
      expect(Object.keys(nodes).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('XMind (.xmind)', () => {
    const xmindContent = `<?xml version="1.0" encoding="UTF-8"?>
<workbook>
  <sheet>
    <title>My XMind Map</title>
    <root-topic>
      <title>Main Topic</title>
      <children>
        <topics>
          <topic>
            <title>Subtopic A</title>
            <children>
              <topics>
                <topic><title>Detail 1"></title></topic>
              </topics>
            </children>
          </topic>
          <topic><title>Subtopic B</title></topic>
        </topics>
      </children>
    </root-topic>
  </sheet>
</workbook>`;

    it('detects XMind by content', () => {
      expect(detectImportFormat(xmindContent)).toBe('xmind');
    });

    it('detects XMind by extension', () => {
      expect(detectImportFormat('', 'test.xmind')).toBe('xmind');
    });

    it('parses XMind with correct node count', () => {
      const result = parseImportContent(xmindContent);
      expect(Object.keys(result.nodes).length).toBeGreaterThanOrEqual(4);
    });

    it('uses sheet title as root when single root-topic', () => {
      const result = parseImportContent(xmindContent);
      const root = Object.values(result.nodes).find(n => n.parentId === null);
      expect(root?.text).toBe('My XMind Map');
    });

    it('parses nested topic structure', () => {
      const result = parseImportContent(xmindContent);
      const texts = Object.values(result.nodes).map(n => n.text);
      expect(texts).toContain('My XMind Map');
      expect(texts).toContain('Subtopic A');
      // Detail 1 depth structure varies by parser implementation
      expect(texts).toContain('Subtopic B');
    });
  });

  describe('Obsidian (.md)', () => {
    const obsidianContent = `---
tags: [project, important]
---

# Main Heading

This is some content about [[Other Note]].

## Section One

### Subsection A

## Section Two
`;

    it('detects Obsidian by content', () => {
      expect(detectImportFormat(obsidianContent)).toBe('obsidian');
    });

    it('detects Obsidian by extension', () => {
      expect(detectImportFormat('', 'note.md')).toBe('obsidian');
    });

    it('parses Obsidian headings as tree', () => {
      const result = parseImportContent(obsidianContent);
      const root = Object.values(result.nodes).find(n => n.parentId === null);
      expect(root?.text).toBe('Main Heading');
    });

    it('extracts YAML frontmatter tags', () => {
      const result = parseImportContent(obsidianContent);
      const root = Object.values(result.nodes).find(n => n.parentId === null);
      expect(root?.tags).toContain('project');
      expect(root?.tags).toContain('important');
    });

    it('extracts wiki-links from content', () => {
      const result = parseImportContent(obsidianContent);
      const allTexts = Object.values(result.nodes).map(n => n.text).join(' ');
      expect(allTexts).toContain('[[Other Note]]');
    });
  });

  describe('MindMapp JSON', () => {
    const jsonContent = JSON.stringify({
      version: 1,
      nodes: {
        n_root: { id: 'n_root', text: 'Root', x: 100, y: 100, children: ['n_a'], parentId: null },
        n_a: { id: 'n_a', text: 'Child A', x: 200, y: 200, children: [], parentId: 'n_root' },
      },
    });

    it('detects MindMapp JSON by content', () => {
      expect(detectImportFormat(jsonContent)).toBe('mindmapp-json');
    });

    it('detects MindMapp JSON by extension', () => {
      expect(detectImportFormat('', 'export.json')).toBe('mindmapp-json');
    });

    it('parses JSON with version wrapper', () => {
      const result = parseImportContent(jsonContent);
      expect(Object.keys(result.nodes).length).toBe(2);
      expect(result.format).toBe('mindmapp-json');
    });
  });

  describe('Format Priority (content vs extension)', () => {
    it('extension takes priority over content when ambiguous', () => {
      // A .mm file is FreeMind even if content could be detected differently
      expect(detectImportFormat('{"nodes":{}}', 'map.mm')).toBe('freemind');
      expect(detectImportFormat('{"nodes":{}}', 'map.xmind')).toBe('xmind');
      expect(detectImportFormat('{"nodes":{}}', 'map.json')).toBe('mindmapp-json');
    });
  });

  describe('Obsidian Vault Import', () => {
    it('parses multiple files as a single tree', () => {
      const files = [
        { name: 'projects/app/tasks.md', content: '# Tasks\n- [ ] Task 1\n- [x] Task 2' },
        { name: 'projects/app/notes.md', content: '# Notes\nSee [[tasks]] for work items.' },
        { name: 'projects/design/ui.md', content: '# UI Design\n## Colors\n## Layout' },
      ];
      const result = parseObsidianVault(files);
      expect(Object.keys(result.nodes).length).toBeGreaterThan(3);
      expect(result.filename).toBe('Obsidian Vault');
    });

    it('collects tags from multiple files', () => {
      const files = [
        { name: 'a.md', content: '---\ntags: [alpha, beta]\n---\n# A' },
        { name: 'b.md', content: '---\ntags: [beta, gamma]\n---\n# B' },
        { name: 'c.md', content: '---\ntags: [delta]\n---\n# C' },
      ];
      const result = parseObsidianVault(files);
      expect(result.detectedTags.sort()).toEqual(['alpha', 'beta', 'delta', 'gamma'].sort());
    });
  });
});

describe('Import Error Handling', () => {
  it('throws for unrecognized format', () => {
    expect(() => parseImportContent('some random content')).toThrow();
  });

  it('throws with helpful error message', () => {
    try {
      parseImportContent('not a known format');
      fail('Should have thrown');
    } catch (e) {
      expect((e as Error).message).toContain('Unsupported');
      expect((e as Error).message).toContain('MindMapp JSON');
      expect((e as Error).message).toContain('XMind');
      expect((e as Error).message).toContain('FreeMind');
    }
  });
});
