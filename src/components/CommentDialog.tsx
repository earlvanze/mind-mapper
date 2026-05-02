import React, { useEffect, useRef, useState } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';

interface CommentDialogProps {
  nodeId: string;
  onClose: () => void;
}

export function CommentDialog({ nodeId, onClose }: CommentDialogProps) {
  const node = useMindMapStore((state) => state.nodes[nodeId]);
  const setNodeComment = useMindMapStore((state) => state.setNodeComment);
  const [comment, setComment] = useState(node?.comment ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  const handleSave = () => {
    const trimmed = comment.trim();
    setNodeComment(nodeId, trimmed || undefined);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  const handleClear = () => {
    setNodeComment(nodeId, undefined);
    setComment('');
    onClose();
  };

  return (
    <div 
      className="dialog-overlay" 
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="comment-dialog-title"
    >
      <div className="dialog-content" style={{ minWidth: '400px', maxWidth: '600px' }}>
        <h2 id="comment-dialog-title" style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
          Node Comment
        </h2>
        
        <div style={{ marginBottom: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Node: <strong>{node?.text || 'Unknown'}</strong>
        </div>

        <textarea
          ref={textareaRef}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a note or annotation to this node..."
          rows={5}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-color)',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />

        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
          ⌘ Enter to save • Escape to cancel
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
          {node?.comment && (
            <button 
              onClick={handleClear}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'transparent',
                color: 'var(--text-color)',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'transparent',
              color: 'var(--text-color)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--accent-color, #3b82f6)',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
