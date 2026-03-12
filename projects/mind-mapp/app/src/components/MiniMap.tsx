import { useEffect, useMemo, useRef, useState } from 'react';
import type { Node } from '../store/useMindMapStore';
import { getMapBounds, mapToMini, miniToWorld, worldRectToMini, type MiniRect } from '../utils/minimap';

type Props = {
  nodes: Record<string, Node>;
  focusId: string;
  selectedIds: string[];
  onFocus: (id: string) => void;
  onNavigate: (x: number, y: number) => void;
};

const MINI_W = 180;
const MINI_H = 120;

export default function MiniMap({ nodes, focusId, selectedIds, onFocus, onNavigate }: Props) {
  const bounds = useMemo(() => getMapBounds(nodes), [nodes]);
  const entries = Object.values(nodes);
  const [viewRect, setViewRect] = useState<MiniRect | null>(null);
  const [draggingView, setDraggingView] = useState(false);
  const miniRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const sync = () => {
      const panZoom = (window as any).__mindmappPanZoom;
      const canvas = document.querySelector('.canvas') as HTMLElement | null;
      if (!panZoom?.getView || !canvas) {
        setViewRect(null);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const view = panZoom.getView();
      const scale = Number(view?.scale) || 1;
      const originX = Number(view?.originX) || 0;
      const originY = Number(view?.originY) || 0;

      const world = {
        x: -originX / scale,
        y: -originY / scale,
        width: rect.width / scale,
        height: rect.height / scale,
      };

      setViewRect(worldRectToMini(world, bounds, MINI_W, MINI_H));
    };

    sync();
    window.addEventListener('mindmapp:viewchange', sync as EventListener);
    window.addEventListener('resize', sync);

    return () => {
      window.removeEventListener('mindmapp:viewchange', sync as EventListener);
      window.removeEventListener('resize', sync);
    };
  }, [bounds]);

  const navigateFromClient = (clientX: number, clientY: number) => {
    const svg = miniRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const world = miniToWorld(mx, my, bounds, MINI_W, MINI_H);
    onNavigate(world.x, world.y);
  };

  return (
    <div className="minimap" aria-label="Mini map navigator">
      <div className="minimap-title">Mini‑map (click/drag viewport)</div>
      <svg
        ref={miniRef}
        width={MINI_W}
        height={MINI_H}
        viewBox={`0 0 ${MINI_W} ${MINI_H}`}
        onClick={(e) => {
          navigateFromClient(e.clientX, e.clientY);
        }}
      >
        {entries.flatMap(parent =>
          parent.children
            .map(cid => {
              const child = nodes[cid];
              if (!child) return null;
              const p1 = mapToMini(parent.x + 20, parent.y + 16, bounds, MINI_W, MINI_H);
              const p2 = mapToMini(child.x + 20, child.y + 16, bounds, MINI_W, MINI_H);
              return (
                <line
                  key={`${parent.id}-${child.id}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#8391a8"
                  strokeWidth={1}
                  opacity={0.75}
                />
              );
            })
            .filter(Boolean),
        )}

        {viewRect ? (
          <rect
            className={`minimap-view ${draggingView ? 'dragging' : ''}`}
            x={viewRect.x}
            y={viewRect.y}
            width={viewRect.width}
            height={viewRect.height}
            rx={4}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.currentTarget as SVGRectElement).setPointerCapture(e.pointerId);
              setDraggingView(true);
              navigateFromClient(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (!draggingView) return;
              e.stopPropagation();
              navigateFromClient(e.clientX, e.clientY);
            }}
            onPointerUp={(e) => {
              if (!draggingView) return;
              e.stopPropagation();
              setDraggingView(false);
              (e.currentTarget as SVGRectElement).releasePointerCapture(e.pointerId);
            }}
            onPointerCancel={() => setDraggingView(false)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : null}

        {entries.map(node => {
          const p = mapToMini(node.x + 20, node.y + 16, bounds, MINI_W, MINI_H);
          const selected = selectedIds.includes(node.id);
          const focused = focusId === node.id;

          return (
            <circle
              key={node.id}
              cx={p.x}
              cy={p.y}
              r={focused ? 4.5 : selected ? 4 : 3}
              fill={focused ? '#4f46e5' : selected ? '#6366f1' : '#a7b3c8'}
              stroke={focused ? '#c7d2fe' : 'transparent'}
              strokeWidth={focused ? 1.5 : 0}
              onClick={(e) => {
                e.stopPropagation();
                onFocus(node.id);
              }}
              style={{ cursor: 'pointer' }}
            />
          );
        })}
      </svg>
    </div>
  );
}
