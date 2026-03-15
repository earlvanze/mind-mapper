import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import { HELP_DIALOG_ARIA_KEYSHORTCUTS, HELP_DIALOG_CLOSE_ARIA_KEYSHORTCUTS, HELP_INPUT_ARIA_KEYSHORTCUTS, filterShortcuts, FOCUS_NAV_HISTORY_SHORTCUT_KEYS, formatHelpSummary, getHelpPendingMessage, isDialogClearInputEvent, isDialogFocusInputEvent, isDialogSelectInputEvent, pickShortcutsByKeys, SHORTCUTS, shouldSkipDialogSelectShortcut } from '../utils';

export default function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
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
      if (isDialogFocusInputEvent(e)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (isDialogClearInputEvent(e)) {
        e.preventDefault();
        setQuery('');
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (isDialogSelectInputEvent(e)) {
        if (shouldSkipDialogSelectShortcut(e)) return;
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, query]);

  const filtered = useMemo(
    () => filterShortcuts(SHORTCUTS, deferredQuery),
    [deferredQuery],
  );
  const focusNavHistory = useMemo(
    () => pickShortcutsByKeys(SHORTCUTS, FOCUS_NAV_HISTORY_SHORTCUT_KEYS),
    [],
  );
  const isFilterPending = query !== deferredQuery;
  const pendingMessage = getHelpPendingMessage(isFilterPending);
  const summaryText = useMemo(
    () => formatHelpSummary(filtered.length, SHORTCUTS.length, isFilterPending),
    [filtered.length, isFilterPending],
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
        aria-describedby={`${summaryId} ${hintId}`}
        aria-keyshortcuts={HELP_DIALOG_ARIA_KEYSHORTCUTS}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3 id={titleId}>Shortcuts</h3>
          <button
            type="button"
            className="dialog-close-btn"
            title="Close shortcuts (Esc, ? or Cmd/Ctrl+/)"
            aria-label="Close shortcuts dialog"
            aria-keyshortcuts={HELP_DIALOG_CLOSE_ARIA_KEYSHORTCUTS}
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
          aria-keyshortcuts={HELP_INPUT_ARIA_KEYSHORTCUTS}
          placeholder="Filter shortcuts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div id={summaryId} className="help-meta" aria-live="polite">{summaryText}</div>
        <div id={hintId} className="help-hint">Esc: clear filter (or close when empty) • Cmd/Ctrl+Shift+K: clear filter • Cmd/Ctrl+F: focus filter • Cmd/Ctrl+A: select filter</div>
        <div className={`help-results ${isFilterPending ? 'is-pending' : ''}`} aria-busy={isFilterPending} aria-disabled={isFilterPending} title={pendingMessage}>
          {filtered.length ? (
            <ul>
              {filtered.map(s => (
                <li key={s.key}><b>{s.key}</b>: {s.desc}</li>
              ))}
            </ul>
          ) : (
            <div className={`help-empty ${isFilterPending ? 'is-pending' : ''}`} role="status">
              {pendingMessage ?? 'No shortcuts match your filter.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
