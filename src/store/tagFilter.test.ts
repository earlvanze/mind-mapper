import { describe, it, expect, beforeEach } from 'vitest';
import { useMindMapStore } from './useMindMapStore';

const getStore = () => useMindMapStore.getState();

describe('Tag filtering integration', () => {
  beforeEach(() => {
    getStore().resetMap();
  });

  function createMapWithTags() {
    // Capture node IDs from root before adding children
    const rootId = 'n_root';
    getStore().addChild(rootId);
    getStore().addTag(getStore().nodes[rootId].children[0], 'urgent');
    getStore().addTag(getStore().nodes[rootId].children[0], 'review');
    
    getStore().addChild(rootId);
    getStore().addTag(getStore().nodes[rootId].children[1], 'urgent');
    
    getStore().addChild(rootId);
    getStore().addTag(getStore().nodes[rootId].children[2], 'done');
    
    const state = getStore();
    return { 
      rootId, 
      child1: state.nodes[rootId].children[0],
      child2: state.nodes[rootId].children[1],
      child3: state.nodes[rootId].children[2],
    };
  }

  describe('setTagFilter', () => {
    it('adds a tag to filters if not present', () => {
      getStore().setTagFilter('urgent');
      expect(getStore().activeTagFilters).toContain('urgent');
    });

    it('removes a tag from filters if already present (toggle behavior)', () => {
      getStore().setTagFilter('urgent');
      getStore().setTagFilter('urgent');
      expect(getStore().activeTagFilters).not.toContain('urgent');
    });

    it('can add multiple filters', () => {
      getStore().setTagFilter('urgent');
      getStore().setTagFilter('done');
      getStore().setTagFilter('review');
      expect(getStore().activeTagFilters).toEqual(['urgent', 'done', 'review']);
    });
  });

  describe('clearTagFilters', () => {
    it('removes all active filters', () => {
      getStore().setTagFilter('urgent');
      getStore().setTagFilter('done');
      getStore().setTagFilter('review');
      getStore().clearTagFilters();
      expect(getStore().activeTagFilters).toEqual([]);
    });

    it('clearTagFilters does NOT push to undo history', () => {
      getStore().setTagFilter('urgent');
      const canUndoBeforeClear = getStore().canUndo;
      getStore().clearTagFilters();
      expect(getStore().canUndo).toBe(canUndoBeforeClear);
    });
  });

  describe('toggleMatchMode', () => {
    it('switches from any to all', () => {
      expect(getStore().matchMode).toBe('any');
      getStore().toggleMatchMode();
      expect(getStore().matchMode).toBe('all');
    });

    it('switches from all to any', () => {
      getStore().toggleMatchMode(); // any → all
      getStore().toggleMatchMode(); // all → any
      expect(getStore().matchMode).toBe('any');
    });

    it('toggleMatchMode does NOT push to undo history', () => {
      const initialCanUndo = getStore().canUndo;
      getStore().toggleMatchMode();
      expect(getStore().canUndo).toBe(initialCanUndo);
    });
  });

  describe('filter with node tag data', () => {
    it('filtering does not modify node tags', () => {
      const { child1 } = createMapWithTags();
      const tagsBefore = [...(getStore().nodes[child1].tags || [])];
      
      getStore().setTagFilter('urgent');
      getStore().setTagFilter('done');
      getStore().toggleMatchMode();
      getStore().clearTagFilters();
      
      const tagsAfter = getStore().nodes[child1].tags;
      expect(tagsAfter).toEqual(tagsBefore);
    });

    it('node tags are preserved correctly', () => {
      const { rootId, child1, child2, child3 } = createMapWithTags();
      
      expect(getStore().nodes[rootId].tags).toBeUndefined();
      expect(getStore().nodes[child1].tags).toEqual(['urgent', 'review']);
      expect(getStore().nodes[child2].tags).toEqual(['urgent']);
      expect(getStore().nodes[child3].tags).toEqual(['done']);
    });
  });

  describe('isFaded logic (AND/OR semantics)', () => {
    function getIsFaded(nodeId: string) {
      const state = getStore();
      const hasFilters = state.activeTagFilters.length > 0;
      const nodeTags = state.nodes[nodeId]?.tags || [];
      return hasFilters && 
        (state.matchMode === 'any'
          ? !state.activeTagFilters.some(f => nodeTags.includes(f))
          : !state.activeTagFilters.every(f => nodeTags.includes(f)));
    }

    it('OR mode: node fades if it has NONE of the filters', () => {
      const { child1 } = createMapWithTags();
      getStore().setTagFilter('done'); // only 'done'
      
      // child1 has ['urgent', 'review'], filter is ['done']
      // In OR mode: no filter matches → should be faded
      expect(getIsFaded(child1)).toBe(true);
    });

    it('OR mode: node NOT faded if it matches at least one filter', () => {
      const { child1 } = createMapWithTags();
      getStore().setTagFilter('urgent'); // child1 has 'urgent'
      
      expect(getIsFaded(child1)).toBe(false);
    });

    it('AND mode: node NOT faded if it has ALL filters', () => {
      const { child1 } = createMapWithTags();
      getStore().setTagFilter('urgent');
      getStore().setTagFilter('review');
      getStore().toggleMatchMode(); // all
      
      // child1 has both 'urgent' AND 'review' → not faded
      expect(getIsFaded(child1)).toBe(false);
    });

    it('AND mode: node fades if missing one filter', () => {
      const { child2 } = createMapWithTags();
      getStore().setTagFilter('urgent');
      getStore().setTagFilter('review'); // child2 only has 'urgent', not 'review'
      getStore().toggleMatchMode(); // all
      
      // child2 has only 'urgent', missing 'review' → faded
      expect(getIsFaded(child2)).toBe(true);
    });
  });

  describe('resetMap clears filters', () => {
    it('resetMap clears all filter state', () => {
      getStore().setTagFilter('urgent');
      getStore().setTagFilter('done');
      getStore().toggleMatchMode();
      
      // Before reset - filters are active
      expect(getStore().activeTagFilters).toEqual(['urgent', 'done']);
      expect(getStore().matchMode).toBe('all');
      
      getStore().resetMap();
      
      // After reset - filters cleared
      expect(getStore().activeTagFilters).toEqual([]);
      expect(getStore().matchMode).toBe('any');
    });
  });
});
