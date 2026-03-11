# Mind Mapp — Run Locally

```bash
cd projects/mind-mapp/app
npm install
npm run dev
```

Then open the URL shown (usually http://localhost:5173).

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
- Alt+P: select parent of focused node
- Cmd/Ctrl+Z: undo
- Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y: redo
- Cmd/Ctrl+K: search
- Cmd/Ctrl+S: export JSON
- Cmd/Ctrl+Shift+M: export Markdown
- Cmd/Ctrl+Shift+S: export PNG
- E / double‑click: edit node
- Arrow keys: move focus
- Alt+Arrow: nudge selected node(s) by 10px
- Shift+Alt+Arrow: nudge selected node(s) by 40px
- F: fit to view
- Alt+F: fit selected nodes
- Shift+G: toggle grid overlay
- Shift+M: toggle mini-map visibility
- Shift+A: toggle advanced toolbar actions
- C: center focused node
- L: auto-layout children
- Shift+drag: pan
- Ctrl/Cmd + wheel: zoom
- = / +: zoom in (center‑preserving)
- -: zoom out (center‑preserving)
- Double‑click background: reset view
- Sample: load demo map (button)
- Reset View: reset pan/zoom (button)
