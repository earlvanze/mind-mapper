# Mind Mapp (MVP)

A lightweight, keyboard‑first mind map app focused on speed and clarity.

## Features
- Node creation (Enter = sibling, Tab = child, Shift+Tab = promote)
- Multi-select (Cmd/Ctrl+click / Cmd/Ctrl+A / Alt+I invert / Alt+S siblings / Alt+C children / Alt+L leaves / Alt+U ancestors / Alt+T top-level / Alt+G generation / Alt+X clear extras / Alt+N neighbors / Alt+Shift+X/Y align / Alt+Shift+H/V distribute / Alt+[ / Alt+] stack / Alt+B subtree / Alt+P parent) + duplicate (Cmd/Ctrl+D, subtree-aware) + group drag + keyboard nudge (Alt+Arrow)
- Explicit edit mode (double‑click or E)
- Delete node (Backspace/Delete)
- Arrow‑key navigation
- Search (Cmd/Ctrl+K) with focus+center on selection
- Edit (double‑click or E)
- Pan/zoom (Shift+drag, Ctrl/Cmd+wheel, touch pan/pinch)
- Fit to view (F) + Center focused node (C) + Reset View button
- Auto‑layout children (L)
- Help dialog (?)
- Autosave + JSON import/export
- Markdown export (Cmd/Ctrl+Shift+M)
- PNG export (Cmd/Ctrl+Shift+S)
- Curved edge rendering with arrowheads
- Mini-map navigator (click node to focus + center, click background to recenter) with live viewport indicator
- Sample map loader

## Run
```bash
cd projects/mind-mapp/app
npm install
npm run dev
```

## Files
- `src/` — app source
- `RUN.md` — quick start + shortcuts
- `CHANGELOG.md` — feature log
- `STATUS.md` — current status + priorities
- `DEPLOY.md` — deployment notes
- `TODO.md` — next steps
- `KEYS.md` — full shortcut reference
- `CONTRIBUTING.md` — dev setup & conventions
- `KNOWN_ISSUES.md` — known gaps/advisories
- `ROADMAP.md` — upcoming milestones
- `LINKS.md` — doc index
- `OVERVIEW.md` — quick product summary
- `FILETREE.md` — document list
- `SECURITY.md` — security notes
- `SESSION_NOTES.md` — session summary
- `RELEASE.md` — release checklist
- `DOCS_CHECKLIST.md` — doc inventory
- `MIGRATIONS.md` — schema migration notes
- `FAQ.md` — product FAQ
- `GLOSSARY.md` — key terms
- `EXPORTS.md` — export formats
- `IMPORTS.md` — import flows
- `ARCHITECTURE.md` — app architecture
- `GESTURES.md` — mouse/trackpad gestures
- `STYLE.md` — UI style guide
- `ACCESSIBILITY.md` — a11y notes
- `.editorconfig` — formatting defaults
