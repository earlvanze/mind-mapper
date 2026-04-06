# MEMORY.md

## Mind Mapp
- **Canonical source path:** `/home/umbrel/umbrel/app-data/nextcloud/data/nextcloud/data/umbrel/files/Dropbox/Projects/mind-mapp`
- v1.2 complete, deployed to mindmap.earlco.in
- 67 test files, 739 tests all passing
- All backlog items done; only "Future" items remain (collab, mobile, plugins, cloud sync — all require backend)
- GitHub: `earlvanze/mind-mapper` (SSH)
- Netlify auto-deploys from main branch

## Workspace
- workspace-tech-mvp: `/home/umbrel/.openclaw/workspace-tech-mvp`
- Dropbox: `/home/umbrel/umbrel/app-data/nextcloud/data/nextcloud/data/umbrel/files/Dropbox`
- PROJECTS.md workspace link (`projects/mind-mapp/app/`) is stale — canonical is Dropbox path above

## Operator
- Earl Vanze Quibido Co (Earl Co)
- Autistic + ADHD; benefits from structured external cognition
- Direct, no fluff, prefers structured output
- Builds tokenized real estate, DAO systems, automation

## 2026-04-05/06 — Mind Mapp session (00:47 UTC)
- Ran full test suite: 743 tests → 747 (added doubleTapCollapse.test.ts) — all passing
- Implemented P0 backlog item: double-tap on node body toggles expand/collapse
  - Added `lastTapRef` in Node.tsx; 300ms threshold; only fires on nodes with children while not editing
  - Normal click → focus; slow double-click → start editing; double-tap → collapse toggle
- Git repo had broken refs (conflicted copies with spaces in filenames); cleaned up refs/heads/
- Pushed to `earlvanze/mind-mapper` main branch (GitHub auth confirmed)
- Remaining P0: handwriting.js OCR, cron timeout fix
