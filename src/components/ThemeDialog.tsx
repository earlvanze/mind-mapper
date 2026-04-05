import { useEffect, useRef, useState } from 'react';
import { getPresets, getPresetById, applyPreset, savePreset, loadSavedPreset } from '../utils/themePresets';

interface Props {
  onClose: () => void;
  currentThemeId: string;
  onSelect: (themeId: string) => void;
}

export default function ThemeDialog({ onClose, currentThemeId, onSelect }: Props) {
  const presets = getPresets();
  const [selected, setSelected] = useState(currentThemeId);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [tabindex="0"], input:not([disabled])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    el.addEventListener('keydown', trap);
    return () => el.removeEventListener('keydown', trap);
  }, []);

  const handlePreview = (id: string) => {
    setPreviewing(id);
    const p = getPresetById(id);
    if (p) applyPreset(p);
  };

  const handleSelect = (id: string) => {
    setSelected(id);
    savePreset(id);
    const p = getPresetById(id)!;
    applyPreset(p);
    onSelect(id);
    onClose();
  };

  const handleApply = () => handleSelect(selected);

  const lightPresets = presets.filter(p => !p.isDark);
  const darkPresets = presets.filter(p => p.isDark);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose theme"
      ref={dialogRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          padding: '24px',
          width: 'min(520px, 90vw)',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
            Choose Theme
          </h2>
          <button
            onClick={onClose}
            aria-label="Close theme dialog"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-secondary)', padding: '2px 6px' }}
          >✕</button>
        </div>

        {previewing && (
          <div role="status" aria-live="polite" style={{
            marginBottom: 12,
            padding: '8px 12px',
            background: 'var(--color-accent-bg)',
            border: '1px solid var(--color-accent)',
            borderRadius: 6,
            fontSize: 13,
            color: 'var(--color-accent-deep)',
          }}>
            Previewing — press Apply to confirm or Cancel to revert
          </div>
        )}

        <section aria-labelledby="light-themes-heading">
          <h3 id="light-themes-heading" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 12 }}>
            Light Themes
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
            {lightPresets.map(p => (
              <button
                key={p.id}
                onClick={() => handlePreview(p.id)}
                onDoubleClick={() => handleSelect(p.id)}
                aria-pressed={selected === p.id}
                aria-label={`Preview ${p.name} theme`}
                style={{
                  background: p.vars['--color-bg'],
                  border: `2px solid ${selected === p.id ? 'var(--color-accent)' : p.vars['--color-border']}`,
                  borderRadius: 10,
                  padding: '10px 8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'border-color 0.15s',
                  color: p.vars['--color-text'],
                }}
              >
                {/* Mini color swatch */}
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 8 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: p.vars['--color-accent'] }} />
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: p.vars['--color-surface'] }} />
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: p.vars['--color-text'] }} />
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: p.vars['--color-bg'] }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: selected === p.id ? 600 : 400 }}>
                  {p.name}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="dark-themes-heading">
          <h3 id="dark-themes-heading" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 12 }}>
            Dark Themes
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 24 }}>
            {darkPresets.map(p => (
              <button
                key={p.id}
                onClick={() => handlePreview(p.id)}
                onDoubleClick={() => handleSelect(p.id)}
                aria-pressed={selected === p.id}
                aria-label={`Preview ${p.name} theme`}
                style={{
                  background: p.vars['--color-bg'],
                  border: `2px solid ${selected === p.id ? 'var(--color-accent)' : p.vars['--color-border']}`,
                  borderRadius: 10,
                  padding: '10px 8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'border-color 0.15s',
                  color: p.vars['--color-text'],
                }}
              >
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 8 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: p.vars['--color-accent'] }} />
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: p.vars['--color-surface'] }} />
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: p.vars['--color-text'] }} />
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: p.vars['--color-bg'] }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: selected === p.id ? 600 : 400 }}>
                  {p.name}
                </div>
              </button>
            ))}
          </div>
        </section>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              const saved = loadSavedPreset();
              const p = getPresetById(saved) ?? getPresets()[0];
              applyPreset(p);
              setPreviewing(null);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >Cancel</button>
          <button
            onClick={handleApply}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              border: 'none',
              background: 'var(--color-accent)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >Apply</button>
        </div>
      </div>
    </div>
  );
}
