import { useEffect, useMemo, useState } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { getAllTagsWithCounts, allNodesHaveTag } from '../utils/tags';
import { TagBadge } from './TagBadge';

interface TagPickerDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * TagPickerDialog - Shows all existing tags with counts
 * Allows toggling tags on selected nodes
 */
export function TagPickerDialog({ open, onClose }: TagPickerDialogProps) {
  const { nodes, selectedIds, addTag, removeTag } = useMindMapStore();
  const [filter, setFilter] = useState('');

  const selectedNodes = useMemo(
    () => selectedIds.map(id => nodes[id]).filter(Boolean),
    [nodes, selectedIds]
  );

  const tagCounts = useMemo(() => getAllTagsWithCounts(nodes), [nodes]);

  const filteredTags = useMemo(() => {
    const allTags = Array.from(tagCounts.entries());
    if (!filter.trim()) return allTags;
    
    const lower = filter.toLowerCase();
    return allTags.filter(([tag]) => tag.toLowerCase().includes(lower));
  }, [tagCounts, filter]);

  useEffect(() => {
    if (open) {
      setFilter('');
    }
  }, [open]);

  if (!open) return null;

  const hasSelection = selectedNodes.length > 0;

  const toggleTag = (tag: string) => {
    if (!hasSelection) return;

    // If all selected nodes have this tag, remove it; otherwise add it
    const allHaveTag = allNodesHaveTag(selectedNodes, tag);
    
    selectedNodes.forEach(node => {
      if (allHaveTag) {
        removeTag(node.id, tag);
      } else {
        addTag(node.id, tag);
      }
    });
  };

  const getTagState = (tag: string): 'all' | 'some' | 'none' => {
    if (!hasSelection) return 'none';
    
    const nodesWithTag = selectedNodes.filter(node => node.tags?.includes(tag));
    if (nodesWithTag.length === selectedNodes.length) return 'all';
    if (nodesWithTag.length > 0) return 'some';
    return 'none';
  };

  return (
    <div
      className="tag-picker-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        className="tag-picker-dialog"
        style={{
          backgroundColor: 'var(--color-bg)',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-labelledby="tag-picker-title"
        aria-modal="true"
      >
        <h2
          id="tag-picker-title"
          style={{
            margin: '0 0 16px 0',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--color-text)',
          }}
        >
          Tag Picker
        </h2>

        {!hasSelection && (
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.875rem',
              marginBottom: '16px',
            }}
          >
            Select one or more nodes to manage tags
          </p>
        )}

        {hasSelection && (
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.875rem',
              marginBottom: '16px',
            }}
          >
            {selectedNodes.length} node{selectedNodes.length !== 1 ? 's' : ''} selected
          </p>
        )}

        <input
          type="text"
          placeholder="Filter tags..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            fontSize: '0.875rem',
            marginBottom: '16px',
            backgroundColor: 'var(--color-input-bg)',
            color: 'var(--color-text)',
          }}
        />

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: '16px',
          }}
        >
          {filteredTags.length === 0 && (
            <p
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.875rem',
                textAlign: 'center',
                padding: '32px',
              }}
            >
              {tagCounts.size === 0 ? 'No tags yet' : 'No matching tags'}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {filteredTags.map(([tag, count]) => {
              const state = getTagState(tag);
              const isChecked = state === 'all';
              const isIndeterminate = state === 'some';
              
              return (
                <label
                  key={tag}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px',
                    borderRadius: '4px',
                    cursor: hasSelection ? 'pointer' : 'not-allowed',
                    backgroundColor: isChecked ? 'var(--color-accent-light)' : 'transparent',
                    opacity: hasSelection ? 1 : 0.6,
                  }}
                  onClick={() => hasSelection && toggleTag(tag)}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    ref={input => {
                      if (input) {
                        input.indeterminate = isIndeterminate;
                      }
                    }}
                    disabled={!hasSelection}
                    onChange={() => {}} // Controlled by label click
                    style={{
                      cursor: hasSelection ? 'pointer' : 'not-allowed',
                    }}
                  />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TagBadge tag={tag} size="medium" />
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      ({count} node{count !== 1 ? 's' : ''})
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
