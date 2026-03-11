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
});
