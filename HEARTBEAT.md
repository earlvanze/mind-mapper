# HEARTBEAT.md - Periodic Checks

Rotate through these tasks every few hours. Track last run in `memory/heartbeat-state.json`.

## Lofty Operations

- [ ] **Check batch update status** — Look for pending entries in /tmp/lofty_*.json or /tmp/lofty_entry_*.md
  - If drafts exist: remind user to review/push
- [ ] **Check treasury ASA opportunities** — Review Supabase lofty_alpha_opportunities for new high-alpha properties
- [ ] **Verify CDP push pipeline** — Ensure prepare-batch-updates.py and batch-push-cdp.py are functional

## General Maintenance

- [ ] **Git status** — Check workspace repos for uncommitted changes, stale branches
- [ ] **Memory cleanup** — Review recent memory files, update MEMORY.md with distillations
- [ ] **Check calendar** — Any events in next 24h?

## Notes

- Be proactive but don't spam — if nothing's changed since last check, stay quiet (HEARTBEAT_OK)
- Late night (23:00-08:00 Madrid): skip unless urgent
- When in doubt, prefer actions that don't require user approval (reading, organizing, internal checks)
