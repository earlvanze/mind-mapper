import { create } from 'zustand';

export type Node = {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
  children: string[];
};

type MindMapState = {
  nodes: Record<string, Node>;
  focusId: string;
  setText: (id: string, text: string) => void;
  setFocus: (id: string) => void;
  moveNode: (id: string, x: number, y: number) => void;
  addSibling: (id: string) => void;
  addChild: (id: string) => void;
  importState: (nodes: Record<string, Node>) => void;
};

const rootId = 'n_root';

const defaultState = {
  nodes: {
    [rootId]: { id: rootId, text: 'Root', x: 320, y: 180, parentId: null, children: [] },
  },
  focusId: rootId,
};

const STORAGE_KEY = 'mindmapp.v0.1.map';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    if (!parsed.nodes || !parsed.focusId) return defaultState;
    return parsed;
  } catch {
    return defaultState;
  }
}

export const useMindMapStore = create<MindMapState>((set, get) => ({
  ...(typeof window !== 'undefined' ? loadState() : defaultState),
  setText: (id, text) => set(state => ({
    nodes: { ...state.nodes, [id]: { ...state.nodes[id], text } }
  })),
  setFocus: (id) => set({ focusId: id }),
  moveNode: (id, x, y) => set(state => ({
    nodes: { ...state.nodes, [id]: { ...state.nodes[id], x, y } }
  })),
  addSibling: (id) => {
    const state = get();
    const parentId = state.nodes[id].parentId;
    const newId = `n_${Date.now()}`;
    const base = state.nodes[id];
    set(s => ({
      nodes: {
        ...s.nodes,
        [newId]: { id: newId, text: 'New', x: base.x + 140, y: base.y, parentId, children: [] },
        ...(parentId ? { [parentId]: { ...s.nodes[parentId], children: [...s.nodes[parentId].children, newId] } } : {})
      },
      focusId: newId
    }));
  },
  addChild: (id) => {
    const state = get();
    const newId = `n_${Date.now()}`;
    const base = state.nodes[id];
    set(s => ({
      nodes: {
        ...s.nodes,
        [newId]: { id: newId, text: 'New', x: base.x + 140, y: base.y + 80, parentId: id, children: [] },
        [id]: { ...s.nodes[id], children: [...s.nodes[id].children, newId] }
      },
      focusId: newId
    }));
  },
  importState: (nodes) => set({ nodes, focusId: Object.keys(nodes)[0] || rootId })
}));

// autosave
useMindMapStore.subscribe((state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes: state.nodes, focusId: state.focusId }));
  } catch {
    // ignore storage errors
  }
});
