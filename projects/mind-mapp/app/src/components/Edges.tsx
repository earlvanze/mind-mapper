import { Node } from '../store/useMindMapStore';

export default function Edges({ nodes }: { nodes: Record<string, Node> }) {
  const lines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
  Object.values(nodes).forEach((n) => {
    n.children.forEach((cid) => {
      const child = nodes[cid];
      if (!child) return;
      lines.push({
        x1: n.x + 40,
        y1: n.y + 16,
        x2: child.x,
        y2: child.y + 16,
        key: `${n.id}-${child.id}`
      });
    });
  });

  return (
    <svg className="edges" width="100%" height="100%">
      {lines.map(l => (
        <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#9aa4b2" strokeWidth="2" />
      ))}
    </svg>
  );
}
