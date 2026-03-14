import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { filterShortcuts, FOCUS_NAV_HISTORY_SHORTCUT_KEYS, pickShortcutsByKeys, SHORTCUTS } from '../utils';

export default function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const titleId = useId();
  const summaryId = useId();
  const quickSectionId = useId();
  const hintId = useId();

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (query.trim()) {
          e.preventDefault();
          setQuery('');
          inputRef.current?.focus();
          return;
        }
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuery('');
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        const target = e.target as HTMLElement | null;
        if (target?.tagName === 'INPUT') return;
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, query]);

  const filtered = useMemo(
    () => filterShortcuts(SHORTCUTS, query),
    [query],
  );
  const focusNavHistory = useMemo(
    () => pickShortcutsByKeys(SHORTCUTS, FOCUS_NAV_HISTORY_SHORTCUT_KEYS),
    [],
  );

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div
        id="mindmapp-help-dialog"
        className="help-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3 id={titleId}>Shortcuts</h3>
          <button
            type="button"
            className="dialog-close-btn"
            title="Close shortcuts (Esc, ? or Cmd/Ctrl+/)"
            aria-label="Close shortcuts dialog"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="help-quick-section" role="region" aria-labelledby={quickSectionId}>
          <h4 id={quickSectionId}>Focus Navigation &amp; History</h4>
          <ul className="help-quick-list">
            {focusNavHistory.map(shortcut => (
              <li key={shortcut.key}><b>{shortcut.key}</b>: {shortcut.desc}</li>
            ))}
          </ul>
        </div>
        <input
          ref={inputRef}
          className="help-filter"
          aria-label="Filter shortcuts"
          aria-describedby={`${summaryId} ${hintId}`}
          placeholder="Filter shortcuts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div id={summaryId} className="help-meta" aria-live="polite">{filtered.length} / {SHORTCUTS.length} shown</div>
        <div id={hintId} className="help-hint">Esc: clear filter (or close when empty) • Cmd/Ctrl+Shift+K: clear filter • Cmd/Ctrl+F: focus filter</div>
        {filtered.length ? (
          <ul>
            {filtered.map(s => (
              <li key={s.key}><b>{s.key}</b>: {s.desc}</li>
            ))}
          </ul>
        ) : (
          <div className="help-empty">No shortcuts match your filter.</div>
        )}
      </div>
    </div>
  );
}
