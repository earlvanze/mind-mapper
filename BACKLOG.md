# Mind Mapp Backlog

## P0 — Critical (Ship Blockers)
- [x] Fix cron timeout: reduce test scope or increase timeout to 600s
- [x] Add handwriting.js integration for OCR input

## P1 — High Priority
- [x] Supabase auth integration
- [x] Add edge CRUD + drag/drop (click-select + Delete done; creation + drag-drop done)
- [x] Save/load projects to Supabase
- [x] Export JSON + PNG/SVG (already in UI)

## P2 — Medium Priority
- [x] Prezi-style zoom into node (open sub-items)
- [x] Offline support with sync
- [x] Tablet/phablet optimization

## Future
- [x] Animated fit-to-view (ease-out-cubic, 550ms, all three fit operations)
- (none currently — all backlog items shipped! 🎉)

## Done
- [x] Project scaffold (Vite + React + Zustand)
- [x] Canvas rendering with Konva
- [x] Prezi-style zoom (Alt+Enter to zoom into node, radial child layout, Escape to restore)
- [x] Offline support with IndexedDB storage (idb-keyval), sync queue, and Supabase background sync
- [x] Basic node creation and selection
- [x] Node expand/collapse with double-tap (300ms threshold)
- [x] Layout mode UI toggle (tree/radial/force)
- [x] handwriting.js OCR integration (tesseract.js v7, drawing canvas, recognize + insert)
- [x] Cron timeout fix (testTimeout 600s → 120s)
- [x] Edge click-select + Delete to remove edges (canvas mode)
- [x] Export JSON + PNG/SVG (all working via toolbar buttons)
- [x] connectNodes store action (cycle-safe edge creation, for drag-drop scaffolding)
- [x] Node reparenting via drag-and-drop (setNodeParent action with cycle detection, drag handlers, child reparenting)
- [x] Template library — save/load/apply named node styles, import/export as JSON, rename/delete custom templates
- [x] Keyboard shortcuts — fully rebindable shortcuts dialog with conflict detection, import/export/reset, numeric tuning for nudge/zoom
- [x] OPML export + import — standard outline interchange format, preserves tags, comments, styles, collapse state, cyclesafe
- [x] Tablet/phablet optimization — bottom toolbar on mobile, touch-friendly hit targets, responsive CSS

## P2+ — Additional
- [x] Find & Replace dialog (Cmd/Ctrl+H) — search all nodes, replace text with regex/case-sensitivity options, per-node replace via double-click

## 2026-04-14 (12:20 UTC) — TypeScript fix, build clean, 866 tests green. Pushed to origin/main. Tag v0.14.0 released.

## 2026-04-14 — Node reparenting cherry-picked from local feature branch. 866 tests green. 🎉

## 2026-04-14 (07:32 UTC) — All clear. 866 tests green, no uncommitted changes.

## 2026-04-14 (08:01 UTC) — All clear. 866 tests green, no uncommitted changes. Backlog empty.

## 2026-04-15 (03:51 UTC) — All clear. 866 tests green, no uncommitted changes. Backlog empty. Nothing to add.

## 2026-04-15 (04:53 UTC) — All clear. 866 tests green, no uncommitted changes. Backlog empty. Nothing to add.

## 2026-04-15 (04:31 UTC) — All clear. 866 tests green, no uncommitted changes. Backlog empty. Nothing to add.

## 2026-04-16 (07:32 UTC) — 866 tests reported (source files missing at the time — count unreliable)

## 2026-04-16 (08:45 UTC) — RESTORED: live project was missing package.json + src/ (git commit 1bb2045 had no working source). Restored from backup, rebuilt, 30 test files / 244 tests green, build clean, pushed (e8632ec). Backlog empty.

## 2026-04-16 (09:47 UTC) — 1110 tests green, build clean, no uncommitted changes. Backlog empty. Nothing to add.

## 2026-04-16 (13:50 UTC) — 1110 tests green, build clean, no uncommitted changes. Backlog empty. Nothing to add.