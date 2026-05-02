import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSnapshot,
  loadVersionHistory,
  saveSnapshot,
  deleteSnapshot,
  renameSnapshot,
  formatSnapshotDate,
} from './versionHistory';

// Mock localStorage
let store: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { store = {}; },
  key: (i: number) => Object.keys(store)[i] ?? null,
  get length() { return Object.keys(store).length; },
} as any;

const HISTORY_KEY = 'mindmapp.v0.1.history';
const rootId = 'n_root';
const makeNodes = () => ({
  [rootId]: { id: rootId, text: 'Root', x: 320, y: 180, parentId: null, children: ['n1'] },
  n1: { id: 'n1', text: 'Child', x: 500, y: 180, parentId: rootId, children: [] },
});

beforeEach(() => { store = {}; });

// ── createSnapshot ──────────────────────────────────────────────────────────

it('creates a snapshot with the given name and data', () => {
  const nodes = makeNodes();
  const snap = createSnapshot(nodes, 'n1', 'My version');
  expect(snap.name).toBe('My version');
  expect(snap.focusId).toBe('n1');
  expect(snap.nodeCount).toBe(2);
  expect(snap.id).toMatch(/^snap_/);
  expect(snap.createdAt).toBeGreaterThan(0);
});

it('deep-clones nodes so edits to the original do not affect the snapshot', () => {
  const nodes = makeNodes();
  const snap = createSnapshot(nodes, rootId, 'Clone test');
  nodes.n1.text = 'Mutated';
  expect(snap.nodes.n1.text).toBe('Child');
});

// ── saveSnapshot / loadVersionHistory ───────────────────────────────────────

it('saves a snapshot and it persists via loadVersionHistory', () => {
  const snap = createSnapshot(makeNodes(), rootId, 'First');
  const result = saveSnapshot(snap);
  expect(result).toEqual({ success: true });
  const data = loadVersionHistory();
  expect(data.snapshots).toHaveLength(1);
  expect(data.snapshots[0].name).toBe('First');
});

it('rejects a snapshot with a duplicate name (case-insensitive)', () => {
  const snap1 = createSnapshot(makeNodes(), rootId, 'Version A');
  const snap2 = createSnapshot(makeNodes(), rootId, 'version a');
  expect(saveSnapshot(snap1)).toEqual({ success: true });
  expect(saveSnapshot(snap2)).toEqual({ success: false, error: expect.stringContaining('already exists') });
});

it('rejects more than 50 snapshots', () => {
  for (let i = 0; i < 50; i++) {
    const snap = createSnapshot(makeNodes(), rootId, `Snap ${i}`);
    saveSnapshot(snap);
  }
  const over = createSnapshot(makeNodes(), rootId, 'Over limit');
  const result = saveSnapshot(over);
  expect(result).toEqual({ success: false, error: expect.stringContaining('50') });
});

it('deletes a snapshot by id', () => {
  const snap = createSnapshot(makeNodes(), rootId, 'To delete');
  saveSnapshot(snap);
  expect(loadVersionHistory().snapshots).toHaveLength(1);
  deleteSnapshot(snap.id);
  expect(loadVersionHistory().snapshots).toHaveLength(0);
});

// ── renameSnapshot ───────────────────────────────────────────────────────────

it('renames a snapshot', () => {
  const snap = createSnapshot(makeNodes(), rootId, 'Old name');
  saveSnapshot(snap);
  const result = renameSnapshot(snap.id, 'New name');
  expect(result).toEqual({ success: true });
  expect(loadVersionHistory().snapshots[0].name).toBe('New name');
});

it('prevents renaming to a duplicate name', () => {
  const snap1 = createSnapshot(makeNodes(), rootId, 'Alpha');
  const snap2 = createSnapshot(makeNodes(), rootId, 'Beta');
  saveSnapshot(snap1);
  saveSnapshot(snap2);
  const result = renameSnapshot(snap2.id, 'Alpha');
  expect(result).toEqual({ success: false, error: expect.stringContaining('already exists') });
  expect(loadVersionHistory().snapshots[0].name).toBe('Beta');
});

it('returns error for non-existent snapshot id', () => {
  const result = renameSnapshot('nonexistent', 'Whatever');
  expect(result).toEqual({ success: false, error: 'Snapshot not found.' });
});

// ── formatSnapshotDate ───────────────────────────────────────────────────────

it('formats today timestamps with "Today HH:MM"', () => {
  const now = Date.now();
  const formatted = formatSnapshotDate(now);
  expect(formatted).toMatch(/^Today \d{1,2}:\d{2}/);
});

it('formats yesterday timestamps with "Yesterday HH:MM"', () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(14, 30, 0, 0);
  const formatted = formatSnapshotDate(d.getTime());
  expect(formatted).toMatch(/^Yesterday \d{1,2}:\d{2}/);
});

it('formats older dates with a date prefix', () => {
  const d = new Date(2025, 0, 15, 9, 0, 0);
  const formatted = formatSnapshotDate(d.getTime());
  expect(formatted).toMatch(/Jan 15/);
});
