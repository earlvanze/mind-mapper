import { useEffect, useRef, memo, useCallback } from 'react';
import { Node, useMindMapStore } from '../store/useMindMapStore';

type Props = {
  nodes: Record<string, Node>;
  viewport?: { x: number; y: number; scale: number };
  selectedEdgeId?: string;
  hoveredEdgeId?: string;
  connectMode?: boolean;
  pendingConnection?: { fromId: string; toId: string | null } | null;
  onEdgeClick?: (fromId: string, toId: string) => void;
  onEdgeHover?: (fromId: string | null, toId: string | null) => void;
};

/**
 * Canvas-based edge renderer with hit detection for:
 * - Edge click/hover (select + delete)
 * - Connect mode (drag from node to node)
 * - Edge drag-reconnection (drag edge arrow to reconnect to another node)
 */
function CanvasEdges({ nodes, viewport = { x: 0, y: 0, scale: 1 }, selectedEdgeId, hoveredEdgeId, connectMode = false, pendingConnection = null, onEdgeClick, onEdgeHover }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const nodesRef = useRef(nodes);
  const selectedEdgeIdRef = useRef(selectedEdgeId);
  const hoveredEdgeIdRef = useRef(hoveredEdgeId);
  const connectModeRef = useRef(connectMode);
  const pendingConnectionRef = useRef(pendingConnection);
  const pendingMouseRef = useRef<{ x: number; y: number } | null>(null);

  // Edge drag-reconnection state
  const isDraggingEdgeRef = useRef(false);
  const dragEdgeRef = useRef<{ fromId: string; toId: string } | null>(null);
  const dragMouseRef = useRef<{ x: number; y: number } | null>(null);

  // Keep refs in sync
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { selectedEdgeIdRef.current = selectedEdgeId; }, [selectedEdgeId]);
  useEffect(() => { hoveredEdgeIdRef.current = hoveredEdgeId; }, [hoveredEdgeId]);
  useEffect(() => { connectModeRef.current = connectMode; }, [connectMode]);
  useEffect(() => { pendingConnectionRef.current = pendingConnection; }, [pendingConnection]);

  // Hit test: find edge near point (in world coordinates)
  const hitTest = useCallback((worldX: number, worldY: number) => {
    const nodesSnapshot = nodesRef.current;
    const threshold = 12; // pixels in world space

    for (const node of Object.values(nodesSnapshot)) {
      for (const childId of node.children) {
        const child = nodesSnapshot[childId];
        if (!child) continue;

        const x1 = node.x + 80;
        const y1 = node.y + 16;
        const x2 = child.x;
        const y2 = child.y + 16;

        // Check if point is near bezier curve (simplified: distance to midpoint)
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const dist = Math.sqrt((worldX - midX) ** 2 + (worldY - midY) ** 2);

        if (dist < threshold) {
          return { fromId: node.id, toId: childId };
        }
      }
    }
    return null;
  }, []);

  // Hit test near edge arrow head (the target node's connection point)
  const hitTestEdgeHead = useCallback((worldX: number, worldY: number) => {
    const nodesSnapshot = nodesRef.current;
    const threshold = 18; // larger threshold for easier edge dragging

    for (const node of Object.values(nodesSnapshot)) {
      for (const childId of node.children) {
        const child = nodesSnapshot[childId];
        if (!child) continue;

        const x2 = child.x;
        const y2 = child.y + 16;

        const dist = Math.sqrt((worldX - x2) ** 2 + (worldY - y2) ** 2);

        if (dist < threshold) {
          return { fromId: node.id, toId: childId };
        }
      }
    }
    return null;
  }, []);

  // Hit test nodes in world coordinates
  const hitTestNodes = useCallback((worldX: number, worldY: number): string | null => {
    const nodesSnapshot = nodesRef.current;
    const padding = 8;

    for (const node of Object.values(nodesSnapshot)) {
      const nodeWidth = Math.max(60, 100);
      const nodeHeight = 32;
      if (
        worldX >= node.x - padding &&
        worldX <= node.x + nodeWidth + padding &&
        worldY >= node.y - padding &&
        worldY <= node.y + nodeHeight + padding
      ) {
        return node.id;
      }
    }
    return null;
  }, []);

  // Get viewport from window event
  const getViewport = useCallback((): { x: number; y: number; scale: number } => {
    const vp = (window as any).__mindmappPanZoom?.getView?.();
    return vp ?? viewport;
  }, [viewport]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const vp = getViewport();
    const worldX = (screenX - vp.x) / vp.scale;
    const worldY = (screenY - vp.y) / vp.scale;

    // In connect mode: only track mouse for pending connection line
    if (connectModeRef.current && pendingConnectionRef.current) {
      pendingMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Check for edge drag-reconnection (not in connect mode)
    if (!connectModeRef.current) {
      const edgeHit = hitTestEdgeHead(worldX, worldY);
      if (edgeHit) {
        isDraggingEdgeRef.current = true;
        dragEdgeRef.current = edgeHit;
        dragMouseRef.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
        return;
      }
    }

    // Edge click selection
    const hit = hitTest(worldX, worldY);
    if (hit && onEdgeClick) {
      onEdgeClick(hit.fromId, hit.toId);
    }

    // Track mouse for pending connection
    pendingMouseRef.current = { x: e.clientX, y: e.clientY };
  }, [getViewport, hitTest, hitTestEdgeHead, onEdgeClick]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const vp = getViewport();
    const worldX = (screenX - vp.x) / vp.scale;
    const worldY = (screenY - vp.y) / vp.scale;

    // Track mouse for edge drag-reconnection
    if (isDraggingEdgeRef.current) {
      dragMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Track mouse for pending connection line
    if (connectModeRef.current && pendingConnectionRef.current) {
      pendingMouseRef.current = { x: e.clientX, y: e.clientY };
    }

    // Edge hover detection (only when not in connect mode and not dragging)
    if (!connectModeRef.current && !isDraggingEdgeRef.current) {
      const hit = hitTest(worldX, worldY);
      if (onEdgeHover) {
        onEdgeHover(hit ? hit.fromId : null, hit ? hit.toId : null);
      }
    }
  }, [getViewport, hitTest, onEdgeHover]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const vp = getViewport();
    const worldX = (screenX - vp.x) / vp.scale;
    const worldY = (screenY - vp.y) / vp.scale;

    // Complete edge drag-reconnection
    if (isDraggingEdgeRef.current && dragEdgeRef.current) {
      const targetId = hitTestNodes(worldX, worldY);

      if (targetId && targetId !== dragEdgeRef.current.fromId) {
        // Reconnect edge to new target
        const store = useMindMapStore.getState();
        store.reconnectEdge(dragEdgeRef.current.fromId, dragEdgeRef.current.toId, targetId);
      }

      isDraggingEdgeRef.current = false;
      dragEdgeRef.current = null;
      dragMouseRef.current = null;
      return;
    }

    // Complete connect mode
    if (connectModeRef.current && pendingConnectionRef.current) {
      const targetId = hitTestNodes(worldX, worldY);

      if (targetId && targetId !== pendingConnectionRef.current.fromId) {
        const store = useMindMapStore.getState();
        if (store.connectMode) {
          store.completeConnection(targetId);
        }
      } else {
        const store = useMindMapStore.getState();
        if (store.connectMode) {
          store.cancelConnection();
        }
      }

      pendingMouseRef.current = null;
      return;
    }
  }, [getViewport, hitTestNodes]);

  const handlePointerLeave = useCallback(() => {
    if (onEdgeHover) onEdgeHover(null, null);
  }, [onEdgeHover]);

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

      drawEdges(ctx, nodes, selectedEdgeId, hoveredEdgeId);

      // Draw edge drag-reconnection preview
      if (isDraggingEdgeRef.current && dragEdgeRef.current && dragMouseRef.current) {
        const fromNode = nodes[dragEdgeRef.current.fromId];
        const oldToNode = nodes[dragEdgeRef.current.toId];
        if (fromNode) {
          drawEdgeDragConnection(ctx, fromNode, dragEdgeRef.current.toId, dragMouseRef.current.x, dragMouseRef.current.y, viewport);
        }
      }

      // Draw connect mode pending line
      if (connectMode && pendingConnection) {
        const fromNode = nodes[pendingConnection.fromId];
        if (fromNode && pendingMouseRef.current) {
          drawPendingConnection(ctx, fromNode, pendingMouseRef.current.x, pendingMouseRef.current.y, viewport);
        }
      }

      ctx.restore();
    };

    let rafId: number;
    const loop = () => {
      render();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [nodes, viewport, selectedEdgeId, hoveredEdgeId, connectMode, pendingConnection]);

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
        pointerEvents: 'auto',
        cursor: hoveredEdgeId ? 'pointer' : isDraggingEdgeRef.current ? 'crosshair' : connectMode ? 'crosshair' : 'default',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    />
  );
}

function drawEdgeDragConnection(
  ctx: CanvasRenderingContext2D,
  fromNode: Node,
  oldToId: string,
  mouseX: number,
  mouseY: number,
  viewport: { x: number; y: number; scale: number }
) {
  const nodeWidth = Math.max(60, 100);
  const x1 = fromNode.x + nodeWidth;
  const y1 = fromNode.y + 16;

  const worldX = (mouseX - viewport.x) / viewport.scale;
  const worldY = (mouseY - viewport.y) / viewport.scale;

  ctx.strokeStyle = '#f97316'; // orange for reconnection
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 4]);

  const cp1x = x1 + (worldX - x1) * 0.5;
  const cp1y = y1;
  const cp2x = x1 + (worldX - x1) * 0.5;
  const cp2y = worldY;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, worldX, worldY);
  ctx.stroke();

  // Target circle
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(249, 115, 22, 0.3)';
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(worldX, worldY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Arrow
  const angle = Math.atan2(worldY - cp2y, worldX - cp2x);
  const arrowSize = 10;
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.rotate(angle);
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-arrowSize, -arrowSize / 2);
  ctx.lineTo(-arrowSize, arrowSize / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.setLineDash([]);
}

function drawPendingConnection(
  ctx: CanvasRenderingContext2D,
  fromNode: Node,
  mouseX: number,
  mouseY: number,
  viewport: { x: number; y: number; scale: number }
) {
  const nodeWidth = Math.max(60, 100);
  const x1 = fromNode.x + nodeWidth;
  const y1 = fromNode.y + 16;

  const worldX = (mouseX - viewport.x) / viewport.scale;
  const worldY = (mouseY - viewport.y) / viewport.scale;

  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 4]);
  ctx.lineDashOffset = 0;

  const cp1x = x1 + (worldX - x1) * 0.5;
  const cp1y = y1;
  const cp2x = x1 + (worldX - x1) * 0.5;
  const cp2y = worldY;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, worldX, worldY);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(worldX, worldY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  const angle = Math.atan2(worldY - cp2y, worldX - cp2x);
  const arrowSize = 10;
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.rotate(angle);
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-arrowSize, -arrowSize / 2);
  ctx.lineTo(-arrowSize, arrowSize / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.setLineDash([]);
}

function drawEdges(ctx: CanvasRenderingContext2D, nodes: Record<string, Node>, selectedEdgeId?: string, hoveredEdgeId?: string) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  Object.values(nodes).forEach((node) => {
    node.children.forEach((childId) => {
      const child = nodes[childId];
      if (!child) return;

      const edgeKey = node.id + ':' + childId;
      const isSelected = selectedEdgeId === edgeKey;
      const isHovered = hoveredEdgeId === edgeKey;

      const x1 = node.x + 80;
      const y1 = node.y + 16;
      const x2 = child.x;
      const y2 = child.y + 16;

      const cp1x = x1 + (x2 - x1) * 0.5;
      const cp1y = y1;
      const cp2x = x1 + (x2 - x1) * 0.5;
      const cp2y = y2;

      ctx.lineWidth = isSelected ? 3.5 : isHovered ? 3 : 2;
      ctx.strokeStyle = isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#9aa4b2';

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
      ctx.stroke();

      const angle = Math.atan2(y2 - cp2y, x2 - cp2x);
      const arrowSize = isSelected || isHovered ? 10 : 8;

      ctx.save();
      ctx.translate(x2, y2);
      ctx.rotate(angle);

      ctx.fillStyle = isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#9aa4b2';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-arrowSize, -arrowSize / 2);
      ctx.lineTo(-arrowSize, arrowSize / 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });
  });
}

export default memo(CanvasEdges, (prev, next) => {
  const prevNodes = Object.values(prev.nodes);
  const nextNodes = Object.values(next.nodes);

  if (prevNodes.length !== nextNodes.length) return false;
  if (prev.selectedEdgeId !== next.selectedEdgeId) return false;
  if (prev.hoveredEdgeId !== next.hoveredEdgeId) return false;
  if (prev.connectMode !== next.connectMode) return false;
  if (JSON.stringify(prev.pendingConnection) !== JSON.stringify(next.pendingConnection)) return false;

  for (const node of nextNodes) {
    const prevNode = prev.nodes[node.id];
    if (!prevNode) return false;
    if (prevNode.x !== node.x || prevNode.y !== node.y) return false;
    if (prevNode.children.length !== node.children.length) return false;
    for (let i = 0; i < node.children.length; i++) {
      if (prevNode.children[i] !== node.children[i]) return false;
    }
  }

  return true;
});
