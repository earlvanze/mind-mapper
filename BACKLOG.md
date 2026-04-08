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

## P3 — Nice to Have
- [ ] Realtime collaboration
- [x] Template library (save/load/apply named node styles, import/export JSON)
- [x] Keyboard shortcuts (rebindable shortcuts dialog, import/export, conflict detection)
- [x] OPML import + export (standard outline interchange format, preserves tags, comments, styles, collapse state, cyclesafe)

## Future
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
- [x] Template library — save/load/apply named node styles, import/export as JSON, rename/delete custom templates
- [x] Keyboard shortcuts — fully rebindable shortcuts dialog with conflict detection, import/export/reset, numeric tuning for nudge/zoom
- [x] OPML export + import — standard outline interchange format, preserves tags, comments, styles, collapse state, cyclesafe
