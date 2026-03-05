import { useEffect } from 'react';

export default function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="help-box" onClick={(e) => e.stopPropagation()}>
        <h3>Shortcuts</h3>
        <ul>
          <li><b>Enter</b>: new sibling</li>
          <li><b>Tab</b>: new child</li>
          <li><b>Delete</b>: delete node</li>
          <li><b>Cmd/Ctrl+K</b>: search</li>
          <li><b>Cmd/Ctrl+S</b>: export JSON</li>
          <li><b>Cmd/Ctrl+Shift+S</b>: export PNG</li>
          <li><b>E</b> / double‑click: edit node</li>
          <li><b>Arrow keys</b>: move focus</li>
          <li><b>F</b>: fit to view</li>
          <li><b>L</b>: auto‑layout children</li>
          <li><b>Shift+drag</b>: pan</li>
          <li><b>Ctrl/Cmd+wheel</b>: zoom</li>
          <li><b>?</b>: help</li>
        </ul>
      </div>
    </div>
  );
}
