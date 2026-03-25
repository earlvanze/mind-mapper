import { describe, expect, it } from 'vitest';
import { toFreemind } from './exportFreemind';
import type { Node } from '../store/useMindMapStore';

const makeNode = (overrides: Partial<Node>): Node => ({
  id: 'n_test',
  text: 'Test',
  x: 0,
  y: 0,
  parentId: null,
  children: [],
  ...overrides,
});

describe('toFreemind', () => {
  it('returns valid XML header for empty map', () => {
    const result = toFreemind({});
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result).toContain('<map version="0.9.0">');
  });

  it('renders root node with text', () => {
    const result = toFreemind({ n_root: makeNode({ id: 'n_root', text: 'Root' }) });
    expect(result).toContain('TEXT="Root"');
  });

  it('escapes special XML characters in text', () => {
    const result = toFreemind({ n_root: makeNode({ id: 'n_root', text: 'A & B <C> "D"' }) });
    expect(result).toContain('&amp;');
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&quot;');
    expect(result).not.toContain('& B');
  });

  it('maps ellipse shape to STYLE=ellipse', () => {
    const result = toFreemind({ n_root: makeNode({ id: 'n_root', style: { shape: 'ellipse' as const } }) });
    expect(result).toContain('STYLE="ellipse"');
  });

  it('maps rectangle shape to STYLE=rectangle', () => {
    const result = toFreemind({ n_root: makeNode({ id: 'n_root', style: { shape: 'rectangle' as const } }) });
    expect(result).toContain('STYLE="rectangle"');
  });

  it('maps rounded shape to STYLE=rounded_rectangle', () => {
    const result = toFreemind({ n_root: makeNode({ id: 'n_root', style: { shape: 'rounded' as const } }) });
    expect(result).toContain('STYLE="rounded_rectangle"');
  });

  it('maps diamond shape to STYLE=diamond', () => {
    const result = toFreemind({ n_root: makeNode({ id: 'n_root', style: { shape: 'diamond' as const } }) });
    expect(result).toContain('STYLE="diamond"');
  });

  it('strips # prefix from background color', () => {
    const result = toFreemind({ n_root: makeNode({ id: 'n_root', style: { backgroundColor: '#ff5500' } }) });
    expect(result).toContain('BACKGROUND_COLOR="ff5500"');
    expect(result).not.toContain('BACKGROUND_COLOR="#ff5500"');
  });

  it('renders child nodes', () => {
    const root = makeNode({ id: 'n_root', children: ['n1'] });
    const child = makeNode({ id: 'n1', text: 'Child Node', parentId: 'n_root' });
    const result = toFreemind({ n_root: root, n1: child });
    expect(result).toContain('TEXT="Child Node"');
  });

  it('includes icon attribute', () => {
    const result = toFreemind({ n_root: makeNode({ id: 'n_root', style: { icon: 'star' } }) });
    expect(result).toContain('ICON="star"');
  });

  it('renders plain text node', () => {
    const result = toFreemind({ n_root: makeNode({ id: 'n_root', text: 'Hello World' }) });
    expect(result).toContain('TEXT="Hello World"');
  });

  it('handles disconnected orphan nodes', () => {
    const orphan = makeNode({ id: 'n_orphan', text: 'Orphan', parentId: null, children: [] });
    const result = toFreemind({ n_orphan: orphan });
    expect(result).toContain('TEXT="Orphan"');
  });
});
