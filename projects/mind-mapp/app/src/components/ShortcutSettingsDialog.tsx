import { useEffect, useId, useRef, useState } from 'react';
import { getKeyboardPref, saveKeyboardPrefs, DEFAULT_KEYBOARD_PREFS, type KeyboardPrefs, type ShortcutKey } from '../utils/uiPrefs';

type Props = {
  open: boolean;
  onClose: () => void;
};

const FIELDS: { key: ShortcutKey; label: string; hint: string; min: number; max: number; step: number }[] = [
  {
    key: 'nudge',
    label: 'Nudge distance (px)',
    hint: 'Shift+Arrow — distance per press',
    min: 1,
    max: 100,
    step: 1,
  },
  {
    key: 'nudgeLarge',
    label: 'Large nudge distance (px)',
    hint: 'Shift+Alt+Arrow — distance per press',
    min: 1,
    max: 200,
    step: 1,
  },
  {
    key: 'zoomIn',
    label: 'Zoom in factor',
    hint: '=/+ key — scale multiplier per press',
    min: 1.01,
    max: 2.0,
    step: 0.01,
  },
  {
    key: 'zoomOut',
    label: 'Zoom out factor',
    hint: '- key — scale multiplier per press',
    min: 0.5,
    max: 0.99,
    step: 0.01,
  },
];

export default function ShortcutSettingsDialog({ open, onClose }: Props) {
  const [values, setValues] = useState<KeyboardPrefs>(() => {
    const prefs: KeyboardPrefs = {};
    for (const f of FIELDS) {
      prefs[f.key] = getKeyboardPref(f.key);
    }
    return prefs;
  });
  const [saved, setSaved] = useState(false);
  const titleId = useId();
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    const prefs: KeyboardPrefs = {};
    for (const f of FIELDS) {
      prefs[f.key] = getKeyboardPref(f.key);
    }
    setValues(prefs);
    setSaved(false);
    setTimeout(() => firstInputRef.current?.focus(), 0);
  }, [open]);

  // Focus trap + Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      // Tab trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleChange = (key: ShortcutKey, rawValue: string) => {
    const num = parseFloat(rawValue);
    if (isNaN(num)) return;
    const field = FIELDS.find(f => f.key === key)!;
    const clamped = Math.min(field.max, Math.max(field.min, num));
    setValues(prev => ({ ...prev, [key]: clamped }));
  };

  const handleReset = () => {
    setValues({ ...DEFAULT_KEYBOARD_PREFS });
  };

  const handleSave = () => {
    saveKeyboardPrefs(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    onClose();
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
        style={{ maxWidth: 420, minWidth: 340 }}
      >
        <div className="dialog-header">
          <h3 id={titleId}>⚙️ Shortcut Settings</h3>
          <button
            type="button"
            className="dialog-close-btn"
            title="Close (Esc)"
            aria-label="Close shortcut settings"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FIELDS.map(field => (
            <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label
                htmlFor={`kbd-setting-${field.key}`}
                style={{ fontWeight: 600, fontSize: 13 }}
              >
                {field.label}
              </label>
              <input
                id={`kbd-setting-${field.key}`}
                ref={field.key === 'nudge' ? firstInputRef : undefined}
                type="number"
                value={values[field.key] ?? DEFAULT_KEYBOARD_PREFS[field.key]}
                min={field.min}
                max={field.max}
                step={field.step}
                onChange={e => handleChange(field.key, e.target.value)}
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

        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 16px',
            borderTop: '1px solid var(--border-color, #eee)',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid var(--border-color, #ccc)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            Reset defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid var(--border-color, #ccc)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: '6px 16px',
              fontSize: 13,
              borderRadius: 6,
              border: 'none',
              background: 'var(--primary-btn-bg, #0078d4)',
              color: 'var(--primary-btn-fg, #fff)',
              cursor: 'pointer',
              marginLeft: 'auto',
            }}
          >
            {saved ? '✓ Saved!' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
