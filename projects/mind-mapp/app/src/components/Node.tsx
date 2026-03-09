import { useEffect, useRef } from 'react';
import { Node as NodeType, useMindMapStore } from '../store/useMindMapStore';

type Props = { node: NodeType };

export default function Node({ node }: Props) {
  const { focusId, editingId, setFocus, startEditing, setText, moveNode } = useMindMapStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingId === node.id) {
      ref.current?.focus();
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(ref.current as Node);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [editingId, node.id]);

  const onDragStart = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const { x, y } = node;

    let lastX = x;
    let lastY = y;

    const onMove = (ev: MouseEvent) => {
      lastX = x + (ev.clientX - startX);
      lastY = y + (ev.clientY - startY);
      moveNode(node.id, lastX, lastY);
    };
    const onUp = () => {
      moveNode(node.id, lastX, lastY, true);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      ref={ref}
      className={`node ${focusId === node.id ? 'focused' : ''}`}
      style={{ left: node.x, top: node.y, minWidth: 60 }}
      onMouseDown={(e) => {
        if (e.shiftKey) return;
        if (editingId === node.id) return;
        onDragStart(e);
      }}
      onClick={() => setFocus(node.id)}
      onDoubleClick={() => startEditing(node.id)}
      contentEditable={editingId === node.id}
      suppressContentEditableWarning
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      onBlur={(e) => {
        const text = (e.currentTarget.textContent || '').trim();
        setText(node.id, text || 'New');
        (e.currentTarget as HTMLElement).contentEditable = 'false';
      }}
    >
      {node.text}
    </div>
  );
}
