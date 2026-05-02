import { describe, it, expect } from 'vitest';
import { parseObsidian, isObsidianContent, parseObsidianVault } from './importObsidian';

describe('parseObsidian', () => {
  it('parses a simple markdown note', () => {
    const content = `# My Note

This is some content.
`;
    const nodes = parseObsidian(content);
    expect(Object.keys(nodes).length).toBeGreaterThan(0);

    // Root should exist
    const root = Object.values(nodes).find(n => n.parentId === null);
    expect(root).toBeDefined();
  });

  it('extracts YAML frontmatter tags', () => {
    const content = `---
tags: [important, project]
---

# Project Plan
`;
    const nodes = parseObsidian(content);
    const root = Object.values(nodes).find(n => n.parentId === null);
    expect(root?.tags).toContain('important');
    expect(root?.tags).toContain('project');
  });

  it('converts headings to child nodes', () => {
    const content = `# Main
## Section A
### Sub A1
## Section B
`;
    const nodes = parseObsidian(content);
    const root = Object.values(nodes).find(n => n.parentId === null);
    expect(root?.text).toBe('Main');
    expect(root?.children.length).toBe(2);
  });

  it('extracts wiki-links from text', () => {
    const content = `---
tags: [test]
---

# Main

See [[Other Note]] for details.
`;
    const nodes = parseObsidian(content);
    // The "See [[Other Note]]" line should be in a node
    const allTexts = Object.values(nodes).map(n => n.text);
    const hasWikiRef = allTexts.some(t => t.includes('[[Other Note]]'));
    expect(hasWikiRef).toBe(true);
  });

  it('handles bullet lists', () => {
    const content = `# Task List
- First item
- Second item
`;
    const nodes = parseObsidian(content);
    const root = Object.values(nodes).find(n => n.parentId === null);
    // Should have task list children
    expect(root?.children.length).toBeGreaterThan(0);
  });

  it('handles task items', () => {
    const content = `# Tasks
- [ ] Unchecked
- [x] Checked
`;
    const nodes = parseObsidian(content);
    const allTexts = Object.values(nodes).map(n => n.text);
    expect(allTexts).toContain('Unchecked');
    expect(allTexts).toContain('Checked');
  });

  it('handles nested headings', () => {
    const content = `# Level 1
## Level 2
### Level 3
#### Level 4
`;
    const nodes = parseObsidian(content);
    const root = Object.values(nodes).find(n => n.parentId === null);
    expect(root?.text).toBe('Level 1');
    expect(root?.children.length).toBe(1);
  });

  it('assigns positions to all nodes', () => {
    const content = `# Root
## Child 1
## Child 2
`;
    const nodes = parseObsidian(content);
    for (const node of Object.values(nodes)) {
      expect(typeof node.x).toBe('number');
      expect(typeof node.y).toBe('number');
    }
  });

  it('handles wiki-link with alias [[text|alias]]', () => {
    const content = `# Note
See [[Target|alias text]] for more.
`;
    const nodes = parseObsidian(content);
    const allTexts = Object.values(nodes).map(n => n.text);
    expect(allTexts).toContain('See [[Target|alias text]] for more.');
  });
});

describe('isObsidianContent', () => {
  it('detects YAML frontmatter', () => {
    expect(isObsidianContent('---\ntags: [test]\n---\n# Hi')).toBe(true);
  });

  it('detects wiki-links', () => {
    expect(isObsidianContent('# Note\nSee [[Link]] here.')).toBe(true);
  });

  it('detects markdown headings', () => {
    expect(isObsidianContent('# Heading\nSome text')).toBe(true);
  });

  it('rejects plain text', () => {
    expect(isObsidianContent('Just plain text')).toBe(false);
  });

  it('rejects MindMapp JSON', () => {
    expect(isObsidianContent('{"nodes":{"n_root":{"id":"n_root"}}}')).toBe(false);
  });
});

describe('parseObsidianVault', () => {
  it('merges multiple files into tree', () => {
    const files = [
      { name: 'folder/file1.md', content: '# File 1\nContent 1' },
      { name: 'folder/file2.md', content: '# File 2\nContent 2' },
    ];
    const result = parseObsidianVault(files);
    expect(Object.keys(result.nodes).length).toBeGreaterThan(0);
    expect(result.filename).toBe('Obsidian Vault');
  });

  it('creates folder hierarchy', () => {
    const files = [
      { name: 'projects/alpha.md', content: '# Alpha' },
      { name: 'projects/beta.md', content: '# Beta' },
      { name: 'notes/gamma.md', content: '# Gamma' },
    ];
    const result = parseObsidianVault(files);
    const root = Object.values(result.nodes).find(n => n.parentId === null);
    expect(root?.text).toBe('Vault Root');
    // Should have 'projects' and 'notes' children
    const children = Object.values(result.nodes).filter(n => n.parentId === root?.id);
    expect(children.length).toBeGreaterThanOrEqual(2);
  });

  it('collects tags from all files', () => {
    const files = [
      { name: 'a.md', content: '---\ntags: [alpha]\n---\n# A' },
      { name: 'b.md', content: '---\ntags: [beta]\n---\n# B' },
    ];
    const result = parseObsidianVault(files);
    expect(result.detectedTags).toContain('alpha');
    expect(result.detectedTags).toContain('beta');
  });
});
