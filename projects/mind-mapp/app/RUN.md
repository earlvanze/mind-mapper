# Mind Mapp — Run Locally

```bash
cd projects/mind-mapp/app
npm install
npm run dev
```

Then open the URL shown (usually http://localhost:5173).

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
- C: center focused node
- L: auto-layout children
- Shift+drag: pan
- Ctrl/Cmd + wheel: zoom
- Double‑click background: reset view
- Sample: load demo map (button)
- Reset View: reset pan/zoom (button)
