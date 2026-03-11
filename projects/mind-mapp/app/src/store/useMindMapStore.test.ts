import { beforeEach, describe, expect, it } from 'vitest';
import { useMindMapStore, type Node } from './useMindMapStore';

const ROOT_ID = 'n_root';

function resetStore() {
  const root: Node = {
    id: ROOT_ID,
    text: 'Root',
    x: 320,
    y: 180,
    parentId: null,
    children: [],
  };

  useMindMapStore.setState({
    nodes: { [ROOT_ID]: root },
    focusId: ROOT_ID,
    selectedIds: [ROOT_ID],
    editingId: undefined,
    past: [],
    future: [],
    canUndo: false,
    canRedo: false,
  });
}

describe('useMindMapStore history', () => {
  beforeEach(() => {
    resetStore();
  });

  it('undoes and redoes addChild mutations', () => {
    const store = useMindMapStore.getState();

    store.addChild(ROOT_ID);
    expect(Object.keys(useMindMapStore.getState().nodes)).toHaveLength(2);
    expect(useMindMapStore.getState().canUndo).toBe(true);

    useMindMapStore.getState().undo();
    expect(Object.keys(useMindMapStore.getState().nodes)).toHaveLength(1);
    expect(useMindMapStore.getState().canRedo).toBe(true);

    useMindMapStore.getState().redo();
    expect(Object.keys(useMindMapStore.getState().nodes)).toHaveLength(2);
    expect(useMindMapStore.getState().canUndo).toBe(true);
  });

  it('clears redo stack when new mutation happens after undo', () => {
    useMindMapStore.getState().addChild(ROOT_ID);
    useMindMapStore.getState().undo();

    expect(useMindMapStore.getState().canRedo).toBe(true);

    useMindMapStore.getState().addChild(ROOT_ID);

    expect(useMindMapStore.getState().canRedo).toBe(false);
    expect(useMindMapStore.getState().future).toHaveLength(0);
  });

  it('does not create history for no-op setText', () => {
    useMindMapStore.getState().setText(ROOT_ID, 'Root');

    expect(useMindMapStore.getState().past).toHaveLength(0);
    expect(useMindMapStore.getState().canUndo).toBe(false);
  });

  it('moves selected nodes together with one history commit', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);
    store.addChild(ROOT_ID);

    const state = useMindMapStore.getState();
    const childIds = state.nodes[ROOT_ID].children;

    state.setFocus(childIds[0]);
    state.toggleSelection(childIds[1]);

    useMindMapStore.getState().moveNodes(
      {
        [childIds[0]]: { x: 500, y: 200 },
        [childIds[1]]: { x: 520, y: 280 },
      },
      true,
    );

    const moved = useMindMapStore.getState();
    expect(moved.nodes[childIds[0]].x).toBe(500);
    expect(moved.nodes[childIds[1]].x).toBe(520);
    expect(moved.canUndo).toBe(true);

    moved.undo();
    const undone = useMindMapStore.getState();
    expect(undone.nodes[childIds[0]].x).not.toBe(500);
    expect(undone.nodes[childIds[1]].x).not.toBe(520);
  });

  it('deletes all selected nodes with one delete action', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);
    store.addChild(ROOT_ID);

    const childIds = useMindMapStore.getState().nodes[ROOT_ID].children;

    useMindMapStore.getState().setFocus(childIds[0]);
    useMindMapStore.getState().toggleSelection(childIds[1]);
    useMindMapStore.getState().deleteSelected();

    const next = useMindMapStore.getState();
    expect(next.nodes[childIds[0]]).toBeUndefined();
    expect(next.nodes[childIds[1]]).toBeUndefined();
    expect(next.nodes[ROOT_ID].children).toHaveLength(0);
  });

  it('selectAll marks every node as selected', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);
    store.addChild(ROOT_ID);

    useMindMapStore.getState().selectAll();

    const next = useMindMapStore.getState();
    expect(next.selectedIds.sort()).toEqual(Object.keys(next.nodes).sort());
  });

  it('selectSiblings selects siblings of focused node', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);
    store.addChild(ROOT_ID);
    const parentIds = useMindMapStore.getState().nodes[ROOT_ID].children;

    store.addChild(parentIds[0]);
    store.addChild(parentIds[0]);
    const siblingIds = useMindMapStore.getState().nodes[parentIds[0]].children;

    useMindMapStore.getState().setFocus(siblingIds[0]);
    useMindMapStore.getState().selectSiblings();

    const selected = useMindMapStore.getState().selectedIds;
    expect(selected.sort()).toEqual([...siblingIds].sort());
  });

  it('invertSelection toggles selected vs unselected nodes', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);
    store.addChild(ROOT_ID);

    const children = useMindMapStore.getState().nodes[ROOT_ID].children;
    useMindMapStore.getState().setFocus(children[0]);

    useMindMapStore.getState().invertSelection();
    const inverted = useMindMapStore.getState();

    expect(inverted.selectedIds).not.toContain(children[0]);
    expect(inverted.selectedIds.length).toBe(Object.keys(inverted.nodes).length - 1);
  });

  it('selectSubtree selects focused node and descendants', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);

    const parentId = useMindMapStore.getState().nodes[ROOT_ID].children[0];
    store.addChild(parentId);
    const childId = useMindMapStore.getState().nodes[parentId].children[0];
    store.addChild(childId);
    const grandChildId = useMindMapStore.getState().nodes[childId].children[0];

    useMindMapStore.getState().setFocus(parentId);
    useMindMapStore.getState().selectSubtree();

    const selected = useMindMapStore.getState().selectedIds.sort();
    expect(selected).toEqual([parentId, childId, grandChildId].sort());
  });

  it('selectParent focuses parent of current node', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);

    const parentId = useMindMapStore.getState().nodes[ROOT_ID].children[0];
    store.addChild(parentId);
    const childId = useMindMapStore.getState().nodes[parentId].children[0];

    useMindMapStore.getState().setFocus(childId);
    useMindMapStore.getState().selectParent();

    const next = useMindMapStore.getState();
    expect(next.focusId).toBe(parentId);
    expect(next.selectedIds).toEqual([parentId]);
  });

  it('selectChildren selects focused node children', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);

    const parentId = useMindMapStore.getState().nodes[ROOT_ID].children[0];
    store.addChild(parentId);
    store.addChild(parentId);

    useMindMapStore.getState().setFocus(parentId);
    useMindMapStore.getState().selectChildren();

    const next = useMindMapStore.getState();
    const expected = next.nodes[parentId].children;
    expect(next.selectedIds.sort()).toEqual([...expected].sort());
    expect(next.focusId).toBe(expected[0]);
  });

  it('selectLeaves selects leaves under focused subtree', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);

    const parentId = useMindMapStore.getState().nodes[ROOT_ID].children[0];
    store.addChild(parentId);
    store.addChild(parentId);

    const [childA, childB] = useMindMapStore.getState().nodes[parentId].children;
    store.addChild(childA);
    const grandChild = useMindMapStore.getState().nodes[childA].children[0];

    useMindMapStore.getState().setFocus(parentId);
    useMindMapStore.getState().selectLeaves();

    const next = useMindMapStore.getState();
    const leaves = next.selectedIds.sort();
    expect(leaves).toEqual([childB, grandChild].sort());
  });

  it('selectAncestors selects focused node lineage up to root', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);

    const parentId = useMindMapStore.getState().nodes[ROOT_ID].children[0];
    store.addChild(parentId);
    const childId = useMindMapStore.getState().nodes[parentId].children[0];

    useMindMapStore.getState().setFocus(childId);
    useMindMapStore.getState().selectAncestors();

    const next = useMindMapStore.getState();
    expect(next.selectedIds.sort()).toEqual([childId, parentId, ROOT_ID].sort());
    expect(next.focusId).toBe(childId);
  });

  it('selectTopLevel removes descendants when ancestor is selected', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);

    const parentId = useMindMapStore.getState().nodes[ROOT_ID].children[0];
    store.addChild(parentId);
    const childId = useMindMapStore.getState().nodes[parentId].children[0];

    useMindMapStore.getState().setFocus(parentId);
    useMindMapStore.getState().toggleSelection(childId);
    useMindMapStore.getState().selectTopLevel();

    const next = useMindMapStore.getState();
    expect(next.selectedIds).toEqual([parentId]);
    expect(next.focusId).toBe(parentId);
  });

  it('nudges selected nodes and supports undo', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);

    const childId = useMindMapStore.getState().nodes[ROOT_ID].children[0];
    const before = useMindMapStore.getState().nodes[childId];

    useMindMapStore.getState().setFocus(childId);
    useMindMapStore.getState().nudgeSelected(10, -20);

    const moved = useMindMapStore.getState().nodes[childId];
    expect(moved.x).toBe(before.x + 10);
    expect(moved.y).toBe(before.y - 20);

    useMindMapStore.getState().undo();
    const undone = useMindMapStore.getState().nodes[childId];
    expect(undone.x).toBe(before.x);
    expect(undone.y).toBe(before.y);
  });

  it('duplicates selected nodes with offset and selection handoff', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);

    const childId = useMindMapStore.getState().nodes[ROOT_ID].children[0];
    const source = useMindMapStore.getState().nodes[childId];

    useMindMapStore.getState().setFocus(childId);
    useMindMapStore.getState().duplicateSelected();

    const next = useMindMapStore.getState();
    expect(next.selectedIds).toHaveLength(1);

    const dupId = next.selectedIds[0];
    expect(dupId).not.toBe(childId);
    expect(next.nodes[dupId]).toBeDefined();
    expect(next.nodes[dupId].text).toBe(source.text);
    expect(next.nodes[dupId].x).toBe(source.x + 40);
    expect(next.nodes[dupId].y).toBe(source.y + 40);
    expect(next.nodes[ROOT_ID].children).toContain(dupId);
  });

  it('duplicates subtree structure for selected parent nodes', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);

    const parentId = useMindMapStore.getState().nodes[ROOT_ID].children[0];
    store.addChild(parentId);

    const childId = useMindMapStore.getState().nodes[parentId].children[0];
    const sourceParent = useMindMapStore.getState().nodes[parentId];
    const sourceChild = useMindMapStore.getState().nodes[childId];

    useMindMapStore.getState().setFocus(parentId);
    useMindMapStore.getState().duplicateSelected();

    const next = useMindMapStore.getState();
    const dupParentId = next.selectedIds[0];
    const dupParent = next.nodes[dupParentId];

    expect(dupParent.parentId).toBe(sourceParent.parentId);
    expect(dupParent.children).toHaveLength(1);

    const dupChildId = dupParent.children[0];
    const dupChild = next.nodes[dupChildId];
    expect(dupChild.parentId).toBe(dupParentId);
    expect(dupChild.text).toBe(sourceChild.text);
    expect(dupChild.x).toBe(sourceChild.x + 40);
    expect(dupChild.y).toBe(sourceChild.y + 40);
  });

  it('does not double-duplicate descendants when parent and child are both selected', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);

    const parentId = useMindMapStore.getState().nodes[ROOT_ID].children[0];
    store.addChild(parentId);
    const childId = useMindMapStore.getState().nodes[parentId].children[0];

    const beforeCount = Object.keys(useMindMapStore.getState().nodes).length;

    useMindMapStore.getState().setFocus(parentId);
    useMindMapStore.getState().toggleSelection(childId);
    useMindMapStore.getState().duplicateSelected();

    const afterCount = Object.keys(useMindMapStore.getState().nodes).length;
    expect(afterCount).toBe(beforeCount + 2);
  });
});
