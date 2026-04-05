import { describe, it, expect } from 'vitest';
import { sampleMap } from './sampleMap';

describe('sampleMap', () => {
  it('returns a record of nodes', () => {
    const nodes = sampleMap();
    expect(typeof nodes).toBe('object');
    expect(Object.keys(nodes).length).toBeGreaterThan(0);
  });

  it('has a root node with no parent', () => {
    const nodes = sampleMap();
    const root = Object.values(nodes).find(n => n.parentId === null);
    expect(root).toBeDefined();
    expect(root?.id).toBeTruthy();
  });

  it('root node has child references', () => {
    const nodes = sampleMap();
    const root = Object.values(nodes).find(n => n.parentId === null)!;
    expect(root.children.length).toBeGreaterThan(0);
  });

  it('every child node references a valid parent', () => {
    const nodes = sampleMap();
    for (const node of Object.values(nodes)) {
      if (node.parentId !== null) {
        expect(nodes[node.parentId]).toBeDefined();
      }
    }
  });

  it('every child id appears in its parents children array', () => {
    const nodes = sampleMap();
    for (const node of Object.values(nodes)) {
      for (const childId of node.children) {
        const child = nodes[childId];
        expect(child).toBeDefined();
        expect(child.parentId).toBe(node.id);
      }
    }
  });

  it('all nodes have required fields', () => {
    const nodes = sampleMap();
    for (const [id, node] of Object.entries(nodes)) {
      expect(node.id).toBe(id);
      expect(typeof node.text).toBe('string');
      expect(node.text.length).toBeGreaterThan(0);
      expect(typeof node.x).toBe('number');
      expect(typeof node.y).toBe('number');
      expect(Array.isArray(node.children)).toBe(true);
    }
  });

  it('root node text is Mind Mapp', () => {
    const nodes = sampleMap();
    const root = Object.values(nodes).find(n => n.parentId === null)!;
    expect(root.text).toBe('Mind Mapp');
  });

  it('nodes have tag arrays', () => {
    const nodes = sampleMap();
    for (const node of Object.values(nodes)) {
      expect(Array.isArray(node.tags)).toBe(true);
    }
  });
});
