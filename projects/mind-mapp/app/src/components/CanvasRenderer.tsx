import { useEffect, useRef, memo, useCallback } from 'react';
import { Node, useMindMapStore } from '../store/useMindMapStore';
import { resolveStyle, resolvePreset } from '../utils/nodeStyles';
import { loadTheme } from '../utils/theme';

type Props = {
  nodes: Record<string, Node>;
  focusId: string;
  selectedIds: string[];
  editingId?: string;
  viewport?: { x: number; y: number; scale: number };
  onNodeClick: (id: string, metaKey: boolean, ctrlKey: boolean) => void;
  onNodeDoubleClick: (id: string) => void;
  onDragStart: (id: string, x: number, y: number) => void;
};

function CanvasRenderer({
  nodes,
  focusId,
  selectedIds,
  editingId,
  viewport = { x: 0, y: 0, scale: 1 },
  onNodeClick,
  onNodeDoubleClick,
  onDragStart,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const hitMapRef = useRef<Map<string, { x: number; y: number; width: number; height: number }>>(new Map());

  const theme = loadTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, rect.width, rect.height);

      ctx.save();
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.scale, viewport.scale);

      drawEdges(ctx, nodes);
      drawNodes(ctx, nodes, focusId, selectedIds, editingId, hitMapRef.current, theme);

      ctx.restore();
    };

    render();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [nodes, viewport, focusId, selectedIds, editingId, theme]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - viewport.x) / viewport.scale;
    const y = (e.clientY - rect.top - viewport.y) / viewport.scale;

    for (const [id, bounds] of hitMapRef.current.entries()) {
      if (x >= bounds.x && x <= bounds.x + bounds.width &&
          y >= bounds.y && y <= bounds.y + bounds.height) {
        onNodeClick(id, e.metaKey, e.ctrlKey);
        return;
      }
    }
  }, [viewport, onNodeClick]);

  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - viewport.x) / viewport.scale;
    const y = (e.clientY - rect.top - viewport.y) / viewport.scale;

    for (const [id, bounds] of hitMapRef.current.entries()) {
      if (x >= bounds.x && x <= bounds.x + bounds.width &&
          y >= bounds.y && y <= bounds.y + bounds.height) {
        onNodeDoubleClick(id);
        return;
      }
    }
  }, [viewport, onNodeDoubleClick]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.shiftKey || editingId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - viewport.x) / viewport.scale;
    const y = (e.clientY - rect.top - viewport.y) / viewport.scale;

    for (const [id, bounds] of hitMapRef.current.entries()) {
      if (x >= bounds.x && x <= bounds.x + bounds.width &&
          y >= bounds.y && y <= bounds.y + bounds.height) {
        if (!e.metaKey && !e.ctrlKey) {
          onDragStart(id, e.clientX, e.clientY);
        }
        return;
      }
    }
  }, [viewport, editingId, onDragStart]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="canvas-renderer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: 'default',
        }}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        onMouseDown={handleCanvasMouseDown}
      />
      {editingId && nodes[editingId] && (
        <div
          ref={overlayRef}
          className="node focused editing"
          contentEditable
          suppressContentEditableWarning
          style={{
            position: 'absolute',
            left: nodes[editingId].x * viewport.scale + viewport.x,
            top: nodes[editingId].y * viewport.scale + viewport.y,
            transform: `scale(${viewport.scale})`,
            transformOrigin: 'top left',
            minWidth: 60,
            zIndex: 1000,
          }}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.currentTarget as HTMLElement).blur();
            }
          }}
          onBlur={(e) => {
            const text = (e.currentTarget.textContent || '').trim();
            useMindMapStore.getState().setText(editingId, text || 'New');
          }}
        >
          {nodes[editingId].text}
        </div>
      )}
    </>
  );
}

function drawEdges(ctx: CanvasRenderingContext2D, nodes: Record<string, Node>) {
  const edgeColor = getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim() || '#9aa4b2';

  ctx.strokeStyle = edgeColor;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  Object.values(nodes).forEach((node) => {
    node.children.forEach((childId) => {
      const child = nodes[childId];
      if (!child) return;

      const nodeWidth = Math.max(60, measureTextWidth(ctx, node.text, 13) + 20);

      const x1 = node.x + nodeWidth;
      const y1 = node.y + 16;

      const x2 = child.x;
      const y2 = child.y + 16;

      const cp1x = x1 + (x2 - x1) * 0.5;
      const cp1y = y1;
      const cp2x = x1 + (x2 - x1) * 0.5;
      const cp2y = y2;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
      ctx.stroke();

      drawArrow(ctx, x2, y2, cp2x, cp2y, edgeColor);
    });
  });
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fromX: number,
  fromY: number,
  color: string
) {
  const angle = Math.atan2(y - fromY, x - fromX);
  const arrowSize = 8;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-arrowSize, -arrowSize / 2);
  ctx.lineTo(-arrowSize, arrowSize / 2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function getLines(text: string): string[] {
  return text.split(/<br\s*\/?>/).join('\n').split('\n').filter(l => l.length > 0);
}

function drawNodes(
  ctx: CanvasRenderingContext2D,
  nodes: Record<string, Node>,
  focusId: string,
  selectedIds: string[],
  editingId: string | undefined,
  hitMap: Map<string, { x: number; y: number; width: number; height: number }>,
  theme: 'light' | 'dark',
) {
  const focusColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#4f46e5';

  ctx.textBaseline = 'top';

  Object.values(nodes).forEach((node) => {
    if (editingId === node.id) return;

    const isFocused = focusId === node.id;
    const isSelected = selectedIds.includes(node.id);

    const resolved = resolveStyle(node.style, theme);
    const fontSize = resolved.fontSize;
    const lineHeight = fontSize * 1.4;
    const fontStyle = resolved.bold && resolved.italic
      ? 'italic bold '
      : resolved.italic
      ? 'italic '
      : resolved.bold
      ? 'bold '
      : '';
    ctx.font = `${fontStyle}${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

    const iconText = resolved.icon ? resolved.icon + ' ' : '';
    const plainText = iconText + stripHtml(node.text);
    const lines = getLines(plainText);
    if (lines.length === 0) lines.push('');

    const textWidth = Math.max(...lines.map(l => measureTextWidth(ctx, l, fontSize, resolved.bold, resolved.italic)));
    const padding = 20;
    // For nodes with images, width is constrained by image max-width (160) + padding
    const imageWidth = node.style?.imageUrl ? Math.min(160, 144) : 0;
    const width = Math.max(60, Math.max(textWidth + padding, imageWidth + padding));
    // Add image height (112 max) + gap if image present
    const imageHeight = node.style?.imageUrl ? 116 : 0;
    const height = Math.max(32, lines.length * lineHeight + 8 + imageHeight);

    hitMap.set(node.id, { x: node.x, y: node.y, width, height });

    const borderColor = isFocused || isSelected ? focusColor : resolved.border;
    const borderWidth = isFocused || isSelected ? 2 : resolved.borderWidth;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(node.x + 1, node.y + 2, width, height);

    // Background
    ctx.fillStyle = resolved.bg;
    drawShape(ctx, resolved.shape, node.x, node.y, width, height);
    ctx.fill();

    // Draw image if present
    if (node.style?.imageUrl) {
      const img = new Image();
      img.src = node.style.imageUrl;
      const imgMaxW = Math.min(160, width - padding);
      const imgMaxH = 112;
      // Draw image centered at top of node
      const imgX = node.x + (width - imgMaxW) / 2;
      const imgY = node.y + 4;
      try {
        ctx.drawImage(img, imgX, imgY, imgMaxW, imgMaxH);
      } catch (e) {
        // Image draw failure is non-fatal
      }
    }

    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    drawShape(ctx, resolved.shape, node.x, node.y, width, height);
    ctx.stroke();

    // Multi-line text rendering
    ctx.fillStyle = resolved.text;
    const textX = node.x + 10;
    // Account for image height in text positioning
    const textY = node.y + imageHeight + (height - imageHeight - lines.length * lineHeight) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, textX, textY + i * lineHeight);
    });
  });
}


function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  ctx.beginPath();
  if (shape === 'ellipse') {
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
  } else if (shape === 'diamond') {
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height / 2);
    ctx.lineTo(x + width / 2, y + height);
    ctx.lineTo(x, y + height / 2);
    ctx.closePath();
  } else if (shape === 'rounded') {
    const r = Math.min(8, width / 4, height / 4);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  } else {
    // rectangle
    ctx.rect(x, y, width, height);
  }
}

const textWidthCache = new Map<string, number>();
function measureTextWidth(ctx: CanvasRenderingContext2D, text: string, fontSize: number, bold = false, italic = false): number {
  const key = `${bold ? 'b' : ''}${italic ? 'i' : ''}${fontSize}:${text}`;
  const cached = textWidthCache.get(key);
  if (cached !== undefined) return cached;

  const width = ctx.measureText(text).width;
  textWidthCache.set(key, width);
  return width;
}

export default memo(CanvasRenderer);
