# Mind Mapp — Architecture (App)

## Overview
- **UI**: React + Vite, HTML nodes with SVG edges overlay
- **State**: Zustand store (nodes, focus, editing)
- **Persistence**: localStorage (`mindmapp.v0.1.map`)
- **Exports**: JSON (versioned) + PNG

## Key Modules
- `src/store/useMindMapStore.ts`: state + actions
- `src/components/Node.tsx`: node view/edit/drag
- `src/components/Edges.tsx`: edge rendering
- `src/hooks/useKeyboard.ts`: keyboard shortcuts
- `src/hooks/usePanZoom.ts`: pan/zoom + reset view
- `src/utils/*`: exports, storage, ids

## Rendering Strategy
- Nodes are positioned divs
- SVG edges are drawn between node centers

## Extensibility Notes
- Undo/redo: history stack in store
- Multi-select: selection set + drag group
- Import validation: schema versioning in `exportJson`
