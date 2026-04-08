import { useState, useEffect, useRef } from 'react';
import {
  loadVersionHistory,
  deleteSnapshot,
  renameSnapshot,
  formatSnapshotDate,
  type NamedSnapshot,
} from '../store/versionHistory';
import { confirmAction } from '../utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onLoadSnapshot: (snapshot: NamedSnapshot) => void;
  onSaveSnapshot: (name: string) => { success: true } | { success: false; error: string };
}

export default function VersionHistoryDialog({ open, onClose, onLoadSnapshot, onSaveSnapshot }: Props) {
  const [snapshots, setSnapshots] = useState<NamedSnapshot[]>([]);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const saveInputRef = useRef<HTMLInputElement>(null);

  const reload = () => setSnapshots(loadVersionHistory().snapshots);

  useEffect(() => {
    if (open) {
      reload();
      setError(null);
      setSuccess(null);
      setSaveName('');
      setSaving(false);
      setEditingId(null);
    }
  }, [open]);

  // Auto-focus save input when dialog opens
  useEffect(() => {
    if (open && !saving) {
      setTimeout(() => saveInputRef.current?.focus(), 50);
    }
  }, [open, saving]);

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) {
      setError('Please enter a name for this snapshot.');
      saveInputRef.current?.focus();
      return;
    }
    setSaving(true);
    setError(null);

    const result = onSaveSnapshot(name);
    if (!result.success) {
      setError(result.error);
      setSaving(false);
      saveInputRef.current?.focus();
      return;
    }

    setSaveName('');
    setSaving(false);
    setSuccess(`Snapshot "${name}" saved.`);
    reload();
    setTimeout(() => setSuccess(null), 2500);
  };

  const handleLoad = (snapshot: NamedSnapshot) => {
    if (!confirmAction(`Load snapshot "${snapshot.name}"? Your current map will be replaced.`)) return;
    onLoadSnapshot(snapshot);
    onClose();
  };

  const handleDelete = (snapshot: NamedSnapshot) => {
    if (!confirmAction(`Delete snapshot "${snapshot.name}"? This cannot be undone.`)) return;
    deleteSnapshot(snapshot.id);
    reload();
    setSuccess(`Deleted "${snapshot.name}".`);
    setTimeout(() => setSuccess(null), 2500);
  };

  const startRename = (snapshot: NamedSnapshot) => {
    setEditingId(snapshot.id);
    setEditingName(snapshot.name);
  };

  const commitRename = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    const result = renameSnapshot(id, trimmed);
    if (!result.success) {
      setError(result.error);
      setTimeout(() => setError(null), 3000);
    }
    setEditingId(null);
    reload();
  };

  const handleKeyDown = (e: React.KeyboardEvent, id?: string) => {
    if (e.key === 'Enter') {
      if (id) {
        commitRename(id);
      } else {
        handleSave();
      }
    }
    if (e.key === 'Escape') {
      if (id) {
        setEditingId(null);
      } else {
        onClose();
      }
    }
  };

  if (!open) return null;

  return (
    <div
      className="dialog-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vh-title"
        style={{ minWidth: 420, maxWidth: 600 }}
      >
        <div className="dialog-header">
          <h2 id="vh-title">Version History</h2>
          <button
            className="dialog-close"
            aria-label="Close version history"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="dialog-body">
          {/* Save new snapshot */}
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
            <label
              htmlFor="vh-save-name"
              style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}
            >
              Save current map as snapshot
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                ref={saveInputRef}
                id="vh-save-name"
                aria-describedby="vh-help vh-error"
                aria-invalid={error ? 'true' : 'false'}
                type="text"
                className="style-text-input"
                placeholder="e.g. Before restructuring"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={80}
                style={{ flex: 1 }}
              />
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={saving || !saveName.trim()}
                style={{ whiteSpace: 'nowrap' }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
            <p id="vh-help" style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>
              Saves up to 50 named snapshots in browser localStorage.
            </p>
          </div>

          {/* Feedback - Always in DOM for proper aria-describedby association */}
          <div
            id="vh-error"
            role="alert"
            aria-live="assertive"
            style={{
              color: 'var(--danger)',
              fontSize: 13,
              marginBottom: 8,
              display: error ? 'block' : 'none'
            }}
          >
            {error || '\u00A0' /* nbsp to maintain layout */}
          </div>
          {success && (
            <div role="status" style={{ color: 'var(--success)', fontSize: 13, marginBottom: 8 }}>
              {success}
            </div>
          )}

          {/* Snapshot list */}
          {snapshots.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              No snapshots saved yet. Save your current map to create one.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 340, overflowY: 'auto' }}>
              {snapshots.map(snap => (
                <li
                  key={snap.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingId === snap.id ? (
                      <input
                        type="text"
                        className="style-text-input"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => handleKeyDown(e, snap.id)}
                        onBlur={() => commitRename(snap.id)}
                        maxLength={80}
                        autoFocus
                        style={{ width: '100%' }}
                      />
                    ) : (
                      <div
                        style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                        onClick={() => handleLoad(snap)}
                        title={`Load "${snap.name}"`}
                      >
                        {snap.name}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {formatSnapshotDate(snap.createdAt)} · {snap.nodeCount} nodes
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      title={`Rename "${snap.name}"`}
                      aria-label={`Rename snapshot "${snap.name}"`}
                      onClick={() => startRename(snap)}
                      style={{ fontSize: 12, padding: '3px 8px' }}
                    >
                      Rename
                    </button>
                    <button
                      title={`Load "${snap.name}"`}
                      aria-label={`Load snapshot "${snap.name}"`}
                      onClick={() => handleLoad(snap)}
                      style={{ fontSize: 12, padding: '3px 8px' }}
                    >
                      Load
                    </button>
                    <button
                      title={`Delete "${snap.name}"`}
                      aria-label={`Delete snapshot "${snap.name}"`}
                      onClick={() => handleDelete(snap)}
                      style={{ fontSize: 12, padding: '3px 8px', color: 'var(--danger)' }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
