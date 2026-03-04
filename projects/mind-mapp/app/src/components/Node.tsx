import { useRef } from 'react';
import { Node as NodeType, useMindMapStore } from '../store/useMindMapStore';

type Props = { node: NodeType };

export default function Node({ node }: Props) {
  const { focusId, setFocus, setText, moveNode } = useMindMapStore();
  const ref = useRef<HTMLDivElement>(null);

  const onDragStart = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const { x, y } = node;

    const onMove = (ev: MouseEvent) => {
      moveNode(node.id, x + (ev.clientX - startX), y + (ev.clientY - startY));
    };
    const onUp = () => {
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
      style={{ left: node.x, top: node.y }}
      onMouseDown={(e) => {
        if (e.shiftKey) return;
        onDragStart(e);
      }}
      onClick={() => setFocus(node.id)}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      onBlur={(e) => setText(node.id, e.currentTarget.textContent || '')}
    >
      {node.text}
    </div>
  );
}
