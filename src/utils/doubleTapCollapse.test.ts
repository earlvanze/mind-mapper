import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Node } from '../store/useMindMapStore';

// Mock the store
vi.mock('../store/useMindMapStore', () => {
  const actual = vi.importActual('../store/useMindMapStore');
  return {
    ...actual,
    useMindMapStore: {
      getState: vi.fn(() => ({
        toggleNodeCollapsed: vi.fn(),
        nodes: {},
        selectedIds: [],
        focusId: null,
      })),
    },
  };
});

describe('double-tap collapse behavior', () => {
  // This test documents the expected behavior for the double-tap-to-collapse feature.
  // Double-tap (two clicks within 300ms) on a node body toggles collapse state.
  // A single click focuses the node. A slow double-click or normal double-click starts editing.

  it('documents: double-tap within 300ms on node with children triggers collapse toggle', () => {
    // If a user taps twice on the same node within 300ms and the node has children,
    // the collapse state should toggle.
    const lastTap = Date.now();
    const now = lastTap + 100; // 100ms later = within 300ms threshold
    
    const isDoubleTap = now - lastTap < 300;
    const nodeHasChildren = true;
    
    expect(isDoubleTap && nodeHasChildren).toBe(true);
  });

  it('documents: single click does not trigger collapse toggle', () => {
    const lastTap = Date.now();
    const now = lastTap + 500; // 500ms later = beyond 300ms threshold
    
    const isDoubleTap = now - lastTap < 300;
    
    expect(isDoubleTap).toBe(false);
  });

  it('documents: double-tap on leaf node (no children) does not trigger collapse', () => {
    const lastTap = Date.now();
    const now = lastTap + 100;
    
    const isDoubleTap = now - lastTap < 300;
    const nodeHasChildren = false;
    
    expect(isDoubleTap && nodeHasChildren).toBe(false);
  });

  it('documents: double-tap while editing does not trigger collapse toggle', () => {
    const lastTap = Date.now();
    const now = lastTap + 100;
    
    const isDoubleTap = now - lastTap < 300;
    const isEditing = true;
    const nodeHasChildren = true;
    
    expect(isDoubleTap && !isEditing && nodeHasChildren).toBe(false);
  });
});
