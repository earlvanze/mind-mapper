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
  editingId?: string;
  setText: (id: string, text: string) => void;
  setFocus: (id: string) => void;
  moveNode: (id: string, x: number, y: number) => void;
  startEditing: (id: string) => void;
  addSibling: (id: string) => void;
  addChild: (id: string) => void;
  importState: (nodes: Record<string, Node>) => void;
  deleteNode: (id: string) => void;
  moveFocus: (direction: 'left' | 'right' | 'up' | 'down') => void;
  autoLayoutChildren: (parentId: string) => void;
};

const rootId = 'n_root';

const defaultState = {
  nodes: {
    [rootId]: { id: rootId, text: 'Root', x: 320, y: 180, parentId: null, children: [] },
  },
  focusId: rootId,
  editingId: undefined,
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
  setFocus: (id) => set({ focusId: id, editingId: undefined }),
  startEditing: (id) => set({ editingId: id }),
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
  importState: (nodes) => set({ nodes, focusId: Object.keys(nodes)[0] || rootId }),
  deleteNode: (id) => {
    if (id === rootId) return; // don't delete root
    const state = get();
    const node = state.nodes[id];
    if (!node) return;
    const newNodes = { ...state.nodes };
    // remove from parent children
    if (node.parentId && newNodes[node.parentId]) {
      newNodes[node.parentId] = {
        ...newNodes[node.parentId],
        children: newNodes[node.parentId].children.filter(c => c !== id)
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
    set({ nodes: newNodes, focusId: rootId });
  },
  moveFocus: (direction) => {
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
        const angleBias = Math.abs((direction === 'left' || direction === 'right') ? dy : dx);
        return { id: n.id, score: dist + angleBias * 0.3 };
      })
      .filter(Boolean) as { id: string; score: number }[];
    if (!scored.length) return;
    scored.sort((a, b) => a.score - b.score);
    set({ focusId: scored[0].id });
  },
  autoLayoutChildren: (parentId) => {
    const state = get();
    const parent = state.nodes[parentId];
    if (!parent) return;
    const children = parent.children.map(id => state.nodes[id]).filter(Boolean);
    if (!children.length) return;
    const startY = parent.y - (children.length - 1) * 40;
    children.forEach((child, i) => {
      set(s => ({
        nodes: {
          ...s.nodes,
          [child.id]: { ...s.nodes[child.id], x: parent.x + 180, y: startY + i * 80 }
        }
      }));
    });
  }
}));

// autosave
useMindMapStore.subscribe((state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes: state.nodes, focusId: state.focusId }));
  } catch {
    // ignore storage errors
  }
});
