import { useEffect } from 'react';
import { SHORTCUTS } from '../utils/shortcuts';

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
          {SHORTCUTS.map(s => (
            <li key={s.key}><b>{s.key}</b>: {s.desc}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
