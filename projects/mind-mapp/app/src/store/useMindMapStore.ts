import { create } from 'zustand';
import { loadFromStorage, saveToStorage, uid } from '../utils';

export type Node = {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
  children: string[];
};

type Snapshot = {
  nodes: Record<string, Node>;
  focusId: string;
  selectedIds: string[];
};

type MindMapState = {
  nodes: Record<string, Node>;
  focusId: string;
  selectedIds: string[];
  editingId?: string;
  past: Snapshot[];
  future: Snapshot[];
  canUndo: boolean;
  canRedo: boolean;
  setText: (id: string, text: string) => void;
  setFocus: (id: string) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  invertSelection: () => void;
  selectSiblings: () => void;
  selectChildren: () => void;
  selectLeaves: () => void;
  selectAncestors: () => void;
  selectTopLevel: () => void;
  selectGeneration: () => void;
  clearSelectionSet: () => void;
  expandSelectionToNeighbors: () => void;
  selectSubtree: () => void;
  moveNode: (id: string, x: number, y: number, commitHistory?: boolean) => void;
  moveNodes: (updates: Record<string, { x: number; y: number }>, commitHistory?: boolean) => void;
  nudgeSelected: (dx: number, dy: number) => void;
  startEditing: (id: string) => void;
  addSibling: (id: string) => void;
  addChild: (id: string) => void;
  promoteNode: (id: string) => void;
  importState: (nodes: Record<string, Node>) => void;
  resetMap: () => void;
  deleteNode: (id: string) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  moveFocus: (direction: 'left' | 'right' | 'up' | 'down') => void;
  selectParent: () => void;
  autoLayoutChildren: (parentId: string) => void;
  undo: () => void;
  redo: () => void;
};

const rootId = 'n_root';
const MAX_HISTORY = 100;

function cloneNodes(nodes: Record<string, Node>) {
  return Object.fromEntries(
    Object.entries(nodes).map(([id, node]) => [id, { ...node, children: [...node.children] }])
  ) as Record<string, Node>;
}

function makeSnapshot(state: Pick<MindMapState, 'nodes' | 'focusId' | 'selectedIds'>): Snapshot {
  return {
    nodes: cloneNodes(state.nodes),
    focusId: state.focusId,
    selectedIds: [...state.selectedIds],
  };
}

function withHistory(state: MindMapState) {
  const past = [...state.past, makeSnapshot(state)].slice(-MAX_HISTORY);
  return {
    past,
    future: [],
    canUndo: past.length > 0,
    canRedo: false,
  };
}

const defaultState = {
  nodes: {
    [rootId]: { id: rootId, text: 'Root', x: 320, y: 180, parentId: null, children: [] },
  },
  focusId: rootId,
  selectedIds: [rootId],
  editingId: undefined,
  past: [] as Snapshot[],
  future: [] as Snapshot[],
  canUndo: false,
  canRedo: false,
};

function loadState() {
  const parsed = loadFromStorage<{ nodes: Record<string, Node>; focusId: string }>();
  if (!parsed || !parsed.nodes || !parsed.focusId) return defaultState;
  return { ...defaultState, nodes: parsed.nodes, focusId: parsed.focusId, selectedIds: [parsed.focusId] };
}

export const useMindMapStore = create<MindMapState>((set, get) => ({
  ...(typeof window !== 'undefined' ? loadState() : defaultState),
  setText: (id, text) =>
    set(state => {
      const current = state.nodes[id];
      if (!current || current.text === text) return {};
      return {
        ...withHistory(state),
        nodes: { ...state.nodes, [id]: { ...current, text } },
      };
    }),
  setFocus: id => set({ focusId: id, selectedIds: [id], editingId: undefined }),
  toggleSelection: id =>
    set(state => {
      if (!state.nodes[id]) return {};
      const exists = state.selectedIds.includes(id);
      const selectedIds = exists
        ? state.selectedIds.filter(sid => sid !== id)
        : [...state.selectedIds, id];
      return {
        selectedIds,
        focusId: id,
        editingId: undefined,
      };
    }),
  clearSelection: () => set(state => ({ selectedIds: state.focusId ? [state.focusId] : [] })),
  selectAll: () =>
    set(state => {
      const allIds = Object.keys(state.nodes);
      if (!allIds.length) return {};
      return {
        selectedIds: allIds,
        focusId: state.focusId || allIds[0],
        editingId: undefined,
      };
    }),
  invertSelection: () =>
    set(state => {
      const allIds = Object.keys(state.nodes);
      if (!allIds.length) return {};

      const current = new Set(state.selectedIds.filter(id => !!state.nodes[id]));
      const inverted = allIds.filter(id => !current.has(id));

      if (!inverted.length) {
        const keep = state.nodes[state.focusId] ? state.focusId : allIds[0];
        return {
          selectedIds: keep ? [keep] : [],
          focusId: keep,
          editingId: undefined,
        };
      }

      return {
        selectedIds: inverted,
        focusId: inverted.includes(state.focusId) ? state.focusId : inverted[0],
        editingId: undefined,
      };
    }),
  selectSiblings: () =>
    set(state => {
      const focused = state.nodes[state.focusId];
      if (!focused) return {};

      if (!focused.parentId) {
        return {
          selectedIds: [focused.id],
          focusId: focused.id,
          editingId: undefined,
        };
      }

      const parent = state.nodes[focused.parentId];
      if (!parent) return {};

      const siblingIds = parent.children.filter(id => !!state.nodes[id]);
      if (!siblingIds.length) return {};

      return {
        selectedIds: siblingIds,
        focusId: focused.id,
        editingId: undefined,
      };
    }),
  selectChildren: () =>
    set(state => {
      const focused = state.nodes[state.focusId];
      if (!focused) return {};

      const childIds = focused.children.filter(id => !!state.nodes[id]);
      if (!childIds.length) {
        return {
          selectedIds: [focused.id],
          focusId: focused.id,
          editingId: undefined,
        };
      }

      return {
        selectedIds: childIds,
        focusId: childIds[0],
        editingId: undefined,
      };
    }),
  selectLeaves: () =>
    set(state => {
      const focused = state.nodes[state.focusId];
      if (!focused) return {};

      const leaves: string[] = [];
      const stack = [focused.id];
      const visited = new Set<string>();

      while (stack.length) {
        const id = stack.pop()!;
        const node = state.nodes[id];
        if (!node || visited.has(id)) continue;
        visited.add(id);

        const validChildren = node.children.filter(cid => !!state.nodes[cid]);
        if (!validChildren.length) {
          leaves.push(id);
        } else {
          stack.push(...validChildren);
        }
      }

      if (!leaves.length) return {};
      return {
        selectedIds: leaves,
        focusId: leaves[0],
        editingId: undefined,
      };
    }),
  selectAncestors: () =>
    set(state => {
      const focused = state.nodes[state.focusId];
      if (!focused) return {};

      const chain = [focused.id];
      let parentId = focused.parentId;

      while (parentId && state.nodes[parentId]) {
        chain.push(parentId);
        parentId = state.nodes[parentId].parentId;
      }

      return {
        selectedIds: chain,
        focusId: focused.id,
        editingId: undefined,
      };
    }),
  selectTopLevel: () =>
    set(state => {
      const selected = state.selectedIds.filter(id => !!state.nodes[id]);
      if (!selected.length) return {};

      const selectedSet = new Set(selected);
      const hasSelectedAncestor = (id: string) => {
        let parentId = state.nodes[id]?.parentId;
        while (parentId) {
          if (selectedSet.has(parentId)) return true;
          parentId = state.nodes[parentId]?.parentId ?? null;
        }
        return false;
      };

      const topLevel = selected.filter(id => !hasSelectedAncestor(id));
      if (!topLevel.length) return {};

      const focusId = topLevel.includes(state.focusId) ? state.focusId : topLevel[0];
      return {
        selectedIds: topLevel,
        focusId,
        editingId: undefined,
      };
    }),
  selectGeneration: () =>
    set(state => {
      const focused = state.nodes[state.focusId];
      if (!focused) return {};

      const depthOf = (id: string) => {
        let depth = 0;
        let current = state.nodes[id];
        const seen = new Set<string>([id]);

        while (current?.parentId) {
          if (seen.has(current.parentId)) break;
          seen.add(current.parentId);
          const parent = state.nodes[current.parentId];
          if (!parent) break;
          depth += 1;
          current = parent;
        }

        return depth;
      };

      const targetDepth = depthOf(focused.id);
      const selectedIds = Object.keys(state.nodes).filter(id => depthOf(id) === targetDepth);
      if (!selectedIds.length) return {};

      return {
        selectedIds,
        focusId: selectedIds.includes(state.focusId) ? state.focusId : selectedIds[0],
        editingId: undefined,
      };
    }),
  clearSelectionSet: () =>
    set(state => {
      const focused = state.nodes[state.focusId]
        ? state.focusId
        : Object.keys(state.nodes)[0] ?? rootId;
      return {
        selectedIds: focused ? [focused] : [],
        focusId: focused,
        editingId: undefined,
      };
    }),
  expandSelectionToNeighbors: () =>
    set(state => {
      const selected = state.selectedIds.filter(id => !!state.nodes[id]);
      if (!selected.length) return {};

      const expanded = new Set<string>(selected);
      for (const id of selected) {
        const node = state.nodes[id];
        if (!node) continue;

        if (node.parentId && state.nodes[node.parentId]) {
          expanded.add(node.parentId);
        }

        for (const childId of node.children) {
          if (state.nodes[childId]) expanded.add(childId);
        }
      }

      const selectedIds = [...expanded];
      return {
        selectedIds,
        focusId: selectedIds.includes(state.focusId) ? state.focusId : selectedIds[0],
        editingId: undefined,
      };
    }),
  selectSubtree: () =>
    set(state => {
      const focused = state.nodes[state.focusId];
      if (!focused) return {};

      const selected = new Set<string>();
      const stack = [focused.id];

      while (stack.length) {
        const id = stack.pop()!;
        const node = state.nodes[id];
        if (!node || selected.has(id)) continue;
        selected.add(id);
        stack.push(...node.children);
      }

      const selectedIds = [...selected];
      if (!selectedIds.length) return {};

      return {
        selectedIds,
        focusId: focused.id,
        editingId: undefined,
      };
    }),
  startEditing: id => set({ editingId: id, focusId: id, selectedIds: [id] }),
  moveNode: (id, x, y, commitHistory = false) =>
    set(state => {
      const node = state.nodes[id];
      if (!node) return {};
      if (node.x === x && node.y === y) return {};
      if (!commitHistory) {
        return {
          nodes: { ...state.nodes, [id]: { ...state.nodes[id], x, y } },
        };
      }
      return {
        ...withHistory(state),
        nodes: { ...state.nodes, [id]: { ...state.nodes[id], x, y } },
      };
    }),
  moveNodes: (updates, commitHistory = false) =>
    set(state => {
      const updateEntries = Object.entries(updates).filter(([id]) => !!state.nodes[id]);
      if (!updateEntries.length) return {};

      const changed = updateEntries.some(([id, pos]) => {
        const node = state.nodes[id];
        return node.x !== pos.x || node.y !== pos.y;
      });
      if (!changed) return {};

      const nextNodes = { ...state.nodes };
      for (const [id, pos] of updateEntries) {
        nextNodes[id] = { ...nextNodes[id], x: pos.x, y: pos.y };
      }

      if (!commitHistory) {
        return { nodes: nextNodes };
      }

      return {
        ...withHistory(state),
        nodes: nextNodes,
      };
    }),
  nudgeSelected: (dx, dy) =>
    set(state => {
      if (!dx && !dy) return {};
      const ids = state.selectedIds.filter(id => !!state.nodes[id]);
      if (!ids.length) return {};

      const nextNodes = { ...state.nodes };
      for (const id of ids) {
        nextNodes[id] = {
          ...nextNodes[id],
          x: nextNodes[id].x + dx,
          y: nextNodes[id].y + dy,
        };
      }

      return {
        ...withHistory(state),
        nodes: nextNodes,
      };
    }),
  addSibling: id => {
    const state = get();
    const parentId = state.nodes[id].parentId;
    const newId = uid();
    const base = state.nodes[id];
    set(s => ({
      ...withHistory(s),
      nodes: {
        ...s.nodes,
        [newId]: { id: newId, text: 'New', x: base.x + 140, y: base.y, parentId, children: [] },
        ...(parentId
          ? { [parentId]: { ...s.nodes[parentId], children: [...s.nodes[parentId].children, newId] } }
          : {}),
      },
      focusId: newId,
      selectedIds: [newId],
    }));
  },
  addChild: id => {
    const state = get();
    const newId = uid();
    const base = state.nodes[id];
    set(s => ({
      ...withHistory(s),
      nodes: {
        ...s.nodes,
        [newId]: { id: newId, text: 'New', x: base.x + 140, y: base.y + 80, parentId: id, children: [] },
        [id]: { ...s.nodes[id], children: [...s.nodes[id].children, newId] },
      },
      focusId: newId,
      selectedIds: [newId],
    }));
  },
  promoteNode: id => {
    const state = get();
    const node = state.nodes[id];
    if (!node || !node.parentId) return;
    const parent = state.nodes[node.parentId];
    if (!parent) return;
    const newParentId = parent.parentId;
    const updated: Record<string, Node> = { ...state.nodes };
    // remove from current parent
    updated[parent.id] = {
      ...parent,
      children: parent.children.filter(c => c !== id),
    };
    // attach to new parent (or root if null)
    if (newParentId) {
      const grand = updated[newParentId];
      updated[newParentId] = { ...grand, children: [...grand.children, id] };
    }
    updated[id] = { ...node, parentId: newParentId, x: node.x + 120 };
    set(s => ({ ...withHistory(s), nodes: updated, focusId: id, selectedIds: [id] }));
  },
  importState: nodes =>
    set(state => {
      const focusId = Object.keys(nodes)[0] || rootId;
      return { ...withHistory(state), nodes, focusId, selectedIds: [focusId] };
    }),
  resetMap: () => set(state => ({ ...withHistory(state), ...defaultState })),
  deleteNode: id => {
    if (id === rootId) return; // don't delete root
    const state = get();
    const node = state.nodes[id];
    if (!node) return;
    const newNodes = { ...state.nodes };
    // remove from parent children
    if (node.parentId && newNodes[node.parentId]) {
      newNodes[node.parentId] = {
        ...newNodes[node.parentId],
        children: newNodes[node.parentId].children.filter(c => c !== id),
      };
    }
    // delete subtree
    const stack = [id];
    while (stack.length) {
      const current = stack.pop()!;
      const n = newNodes[current];
      if (n) {
        stack.push(...n.children);
        delete newNodes[current];
      }
    }
    const nextFocus = newNodes[rootId] ? rootId : Object.keys(newNodes)[0];
    set(s => ({ ...withHistory(s), nodes: newNodes, focusId: nextFocus, selectedIds: nextFocus ? [nextFocus] : [] }));
  },
  deleteSelected: () => {
    const state = get();
    const seeds = state.selectedIds.filter(id => id !== rootId && !!state.nodes[id]);
    if (!seeds.length) {
      if (state.focusId !== rootId && state.nodes[state.focusId]) {
        state.deleteNode(state.focusId);
      }
      return;
    }

    const toDelete = new Set<string>();
    for (const seed of seeds) {
      const stack = [seed];
      while (stack.length) {
        const id = stack.pop()!;
        if (toDelete.has(id)) continue;
        toDelete.add(id);
        const n = state.nodes[id];
        if (n) stack.push(...n.children);
      }
    }

    const newNodes = { ...state.nodes };

    for (const id of toDelete) {
      const n = state.nodes[id];
      if (!n?.parentId) continue;
      if (toDelete.has(n.parentId)) continue;
      if (!newNodes[n.parentId]) continue;
      newNodes[n.parentId] = {
        ...newNodes[n.parentId],
        children: newNodes[n.parentId].children.filter(childId => childId !== id),
      };
    }

    for (const id of toDelete) delete newNodes[id];

    const nextFocus = newNodes[rootId] ? rootId : Object.keys(newNodes)[0];
    set(s => ({ ...withHistory(s), nodes: newNodes, focusId: nextFocus, selectedIds: nextFocus ? [nextFocus] : [] }));
  },
  duplicateSelected: () => {
    const state = get();
    const selected = new Set(state.selectedIds.filter(id => id !== rootId && !!state.nodes[id]));
    if (!selected.size) return;

    const hasSelectedAncestor = (id: string) => {
      let parentId = state.nodes[id]?.parentId;
      while (parentId) {
        if (selected.has(parentId)) return true;
        parentId = state.nodes[parentId]?.parentId ?? null;
      }
      return false;
    };

    const seedRoots = [...selected].filter(id => !hasSelectedAncestor(id));
    if (!seedRoots.length) return;

    const nextNodes: Record<string, Node> = { ...state.nodes };
    const createdRootIds: string[] = [];

    for (const seed of seedRoots) {
      const seedNode = state.nodes[seed];
      if (!seedNode) continue;

      const stack = [seed];
      const order: string[] = [];
      while (stack.length) {
        const id = stack.pop()!;
        if (!state.nodes[id]) continue;
        order.push(id);
        stack.push(...state.nodes[id].children);
      }

      const idMap: Record<string, string> = {};
      for (const oldId of order) {
        idMap[oldId] = uid();
      }

      for (const oldId of order) {
        const source = state.nodes[oldId];
        if (!source) continue;

        const isSeedRoot = oldId === seed;
        const mappedParentId = source.parentId ? idMap[source.parentId] : undefined;

        nextNodes[idMap[oldId]] = {
          id: idMap[oldId],
          text: source.text,
          x: source.x + 40,
          y: source.y + 40,
          parentId: isSeedRoot ? source.parentId : mappedParentId ?? null,
          children: source.children.map(cid => idMap[cid]).filter(Boolean),
        };
      }

      const cloneRootId = idMap[seed];
      createdRootIds.push(cloneRootId);
      if (seedNode.parentId && nextNodes[seedNode.parentId]) {
        nextNodes[seedNode.parentId] = {
          ...nextNodes[seedNode.parentId],
          children: [...nextNodes[seedNode.parentId].children, cloneRootId],
        };
      }
    }

    if (!createdRootIds.length) return;
    set(s => ({
      ...withHistory(s),
      nodes: nextNodes,
      focusId: createdRootIds[0],
      selectedIds: createdRootIds,
      editingId: undefined,
    }));
  },
  moveFocus: direction => {
    const state = get();
    const current = state.nodes[state.focusId];
    if (!current) return;
    const candidates = Object.values(state.nodes).filter(n => n.id !== current.id);
    const scored = candidates
      .map(n => {
        const dx = n.x - current.x;
        const dy = n.y - current.y;
        const isValid =
          (direction === 'left' && dx < 0) ||
          (direction === 'right' && dx > 0) ||
          (direction === 'up' && dy < 0) ||
          (direction === 'down' && dy > 0);
        if (!isValid) return null;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angleBias = Math.abs(direction === 'left' || direction === 'right' ? dy : dx);
        return { id: n.id, score: dist + angleBias * 0.3 };
      })
      .filter(Boolean) as { id: string; score: number }[];
    if (!scored.length) return;
    scored.sort((a, b) => a.score - b.score);
    set({ focusId: scored[0].id, selectedIds: [scored[0].id] });
  },
  selectParent: () => {
    const state = get();
    const focused = state.nodes[state.focusId];
    if (!focused?.parentId) return;
    if (!state.nodes[focused.parentId]) return;
    set({
      focusId: focused.parentId,
      selectedIds: [focused.parentId],
      editingId: undefined,
    });
  },
  autoLayoutChildren: parentId => {
    const state = get();
    const parent = state.nodes[parentId];
    if (!parent) return;
    const children = parent.children.map(id => state.nodes[id]).filter(Boolean);
    if (!children.length) return;
    const startY = parent.y - (children.length - 1) * 40;
    const updatedNodes = { ...state.nodes };
    children.forEach((child, i) => {
      updatedNodes[child.id] = { ...updatedNodes[child.id], x: parent.x + 180, y: startY + i * 80 };
    });
    set(s => ({ ...withHistory(s), nodes: updatedNodes }));
  },
  undo: () =>
    set(state => {
      if (!state.past.length) return {};
      const previous = state.past[state.past.length - 1];
      const past = state.past.slice(0, -1);
      const future = [makeSnapshot(state), ...state.future].slice(0, MAX_HISTORY);
      return {
        nodes: previous.nodes,
        focusId: previous.focusId,
        selectedIds: previous.selectedIds?.length ? previous.selectedIds : [previous.focusId],
        editingId: undefined,
        past,
        future,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
      };
    }),
  redo: () =>
    set(state => {
      if (!state.future.length) return {};
      const next = state.future[0];
      const future = state.future.slice(1);
      const past = [...state.past, makeSnapshot(state)].slice(-MAX_HISTORY);
      return {
        nodes: next.nodes,
        focusId: next.focusId,
        selectedIds: next.selectedIds?.length ? next.selectedIds : [next.focusId],
        editingId: undefined,
        past,
        future,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
      };
    }),
}));

// autosave is triggered from hook to debounce localStorage writes
export function saveState() {
  const state = useMindMapStore.getState();
  saveToStorage({ nodes: state.nodes, focusId: state.focusId });
}
