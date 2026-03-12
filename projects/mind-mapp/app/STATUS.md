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
- Search + keyboard navigation (Cmd/Ctrl+K, centers selected result, supports ID/path multi-term matching + path metadata + term highlighting + quoted/negated terms + Tab cycle + capped-result match counts, parser unified)
- Undo/redo (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z/Cmd/Ctrl+Y)
- Autosave + JSON import/export (validated)
- Markdown export (Cmd/Ctrl+Shift+M)
- Copy selected/focused node text (Cmd/Ctrl+Shift+C)
- Copy focused subtree outline (Cmd/Ctrl+Shift+L)
- Copy focused node path (Alt+Shift+P)
- Clickable focused-path breadcrumbs for fast ancestor focus jumps
- PNG export (Cmd/Ctrl+Shift+S)
- Pan/zoom + fit-to-view + fit-selection + fit-focused-subtree + keyboard +/- zoom + 0 reset shortcut + toolbar zoom indicator + leaf-cycle index indicator + focus history index + focus/selection/subtree/root centering + parent/child/sibling-wrap/leaf-cycle(root-aware)/root/back+forward/oldest+newest+reset focus history shortcuts + context-aware disabled focus controls + auto-pruned history after node removals + grid/mini-map toggles + reset view (mouse + touch, state-synced, helper-tested incl. parent/child)
- Help dialog + compact Focus Navigation & History section + live shortcut filtering
- Auto-dismissing toolbar notices for copy/import feedback (with manual dismiss)
- Sample map loader
- Curved edge rendering with arrowheads
- Mini-map navigator (focus + center + background recenter + viewport drag pan + focused mini-map Arrow/Shift+Arrow panning) with live viewport indicator (event-synced)

## Next Priorities
- Canvas renderer for larger maps
- Virtualization for very large maps
