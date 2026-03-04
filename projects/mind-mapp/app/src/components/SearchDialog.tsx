import { useEffect, useMemo, useState } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';

export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { nodes, setFocus } = useMindMapStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return Object.values(nodes).filter(n => n.text.toLowerCase().includes(q));
  }, [nodes, query]);

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
      <div className="search-box" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          placeholder="Search nodes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="search-results">
          {results.map(r => (
            <div
              key={r.id}
              className="search-item"
              onClick={() => { setFocus(r.id); onClose(); }}
            >
              {r.text || '(empty)'}
            </div>
          ))}
          {!results.length && query && <div className="search-empty">No results</div>}
        </div>
      </div>
    </div>
  );
}
