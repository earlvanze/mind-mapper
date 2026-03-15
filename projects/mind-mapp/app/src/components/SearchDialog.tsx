import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { DEFAULT_SEARCH_RESULT_LIMIT, SEARCH_DIALOG_ARIA_KEYSHORTCUTS, SEARCH_DIALOG_CLOSE_ARIA_KEYSHORTCUTS, SEARCH_INPUT_ARIA_KEYSHORTCUTS, canExecuteSearchJump, canNavigateSearchSelection, centerPointInView, clampSearchSelection, computeHighlightRanges, createFocusPathResolver, formatSearchSummary, getSearchEmptyMessage, getSearchPendingTooltip, isDialogClearInputEvent, isDialogFocusInputEvent, isDialogSelectInputEvent, isSearchSelectionNavigationKey, isSearchToggleEvent, navigateSearchSelectionByKey, searchNodesWithTotal, shouldDisplaySearchEmptyState, shouldKeepSearchOpen, shouldSkipDialogSelectShortcut, tokenizeSearchQuery } from '../utils';

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
  const deferredQuery = useDeferredValue(query);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dialogTitleId = useId();
  const summaryId = useId();
  const listboxId = useId();
  const hintId = useId();
  const searchTokens = useMemo(
    () => tokenizeSearchQuery(deferredQuery),
    [deferredQuery],
  );
  const terms = useMemo(
    () => searchTokens.filter(token => !token.negated).map(token => token.value),
    [searchTokens],
  );
  const isSearchPending = query !== deferredQuery;

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

  const resolveFocusPath = useMemo(() => createFocusPathResolver(nodes), [nodes]);

  const { results, totalMatches } = useMemo(() => {
    const { results, total } = searchNodesWithTotal(nodes, searchTokens, DEFAULT_SEARCH_RESULT_LIMIT);
    return {
      totalMatches: total,
      results: results.map(node => ({ node, path: resolveFocusPath(node.id) })),
    };
  }, [nodes, resolveFocusPath, searchTokens]);
  const selectedNodeId = results[selected]?.node.id;
  const selectedOptionId = selectedNodeId ? `${listboxId}-${selectedNodeId}` : undefined;
  const canJumpToResult = canExecuteSearchJump(isSearchPending);
  const canNavigateSelection = canNavigateSearchSelection(isSearchPending);
  const activeDescendantId = canNavigateSelection ? selectedOptionId : undefined;
  const summaryText = useMemo(
    () => formatSearchSummary(results.length, totalMatches, isSearchPending),
    [isSearchPending, results.length, totalMatches],
  );
  const pendingTooltip = getSearchPendingTooltip(isSearchPending);
  const emptyMessage = useMemo(
    () => getSearchEmptyMessage(results.length, totalMatches, isSearchPending),
    [isSearchPending, results.length, totalMatches],
  );
  const shouldShowEmptyState = useMemo(
    () => shouldDisplaySearchEmptyState(query, searchTokens.length > 0),
    [query, searchTokens.length],
  );

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
      if (isSearchToggleEvent(e)) {
        e.preventDefault();
        onClose();
      }
      if (isDialogClearInputEvent(e)) {
        e.preventDefault();
        setQuery('');
        setSelected(0);
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (isDialogFocusInputEvent(e)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (isDialogSelectInputEvent(e)) {
        if (shouldSkipDialogSelectShortcut(e)) return;
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (results.length && isSearchSelectionNavigationKey(e.key)) {
        e.preventDefault();
        if (!canNavigateSelection) return;

        setSelected((current) => {
          const next = navigateSearchSelectionByKey(current, results.length, e.key, e.shiftKey);
          return next ?? current;
        });
      }
      if (e.key === 'Enter' && results.length) {
        e.preventDefault();
        if (!canJumpToResult) return;
        const item = results[selected]?.node;
        if (item) {
          const closeAfter = !shouldKeepSearchOpen(e);
          jumpToNode(item.id, closeAfter);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canJumpToResult, canNavigateSelection, onClose, open, query, results, selected, setFocus]);

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div
        id="mindmapp-search-dialog"
        className="search-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        aria-describedby={`${summaryId} ${hintId}`}
        aria-keyshortcuts={SEARCH_DIALOG_ARIA_KEYSHORTCUTS}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3 id={dialogTitleId} className="search-title">Search</h3>
          <button
            type="button"
            className="dialog-close-btn"
            title="Close search (Esc or Cmd/Ctrl+K)"
            aria-label="Close search dialog"
            aria-keyshortcuts={SEARCH_DIALOG_CLOSE_ARIA_KEYSHORTCUTS}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <input
          ref={inputRef}
          autoFocus
          role="combobox"
          aria-label="Search nodes"
          aria-controls={listboxId}
          aria-describedby={`${summaryId} ${hintId}`}
          aria-keyshortcuts={SEARCH_INPUT_ARIA_KEYSHORTCUTS}
          aria-expanded={results.length > 0}
          aria-activedescendant={activeDescendantId}
          placeholder='Search nodes… (use "phrase" or -exclude)'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div id={summaryId} className="search-summary" aria-live="polite">
          {summaryText}
        </div>
        <div id={listboxId} className={`search-results ${isSearchPending ? 'is-pending' : ''}`} role="listbox" aria-describedby={`${summaryId} ${hintId}`} aria-busy={isSearchPending} aria-disabled={!canNavigateSelection} title={pendingTooltip}>
          {results.map((r, i) => {
            const title = r.node.text || '(empty)';
            const meta = `${r.node.id} • ${r.path || '(no path)'}`;
            return (
              <div
                key={r.node.id}
                id={`${listboxId}-${r.node.id}`}
                role="option"
                aria-selected={canNavigateSelection && i === selected}
                aria-disabled={!canJumpToResult}
                aria-posinset={i + 1}
                aria-setsize={results.length}
                ref={(element) => {
                  resultRefs.current[r.node.id] = element;
                }}
                className={`search-item ${canNavigateSelection && i === selected ? 'active' : ''} ${canJumpToResult ? '' : 'is-disabled'}`}
                title={pendingTooltip}
                onMouseEnter={() => {
                  if (!canNavigateSelection) return;
                  setSelected(i);
                }}
                onClick={(event) => {
                  if (!canJumpToResult) return;
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
          {!results.length && shouldShowEmptyState && (
            <div className={`search-empty ${isSearchPending ? 'is-pending' : ''}`} role="status">
              {emptyMessage ?? 'No results'}
            </div>
          )}
          <div id={hintId} className="search-hint">Tab/Shift+Tab: cycle selection (when not updating) • PageUp/PageDown: jump by 5 (when not updating) • Home/End: first/last (when not updating) • Enter/click: jump + close (when not updating) • Shift/Cmd/Ctrl/Alt+Enter/click: jump + keep open • Esc: clear query (or close when empty) • Cmd/Ctrl+Shift+K: clear query • Cmd/Ctrl+F: focus search • Cmd/Ctrl+A: select query • Cmd/Ctrl+K: close search</div>
        </div>
      </div>
    </div>
  );
}
