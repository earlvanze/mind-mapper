import React from 'react';

interface TagBadgeProps {
  tag: string;
  color?: string;
  onRemove?: () => void;
  size?: 'small' | 'medium';
}

export function TagBadge({ tag, color = '#6366f1', onRemove, size = 'small' }: TagBadgeProps) {
  const fontSize = size === 'small' ? '0.7rem' : '0.8rem';
  const padding = size === 'small' ? '2px 6px' : '3px 8px';

  return (
    <span
      className="tag-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: color,
        color: '#fff',
        fontSize,
        padding,
        borderRadius: '3px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        marginRight: '4px',
        marginTop: '2px',
      }}
    >
      {tag}
      {onRemove && (
        <button
          className="tag-remove"
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: 0,
            fontSize: '0.9em',
            lineHeight: 1,
            opacity: 0.7,
          }}
          aria-label={`Remove tag ${tag}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
