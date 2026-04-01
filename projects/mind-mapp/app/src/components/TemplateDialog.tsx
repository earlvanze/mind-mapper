import { useState, useRef, useEffect, useId, useCallback } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import type { NodeStyle } from '../store/useMindMapStore';
import {
  getTemplatePresets,
  saveTemplatePreset,
  deleteTemplatePreset,
  renameTemplatePreset,
  exportTemplatesToJson,
  importTemplatesFromJson,
  type TemplatePreset,
} from '../utils/templatePresets';
import type { Theme } from '../utils/theme';

type Props = {
  theme: Theme;
  open: boolean;
  onClose: () => void;
};

export default function TemplateDialog({ theme, open, onClose }: Props) {
  const { nodes, setSelectedStyle, setNodeStyle, selectedIds } = useMindMapStore();
  const [presets, setPresets] = useState<TemplatePreset[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [applyAllPresetId, setApplyAllPresetId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'apply' | 'manage'>('apply');
  const [importResult, setImportResult] = useState<{ imported: number; duplicates: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const dialogTitleId = useId();

  useEffect(() => {
    if (open) {
      setPresets(getTemplatePresets());
      setImportResult(null);
    }
  }, [open]);

  // Focus trap + Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const d = dialogRef.current;
      if (!d) return;
      const focusable = Array.from(d.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex="0"]'
      )).filter(el => !el.hasAttribute('disabled'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey, true);
    return () => document.removeEventListener('keydown', handleKey, true);
  }, [open, onClose]);

  // Focus name input when editing
  useEffect(() => {
    if (editingId) nameInputRef.current?.focus();
  }, [editingId]);

  const refreshPresets = useCallback(() => {
    setPresets(getTemplatePresets());
  }, []);

  const applyPreset = (preset: TemplatePreset) => {
    if (selectedIds.length === 0) return;
    const defaultStyle = { ...preset.defaultStyle };
    setSelectedStyle(defaultStyle);
    onClose();
  };

  const applyPresetToAll = (preset: TemplatePreset) => {
    const allNodeIds = Object.keys(nodes);
    if (!allNodeIds.length) return;
    for (const id of allNodeIds) {
      setNodeStyle(id, preset.defaultStyle);
    }
    onClose();
  };

  const handleSave = () => {
    if (!saveName.trim()) return;
    const firstSelected = selectedIds[0];
    const baseStyle: NodeStyle = firstSelected ? nodes[firstSelected]?.style ?? {} : {};
    saveTemplatePreset({
      name: saveName.trim(),
      theme,
      defaultStyle: baseStyle,
      colorPresets: [],
    });
    refreshPresets();
    setSaveName('');
    setShowSave(false);
  };

  const handleDelete = (id: string) => {
    deleteTemplatePreset(id);
    refreshPresets();
    setEditingId(null);
  };

  const handleRename = (id: string) => {
    if (!editName.trim()) return;
    renameTemplatePreset(id, editName.trim());
    refreshPresets();
    setEditingId(null);
    setEditName('');
  };

  const handleExport = () => {
    const custom = getTemplatePresets().filter(p => p.id.startsWith('tpl_'));
    if (!custom.length) {
      setImportResult({ imported: 0, duplicates: 0, errors: ['No custom templates to export.'] });
      return;
    }
    exportTemplatesToJson();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importTemplatesFromJson(file);
    setImportResult(result);
    refreshPresets();
    // Reset so the same file can be re-imported
    e.target.value = '';
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogTitleId}
      ref={dialogRef}
      className="template-dialog"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.35)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        aria-hidden="true"
      />
      <div
        style={{
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: '24px',
          width: 520,
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 id={dialogTitleId} style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            Export Templates
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-secondary)', padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--color-border)', paddingBottom: 8 }}>
          <button
            onClick={() => setActiveTab('apply')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: activeTab === 'apply' ? 600 : 400,
              color: activeTab === 'apply' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'apply' ? '2px solid var(--color-accent)' : '2px solid transparent',
              paddingBottom: 4,
            }}
          >
            Apply Template
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: activeTab === 'manage' ? 600 : 400,
              color: activeTab === 'manage' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              borderBottom: activeTab === 'manage' ? '2px solid var(--color-accent)' : '2px solid transparent',
              paddingBottom: 4,
            }}
          >
            Manage Templates
          </button>
        </div>

        {activeTab === 'apply' && (
          <div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {selectedIds.length > 0
                ? `Applying to ${selectedIds.length} selected node(s).`
                : 'No nodes selected — select nodes to apply a template, or use "Apply to All".'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {presets.map(p => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  style={{
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--color-text)',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      width: 14, height: 14,
                      borderRadius: p.defaultStyle.shape === 'ellipse' ? '50%' : 3,
                      background: p.defaultStyle.backgroundColor ?? 'var(--color-surface)',
                      border: '1px solid ' + (p.defaultStyle.borderColor ?? 'var(--color-border)'),
                    }} />
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                      {p.theme === 'dark' ? '🌙' : '☀️'} {p.theme}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={applyAllPresetId || presets[0]?.id || ''}
                onChange={e => setApplyAllPresetId(e.target.value)}
                disabled={!presets.length}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  fontSize: 12,
                  cursor: presets.length ? 'pointer' : 'not-allowed',
                }}
              >
                {presets.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  const preset = presets.find(p => p.id === applyAllPresetId) || presets[0];
                  if (preset) applyPresetToAll(preset);
                }}
                disabled={!presets.length}
                style={{
                  padding: '8px 12px',
                  background: presets.length ? 'var(--color-accent)' : 'var(--color-border)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: presets.length ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                }}
              >
                Apply to All
              </button>
              <button
                onClick={() => setShowSave(true)}
                disabled={selectedIds.length === 0}
                style={{
                  padding: '8px 12px',
                  background: selectedIds.length ? 'var(--color-surface)' : 'var(--color-border)',
                  color: selectedIds.length ? 'var(--color-text)' : 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  cursor: selectedIds.length ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                }}
              >
                Save Selection as Template
              </button>
            </div>

            {showSave && (
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder="Template name..."
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSave(false); }}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 6,
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    fontSize: 13,
                  }}
                />
                <button onClick={handleSave} style={{ padding: '6px 12px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Save</button>
                <button onClick={() => setShowSave(false)} style={{ padding: '6px 12px', background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'manage' && (
          <div>
            {/* Import / Export row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                onClick={handleImportClick}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                📥 Import from file
              </button>
              <button
                onClick={handleExport}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                📤 Export custom templates
              </button>
            </div>

            {/* Import result feedback */}
            {importResult && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  marginBottom: 12,
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  background: importResult.errors.length ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                  color: importResult.errors.length ? 'var(--color-error-text, #ef4444)' : 'var(--color-success-text, #10b981)',
                  border: '1px solid ' + (importResult.errors.length ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'),
                }}
              >
                {importResult.imported > 0 && <span>✅ Imported {importResult.imported} template{importResult.imported !== 1 ? 's' : ''}. </span>}
                {importResult.duplicates > 0 && <span>⏭️ Skipped {importResult.duplicates} duplicate{importResult.duplicates !== 1 ? 's' : ''} by name. </span>}
                {importResult.errors.map((err, i) => <span key={i}>{err} </span>)}
                {importResult.imported === 0 && importResult.duplicates === 0 && importResult.errors.length === 0 && (
                  <span>No custom templates to export.</span>
                )}
              </div>
            )}

            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Rename or delete saved templates. Built-in presets cannot be deleted.
            </p>
            {presets.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No templates saved yet.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {presets.map(p => {
                const isEditing = editingId === p.id;
                const isBuiltIn = !p.id.startsWith('tpl_');
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
                    <span style={{
                      display: 'inline-block',
                      width: 16, height: 16,
                      borderRadius: p.defaultStyle.shape === 'ellipse' ? '50%' : 3,
                      background: p.defaultStyle.backgroundColor ?? 'var(--color-surface)',
                      border: '1px solid ' + (p.defaultStyle.borderColor ?? 'var(--color-border)'),
                      flexShrink: 0,
                    }} />
                    {isEditing ? (
                      <>
                        <input
                          ref={nameInputRef}
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleRename(p.id); if (e.key === 'Escape') setEditingId(null); }}
                          style={{ flex: 1, padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 4, background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 13 }}
                        />
                        <button onClick={() => handleRename(p.id)} title="Confirm rename" style={{ padding: '4px 8px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>✓</button>
                        <button onClick={() => setEditingId(null)} title="Cancel" style={{ padding: '4px 8px', background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>✕</button>
                      </>
                    ) : (
                      <>
                        <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text)' }}>{p.name}</span>
                        {!isBuiltIn && (
                          <>
                            <button onClick={() => { setEditingId(p.id); setEditName(p.name); }} title="Rename" style={{ padding: '4px 8px', background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>✏️</button>
                            <button onClick={() => handleDelete(p.id)} title="Delete" style={{ padding: '4px 8px', background: 'var(--color-surface)', color: 'var(--color-error-text)', border: '1px solid var(--color-error-border)', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>🗑️</button>
                          </>
                        )}
                        {isBuiltIn && <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>built-in</span>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
