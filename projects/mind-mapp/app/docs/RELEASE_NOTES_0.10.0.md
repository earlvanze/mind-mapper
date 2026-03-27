# Mind Mapp v0.10.0 - Version History

**Released**: March 26, 2026

## Overview
Named snapshots of your mind map, stored separately from autosave. Save milestones, compare states, and restore previous versions at any time.

## Key Features

### Named Snapshots
- **Save** current map state with a custom name (up to 80 chars)
- **Browse** all snapshots with name, date, and node count
- **Load** any snapshot (replaces current map, resets focus history)
- **Rename** snapshots inline
- **Delete** snapshots with confirmation

### Storage
- Separate localStorage key from autosave — safe from overwrites
- Up to 50 snapshots to prevent localStorage bloat
- Duplicate-name guard (case-insensitive)
- Loading a snapshot commits to undo stack so it can be undone

### Keyboard Shortcut
- `Alt+V` opens the version history dialog

## Technical Details
- `VersionHistoryDialog.tsx` — full dialog with save/load/rename/delete
- `versionHistory.ts` store — `createSnapshot`, `saveSnapshot`, `deleteSnapshot`, `renameSnapshot`, `formatSnapshotDate`
- Store integration: `restoreSnapshot(nodes, focusId)` loads snapshot and commits to undo stack
- Smart date formatting: "Today HH:MM", "Yesterday HH:MM", or date+time

## Breaking Changes
None.
