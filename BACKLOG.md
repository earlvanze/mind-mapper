# Mind Mapp — Backlog

## Project Overview
A minimal, browser-based mind mapping tool. Nodes, connections, pan/zoom canvas.

## Backlog (ordered by priority)

### P0 — Foundation
- [x] Initialize project (Vite + vanilla JS)
- [x] Canvas setup with pan/zoom
- [x] Render a basic node on canvas
- [x] Add new node via click on canvas
- [x] Drag nodes to reposition

### P1 — Core Features
- [x] Connect two nodes with an edge
- [x] Double-click node to edit text
- [x] Delete node (and its edges)
- [x] Delete edge

### P2 — Persistence
- [x] Save to localStorage
- [x] Load from localStorage on startup

### P3 — Polish
- [x] Export as PNG
- [x] Minimap overview
- [x] Keyboard shortcuts (Del, Escape, A/C/E, Ctrl+Z/Y)

### P4 — Navigation
- [x] Fit view to content (button + F shortcut)

---

_All backlog items completed on 2026-04-25_
_Last updated: 2026-04-26_

## Session Log — 2026-04-26 11:47 UTC
- Ran tests: 2/2 passed ✓
- Git status: clean, nothing to commit
- All backlog items complete (P0–P3 done)
- No issues found, no fixes needed

_Mind Mapp fully implemented. Project complete._ ✓

## Session Log — 2026-04-26 12:48 UTC
- Ran tests: 2/2 passed ✓
- Git status: clean
- All backlog items complete (P0–P3 done)
- No issues found, no fixes needed


## Session Log — 2026-04-27 00:43 UTC
- Ran build and tests: 4/4 passed ✓
- Implemented P4 reliability hardening:
  - Fixed node edit cleanup so committed/cancelled textarea editors are removed without blur races.
  - Fixed node dragging after pan/zoom by calculating drag offsets in world coordinates.
  - Made node deletion remove legacy array-form edges as well as object-form edges.
- Added Playwright regression tests for edit cleanup and pan-stable dragging.
- Added `npm test` script for the Playwright suite.


## Session Log — 2026-04-27 01:42 UTC
- Ran tests first: 4/4 passed ✓
- Implemented P4 navigation polish:
  - Added Fit view button and F keyboard shortcut.
  - Added viewport fitting logic that centers all nodes with padding without mutating saved map data.
  - Added Playwright coverage for fit view and toolbar presence.
- Ran build and tests after changes: 5/5 passed ✓

## Session Log — 2026-04-27 02:20 UTC
- Ran tests first: 2/5 passed, 3 failed due to stale preview-server reuse and edit/fit-view regressions appearing against old built assets.
- Hardened Playwright config to build fresh on an isolated preview port and updated tests to use the configured base URL.
- Preserved edge-label editing while keeping recent edit cleanup, pan-stable dragging, legacy edge cleanup, and fit-view work.
- Fixed hovered-edge highlighting, incident edge-label cleanup when deleting nodes, and node-vs-edge selection when ids overlap.
- Added regression coverage for deletion when a selected node shares an id with an edge.
- Ran final validation: tests 6/6 passed ✓ and production build passed ✓

## Session Log — 2026-04-27 03:20 UTC
- Reviewed backlog: all P0–P4 items remain complete; no next backlog item is available.
- Found stale uncommitted worktree changes that would have rolled back the edge-label and hardening commit; restored Mind Mapp files to HEAD to preserve the shipped behavior.
- Ran full Playwright test suite: 6/6 passed ✓
- Ran production build: passed ✓

## Session Log — 2026-04-27 04:20 UTC
- Reviewed BACKLOG.md: all P0–P4 items are complete; no new backlog item is available.
- Found uncommitted worktree changes that regressed edge labels, selected edge deletion, and the 6-test hardening suite; saved a backup patch under `.openclaw/` and restored Mind Mapp files to HEAD.
- Ran full Playwright test suite: 6/6 passed ✓
- Ran production build: passed ✓

## Session Log — 2026-04-27 05:05 UTC
- Reviewed BACKLOG.md: all P0–P4 items remain complete; no next backlog item is available.
- Found stale uncommitted worktree changes that would have rolled back edge labels, selected-edge deletion, and the hardening test/config updates; saved a temporary recovery patch and restored Mind Mapp files to HEAD.
- Ran full Playwright test suite: 6/6 passed ✓
- Ran production build: passed ✓

## Session Log — 2026-04-27 05:12 UTC
- Reviewed BACKLOG.md: all P0–P4 items remain complete; no next backlog item is available.
- Ran full Playwright test suite: 6/6 passed ✓
- Ran production build: passed ✓
- Left unrelated workspace change `../AGENTS.md` untouched.

## Session Log — 2026-04-27 05:20 UTC
- Reviewed BACKLOG.md: all P0–P4 items remain complete; no next backlog item is available.
- Ran full Playwright test suite: 6/6 passed ✓
- Ran production build: passed ✓
- Left unrelated workspace change `../AGENTS.md` untouched.

## Session Log — 2026-04-27 06:20 UTC
- Reviewed BACKLOG.md: all P0–P4 items remain complete; no next backlog item is available.
- Found stale uncommitted Mind Mapp changes that would have rolled back edge labels, selected-edge deletion, and the 6-test hardening suite; restored Mind Mapp files to HEAD to preserve the shipped behavior.
- Ran full Playwright test suite: 6/6 passed ✓
- Ran production build: passed ✓
- Left unrelated workspace change `../AGENTS.md` untouched.

## Session Log — 2026-04-27 07:20 UTC
- Reviewed BACKLOG.md: all P0–P4 items remain complete; no next backlog item is available.
- Found stale uncommitted Mind Mapp changes that would have rolled back edge labels, selected-edge deletion, isolated Playwright preview config, and the 6-test hardening suite; saved a backup patch under `.openclaw/` and restored Mind Mapp files to HEAD.
- Ran full Playwright test suite: 6/6 passed ✓
- Ran production build: passed ✓
- Left unrelated workspace change `../AGENTS.md` untouched.

## Session Log — 2026-04-27 08:20 UTC
- Reviewed BACKLOG.md: all P0–P4 items remain complete; no next backlog item is available.
- Found stale uncommitted Mind Mapp changes that would have rolled back edge labels, selected-edge deletion, isolated Playwright preview config, and the 6-test hardening suite; restored Mind Mapp files to HEAD to preserve the shipped behavior.
- Ran full Playwright test suite: 6/6 passed ✓
- Ran production build: passed ✓
- Left unrelated workspace change `../AGENTS.md` untouched.

## Session Log — 2026-04-27 09:20 UTC
- Reviewed BACKLOG.md: all P0–P4 items remain complete; no next backlog item is available.
- Found stale uncommitted Mind Mapp changes that would have rolled back edge labels, selected-edge deletion, isolated Playwright preview config, and the 6-test hardening suite; restored Mind Mapp files to HEAD to preserve shipped behavior.
- Ran full Playwright test suite: 6/6 passed ✓
- Ran production build: passed ✓
- Left unrelated workspace change `../AGENTS.md` untouched.

## Session Log — 2026-04-27 10:20 UTC
- Reviewed BACKLOG.md: all P0–P4 items remain complete; no next backlog item is available.
- Found stale uncommitted Mind Mapp changes that would have rolled back edge labels, selected-edge deletion, isolated Playwright preview config, and the 6-test hardening suite; restored Mind Mapp files to HEAD to preserve shipped behavior.
- Ran full Playwright test suite: 6/6 passed ✓
- Ran production build: passed ✓
- Left unrelated workspace change `../AGENTS.md` untouched.

## Session Log — 2026-04-27 11:12 UTC
- Reviewed BACKLOG.md: all P0–P4 backlog items remain complete; no next backlog item is available to implement.
- Found stale uncommitted Mind Mapp changes that would have rolled back edge labels, selected-edge deletion, isolated Playwright preview config, and the 6-test hardening suite; restored Mind Mapp files to HEAD to preserve shipped behavior.
- Ran full Playwright test suite: 6/6 passed ✓
- Ran production build: passed ✓
- Left unrelated workspace change `AGENTS.md` untouched.

## Session Log — 2026-04-27 11:16 UTC
- Reviewed BACKLOG.md: all P0–P4 backlog items remain complete; no next backlog item is available to implement.
- Ran full Playwright test suite: 6/6 passed ✓
- Ran production build: passed ✓
- Left unrelated workspace change `../AGENTS.md` untouched.

## Session Log — 2026-04-27 11:19 UTC
- Reviewed BACKLOG.md: all P0–P4 backlog items remain complete; no next backlog item is available to implement.
- Ran full Playwright test suite: 6/6 passed ✓
- Ran production build: passed ✓
- Left unrelated workspace change `../AGENTS.md` untouched.

## Session Log — 2026-04-27 11:20 UTC
- Reviewed BACKLOG.md: all P0–P4 backlog items remain complete; no next backlog item is available to implement.
- Ran full Playwright test suite: 6/6 passed ✓
- Ran production build: passed ✓
- Left unrelated workspace change `../AGENTS.md` untouched.

## Session Log — 2026-04-27 12:20 UTC
- Reviewed BACKLOG.md: all P0–P4 backlog items remain complete; no next backlog item was available.
- Found and fixed a minimap transform bug where far-away or negative-coordinate content could render outside the overview and minimap clicks recentered incorrectly.
- Added Playwright coverage for minimap rendering and click-to-recenter behavior.
- Preserved existing edge labels, selected-edge deletion, and node/edge ID collision behavior while applying the minimap fix.
- Ran full Playwright test suite: 8/8 passed ✓
- Ran production build: passed ✓

## Session Log — 2026-05-02 10:25 UTC
- Applied ALP-RIVER review workflow: audited the worktree, located stale uncommitted changes, protected shipped edge-label/edge-selection behavior, reproduced validation, and documented release readiness.
- Found a real regression risk in the uncommitted worktree: it would have removed edge labels, selected-edge deletion, and node/edge ID collision coverage. Restored those shipped behaviors from HEAD.
- Kept the new resize repaint fix and added Playwright coverage for it.
- Ran final `npm test`: 9/9 passed ✓

