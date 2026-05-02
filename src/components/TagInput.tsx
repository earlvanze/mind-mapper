import React, { useState, useRef, useEffect } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';

interface TagInputProps {
  nodeId: string;
  onClose: () => void;
}

/**
 * TagInput - Autocomplete input for adding/editing tags
 * Features:
 * - Shows existing tags as suggestions
 * - Creates new tags on Enter
 * - Closes on Escape
 * - Tab/arrow navigation through suggestions
 */
export function TagInput({ nodeId, onClose }: TagInputProps) {
  const { nodes, addTag } = useMindMapStore();
  const [input, setInput] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get all existing tags across all nodes for autocomplete
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    Object.values(nodes).forEach(node => {
      node.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [nodes]);

  // Filter suggestions based on input
  const suggestions = React.useMemo(() => {
    if (!input.trim()) return allTags;
    const lower = input.toLowerCase();
    return allTags.filter(tag => tag.toLowerCase().includes(lower));
  }, [input, allTags]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions.length]);

  const handleSubmit = (tagValue?: string) => {
    const finalTag = (tagValue || input).trim();
    if (!finalTag) return;

    addTag(nodeId, finalTag);
    setInput('');
    setSelectedIndex(0);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && selectedIndex < suggestions.length) {
        handleSubmit(suggestions[selectedIndex]);
      } else {
        handleSubmit();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSubmit(suggestions[selectedIndex]);
      }
    }
  };

  return (
    <div
      className="tag-input-container"
      style={{
        position: 'absolute',
        backgroundColor: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: '4px',
        padding: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000,
        minWidth: '200px',
        maxWidth: '300px',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add tag..."
        style={{
          width: '100%',
          padding: '6px',
          border: '1px solid var(--color-border)',
          borderRadius: '3px',
          fontSize: '0.875rem',
          backgroundColor: 'var(--color-input-bg)',
          color: 'var(--color-text)',
        }}
        aria-label="Tag input"
        aria-autocomplete="list"
        aria-controls="tag-suggestions"
      />

      {suggestions.length > 0 && input && (
        <ul
          id="tag-suggestions"
          role="listbox"
          style={{
            margin: '8px 0 0 0',
            padding: 0,
            listStyle: 'none',
            maxHeight: '150px',
            overflowY: 'auto',
          }}
        >
          {suggestions.map((tag, idx) => (
            <li
              key={tag}
              role="option"
              aria-selected={idx === selectedIndex}
              onClick={() => handleSubmit(tag)}
              onMouseEnter={() => setSelectedIndex(idx)}
              style={{
                padding: '6px 8px',
                cursor: 'pointer',
                backgroundColor: idx === selectedIndex ? 'var(--color-accent)' : 'transparent',
                color: idx === selectedIndex ? '#fff' : 'var(--color-text)',
                borderRadius: '3px',
                fontSize: '0.875rem',
              }}
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div
        style={{
          marginTop: '8px',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
        }}
      >
        Press Enter to add • Tab to select • Esc to close
      </div>
    </div>
  );
}
