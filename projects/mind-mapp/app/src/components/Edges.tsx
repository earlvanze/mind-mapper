import { Node } from '../store/useMindMapStore';
import { edgePath } from '../utils/edgePath';

export default function Edges({ nodes }: { nodes: Record<string, Node> }) {
  const paths: { d: string; key: string }[] = [];
  Object.values(nodes).forEach((n) => {
    n.children.forEach((cid) => {
      const child = nodes[cid];
      if (!child) return;
      paths.push({
        d: edgePath(n.x + 40, n.y + 16, child.x, child.y + 16),
        key: `${n.id}-${child.id}`
      });
    });
  });

  return (
    <svg className="edges" width="100%" height="100%">
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#9aa4b2" />
        </marker>
      </defs>
      {paths.map(p => (
        <path key={p.key} d={p.d} fill="none" stroke="#9aa4b2" strokeWidth="2" markerEnd="url(#arrow)" />
      ))}
    </svg>
  );
}
