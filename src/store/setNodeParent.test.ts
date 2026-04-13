import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { useMindMapStore } from './useMindMapStore';

describe('setNodeParent', () => {
  beforeEach(() => {
    // Reset to fresh state with a small tree:
    //   root (n_root)
    //   └── a (parentId: n_root, children: ['b'])
    //       └── b (parentId: a, children: [])
    useMindMapStore.setState({
      nodes: {
        n_root: { id: 'n_root', text: 'Root', x: 0, y: 0, parentId: null, children: ['a'] },
        a: { id: 'a', text: 'A', x: 100, y: 100, parentId: 'n_root', children: ['b'] },
        b: { id: 'b', text: 'B', x: 200, y: 200, parentId: 'a', children: [] },
      },
      focusId: 'n_root',
      selectedIds: ['n_root'],
      editingId: undefined,
      selectedEdgeId: undefined,
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
      isTransitioning: false,
      layoutMode: 'tree' as const,
    });
  });

  it('moves a node to a new parent', () => {
    const { setNodeParent } = useMindMapStore.getState();
    setNodeParent('b', 'n_root');

    const { nodes } = useMindMapStore.getState();
    expect(nodes.b.parentId).toBe('n_root');
    expect(nodes.n_root.children).toContain('b');
    expect(nodes.a.children).not.toContain('b');
  });

  it('does nothing when reparenting to the same parent', () => {
    const { setNodeParent, nodes: nodesBefore } = useMindMapStore.getState();
    setNodeParent('b', 'a');

    const { nodes } = useMindMapStore.getState();
    expect(nodes.b.parentId).toBe('a');
    expect(nodes.a.children).toEqual(['b']);
  });

  it('prevents cycles (cannot move parent under child)', () => {
    const { setNodeParent, nodes: nodesBefore } = useMindMapStore.getState();
    // Try to move 'a' under 'b' — should be blocked
    setNodeParent('a', 'b');

    const { nodes } = useMindMapStore.getState();
    // Parent should be unchanged
    expect(nodes.a.parentId).toBe('n_root');
  });

  it('allows moving to root (null parent)', () => {
    const { setNodeParent } = useMindMapStore.getState();
    setNodeParent('a', null);

    const { nodes } = useMindMapStore.getState();
    expect(nodes.a.parentId).toBeNull();
    expect(nodes.n_root.children).not.toContain('a');
  });

  it('does nothing when id is root', () => {
    const { setNodeParent, nodes: nodesBefore } = useMindMapStore.getState();
    setNodeParent('n_root', 'a');

    const { nodes } = useMindMapStore.getState();
    expect(nodes.n_root.parentId).toBeNull();
  });

  it('adds node to new parent children and removes from old', () => {
    const { setNodeParent } = useMindMapStore.getState();
    setNodeParent('b', 'n_root');

    const { nodes } = useMindMapStore.getState();
    expect(nodes.n_root.children).toContain('b');
    expect(nodes.a.children).not.toContain('b');
  });
});
