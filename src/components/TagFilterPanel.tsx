import { useMemo, useState } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { getAllTagsWithCounts, getSortedTags } from '../utils/tags';
import { TagBadge } from './TagBadge';

interface TagFilterPanelProps {
  onClose?: () => void;
}

export default function TagFilterPanel({ onClose }: TagFilterPanelProps) {
  const { nodes, activeTagFilters, matchMode, setTagFilter, clearTagFilters, toggleMatchMode } = useMindMapStore();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(true);

  const allTags = useMemo(() => getSortedTags(nodes), [nodes]);
  const tagCounts = useMemo(() => getAllTagsWithCounts(nodes), [nodes]);

  const filteredTagList = useMemo(() => {
    if (!search.trim()) return allTags;
    const lower = search.toLowerCase();
    return allTags.filter(tag => tag.toLowerCase().includes(lower));
  }, [allTags, search]);

  const isFilterActive = activeTagFilters.length > 0;

  return (
    <div
      className="tag-filter-panel"
      role="region"
      aria-label="Tag filter panel"
      style={{
        position: 'absolute',
        top: 8,
        left: 8,
        zIndex: 100,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        width: 240,
        fontSize: '0.8125rem',
        color: 'var(--color-text)',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          borderBottom: expanded ? '1px solid var(--color-border)' : 'none',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(v => !v)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.9em' }}>🏷️</span>
          <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
            Filter{isFilterActive ? ` (${activeTagFilters.length})` : ''}
          </span>
        </div>
        <button
          aria-label={expanded ? 'Collapse filter panel' : 'Expand filter panel'}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.7rem',
            color: 'var(--color-text-muted)',
            padding: '2px 4px',
            lineHeight: 1,
          }}
          onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
        >
          {expanded ? '▴' : '▾'}
        </button>
      </div>

      {expanded && (
        <>
          {/* Active filter chips */}
          {isFilterActive && (
            <div
              style={{
                padding: '6px 10px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
                alignItems: 'center',
              }}
            >
              {activeTagFilters.map(tag => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    backgroundColor: 'var(--color-accent-light)',
                    border: '1px solid var(--color-accent)',
                    borderRadius: 4,
                    padding: '1px 4px',
                    fontSize: '0.75rem',
                    color: 'var(--color-accent)',
                  }}
                >
                  {tag}
                  <button
                    aria-label={`Remove ${tag} filter`}
                    onClick={(e) => { e.stopPropagation(); setTagFilter(tag); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'inherit',
                      padding: 0,
                      lineHeight: 1,
                      fontSize: '0.7rem',
                      opacity: 0.8,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                <button
                  title="Clear all filters"
                  aria-label="Clear all tag filters"
                  onClick={clearTagFilters}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.75rem',
                    padding: '2px 4px',
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Match mode toggle */}
          <div
            style={{
              padding: '6px 10px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
              Match:
            </span>
            <button
              aria-pressed={matchMode === 'any'}
              title="Match any filter (OR)"
              onClick={() => toggleMatchMode()}
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid var(--color-border)',
                backgroundColor: matchMode === 'any' ? 'var(--color-accent-light)' : 'transparent',
                color: matchMode === 'any' ? 'var(--color-accent)' : 'var(--color-text)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: matchMode === 'any' ? 600 : 400,
              }}
            >
              Any
            </button>
            <button
              aria-pressed={matchMode === 'all'}
              title="Match all filters (AND)"
              onClick={() => toggleMatchMode()}
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid var(--color-border)',
                backgroundColor: matchMode === 'all' ? 'var(--color-accent-light)' : 'transparent',
                color: matchMode === 'all' ? 'var(--color-accent)' : 'var(--color-text)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: matchMode === 'all' ? 600 : 400,
              }}
            >
              All
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--color-border)' }}>
            <input
              type="text"
              placeholder="Search tags..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search tags to filter"
              style={{
                width: '100%',
                padding: '4px 8px',
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                fontSize: '0.75rem',
                backgroundColor: 'var(--color-input-bg)',
                color: 'var(--color-text)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Tag list */}
          <div
            style={{
              maxHeight: 200,
              overflowY: 'auto',
              padding: '4px 0',
            }}
          >
            {filteredTagList.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '12px 10px' }}>
                {allTags.length === 0 ? 'No tags yet' : 'No matching tags'}
              </p>
            )}
            {filteredTagList.map(tag => {
              const isActive = activeTagFilters.includes(tag);
              const count = tagCounts.get(tag) || 0;
              return (
                <div
                  key={tag}
                  role="option"
                  aria-selected={isActive}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    backgroundColor: isActive ? 'var(--color-accent-light)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
                  }}
                  onClick={() => setTagFilter(tag)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTagFilter(tag); } }}
                  tabIndex={0}
                >
                  <TagBadge tag={tag} size="small" />
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
