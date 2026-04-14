# Mind Mapp

Collaborative mind-mapping with canvas, offline sync, and multi-format export.

**866 tests, all green.**  
Live: https://mindmapp.deno.dev

## Features

- **Canvas**: SVG or Canvas renderer (toggle in toolbar)
- **Layouts**: Tree, Radial, Force-directed (switch via toolbar)
- **Prezi-style zoom**: `Z` to zoom into focused node, `Esc` to restore
- **Offline**: IndexedDB storage, sync queue, Supabase background sync
- **Import/Export**: JSON, PNG, SVG, Markdown, OPML, FreeMind, PDF
- **Collaboration**: Supabase auth + CRUD + realtime sync
- **Handwriting OCR**: Draw to recognize text (tesseract.js v7)
- **Node notes**: `Shift+N` to toggle notes panel
- **Version history**: Named snapshots via `Alt+V`
- **Keyboard shortcuts**: Fully rebindable with conflict detection
- **Find & Replace**: Regex, case-sensitivity, per-node preview
- **Template library**: Save/load/import/export named styles
- **Focus mode**: Dim nodes outside focused subtree
- **Tag filtering**: Filter nodes by tags
- **Node styles**: Colors, shapes, icons, images, links, attachments
- **Selection**: Multi-select with align/distribute/layout/stack/mirror
- **Edge connect mode**: Drag between nodes to create parent-child
- **Node reparenting**: Drag nodes to reparent with cycle detection

## Quick Start

```bash
npm install
npm run dev    # dev server at localhost:5173
npm run build  # production build
npm test       # 866 tests
```

## Tech Stack

- **Frontend**: React 18, Zustand, Konva (canvas), SVG
- **Backend**: Supabase (auth, DB, realtime)
- **Offline**: IndexedDB via idb-keyval
- **OCR**: tesseract.js v7
- **Testing**: Vitest, jsdom, 120s timeout, threads pool
- **Build**: Vite, TypeScript

## Stack

React 18 + Zustand + Konva + Supabase + IndexedDB + tesseract.js v7
