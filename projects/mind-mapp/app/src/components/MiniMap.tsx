import type { Node } from '../store/useMindMapStore';
import { getMapBounds, mapToMini } from '../utils/minimap';

type Props = {
  nodes: Record<string, Node>;
  focusId: string;
  selectedIds: string[];
  onFocus: (id: string) => void;
};

const MINI_W = 180;
const MINI_H = 120;

export default function MiniMap({ nodes, focusId, selectedIds, onFocus }: Props) {
  const bounds = getMapBounds(nodes);
  const entries = Object.values(nodes);

  return (
    <div className="minimap" aria-label="Mini map navigator">
      <div className="minimap-title">Mini‑map</div>
      <svg width={MINI_W} height={MINI_H} viewBox={`0 0 ${MINI_W} ${MINI_H}`}>
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
              onClick={() => onFocus(node.id)}
              style={{ cursor: 'pointer' }}
            />
          );
        })}
      </svg>
    </div>
  );
}
