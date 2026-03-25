import { Node } from '../store/useMindMapStore';

const ROOT_ID = 'n_root';

function sortIds(ids: string[], nodes: Record<string, Node>) {
  return [...ids].sort((a, b) => {
    const na = nodes[a];
    const nb = nodes[b];
    if (!na && !nb) return a.localeCompare(b);
    if (!na) return 1;
    if (!nb) return -1;
    if (na.y !== nb.y) return na.y - nb.y;
    if (na.x !== nb.x) return na.x - nb.x;
    return na.text.localeCompare(nb.text);
  });
}

function cleanText(text: string) {
  return text.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function shapeToFreemind(shape?: string): string {
  switch (shape) {
    case 'ellipse': return 'ellipse';
    case 'rectangle': return 'rectangle';
    case 'rounded': return 'rounded_rectangle';
    case 'diamond': return 'diamond';
    default: return 'bullet';
  }
}

function colorToFreemind(color?: string): string | undefined {
  if (!color) return undefined;
  if (color.startsWith('#')) return color.slice(1);
  return undefined;
}

function nodeAttrs(node: Node): string {
  const text = cleanText(node.text);
  const bgColor = colorToFreemind(node.style?.backgroundColor);
  const borderColor = colorToFreemind(node.style?.borderColor);
  const shape = shapeToFreemind(node.style?.shape);
  const icon = node.style?.icon;

  let attrs = `TEXT="${text}"`;
  if (shape !== 'bullet') attrs += ` STYLE="${shape}"`;
  if (bgColor) attrs += ` BACKGROUND_COLOR="${bgColor}"`;
  if (borderColor) attrs += ` COLOR="${borderColor}"`;
  if (icon) attrs += ` ICON="${icon}"`;
  return attrs;
}

function renderNode(id: string, nodes: Record<string, Node>, visited: Set<string>): string {
  const node = nodes[id];
  if (!node) return '';

  const attrs = nodeAttrs(node);
  visited.add(id);

  const children = sortIds(node.children.filter(cid => !!nodes[cid] && !visited.has(cid)), nodes);
  if (children.length === 0) {
    return `      <node ${attrs} />`;
  }

  const childContent = children.map(cid => renderNode(cid, nodes, visited)).join('\n');
  return `      <node ${attrs}>\n${childContent}\n      </node>`;
}

export function toFreemind(nodes: Record<string, Node>): string {
  const ids = Object.keys(nodes);
  if (!ids.length) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<map version="0.9.0">\n</map>`;
  }

  const rootId = nodes[ROOT_ID] ? ROOT_ID : sortIds(ids.filter(id => nodes[id].parentId === null), nodes)[0];
  const visited = new Set<string>();

  let content = '';
  if (rootId) {
    const rootAttrs = nodeAttrs(nodes[rootId]);
    content += `  <node ${rootAttrs}>\n`;
    const children = sortIds(nodes[rootId].children.filter(cid => !!nodes[cid]), nodes);
    for (const cid of children) {
      content += renderNode(cid, nodes, visited) + '\n';
    }
    content += `  </node>\n`;
  }

  // Unlinked nodes
  const unvisited = ids.filter(id => !visited.has(id) && id !== rootId);
  for (const id of unvisited) {
    visited.add(id);
    const node = nodes[id];
    const attrs = nodeAttrs(node);
    const children = sortIds(node.children.filter(cid => !!nodes[cid]), nodes);
    if (children.length === 0) {
      content += `  <node ${attrs} />\n`;
    } else {
      content += `  <node ${attrs}>\n`;
      for (const cid of children) {
        content += renderNode(cid, nodes, visited) + '\n';
      }
      content += `  </node>\n`;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<map version="0.9.0">\n${content}</map>`;
}

export function exportFreemindData(nodes: Record<string, Node>) {
  const xml = toFreemind(nodes);
  const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mindmapp.mm';
  a.click();
  URL.revokeObjectURL(url);
}
