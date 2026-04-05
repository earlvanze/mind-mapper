import { useEffect, useRef, useCallback } from 'react';
import type { Node } from '../store/useMindMapStore';
import { getPresentationProgress, getNodePreviews } from '../utils/presentationMode';

interface PresentationOverlayProps {
  nodes: Record<string, Node>;
  currentNode: Node;
  currentIndex: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
}

export default function PresentationOverlay({
  nodes,
  currentNode,
  currentIndex,
  total,
  onNext,
  onPrev,
  onExit,
}: PresentationOverlayProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const progress = getPresentationProgress(currentIndex, total);
  const previews = getNodePreviews(nodes, currentNode.id);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          onNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrev();
          break;
        case 'Escape':
        case 'p':
        case 'P':
          e.preventDefault();
          onExit();
          break;
      }
    },
    [onNext, onPrev, onExit],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    nodeRef.current?.focus();
  }, []);

  return (
    <div className="presentation-overlay" onClick={onExit}>
      <div
        ref={nodeRef}
        className="presentation-content"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Presentation mode"
      >
        {/* Progress bar */}
        <div className="presentation-progress-bar">
          <div
            className="presentation-progress-fill"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        {/* Header */}
        <div className="presentation-header">
          <span className="presentation-counter">
            {progress.current} / {progress.total}
          </span>
          <button
            type="button"
            className="presentation-exit-btn"
            onClick={onExit}
            aria-label="Exit presentation mode (Esc)"
          >
            ×
          </button>
        </div>

        {/* Main node */}
        <div className="presentation-node-container">
          <div className="presentation-node" data-shape={currentNode.style?.shape ?? 'rectangle'}>
            <span className="presentation-node-icon">{currentNode.style?.icon}</span>
            <span className="presentation-node-text">{currentNode.text || 'Untitled'}</span>
          </div>
        </div>

        {/* Child previews */}
        {previews.length > 0 && (
          <div className="presentation-children">
            <div className="presentation-children-label">Children:</div>
            <div className="presentation-children-grid">
              {previews.map((child) => (
                <div
                  key={child.id}
                  className="presentation-child-preview"
                  data-shape={child.style?.shape ?? 'rectangle'}
                >
                  <span className="presentation-child-icon">{child.style?.icon}</span>
                  <span className="presentation-child-text">{child.text || 'Untitled'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation hints */}
        <div className="presentation-nav-hints">
          <span className="presentation-nav-hint">
            <kbd>←</kbd> Prev
          </span>
          <span className="presentation-nav-hint">
            <kbd>→</kbd> or <kbd>Space</kbd> Next
          </span>
          <span className="presentation-nav-hint">
            <kbd>Esc</kbd> Exit
          </span>
        </div>
      </div>

      <style>{`
        .presentation-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: presentationFadeIn 0.2s ease-out;
        }

        @keyframes presentationFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .presentation-content {
          width: 100%;
          max-width: 900px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          outline: none;
        }

        .presentation-progress-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
        }

        .presentation-progress-fill {
          height: 100%;
          background: #4f9dde;
          transition: width 0.3s ease;
        }

        .presentation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 600px;
        }

        .presentation-counter {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.875rem;
          font-family: system-ui, sans-serif;
        }

        .presentation-exit-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          font-size: 1.5rem;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .presentation-exit-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .presentation-node-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 200px;
        }

        .presentation-node {
          background: var(--node-bg, #ffffff);
          color: var(--node-text, #1a1a1a);
          padding: 2rem 3rem;
          border-radius: 8px;
          font-size: 1.75rem;
          font-family: system-ui, sans-serif;
          max-width: 600px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          animation: presentationNodeIn 0.3s ease-out;
        }

        @keyframes presentationNodeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .presentation-node-icon {
          font-size: 1.5rem;
        }

        .presentation-children {
          width: 100%;
          max-width: 700px;
        }

        .presentation-children-label {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.75rem;
          font-family: system-ui, sans-serif;
        }

        .presentation-children-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
        }

        .presentation-child-preview {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.875rem;
          font-family: system-ui, sans-serif;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          max-width: 180px;
        }

        .presentation-child-icon {
          font-size: 0.875rem;
        }

        .presentation-child-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .presentation-nav-hints {
          display: flex;
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .presentation-nav-hint {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.75rem;
          font-family: system-ui, sans-serif;
        }

        .presentation-nav-hint kbd {
          background: rgba(255, 255, 255, 0.15);
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-family: monospace;
        }

        /* Dark theme adjustments */
        .dark .presentation-node {
          background: #2a2a2a;
          color: #ffffff;
        }

        /* Responsive */
        @media (max-width: 600px) {
          .presentation-node {
            padding: 1.5rem 2rem;
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
