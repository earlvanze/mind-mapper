import { useEffect, useRef, memo } from 'react';
import { Node } from '../store/useMindMapStore';

type Props = {
  nodes: Record<string, Node>;
  viewport?: { x: number; y: number; scale: number };
};

/**
 * Canvas-based edge renderer (better performance than SVG for >100 nodes)
 * Renders only edges on canvas while keeping HTML nodes for text editing
 */
function CanvasEdges({ nodes, viewport = { x: 0, y: 0, scale: 1 } }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // Set canvas size
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      // Clear
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Apply viewport transform
      ctx.save();
      ctx.translate(viewport.x, viewport.y);
      ctx.scale(viewport.scale, viewport.scale);

      // Draw edges
      drawEdges(ctx, nodes);

      ctx.restore();
    };

    render();

    // Cancel any pending frame
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [nodes, viewport]);

  return (
    <canvas
      ref={canvasRef}
      className="edges-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}

// Draw all edges between parent and child nodes
function drawEdges(ctx: CanvasRenderingContext2D, nodes: Record<string, Node>) {
  ctx.strokeStyle = '#9aa4b2';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  Object.values(nodes).forEach((node) => {
    node.children.forEach((childId) => {
      const child = nodes[childId];
      if (!child) return;

      // Parent center-right (anchor point)
      const x1 = node.x + 80;  // Node width approx 80px
      const y1 = node.y + 16;   // Half node height

      // Child center-left (target point)
      const x2 = child.x;
      const y2 = child.y + 16;

      // Draw cubic bezier curve
      const cp1x = x1 + (x2 - x1) * 0.5;
      const cp1y = y1;
      const cp2x = x1 + (x2 - x1) * 0.5;
      const cp2y = y2;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
      ctx.stroke();

      // Draw arrow at child end
      drawArrow(ctx, x2, y2, cp2x, cp2y);
    });
  });
}

// Draw arrow marker at end of edge
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fromX: number,
  fromY: number
) {
  const angle = Math.atan2(y - fromY, x - fromX);
  const arrowSize = 8;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = '#9aa4b2';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-arrowSize, -arrowSize / 2);
  ctx.lineTo(-arrowSize, arrowSize / 2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Memoize to prevent re-render when viewport changes (handled internally)
export default memo(CanvasEdges, (prev, next) => {
  // Re-render only when nodes actually change
  const prevNodes = Object.values(prev.nodes);
  const nextNodes = Object.values(next.nodes);
  
  if (prevNodes.length !== nextNodes.length) return false;
  
  for (const node of nextNodes) {
    const prevNode = prev.nodes[node.id];
    if (!prevNode) return false;
    
    // Check position and children
    if (prevNode.x !== node.x || prevNode.y !== node.y) return false;
    if (prevNode.children.length !== node.children.length) return false;
    for (let i = 0; i < node.children.length; i++) {
      if (prevNode.children[i] !== node.children[i]) return false;
    }
  }
  
  return true; // No changes
});
