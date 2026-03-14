import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { centerPointInView, clampSearchSelection, computeHighlightRanges, cycleSearchSelection, edgeSearchSelection, formatFocusPath, moveSearchSelection, searchNodesWithTotal, shouldKeepSearchOpen, tokenizeSearchQuery } from '../utils';

export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { nodes, setFocus } = useMindMapStore();

  const centerOnNode = (id: string) => {
    const node = nodes[id];
    if (!node) return;

    const panZoom = (window as any).__mindmappPanZoom;
    const canvas = document.querySelector('.canvas') as HTMLElement | null;
    if (!panZoom?.getView || !panZoom?.setView || !canvas) return;

    const view = panZoom.getView();
    const rect = canvas.getBoundingClientRect();
    const centered = centerPointInView(
      { x: node.x + 30, y: node.y + 16 },
      { width: rect.width, height: rect.height },
      view.scale ?? 1,
    );
    panZoom.setView(centered);
  };

  const jumpToNode = (id: string, closeAfter = true) => {
    setFocus(id);
    centerOnNode(id);
    if (closeAfter) onClose();
  };
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dialogTitleId = useId();
  const summaryId = useId();
  const listboxId = useId();
  const terms = useMemo(
    () => tokenizeSearchQuery(query).filter(token => !token.negated).map(token => token.value),
    [query],
  );

  const highlight = (text: string): ReactNode => {
    if (!terms.length) return text;

    const source = text || '(empty)';
    const ranges = computeHighlightRanges(source, terms);
    if (!ranges.length) return source;

    const parts: ReactNode[] = [];
    let cursor = 0;
    ranges.forEach((range, i) => {
      if (range.start > cursor) parts.push(source.slice(cursor, range.start));
      parts.push(<mark key={`m-${i}-${range.start}`}>{source.slice(range.start, range.end)}</mark>);
      cursor = range.end;
    });

    if (cursor < source.length) parts.push(source.slice(cursor));
    return parts;
  };

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const { results, totalMatches } = useMemo(() => {
    const { results, total } = searchNodesWithTotal(nodes, query, 20);
    return {
      totalMatches: total,
      results: results.map(node => ({ node, path: formatFocusPath(nodes, node.id) })),
    };
  }, [nodes, query]);
  const selectedNodeId = results[selected]?.node.id;
  const selectedOptionId = selectedNodeId ? `${listboxId}-${selectedNodeId}` : undefined;

  useEffect(() => {
    setSelected((index) => clampSearchSelection(index, results.length));

    const validIds = new Set(results.map(result => result.node.id));
    Object.keys(resultRefs.current).forEach((id) => {
      if (!validIds.has(id)) {
        delete resultRefs.current[id];
      }
    });
  }, [results]);

  useEffect(() => {
    if (!open || !selectedNodeId) return;
    resultRefs.current[selectedNodeId]?.scrollIntoView({ block: 'nearest' });
  }, [open, selectedNodeId, results.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (query.trim()) {
          e.preventDefault();
          setQuery('');
          setSelected(0);
          inputRef.current?.focus();
          return;
        }
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        const target = e.target as HTMLElement | null;
        if (target?.tagName === 'INPUT') return;
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === 'ArrowDown' && results.length) {
        e.preventDefault();
        setSelected(s => moveSearchSelection(s, results.length, 1));
      }
      if (e.key === 'ArrowUp' && results.length) {
        e.preventDefault();
        setSelected(s => moveSearchSelection(s, results.length, -1));
      }
      if (e.key === 'PageDown' && results.length) {
        e.preventDefault();
        setSelected(s => moveSearchSelection(s, results.length, 5));
      }
      if (e.key === 'PageUp' && results.length) {
        e.preventDefault();
        setSelected(s => moveSearchSelection(s, results.length, -5));
      }
      if (e.key === 'Home' && results.length) {
        e.preventDefault();
        setSelected(edgeSearchSelection(results.length, 'start'));
      }
      if (e.key === 'End' && results.length) {
        e.preventDefault();
        setSelected(edgeSearchSelection(results.length, 'end'));
      }
      if (e.key === 'Tab' && results.length) {
        e.preventDefault();
        setSelected(s => {
          if (e.shiftKey) return cycleSearchSelection(s, results.length, -1);
          return cycleSearchSelection(s, results.length, 1);
        });
      }
      if (e.key === 'Enter' && results.length) {
        e.preventDefault();
        const item = results[selected]?.node;
        if (item) {
          const closeAfter = !shouldKeepSearchOpen(e);
          jumpToNode(item.id, closeAfter);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, query, results, selected, setFocus]);

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div
        id="mindmapp-search-dialog"
        className="search-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={dialogTitleId} className="search-title">Search</h3>
        <input
          ref={inputRef}
          autoFocus
          role="combobox"
          aria-label="Search nodes"
          aria-controls={listboxId}
          aria-expanded={results.length > 0}
          aria-activedescendant={selectedOptionId}
          placeholder='Search nodes… (use "phrase" or -exclude)'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div id={summaryId} className="search-summary" aria-live="polite">
          {results.length} shown / {totalMatches} matches{totalMatches > results.length ? ' (refine to narrow)' : ''}
        </div>
        <div id={listboxId} className="search-results" role="listbox" aria-describedby={summaryId}>
          {results.map((r, i) => {
            const title = r.node.text || '(empty)';
            const meta = `${r.node.id} • ${r.path || '(no path)'}`;
            return (
              <div
                key={r.node.id}
                id={`${listboxId}-${r.node.id}`}
                role="option"
                aria-selected={i === selected}
                aria-posinset={i + 1}
                aria-setsize={results.length}
                ref={(element) => {
                  resultRefs.current[r.node.id] = element;
                }}
                className={`search-item ${i === selected ? 'active' : ''}`}
                onMouseEnter={() => setSelected(i)}
                onClick={(event) => {
                  const closeAfter = !shouldKeepSearchOpen(event);
                  jumpToNode(r.node.id, closeAfter);
                }}
              >
                <div className="search-item-title">{highlight(title)}</div>
                <div className="search-item-meta" title={meta}>
                  {highlight(meta)}
                </div>
              </div>
            );
          })}
          {!results.length && query && <div className="search-empty" role="status">No results</div>}
          <div className="search-hint">Tab/Shift+Tab: cycle selection • PageUp/PageDown: jump by 5 • Home/End: first/last • Enter/click: jump + close • Shift/Cmd/Ctrl/Alt+Enter/click: jump + keep open • Esc: clear query (or close when empty) • Cmd/Ctrl+F: focus search • Cmd/Ctrl+K: close search</div>
        </div>
      </div>
    </div>
  );
}
