# Mind Mapp (MVP)

A lightweight, keyboard‑first mind map app focused on speed and clarity.

## Features
- Node creation (Enter = sibling, Tab = child, Shift+Tab = promote)
- Multi-select (Cmd/Ctrl+click / Cmd/Ctrl+A / Alt+I invert / Alt+S siblings / Alt+C children / Alt+L leaves / Alt+U ancestors / Alt+T top-level / Alt+G generation / Alt+X clear extras / Alt+N neighbors / Alt+Shift+X/Y align / Alt+Shift+H/V distribute / Alt+Shift+R/D layout row/column / Alt+Shift+G snap grid / Alt+Shift+M/W mirror / Alt+[ / Alt+] stack / Alt+B subtree / Alt+P parent) + duplicate (Cmd/Ctrl+D, subtree-aware) + group drag + keyboard nudge (Alt+Arrow)
- Explicit edit mode (double‑click or E)
- Delete node (Backspace/Delete)
- Arrow‑key navigation
- Search (Cmd/Ctrl+K toggle + toolbar Search On/Off toggle button with dialog aria-controls/expanded wiring) with focus+center on selection, ID + path matching, ranked results, path/context metadata, highlighted matches, quoted/negated query terms, whitespace/diacritic/punctuation/camelCase-normalized phrase matching, Tab cycle + Page/Home-End navigation hints, Shift/Cmd/Ctrl/Alt+Enter/click jump-without-close, Esc clear-then-close behavior, accurate match counts, cached path matching, and improved listbox accessibility semantics
- Edit (double‑click or E)
- Pan/zoom (Shift+drag, Ctrl/Cmd+wheel, +/- keys, 0 reset, touch pan/pinch) + toolbar zoom % indicator
- Fit to view (F) + Fit selection (Alt+F) + Fit focused subtree (Alt+Shift+F) + Center focused node (C) + Center selection (Alt+Shift+C) + Center focused subtree (Alt+Shift+B) + Center root (Shift+C) + Focus parent/child/siblings/leaf (Shift+P/N/H/J/L/K/</>, sibling + leaf wrap enabled, context-aware disabled controls) + Focus root (R) + Focus history (Alt+R back / Shift+R forward / Alt+Shift+Home oldest / Alt+Shift+End newest / Alt+Shift+Q reset, auto-pruned on node removal, persisted across reloads) + Grid overlay toggle (Shift+G) + Reset View button
- Leaf-cycle status indicator in toolbar (`leaf i/n`) with disabled leaf-cycle buttons when unavailable
- Focus history status indicator (`hist i/n`) with context-aware Back/Forward target hints
- Auto‑layout children (L)
- Help dialog (? / Cmd/Ctrl+/) toggle with toolbar Help On/Off state, compact Focus Navigation & History section, and live shortcut filter (punctuation-agnostic + symbol/alias term matching; Esc clear-then-close + Cmd/Ctrl+F focus; Cmd/Ctrl+/ works even when typing in dialog inputs)
- Global map shortcuts pause while typing in text fields/dialog inputs and while Search/Help dialogs are open (Cmd/Ctrl+K remains available as a global search toggle outside node edit mode)
- Collapsible Advanced actions panel in toolbar (Shift+A, state persists)
- Autosave + JSON import/export (import clears stale trails by resetting focus history)
- Markdown export (Cmd/Ctrl+Shift+M)
- Copy selected/focused node text to clipboard (Cmd/Ctrl+Shift+C)
- Copy focused subtree outline to clipboard (Cmd/Ctrl+Shift+L)
- Copy focused node path to clipboard (Alt+Shift+P)
- Clickable focused-path breadcrumbs in toolbar for ancestor jump navigation (current node segment is marked/disabled)
- PNG export (Cmd/Ctrl+Shift+S)
- Transient toolbar notices for copy/import outcomes (auto-dismiss + manual dismiss)
- Curved edge rendering with arrowheads
- Mini-map navigator (Shift+M toggle; click node to focus + center, click background to recenter, drag viewport box to pan, focusable viewport handle, Arrow/Shift+Arrow pan + PageUp/PageDown vertical large pan + Shift+PageUp/PageDown horizontal large pan + Home/End edge-jump when mini-map is focused) with live viewport indicator
- Sample map loader

## Run
```bash
cd projects/mind-mapp/app
npm install
npm run dev
```

Optional host allowlist override:
```bash
MINDMAPP_ALLOWED_HOSTS="cyber.earlco.in,cyber.talpa-stargazer.ts.net,example.com" npm run dev
```
(Hostnames or full URLs are accepted; URLs are normalized to hosts.)

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
