# Mind Mapp — Status

## Build
- Framework: Vite + React + TypeScript
- Current version: 0.1.2
- Last build output in `dist/`
- Test runner: Vitest (`npm test`) — import validation + undo/redo store covered
- CI: GitHub Actions workflow runs `npm test` + `npm run build` on app changes
- Docs inventory + migration notes maintained
- FAQ + glossary + exports/imports + architecture + gestures + style docs available

## Core Features
- Node creation (Enter/Tab) + promote (Shift+Tab)
- Multi-select + group drag move
- Explicit edit mode (E/double‑click)
- Delete selected node(s)
- Arrow key navigation
- Search + keyboard navigation (Cmd/Ctrl+K)
- Undo/redo (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z/Cmd/Ctrl+Y)
- Autosave + JSON import/export (validated)
- Markdown export (Cmd/Ctrl+Shift+M)
- PNG export (Cmd/Ctrl+Shift+S)
- Pan/zoom + fit-to-view + reset view (mouse + touch)
- Help dialog + shortcuts
- Sample map loader
- Curved edge rendering with arrowheads
- Mini-map navigator

## Next Priorities
- Canvas renderer for larger maps
- Virtualization for very large maps
