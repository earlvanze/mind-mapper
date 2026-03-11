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

  it('selectGeneration selects nodes at same hierarchy depth', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);
    store.addChild(ROOT_ID);

    const [a, b] = useMindMapStore.getState().nodes[ROOT_ID].children;
    store.addChild(a);
    store.addChild(b);

    const a1 = useMindMapStore.getState().nodes[a].children[0];
    const b1 = useMindMapStore.getState().nodes[b].children[0];

    useMindMapStore.getState().setFocus(a1);
    useMindMapStore.getState().selectGeneration();

    const next = useMindMapStore.getState();
    expect(next.selectedIds.sort()).toEqual([a1, b1].sort());
    expect(next.focusId).toBe(a1);
  });

  it('clearSelectionSet keeps focused node only', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);
    store.addChild(ROOT_ID);

    const children = useMindMapStore.getState().nodes[ROOT_ID].children;
    useMindMapStore.getState().setFocus(children[0]);
    useMindMapStore.getState().toggleSelection(children[1]);
    useMindMapStore.getState().clearSelectionSet();

    const next = useMindMapStore.getState();
    expect(next.selectedIds).toEqual([children[1]]);
    expect(next.focusId).toBe(children[1]);
  });

  it('alignSelection aligns selected nodes to focused X or Y', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);
    store.addChild(ROOT_ID);

    const [a, b] = useMindMapStore.getState().nodes[ROOT_ID].children;
    useMindMapStore.getState().setFocus(a);
    useMindMapStore.getState().toggleSelection(b);

    const before = useMindMapStore.getState();
    const ax = before.nodes[a].x;
    const ay = before.nodes[a].y;

    useMindMapStore.getState().alignSelection('x');
    let next = useMindMapStore.getState();
    expect(next.nodes[a].x).toBe(ax);
    expect(next.nodes[b].x).toBe(ax);

    useMindMapStore.getState().alignSelection('y');
    next = useMindMapStore.getState();
    expect(next.nodes[a].y).toBe(ay);
    expect(next.nodes[b].y).toBe(ay);
  });

  it('distributeSelection spaces selected nodes between first and last', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);
    store.addChild(ROOT_ID);
    store.addChild(ROOT_ID);

    const [a, b, c] = useMindMapStore.getState().nodes[ROOT_ID].children;

    useMindMapStore.getState().moveNode(a, 100, 100);
    useMindMapStore.getState().moveNode(b, 220, 160);
    useMindMapStore.getState().moveNode(c, 500, 300);

    useMindMapStore.getState().setFocus(a);
    useMindMapStore.getState().toggleSelection(b);
    useMindMapStore.getState().toggleSelection(c);

    useMindMapStore.getState().distributeSelection('x');
    let next = useMindMapStore.getState();
    expect(next.nodes[a].x).toBe(100);
    expect(next.nodes[c].x).toBe(500);
    expect(next.nodes[b].x).toBeCloseTo(300, 5);

    useMindMapStore.getState().distributeSelection('y');
    next = useMindMapStore.getState();
    expect(next.nodes[a].y).toBe(100);
    expect(next.nodes[c].y).toBe(300);
    expect(next.nodes[b].y).toBeCloseTo(200, 5);
  });

  it('stackSelection stacks selected nodes from focused anchor', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);
    store.addChild(ROOT_ID);
    store.addChild(ROOT_ID);

    const [a, b, c] = useMindMapStore.getState().nodes[ROOT_ID].children;
    useMindMapStore.getState().setFocus(b);
    useMindMapStore.getState().toggleSelection(a);
    useMindMapStore.getState().toggleSelection(c);

    const anchor = useMindMapStore.getState().nodes[b];

    useMindMapStore.getState().stackSelection('x', 50);
    let next = useMindMapStore.getState();
    const xs = [next.nodes[a].x, next.nodes[b].x, next.nodes[c].x].sort((m, n) => m - n);
    expect(xs).toEqual([anchor.x, anchor.x + 50, anchor.x + 100]);

    useMindMapStore.getState().stackSelection('y', 40);
    next = useMindMapStore.getState();
    const ys = [next.nodes[a].y, next.nodes[b].y, next.nodes[c].y].sort((m, n) => m - n);
    expect(ys).toEqual([anchor.y, anchor.y + 40, anchor.y + 80]);
  });

  it('expandSelectionToNeighbors adds parent and children of selected nodes', () => {
    const store = useMindMapStore.getState();
    store.addChild(ROOT_ID);

    const parentId = useMindMapStore.getState().nodes[ROOT_ID].children[0];
    store.addChild(parentId);
    const childId = useMindMapStore.getState().nodes[parentId].children[0];

    useMindMapStore.getState().setFocus(parentId);
    useMindMapStore.getState().expandSelectionToNeighbors();

    const next = useMindMapStore.getState();
    expect(next.selectedIds).toEqual(expect.arrayContaining([ROOT_ID, parentId, childId]));
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
