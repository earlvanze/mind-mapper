# Mind Mapp — Architecture (v0.1)

## Goal
Ship a fast, keyboard‑first mind map MVP with local persistence and export.

## Rendering Strategy (MVP)
**SVG** for simplicity + text rendering. Switch to Canvas if node count becomes large (>1–2k nodes).

## Frontend Stack
- React + TypeScript
- Vite (build/dev)
- Zustand (or React context) for state
- SVG renderer
- `html-to-image` (or `dom-to-image-more`) for PNG export

## Core Modules
### 1) State Store
- `nodes`: map of id → { id, text, x, y, parentId, children[] }
- `focusId`
- `selectedIds`
- `viewport`: { x, y, scale }
- `history`: undo stack (v0.2)

### 2) Keyboard Controller
- Enter/Tab/Shift+Tab handling
- Arrow key navigation (nearest node by direction)
- Cmd/Ctrl+K search
- Focus management

### 3) Renderer (SVG)
- Draw lines/edges (parent → child)
- Draw nodes as rounded rect + text
- Handle drag events → update positions

### 4) Persistence
- Debounced autosave to `localStorage` (key: `mindmapp.v0.1.map`)
- Export JSON (download)
- Import JSON (v0.2)

### 5) Export PNG
- Render SVG to PNG using `html-to-image`

## Data Model
```ts
export type Node = {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
  children: string[];
};
```

## File Structure (proposed)
```
/projects/mind-mapp/app
  /components
    Node.tsx
    Edge.tsx
    MindMapCanvas.tsx
    SearchDialog.tsx
  /hooks
    useKeyboard.ts
    usePanZoom.ts
  /store
    useMindMapStore.ts
  /utils
    geometry.ts
    export.ts
```

## Key Algorithms
### Nearest‑node navigation
- Filter nodes by directional quadrant (left/right/up/down)
- Pick min distance + angle bias

### Auto‑layout (v0.2)
- Simple tree layout per depth

## Risks
- SVG performance at scale
- Keyboard UX on mobile

## Next Actions
- Decide SVG vs Canvas (lean SVG)
- Create stub Vite app
- Implement core store + renderer
