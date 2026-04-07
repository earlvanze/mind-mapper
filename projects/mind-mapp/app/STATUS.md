# Mind Mapp — Status

## Build
- Framework: Vite + React + TypeScript
- Current version: 0.14.0
- Last build output in `dist/`
- Test runner: Vitest (`npm test`) — import, store history, minimap, fit math, edge/path, and pan/zoom math covered
- CI: GitHub Actions workflows (`.github/workflows/ci.yml` for tests+build, `.github/workflows/deploy.yml` for deployments)
- Vite server/preview `allowedHosts` is configurable via `MINDMAPP_ALLOWED_HOSTS` (comma/space-separated; hostnames or URLs)
- Search/Help dialogs are lazy-loaded for faster initial paint and use mutually exclusive open-state toggles
- Advanced toolbar actions are collapsible to reduce UI clutter (Shift+A toggle, visibility persisted; toggle wired with aria-expanded/aria-controls + aria-keyshortcuts to grouped advanced actions)
- Grid/mini-map visibility prefs persist across reloads (mini-map toggle wired with aria-expanded/aria-controls + aria-keyshortcuts)
- Docs inventory + migration notes maintained
- FAQ + glossary + exports/imports + architecture + gestures + style docs available

## Core Features
- Node creation (Enter/Tab) + promote (Shift+Tab)
- Multi-select + group drag move (+ Cmd/Ctrl+A select all + Alt+I invert + Alt+S siblings + Alt+C children + Alt+L leaves + Alt+U ancestors + Alt+T top-level + Alt+G generation + Alt+X clear extras + Alt+N neighbors + Alt+Shift+X/Y align + Alt+Shift+H/V distribute + Alt+Shift+R/D layout row/column + Alt+Shift+G snap + Alt+Shift+M/W mirror + Alt+[/] stack + Alt+B subtree + Alt+P parent + Cmd/Ctrl+D duplicate + Alt+Arrow nudge)
- Explicit edit mode (E/double‑click)
- Delete selected node(s)
- Arrow key navigation
- Search + keyboard navigation (Cmd/Ctrl+K toggle + toolbar Search On/Off button with aria-expanded/aria-controls/aria-haspopup + aria-keyshortcuts, centers selected result, supports ID/path multi-term matching + path metadata + normalized term highlighting + quoted/negated terms (including spaced negation before quoted phrases and unicode dash negation markers −/–/—; contradictory include/exclude short-circuit to no results) + whitespace/diacritic/punctuation/camelCase-normalized phrase matching + Tab cycle + PageUp/PageDown + Home/End jumps + Shift/Cmd/Ctrl/Alt+Enter/click jump-without-close + Esc clear-then-close + Cmd/Ctrl+Shift+K clear + Cmd/Ctrl+F focus + Cmd/Ctrl+A select-input + capped-result match counts, parser unified, cached search index/path ranking for repeated queries + one-pass bucketed rank assembly (0-4) with direct Node output to avoid full sort and extra rank-object allocations + deterministic same-rank text/id ordering + single-pass positive/negative token partitioning + loop-based pre-tokenized token normalization/filtering, shared tokenization between ranking + highlight + cached query-token parsing for repeated identical input + fast-path reuse for already-normalized token arrays + repeated positive/negative term dedupe in rank checks + cached term-partition reuse for repeated token arrays + include-only/exclude-only skip-path branching + pre-sized bucket flattening + direct searchNodes no-wrapper path when total is unused + searchNodesWithTotal zero-limit no-slice path, normalized non-finite/negative caps for robust result limiting + shared default limit constant, deferred query evaluation with inline "updating…" status, shared jump/navigation guards (Enter/click + Tab/Page/Home/End + hover selection) gated until deferred results settle, with centralized key→selection mapping helper + pending navigation keys intercepted as no-ops to avoid focus escape/scroll drift, pending-result rows marked aria-disabled with disabled visual state + hover selection gated + shared updating tooltip on rows/listbox, search empty-state distinguishes pending vs settled no-results copy and stays hidden for blank/whitespace-only or tokenless (punctuation-only) input, shared search summary formatter, WeakMap-cached focus-path resolver for result metadata, listbox/active-descendant + posinset/setsize + aria-busy/aria-disabled a11y semantics (active-descendant paused while pending), summary/hint aria-describedby wiring on input/listbox/dialog, explicit header close button with close-key aria-keyshortcuts, dialog+input aria-keyshortcuts map sourced from shared dialogKeyshortcuts constants with registry-alignment regression checks; shared normalization helper for match/highlight parity)
- Toolbar container now exposes role="toolbar" with horizontal orientation + labeled primary action group semantics (named group ids for toggle relationships)
- Global shortcuts ignore text-input/contenteditable targets and suspend while Search/Help dialogs are open to avoid accidental canvas actions (Cmd/Ctrl+K remains available as global search toggle outside node edit mode)
- Undo/redo (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z/Cmd/Ctrl+Y)
- Autosave + JSON import/export (validated)
- Markdown export (Cmd/Ctrl+Shift+M)
- Copy selected/focused node text (Cmd/Ctrl+Shift+C)
- Copy focused subtree outline (Cmd/Ctrl+Shift+L)
- Copy focused node path (Alt+Shift+P)
- Clickable focused-path breadcrumbs for fast ancestor focus jumps (current segment disabled + aria-current)
- PNG export (Cmd/Ctrl+Shift+S)
- Pan/zoom + fit-to-view + fit-selection + fit-focused-subtree + keyboard +/- zoom + 0 reset shortcut + toolbar zoom indicator + leaf-cycle index indicator + focus history index + focus/selection/subtree/root centering + parent/child/sibling-wrap/leaf-cycle(root-aware)/root/back+forward/oldest+newest+reset focus history shortcuts + context-aware disabled focus controls + auto-pruned history after node removals + clear/sample/import map actions reset history to root + focus-history persistence across reloads + grid/mini-map toggles + reset view (mouse + touch, state-synced, helper-tested incl. parent/child) + toolbar navigation/history/export/copy/reset + advanced action controls expose aria-keyshortcuts metadata for assistive shortcut discovery (including Fit=F and Redo Cmd/Ctrl+Y alias)
- Help dialog + compact Focus Navigation & History section + live shortcut filtering (punctuation-agnostic + symbol/alias term matching with repeated-term dedupe, e.g. "forward slash", "question mark") + Esc clear-then-close / Cmd/Ctrl+Shift+K clear / Cmd/Ctrl+F filter focus / Cmd/Ctrl+A select-input (? / Cmd/Ctrl+/ + toolbar Help On/Off toggle, including while typing; section keys sourced from shared shortcuts registry; filter summary/hint aria-describedby wiring on input/dialog + no-match status role; explicit header close button with close-key aria-keyshortcuts; toolbar toggle aria-haspopup + dialog+input aria-keyshortcuts map sourced from shared dialogKeyshortcuts constants; deferred filter evaluation with shared summary formatter + cached normalized shortcut haystacks + blank-input short-circuit + 1-term/2-term fast-path matching + aria-busy/aria-disabled pending state + shared pending/no-match empty-state helper copy)
- Auto-dismissing toolbar notices for copy/import feedback (with manual dismiss + status/alert live-region semantics)
- Sample map loader
- Curved edge rendering with arrowheads
- Mini-map navigator (focus + center + background recenter + viewport drag pan + focusable viewport handle + focused mini-map Arrow/Shift+Arrow panning + PageUp/PageDown vertical large-step panning + Shift+PageUp/PageDown horizontal large-step panning + Home/End edge-jumps) with live viewport indicator (event-synced)

## Next Priorities
- Canvas renderer for larger maps
- Virtualization for very large maps

## Performance (v0.3.0) ✅ Complete
- Canvas-based edge rendering for better performance
- Full canvas renderer option for maps with 1000+ nodes
- Viewport-based virtualization (automatic for >500 nodes)
- Component optimization with React.memo
- Renderer toggle in toolbar (SVG ↔ Canvas)
- Smooth performance with 1000+ nodes

## Next Priorities (v0.4)
- Node styling (colors, shapes, icons)
- Style toolbar for quick formatting
- Style presets and custom styles
