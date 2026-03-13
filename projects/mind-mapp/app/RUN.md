# Mind Mapp — Run Locally

```bash
cd projects/mind-mapp/app
npm install
npm run dev
```

Then open the URL shown (usually http://localhost:5173).

Optional host allowlist override (for remote/dev tunnel access):
```bash
MINDMAPP_ALLOWED_HOSTS="cyber.earlco.in,cyber.talpa-stargazer.ts.net,example.com" npm run dev
```
(Hostnames or full URLs are accepted; URLs are normalized to hosts.)

Tip: click `Advanced ▾` in the toolbar to reveal selection/layout actions (your grid/mini-map/advanced visibility preferences persist between reloads).

## Tests
```bash
npm test
```

## Shortcuts
- Enter: new sibling
- Tab: new child
- Delete/Backspace: delete selected node(s)
- Cmd/Ctrl+click: multi-select nodes
- Cmd/Ctrl+A: select all nodes
- Alt+I: invert selection
- Cmd/Ctrl+D: duplicate selected node(s)
- Alt+S: select siblings of focused node
- Alt+C: select children of focused node
- Alt+L: select leaves under focused subtree
- Alt+U: select ancestors of focused node
- Alt+T: reduce selection to top-level nodes
- Alt+G: select nodes at focused depth level
- Alt+X: clear selection extras (keep focus)
- Alt+N: expand selection to parents + children
- Alt+Shift+X: align selected nodes to focused X
- Alt+Shift+Y: align selected nodes to focused Y
- Alt+Shift+H: distribute selected nodes horizontally
- Alt+Shift+V: distribute selected nodes vertically
- Alt+Shift+R: layout selected nodes into a row
- Alt+Shift+D: layout selected nodes into a column
- Alt+Shift+G: snap selected nodes to 20px grid
- Alt+Shift+M: mirror selected nodes across focused X axis
- Alt+Shift+W: mirror selected nodes across focused Y axis
- Alt+[: stack selected nodes along X from focus
- Alt+]: stack selected nodes along Y from focus
- Alt+B: select focused subtree
- Alt+Shift+B: center focused subtree
- Alt+P: select parent of focused node
- Alt+Shift+P: copy focused node path
- Cmd/Ctrl+Z: undo
- Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y: redo
- Cmd/Ctrl+K: toggle search (matches node text + id + path terms; supports "quoted phrases", -exclude terms, and diacritic/punctuation/camelCase-insensitive matching)
- Search dialog: Tab/Shift+Tab cycle result selection, PageUp/PageDown jump by 5, Home/End jump to first/last, Enter/click jumps + closes, Shift/Cmd/Ctrl/Alt+Enter/click jumps + keeps dialog open, Esc clears query (or closes when empty), Cmd/Ctrl+F focuses query input
- ? or Cmd/Ctrl+/: toggle help dialog (opening help closes search)
- Help dialog: Esc clears filter (or closes when empty), Cmd/Ctrl+F focuses filter input
- Global map shortcuts are suspended while typing in inputs/contenteditable fields and while Search/Help dialogs are open
- Cmd/Ctrl+S: export JSON
- Cmd/Ctrl+Shift+M: export Markdown
- Cmd/Ctrl+Shift+C: copy selected/focused node text
- Cmd/Ctrl+Shift+L: copy focused subtree outline
- Cmd/Ctrl+Shift+S: export PNG
- E / double‑click: edit node
- Arrow keys: move focus
- Mini-map focused + Arrow keys: pan mini-map viewport
- Mini-map focused + Shift+Arrow: pan mini-map viewport faster
- Alt+Arrow: nudge selected node(s) by 10px
- Shift+Alt+Arrow: nudge selected node(s) by 40px
- F: fit to view
- Alt+F: fit selected nodes
- Alt+Shift+F: fit focused subtree
- Shift+G: toggle grid overlay
- Shift+M: toggle mini-map visibility
- Shift+A: toggle advanced toolbar actions
- C: center focused node
- Alt+Shift+C: center selected nodes
- Shift+C: center root node
- Shift+P: focus + center parent node
- Shift+N: focus + center first child node
- Shift+H: focus + center previous sibling (wraps)
- Shift+J: focus + center next sibling (wraps)
- Shift+L: focus + center first leaf in focused subtree
- Shift+K: focus + center last leaf in focused subtree
- Shift+,: focus + center previous leaf in focused subtree
- Shift+.: focus + center next leaf in focused subtree
- R: focus + center root node
- Shift+R: jump forward in focus history
- Alt+R: jump back to previous focus
- Alt+Shift+Home: jump to oldest focus history entry
- Alt+Shift+End: jump to newest focus history entry
- Alt+Shift+Q: reset focus history to current node
- Focus history is persisted across reloads (invalid/deleted entries are pruned)
- L: auto-layout children
- Shift+drag: pan
- Drag mini-map viewport box: pan from mini-map
- Ctrl/Cmd + wheel: zoom
- = / +: zoom in (center‑preserving)
- -: zoom out (center‑preserving)
- 0: reset pan/zoom view
- Double‑click background: reset view
- Sample: load demo map and reset focus history (button)
- Import JSON: replace map and reset focus history (button)
- Clear: clear map and reset focus history (button)
- Reset View: reset pan/zoom (button)
