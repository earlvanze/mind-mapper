/**
 * Version History — named snapshots of the mind map
 * Stored separately from autosave so users can save/restore/manage named versions.
 */

import { loadFromStorage, saveToStorage } from '../utils/storage';
import type { Node } from './useMindMapStore';

const HISTORY_KEY = 'mindmapp.v0.1.history';

export type NamedSnapshot = {
  id: string;
  name: string;
  nodes: Record<string, Node>;
  focusId: string;
  createdAt: number; // Unix timestamp ms
  nodeCount: number;
};

type VersionHistoryData = {
  snapshots: NamedSnapshot[];
};

export function loadVersionHistory(): VersionHistoryData {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return { snapshots: [] };
    return JSON.parse(raw) as VersionHistoryData;
  } catch {
    return { snapshots: [] };
  }
}

export function saveVersionHistory(data: VersionHistoryData): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(data));
  } catch {
    // localStorage full — silently ignore
  }
}

export function createSnapshot(
  nodes: Record<string, Node>,
  focusId: string,
  name: string,
): NamedSnapshot {
  return {
    id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    nodes: Object.fromEntries(
      Object.entries(nodes).map(([id, node]) => [
        id,
        { ...node, children: [...node.children], ...(node.style ? { style: { ...node.style } } : {}) },
      ]),
    ) as Record<string, Node>,
    focusId,
    createdAt: Date.now(),
    nodeCount: Object.keys(nodes).length,
  };
}

export function saveSnapshot(
  snapshot: NamedSnapshot,
): { success: true } | { success: false; error: string } {
  const data = loadVersionHistory();

  // Prevent duplicate names (case-insensitive)
  const duplicate = data.snapshots.find(
    s => s.name.toLowerCase() === snapshot.name.toLowerCase(),
  );
  if (duplicate) {
    return { success: false, error: `A snapshot named "${snapshot.name}" already exists.` };
  }

  // Limit to 50 snapshots
  if (data.snapshots.length >= 50) {
    return {
      success: false,
      error: `Limit reached: maximum 50 snapshots. Delete some to make room.`,
    };
  }

  data.snapshots.unshift(snapshot);
  saveVersionHistory(data);
  return { success: true };
}

export function deleteSnapshot(id: string): void {
  const data = loadVersionHistory();
  data.snapshots = data.snapshots.filter(s => s.id !== id);
  saveVersionHistory(data);
}

export function renameSnapshot(id: string, newName: string): { success: true } | { success: false; error: string } {
  const data = loadVersionHistory();
  const idx = data.snapshots.findIndex(s => s.id === id);
  if (idx === -1) return { success: false, error: 'Snapshot not found.' };

  const duplicate = data.snapshots.find(
    s => s.id !== id && s.name.toLowerCase() === newName.toLowerCase(),
  );
  if (duplicate) {
    return { success: false, error: `A snapshot named "${newName}" already exists.` };
  }

  data.snapshots[idx] = { ...data.snapshots[idx], name: newName };
  saveVersionHistory(data);
  return { success: true };
}

export function formatSnapshotDate(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  const timeStr = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday) return `Today ${timeStr}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${timeStr}`;
  }

  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  }) + ` ${timeStr}`;
}
