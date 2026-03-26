import { useEffect, useRef, memo } from 'react';
import { Node as NodeType, useMindMapStore } from '../store/useMindMapStore';
import { resolveStyle } from '../utils/nodeStyles';
import { loadTheme } from '../utils/theme';

type Props = { 
  node: NodeType;
  isFocused: boolean;
  isSelected: boolean;
  isEditing: boolean;
};

function Node({ node, isFocused, isSelected, isEditing }: Props) {
  const {
    nodes,
    selectedIds,
    setFocus,
    toggleSelection,
    startEditing,
    setText,
    moveNode,
    moveNodes,
  } = useMindMapStore();
  const textRef = useRef<HTMLSpanElement>(null);

  // Sync editing state: enable contentEditable and select all text when editing
  useEffect(() => {
    if (!textRef.current) return;
    if (isEditing) {
      textRef.current.contentEditable = 'true';
      textRef.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(textRef.current as Node);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    } else {
      textRef.current.contentEditable = 'false';
    }
  }, [isEditing]);

  const applyFormat = (command: string) => {
    document.execCommand(command, false);
    textRef.current?.focus();
  };

  const onDragStart = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const dragIds = selectedIds.includes(node.id) && selectedIds.length ? selectedIds : [node.id];
    if (!selectedIds.includes(node.id)) setFocus(node.id);

    const startPositions = Object.fromEntries(
      dragIds.map(id => {
        const target = nodes[id];
        return target ? [id, { x: target.x, y: target.y }] : null;
      }).filter(Boolean) as [string, { x: number; y: number }][]
    );

    let lastUpdates = startPositions;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      lastUpdates = Object.fromEntries(
        Object.entries(startPositions).map(([id, pos]) => [id, { x: pos.x + dx, y: pos.y + dy }])
      );
      if (dragIds.length === 1) {
        moveNode(dragIds[0], lastUpdates[dragIds[0]].x, lastUpdates[dragIds[0]].y);
      } else {
        moveNodes(lastUpdates);
      }
    };
    const onUp = () => {
      if (dragIds.length === 1) {
        moveNode(dragIds[0], lastUpdates[dragIds[0]].x, lastUpdates[dragIds[0]].y, true);
      } else {
        moveNodes(lastUpdates, true);
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const theme = loadTheme();
  const resolved = resolveStyle(node.style, theme);
  const focusColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#4f46e5';

  const nodeStyle: React.CSSProperties = {
    position: 'absolute',
    left: node.x,
    top: node.y,
    minWidth: 60,
    backgroundColor: resolved.bg,
    color: resolved.text,
    borderColor: isFocused ? focusColor : (isSelected ? focusColor : resolved.border),
    borderWidth: isFocused || isSelected ? 2 : resolved.borderWidth,
    fontSize: resolved.fontSize,
    borderRadius: resolved.shape === 'ellipse' ? '50%'
               : resolved.shape === 'rounded' ? '8px'
               : resolved.shape === 'diamond' ? '0'
               : '4px',
    borderStyle: 'solid',
    transform: resolved.shape === 'diamond' ? 'rotate(45deg)' : undefined,
    transformOrigin: 'center center',
    display: 'inline-flex',
    flexDirection: node.style?.imageUrl ? 'column' : 'row',
    alignItems: 'center',
    gap: resolved.icon ? '4px' : undefined,
    cursor: isEditing ? 'text' : 'grab',
    userSelect: 'none',
    padding: node.style?.imageUrl ? '8px 8px 4px' : '4px 8px',
  };

  return (
    <>
      {isEditing && (
        <div
          style={{
            position: 'absolute',
            left: node.x,
            top: node.y - 34,
            zIndex: 1001,
            display: 'flex',
            gap: 2,
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            border: `1px solid ${resolved.border}`,
            borderRadius: 4,
            padding: '2px 4px',
            boxShadow: '0 0 4px rgba(0,0,0,0.15)',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            title="Bold (Cmd+B)"
            onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 13,
              padding: '2px 6px',
              borderRadius: 3,
              color: resolved.text,
            }}
          >B</button>
          <button
            title="Italic (Cmd+I)"
            onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontStyle: 'italic',
              fontSize: 13,
              padding: '2px 6px',
              borderRadius: 3,
              color: resolved.text,
            }}
          >I</button>
          <button
            title="Bullet list (Cmd+Shift+8)"
            onMouseDown={(e) => { e.preventDefault(); applyFormat('insertUnorderedList'); }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              padding: '2px 6px',
              borderRadius: 3,
              color: resolved.text,
              lineHeight: 1,
            }}
          >•</button>
          <button
            title="Numbered list (Cmd+Shift+7)"
            onMouseDown={(e) => { e.preventDefault(); applyFormat('insertOrderedList'); }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              padding: '2px 6px',
              borderRadius: 3,
              color: resolved.text,
              lineHeight: 1,
            }}
          >1.</button>
        </div>
      )}
      <div
        role="treeitem"
        aria-selected={isSelected}
        tabIndex={isFocused ? 0 : -1}
        className={`node ${isFocused ? 'focused' : ''} ${isSelected ? 'selected' : ''}`}
        style={nodeStyle}
        onMouseDown={(e) => {
          if (e.shiftKey || e.metaKey || e.ctrlKey) return;
          if (isEditing) return;
          onDragStart(e);
        }}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey) { toggleSelection(node.id); return; }
          setFocus(node.id);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (!isEditing) {
              e.preventDefault();
              startEditing(node.id);
            }
          }
        }}
        onDoubleClick={() => startEditing(node.id)}
      >
        {node.style?.imageUrl && (
          <div style={{
            maxWidth: 160,
            maxHeight: 120,
            overflow: 'hidden',
            borderRadius: 4,
            marginBottom: node.style?.imageUrl ? 4 : 0,
            lineHeight: 0,
          }}>
            <img
              src={node.style.imageUrl}
              alt=""
              style={{
                maxWidth: '100%',
                maxHeight: 112,
                objectFit: 'contain',
                display: 'block',
                borderRadius: 4,
              }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
        {resolved.icon ? <span style={{ fontSize: '1em', lineHeight: 1 }}>{resolved.icon}</span> : null}
        <span
          ref={textRef}
          style={{
            outline: 'none',
            minWidth: 8,
            display: 'inline-block',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            transform: resolved.shape === 'diamond' ? 'rotate(-45deg)' : undefined,
            pointerEvents: 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.currentTarget as HTMLElement).blur();
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
              e.preventDefault();
              applyFormat('bold');
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
              e.preventDefault();
              applyFormat('italic');
            }
            // Lists: Cmd+Shift+7 = ol, Cmd+Shift+8 = ul
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '8') {
              e.preventDefault();
              applyFormat('insertUnorderedList');
            }
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '7') {
              e.preventDefault();
              applyFormat('insertOrderedList');
            }
          }}
          onBlur={(e) => {
            const el = e.currentTarget;
            // Store HTML to preserve b/i formatting
            const html = el.innerHTML || '';
            const temp = document.createElement('div');
            temp.innerHTML = html;
            const text = (temp.textContent || '').trim();
            // Use innerHTML to preserve bold/italic markup
            setText(node.id, html.trim() || 'New');
            el.contentEditable = 'false';
          }}
          dangerouslySetInnerHTML={{ __html: node.text || '' }}
        />
      </div>
    </>
  );
}

export default memo(Node, (prev, next) => {
  return (
    prev.node.id === next.node.id &&
    prev.node.text === next.node.text &&
    prev.node.x === next.node.x &&
    prev.node.y === next.node.y &&
    prev.node.parentId === next.node.parentId &&
    prev.node.children.length === next.node.children.length &&
    prev.isFocused === next.isFocused &&
    prev.isSelected === next.isSelected &&
    prev.isEditing === next.isEditing &&
    prev.node.style?.backgroundColor === next.node.style?.backgroundColor &&
    prev.node.style?.textColor === next.node.style?.textColor &&
    prev.node.style?.borderColor === next.node.style?.borderColor &&
    prev.node.style?.borderWidth === next.node.style?.borderWidth &&
    prev.node.style?.shape === next.node.style?.shape &&
    prev.node.style?.icon === next.node.style?.icon &&
    prev.node.style?.fontSize === next.node.style?.fontSize &&
    prev.node.style?.imageUrl === next.node.style?.imageUrl
  );
});
