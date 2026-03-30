import { useMemo, useState } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { getAllTagsWithCounts, getSortedTags } from '../utils/tags';
import { TagBadge } from './TagBadge';
import { getUniqueShapes, getUniqueColors, getUniqueIcons } from '../utils/nodeFilters';

interface FilterPanelProps {
  onClose?: () => void;
}

type Tab = 'tags' | 'style' | 'date';

export default function FilterPanel({ onClose }: FilterPanelProps) {
  const {
    nodes,
    activeTagFilters,
    matchMode,
    setTagFilter,
    clearTagFilters,
    toggleMatchMode,
    styleFilterShapes,
    styleFilterColors,
    styleFilterIcons,
    styleFilterDateMode,
    styleFilterDateFrom,
    styleFilterDateTo,
    setStyleFilterShapes,
    setStyleFilterColors,
    setStyleFilterIcons,
    setStyleFilterDate,
    clearStyleFilters,
  } = useMindMapStore();

  const [activeTab, setActiveTab] = useState<Tab>('tags');
  const [tagSearch, setTagSearch] = useState('');
  const [expanded, setExpanded] = useState(true);

  const allTags = useMemo(() => getSortedTags(nodes), [nodes]);
  const tagCounts = useMemo(() => getAllTagsWithCounts(nodes), [nodes]);
  const uniqueShapes = useMemo(() => getUniqueShapes(nodes), [nodes]);
  const uniqueColors = useMemo(() => getUniqueColors(nodes), [nodes]);
  const uniqueIcons = useMemo(() => getUniqueIcons(nodes), [nodes]);

  const filteredTagList = useMemo(() => {
    if (!tagSearch.trim()) return allTags;
    const lower = tagSearch.toLowerCase();
    return allTags.filter(tag => tag.toLowerCase().includes(lower));
  }, [allTags, tagSearch]);

  const hasTagFilters = activeTagFilters.length > 0;
  const hasStyleFilters = styleFilterShapes.length > 0 || styleFilterColors.length > 0 || styleFilterIcons.length > 0;
  const hasDateFilters = styleFilterDateMode != null && (styleFilterDateFrom != null || styleFilterDateTo != null);
  const isFilterActive = hasTagFilters || hasStyleFilters || hasDateFilters;

  const allTabs: { id: Tab; label: string; hasContent: boolean }[] = [
    { id: 'tags', label: 'Tags', hasContent: allTags.length > 0 },
    { id: 'style', label: 'Style', hasContent: uniqueShapes.length > 0 || uniqueColors.length > 0 || uniqueIcons.length > 0 },
    { id: 'date', label: 'Date', hasContent: true },
  ];

  return (
    <div
      className="filter-panel"
      role="region"
      aria-label="Advanced filter panel"
      style={{
        position: 'absolute',
        top: 8,
        left: 8,
        zIndex: 100,
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        width: 280,
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
          <span style={{ fontSize: '0.9em' }}>🔍</span>
          <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
            Filter{isFilterActive ? ' •' : ''}
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
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
            {allTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '6px 4px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tag Tab */}
          {activeTab === 'tags' && (
            <>
              {/* Active filter chips */}
              {hasTagFilters && (
                <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                  {activeTagFilters.map(tag => (
                    <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, backgroundColor: 'var(--color-accent-light)', border: '1px solid var(--color-accent)', borderRadius: 4, padding: '1px 4px', fontSize: '0.75rem', color: 'var(--color-accent)' }}>
                      {tag}
                      <button aria-label={`Remove ${tag} filter`} onClick={e => { e.stopPropagation(); setTagFilter(tag); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1, fontSize: '0.7rem' }}>×</button>
                    </span>
                  ))}
                  <button title="Clear all filters" aria-label="Clear all tag filters" onClick={clearTagFilters} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.75rem', padding: '2px 4px', marginLeft: 'auto' }}>Clear</button>
                </div>
              )}

              {/* Match mode */}
              <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>Match:</span>
                {(['any', 'all'] as const).map(mode => (
                  <button key={mode} aria-pressed={matchMode === mode} title={`Match ${mode} filter`} onClick={() => { if (matchMode !== mode) toggleMatchMode(); }} style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid var(--color-border)', backgroundColor: matchMode === mode ? 'var(--color-accent-light)' : 'transparent', color: matchMode === mode ? 'var(--color-accent)' : 'var(--color-text)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: matchMode === mode ? 600 : 400, textTransform: 'capitalize' }}>
                    {mode}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--color-border)' }}>
                <input type="text" placeholder="Search tags..." value={tagSearch} onChange={e => setTagSearch(e.target.value)} aria-label="Search tags to filter" style={{ width: '100%', padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 4, fontSize: '0.75rem', backgroundColor: 'var(--color-input-bg)', color: 'var(--color-text)', boxSizing: 'border-box' }} />
              </div>

              {/* Tag list */}
              <div style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
                {filteredTagList.length === 0 && (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '12px 10px' }}>
                    {allTags.length === 0 ? 'No tags yet' : 'No matching tags'}
                  </p>
                )}
                {filteredTagList.map(tag => {
                  const isActive = activeTagFilters.includes(tag);
                  const count = tagCounts.get(tag) || 0;
                  return (
                    <div key={tag} role="option" aria-selected={isActive} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', cursor: 'pointer', backgroundColor: isActive ? 'var(--color-accent-light)' : 'transparent', borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent' }} onClick={() => setTagFilter(tag)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTagFilter(tag); } }} tabIndex={0}>
                      <TagBadge tag={tag} size="small" />
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Style Tab */}
          {activeTab === 'style' && (
            <div style={{ padding: '8px 10px' }}>
              {/* Clear style filters */}
              {hasStyleFilters && (
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={clearStyleFilters} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Clear style filters</button>
                </div>
              )}

              {/* Shapes */}
              {uniqueShapes.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Shape</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {uniqueShapes.map(shape => {
                      const active = styleFilterShapes.includes(shape);
                      return (
                        <button key={shape} aria-pressed={active} onClick={() => {
                          const next = active ? styleFilterShapes.filter(s => s !== shape) : [...styleFilterShapes, shape];
                          setStyleFilterShapes(next);
                        }} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid var(--color-border)', backgroundColor: active ? 'var(--color-accent-light)' : 'transparent', color: active ? 'var(--color-accent)' : 'var(--color-text)', cursor: 'pointer', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                          {shape}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Colors */}
              {uniqueColors.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Color</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {uniqueColors.map(color => {
                      const active = styleFilterColors.includes(color);
                      return (
                        <button key={color} aria-pressed={active} onClick={() => {
                          const next = active ? styleFilterColors.filter(c => c !== color) : [...styleFilterColors, color];
                          setStyleFilterColors(next);
                        }} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid var(--color-border)', backgroundColor: active ? 'var(--color-accent-light)' : 'transparent', color: active ? 'var(--color-accent)' : 'var(--color-text)', cursor: 'pointer', fontSize: '0.75rem' }}>
                          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, backgroundColor: color, marginRight: 4, border: '1px solid rgba(0,0,0,0.2)' }} />
                          {color.length > 12 ? color.slice(0, 12) + '…' : color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Icons */}
              {uniqueIcons.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Icon</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {uniqueIcons.map(icon => {
                      const active = styleFilterIcons.includes(icon);
                      return (
                        <button key={icon} aria-pressed={active} onClick={() => {
                          const next = active ? styleFilterIcons.filter(i => i !== icon) : [...styleFilterIcons, icon];
                          setStyleFilterIcons(next);
                        }} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid var(--color-border)', backgroundColor: active ? 'var(--color-accent-light)' : 'transparent', color: active ? 'var(--color-accent)' : 'var(--color-text)', cursor: 'pointer', fontSize: '0.75rem' }}>
                          {icon}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {uniqueShapes.length === 0 && uniqueColors.length === 0 && uniqueIcons.length === 0 && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '20px 10px' }}>No styled nodes yet.<br />Style some nodes to filter by style.</p>
              )}
            </div>
          )}

          {/* Date Tab */}
          {activeTab === 'date' && (
            <div style={{ padding: '8px 10px' }}>
              {/* Clear date filter */}
              {hasDateFilters && (
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setStyleFilterDate(undefined, undefined, undefined)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Clear date filter</button>
                </div>
              )}

              {/* Date mode */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Date type</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['created', 'updated'] as const).map(mode => (
                    <button key={mode} aria-pressed={styleFilterDateMode === mode} onClick={() => setStyleFilterDate(mode, styleFilterDateFrom, styleFilterDateTo)} style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid var(--color-border)', backgroundColor: styleFilterDateMode === mode ? 'var(--color-accent-light)' : 'transparent', color: styleFilterDateMode === mode ? 'var(--color-accent)' : 'var(--color-text)', cursor: 'pointer', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                      {mode === 'created' ? 'Created' : 'Updated'}
                    </button>
                  ))}
                </div>
              </div>

              {/* From date */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>From</div>
                <input type="date" aria-label="From date" value={styleFilterDateFrom ? new Date(styleFilterDateFrom).toISOString().split('T')[0] : ''} onChange={e => setStyleFilterDate(styleFilterDateMode || 'created', e.target.value ? new Date(e.target.value).getTime() : undefined, styleFilterDateTo)} style={{ width: '100%', padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 4, fontSize: '0.75rem', backgroundColor: 'var(--color-input-bg)', color: 'var(--color-text)', boxSizing: 'border-box' }} />
              </div>

              {/* To date */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>To</div>
                <input type="date" aria-label="To date" value={styleFilterDateTo ? new Date(styleFilterDateTo).getTime() : ''} onChange={e => setStyleFilterDate(styleFilterDateMode || 'created', styleFilterDateFrom, e.target.value ? new Date(e.target.value).getTime() : undefined)} style={{ width: '100%', padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 4, fontSize: '0.75rem', backgroundColor: 'var(--color-input-bg)', color: 'var(--color-text)', boxSizing: 'border-box' }} />
              </div>

              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', marginTop: 4 }}>Filter nodes by creation or last-modified date.</p>
            </div>
          )}

          {/* Footer with Clear All */}
          {isFilterActive && (
            <div style={{ padding: '6px 10px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { clearTagFilters(); clearStyleFilters(); setStyleFilterDate(undefined, undefined, undefined); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger, #dc3545)', fontSize: '0.75rem', fontWeight: 600 }}>Clear All Filters</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
