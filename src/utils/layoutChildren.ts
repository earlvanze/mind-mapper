import { useMindMapStore } from '../store/useMindMapStore';

export function layoutChildren(parentId: string) {
  const { nodes, moveNode } = useMindMapStore.getState();
  const parent = nodes[parentId];
  if (!parent) return;
  const children = parent.children.map(id => nodes[id]).filter(Boolean);
  if (!children.length) return;

  const startY = parent.y - (children.length - 1) * 40;
  children.forEach((child, i) => {
    moveNode(child.id, parent.x + 180, startY + i * 80);
  });
}
