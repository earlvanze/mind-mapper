# Mind Mapp — Status

## Build
- Framework: Vite + React + TypeScript
- Current version: 0.1.2
- Last build output in `dist/`
- Test runner: Vitest (`npm test`) — import, store history, minimap, fit math, edge/path, and pan/zoom math covered
- CI: GitHub Actions workflow runs `npm test` + `npm run build` on app changes
- Search/Help dialogs are lazy-loaded for faster initial paint
- Advanced toolbar actions are collapsible to reduce UI clutter (Shift+A toggle, visibility persisted)
- Grid/mini-map visibility prefs persist across reloads
- Docs inventory + migration notes maintained
- FAQ + glossary + exports/imports + architecture + gestures + style docs available

## Core Features
- Node creation (Enter/Tab) + promote (Shift+Tab)
- Multi-select + group drag move (+ Cmd/Ctrl+A select all + Alt+I invert + Alt+S siblings + Alt+C children + Alt+L leaves + Alt+U ancestors + Alt+T top-level + Alt+G generation + Alt+X clear extras + Alt+N neighbors + Alt+Shift+X/Y align + Alt+Shift+H/V distribute + Alt+Shift+R/D layout row/column + Alt+Shift+G snap + Alt+Shift+M/W mirror + Alt+[/] stack + Alt+B subtree + Alt+P parent + Cmd/Ctrl+D duplicate + Alt+Arrow nudge)
- Explicit edit mode (E/double‑click)
- Delete selected node(s)
- Arrow key navigation
- Search + keyboard navigation (Cmd/Ctrl+K, centers selected result)
- Undo/redo (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z/Cmd/Ctrl+Y)
- Autosave + JSON import/export (validated)
- Markdown export (Cmd/Ctrl+Shift+M)
- PNG export (Cmd/Ctrl+Shift+S)
- Pan/zoom + fit-to-view + fit-selection + grid/mini-map toggles + reset view (mouse + touch, state-synced)
- Help dialog + shortcuts
- Sample map loader
- Curved edge rendering with arrowheads
- Mini-map navigator (focus + center + background recenter) with live viewport indicator (event-synced)

## Next Priorities
- Canvas renderer for larger maps
- Virtualization for very large maps
