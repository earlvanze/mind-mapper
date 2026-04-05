import { memo } from 'react';
import { Node } from '../store/useMindMapStore';
import { edgePath } from '../utils/edgePath';

function Edges({ nodes }: { nodes: Record<string, Node> }) {
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

// Memoize to prevent edge recalculation when only focus/selection changes
// Re-render only when node positions or structure actually change
export default memo(Edges, (prev, next) => {
  const prevNodes = Object.values(prev.nodes);
  const nextNodes = Object.values(next.nodes);
  
  // Different number of nodes = structure changed
  if (prevNodes.length !== nextNodes.length) return false;
  
  // Check if any node moved or changed children
  for (const node of nextNodes) {
    const prevNode = prev.nodes[node.id];
    if (!prevNode) return false; // New node
    
    if (prevNode.x !== node.x || prevNode.y !== node.y) return false; // Position changed
    
    // Check if children array changed
    if (prevNode.children.length !== node.children.length) return false;
    for (let i = 0; i < node.children.length; i++) {
      if (prevNode.children[i] !== node.children[i]) return false;
    }
  }
  
  return true; // No relevant changes
});
