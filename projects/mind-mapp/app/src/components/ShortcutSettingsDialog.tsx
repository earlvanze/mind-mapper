import { useEffect, useId, useRef, useState, useCallback } from 'react';
import {
  DEFAULT_SHORTCUT_BINDINGS,
  getEffectiveBinding,
  matchesBinding,
  findConflicts,
  saveShortcutsPrefs,
  loadShortcutsPrefs,
  resetAllBindings,
  type ShortcutAction,
  type ShortcutBinding,
  type ShortcutsPrefs,
} from '../utils/keyboardShortcuts';
import type { KeyboardPrefs as NumericPrefs, ShortcutKey as NumericKey } from '../utils/uiPrefs';

// Reuse numeric prefs fields from existing ShortcutSettingsDialog
import {
  getKeyboardPref,
  saveKeyboardPrefs,
  DEFAULT_KEYBOARD_PREFS,
} from '../utils/uiPrefs';

type Props = {
  open: boolean;
  onClose: () => void;
};

const NUMERIC_FIELDS: { key: NumericKey; label: string; hint: string; min: number; max: number; step: number }[] = [
  { key: 'nudge', label: 'Nudge distance (px)', hint: 'Shift+Arrow — distance per press', min: 1, max: 100, step: 1 },
  { key: 'nudgeLarge', label: 'Large nudge distance (px)', hint: 'Shift+Alt+Arrow', min: 1, max: 200, step: 1 },
  { key: 'zoomIn', label: 'Zoom in factor', hint: '=/+ key', min: 1.01, max: 2.0, step: 0.01 },
  { key: 'zoomOut', label: 'Zoom out factor', hint: '- key', min: 0.5, max: 0.99, step: 0.01 },
];

type Tab = 'shortcuts' | 'values';

export default function ShortcutSettingsDialog({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('shortcuts');
  const [prefs, setPrefs] = useState<ShortcutsPrefs>(() => loadShortcutsPrefs());
  const [recording, setRecording] = useState<ShortcutAction | null>(null);
  const [conflict, setConflict] = useState<ShortcutBinding | null>(null);
  const [saved, setSaved] = useState(false);
  const [numericValues, setNumericValues] = useState<NumericPrefs>(() => {
    const vals: NumericPrefs = {};
    for (const f of NUMERIC_FIELDS) vals[f.key] = getKeyboardPref(f.key);
    return vals;
  });
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setPrefs(loadShortcutsPrefs());
    setRecording(null);
    setConflict(null);
    setSaved(false);
    const vals: NumericPrefs = {};
    for (const f of NUMERIC_FIELDS) vals[f.key] = getKeyboardPref(f.key);
    setNumericValues(vals);
    setTab('shortcuts');
  }, [open]);

  // Global key listener for recording
  useEffect(() => {
    if (!recording) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setRecording(null);
        setConflict(null);
        return;
      }

      // Build key string from event
      const parts: string[] = [];
      if (e.metaKey || e.ctrlKey) parts.push(navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      // Use e.key but normalize display
      let keyPart = e.key;
      if (keyPart === ' ') keyPart = 'Space';
      else if (keyPart === 'ArrowUp') keyPart = 'ArrowUp';
      else if (keyPart === 'ArrowDown') keyPart = 'ArrowDown';
      else if (keyPart === 'ArrowLeft') keyPart = 'ArrowLeft';
      else if (keyPart === 'ArrowRight') keyPart = 'ArrowRight';
      else if (keyPart === ' ') keyPart = 'Space';
      else if (keyPart.length === 1) keyPart = keyPart.toUpperCase();
      // Don't include modifiers alone as the key
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        parts.push(keyPart);
      }
      const newKey = parts.join('+');
      
      if (!newKey || parts.length === 0) return;

      const conflictBinding = findConflicts(recording, newKey, prefs);
      if (conflictBinding) {
        setConflict(conflictBinding);
        return;
      }

      setPrefs(prev => ({ ...prev, [recording]: newKey }));
      setRecording(null);
      setConflict(null);
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [recording, prefs]);

  // Focus trap + Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !recording) {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, recording]);

  const handleReset = useCallback(() => {
    resetAllBindings();
    setPrefs({});
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  const handleSave = useCallback(() => {
    saveShortcutsPrefs(prefs);
    saveKeyboardPrefs(numericValues);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onClose();
  }, [prefs, numericValues, onClose]);

  const handleNumericChange = (key: NumericKey, rawValue: string) => {
    const num = parseFloat(rawValue);
    if (isNaN(num)) return;
    const field = NUMERIC_FIELDS.find(f => f.key === key)!;
    const clamped = Math.min(field.max, Math.max(field.min, num));
    setNumericValues(prev => ({ ...prev, [key]: clamped }));
  };

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="help-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 520, minWidth: 400, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="dialog-header">
          <h3 id={titleId}>⌨️ Keyboard Shortcuts</h3>
          <button
            type="button"
            className="dialog-close-btn"
            title="Close (Esc)"
            aria-label="Close keyboard settings"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color, #eee)', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setTab('shortcuts')}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              border: 'none',
              background: tab === 'shortcuts' ? 'var(--bg-highlight, #e8f0fe)' : 'transparent',
              cursor: 'pointer',
              fontWeight: tab === 'shortcuts' ? 600 : 400,
              borderBottom: tab === 'shortcuts' ? '2px solid var(--primary-btn-bg, #0078d4)' : '2px solid transparent',
            }}
          >
            Shortcuts
          </button>
          <button
            type="button"
            onClick={() => setTab('values')}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              border: 'none',
              background: tab === 'values' ? 'var(--bg-highlight, #e8f0fe)' : 'transparent',
              cursor: 'pointer',
              fontWeight: tab === 'values' ? 600 : 400,
              borderBottom: tab === 'values' ? '2px solid var(--primary-btn-bg, #0078d4)' : '2px solid transparent',
            }}
          >
            Values &amp; Distance
          </button>
        </div>

        {tab === 'shortcuts' ? (
          <div
            ref={listRef}
            style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}
          >
            {recording && (
              <div style={{
                padding: '10px 16px',
                background: 'var(--primary-btn-bg, #0078d4)',
                color: 'var(--primary-btn-fg, #fff)',
                fontSize: 13,
                textAlign: 'center',
                margin: '0 8px 8px',
                borderRadius: 6,
              }}>
                🎹 Press any key combination to set it for <b>{DEFAULT_SHORTCUT_BINDINGS.find(b => b.action === recording)?.desc}</b> — Esc to cancel
              </div>
            )}
            {conflict && (
              <div style={{
                padding: '10px 16px',
                background: '#dc3545',
                color: '#fff',
                fontSize: 13,
                margin: '0 8px 8px',
                borderRadius: 6,
              }}>
                ⚠️ "{conflict.desc}" already uses this binding
              </div>
            )}
            {DEFAULT_SHORTCUT_BINDINGS
              .filter(b => {
                const key = prefs[b.action] ?? b.defaultKey;
                return !!key;
              })
              .map(binding => {
                const effectiveKey = prefs[binding.action] ?? binding.defaultKey;
                const isDefault = prefs[binding.action] === undefined;
                const isRecording = recording === binding.action;
                return (
                  <div
                    key={binding.action}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '6px 16px',
                      gap: 12,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      if (recording === binding.action) {
                        setRecording(null);
                      } else {
                        setRecording(binding.action);
                        setConflict(null);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setRecording(binding.action);
                        setConflict(null);
                      }
                    }}
                    aria-label={`${binding.desc}: ${effectiveKey}. Click to rebind.`}
                    title="Click to rebind"
                  >
                    <span style={{ flex: 1, fontSize: 13 }}>{binding.desc}</span>
                    <kbd
                      style={{
                        padding: '3px 8px',
                        background: isRecording
                          ? 'var(--primary-btn-bg, #0078d4)'
                          : isDefault
                          ? 'var(--bg-secondary, #f0f0f0)'
                          : 'var(--bg-input, #fff)',
                        color: isRecording
                          ? 'var(--primary-btn-fg, #fff)'
                          : 'var(--text-color, #333)',
                        border: isRecording
                          ? 'none'
                          : '1px solid var(--border-color, #ccc)',
                        borderRadius: 4,
                        fontSize: 12,
                        fontFamily: 'monospace',
                        minWidth: 60,
                        textAlign: 'center',
                        boxShadow: isRecording ? 'none' : '0 1px 2px rgba(0,0,0,0.1)',
                      }}
                    >
                      {isRecording ? '…' : effectiveKey}
                    </kbd>
                    {!isDefault && (
                      <button
                        type="button"
                        title="Reset to default"
                        onClick={e => {
                          e.stopPropagation();
                          setPrefs(prev => {
                            const next = { ...prev };
                            delete next[binding.action];
                            return next;
                          });
                        }}
                        style={{
                          padding: '2px 6px',
                          fontSize: 11,
                          border: '1px solid var(--border-color, #ccc)',
                          borderRadius: 4,
                          background: 'transparent',
                          cursor: 'pointer',
                          color: 'var(--text-muted, #888)',
                        }}
                      >
                        ↩
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {NUMERIC_FIELDS.map(field => (
              <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label htmlFor={`numpick-${field.key}`} style={{ fontWeight: 600, fontSize: 13 }}>
                  {field.label}
                </label>
                <input
                  id={`numpick-${field.key}`}
                  type="number"
                  value={numericValues[field.key] ?? DEFAULT_KEYBOARD_PREFS[field.key]}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  onChange={e => handleNumericChange(field.key, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: 14,
                    borderRadius: 6,
                    border: '1px solid var(--border-color, #ccc)',
                    background: 'var(--bg-input, #fff)',
                    color: 'var(--text-color, #333)',
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--text-muted, #888)' }}>{field.hint}</span>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 16px',
            borderTop: '1px solid var(--border-color, #eee)',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <button type="button" onClick={handleReset} style={btnStyle(false)}>
            Reset all
          </button>
          <button type="button" onClick={onClose} style={btnStyle(false)}>
            Cancel
          </button>
          <button type="button" onClick={handleSave} style={btnStyle(true)}>
            {saved ? '✓ Saved!' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(primary: boolean) {
  return {
    padding: '6px 14px',
    fontSize: 13,
    borderRadius: 6,
    border: primary ? 'none' : '1px solid var(--border-color, #ccc)',
    background: primary ? 'var(--primary-btn-bg, #0078d4)' : 'transparent',
    color: primary ? 'var(--primary-btn-fg, #fff)' : 'var(--text-color, #333)',
    cursor: 'pointer',
  };
}
