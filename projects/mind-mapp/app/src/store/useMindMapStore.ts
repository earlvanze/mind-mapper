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
  moveNode: (id: string, x: number, y: number, commitHistory?: boolean) => void;
  moveNodes: (updates: Record<string, { x: number; y: number }>, commitHistory?: boolean) => void;
  startEditing: (id: string) => void;
  addSibling: (id: string) => void;
  addChild: (id: string) => void;
  promoteNode: (id: string) => void;
  importState: (nodes: Record<string, Node>) => void;
  resetMap: () => void;
  deleteNode: (id: string) => void;
  deleteSelected: () => void;
  moveFocus: (direction: 'left' | 'right' | 'up' | 'down') => void;
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
