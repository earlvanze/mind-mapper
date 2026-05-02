import { describe, it, expect, beforeEach } from 'vitest';
import { useMindMapStore } from './useMindMapStore';

describe('Tag operations', () => {
  beforeEach(() => {
    useMindMapStore.getState().resetMap();
  });

  describe('addTag', () => {
    it('adds a tag to a node', () => {
      const store = useMindMapStore.getState();
      const rootId = 'n_root';
      
      store.addTag(rootId, 'important');
      
      const node = useMindMapStore.getState().nodes[rootId];
      expect(node.tags).toEqual(['important']);
    });

    it('does not add duplicate tags', () => {
      const store = useMindMapStore.getState();
      const rootId = 'n_root';
      
      store.addTag(rootId, 'important');
      store.addTag(rootId, 'important');
      
      const node = useMindMapStore.getState().nodes[rootId];
      expect(node.tags).toEqual(['important']);
    });

    it('trims whitespace from tags', () => {
      const store = useMindMapStore.getState();
      const rootId = 'n_root';
      
      store.addTag(rootId, '  important  ');
      
      const node = useMindMapStore.getState().nodes[rootId];
      expect(node.tags).toEqual(['important']);
    });

    it('ignores empty tags', () => {
      const store = useMindMapStore.getState();
      const rootId = 'n_root';
      
      store.addTag(rootId, '   ');
      
      const node = useMindMapStore.getState().nodes[rootId];
      expect(node.tags).toBeUndefined();
    });

    it('allows multiple tags on same node', () => {
      const store = useMindMapStore.getState();
      const rootId = 'n_root';
      
      store.addTag(rootId, 'urgent');
      store.addTag(rootId, 'important');
      store.addTag(rootId, 'review');
      
      const node = useMindMapStore.getState().nodes[rootId];
      expect(node.tags).toEqual(['urgent', 'important', 'review']);
    });
  });

  describe('removeTag', () => {
    it('removes a tag from a node', () => {
      const store = useMindMapStore.getState();
      const rootId = 'n_root';
      
      store.addTag(rootId, 'important');
      store.addTag(rootId, 'urgent');
      store.removeTag(rootId, 'important');
      
      const node = useMindMapStore.getState().nodes[rootId];
      expect(node.tags).toEqual(['urgent']);
    });

    it('removes tags array when last tag is removed', () => {
      const store = useMindMapStore.getState();
      const rootId = 'n_root';
      
      store.addTag(rootId, 'important');
      store.removeTag(rootId, 'important');
      
      const node = useMindMapStore.getState().nodes[rootId];
      expect(node.tags).toBeUndefined();
    });

    it('does nothing if tag does not exist', () => {
      const store = useMindMapStore.getState();
      const rootId = 'n_root';
      
      store.addTag(rootId, 'important');
      store.removeTag(rootId, 'urgent');
      
      const node = useMindMapStore.getState().nodes[rootId];
      expect(node.tags).toEqual(['important']);
    });

    it('does nothing if node has no tags', () => {
      const store = useMindMapStore.getState();
      const rootId = 'n_root';
      
      store.removeTag(rootId, 'important');
      
      const node = useMindMapStore.getState().nodes[rootId];
      expect(node.tags).toBeUndefined();
    });
  });

  describe('addTagToSelected', () => {
    it('adds tag to all selected nodes', () => {
      const store = useMindMapStore.getState();
      const rootId = 'n_root';
      
      // Add two children
      store.addChild(rootId);
      const childId1 = useMindMapStore.getState().nodes[rootId].children[0];
      
      store.addChild(rootId);
      const childId2 = useMindMapStore.getState().nodes[rootId].children[1];
      
      // Select both
      store.setFocus(childId1);
      store.toggleSelection(childId2);
      
      store.addTagToSelected('important');
      
      const state = useMindMapStore.getState();
      expect(state.nodes[childId1].tags).toEqual(['important']);
      expect(state.nodes[childId2].tags).toEqual(['important']);
    });

    it('skips nodes that already have the tag', () => {
      const store = useMindMapStore.getState();
      const rootId = 'n_root';
      
      // Add two children
      store.addChild(rootId);
      const childId1 = useMindMapStore.getState().nodes[rootId].children[0];
      
      store.addChild(rootId);
      const childId2 = useMindMapStore.getState().nodes[rootId].children[1];
      
      // Add tag to first child
      store.addTag(childId1, 'important');
      
      // Select both
      store.setFocus(childId1);
      store.toggleSelection(childId2);
      
      store.addTagToSelected('important');
      
      const state = useMindMapStore.getState();
      expect(state.nodes[childId1].tags).toEqual(['important']);
      expect(state.nodes[childId2].tags).toEqual(['important']);
    });

    it('does nothing when no nodes selected', () => {
      const store = useMindMapStore.getState();
      
      // Manually set selectedIds to empty array
      useMindMapStore.setState({ selectedIds: [] });
      
      const rootId = 'n_root';
      const initialNodes = { ...useMindMapStore.getState().nodes };
      
      store.addTagToSelected('important');
      
      expect(useMindMapStore.getState().nodes).toEqual(initialNodes);
    });
  });

  describe('undo/redo with tags', () => {
    it('supports undo after adding tag', () => {
      const store = useMindMapStore.getState();
      const rootId = 'n_root';
      
      store.addTag(rootId, 'important');
      expect(useMindMapStore.getState().nodes[rootId].tags).toEqual(['important']);
      
      store.undo();
      expect(useMindMapStore.getState().nodes[rootId].tags).toBeUndefined();
    });

    it('supports redo after undo', () => {
      const store = useMindMapStore.getState();
      const rootId = 'n_root';
      
      store.addTag(rootId, 'important');
      store.undo();
      store.redo();
      
      expect(useMindMapStore.getState().nodes[rootId].tags).toEqual(['important']);
    });
  });
});
