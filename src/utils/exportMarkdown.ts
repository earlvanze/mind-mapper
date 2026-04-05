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
  const t = text.trim();
  return t.length ? t.replace(/\n+/g, ' ') : 'Untitled';
}

function renderNode(
  id: string,
  level: number,
  nodes: Record<string, Node>,
  visiting: Set<string>,
  visited: Set<string>,
  lines: string[]
) {
  const node = nodes[id];
  if (!node) return;

  const indent = '  '.repeat(level);
  if (visiting.has(id)) {
    lines.push(`${indent}- ${cleanText(node.text)} _(cycle detected)_`);
    return;
  }

  lines.push(`${indent}- ${cleanText(node.text)}`);
  visiting.add(id);
  visited.add(id);

  const children = sortIds(node.children.filter(childId => !!nodes[childId]), nodes);
  for (const childId of children) {
    renderNode(childId, level + 1, nodes, visiting, visited, lines);
  }

  visiting.delete(id);
}

export function toMarkdown(nodes: Record<string, Node>) {
  const ids = Object.keys(nodes);
  if (!ids.length) return '# Mind Mapp\n\n_(empty map)_\n';

  const lines: string[] = ['# Mind Mapp', '', '## Map'];
  const visited = new Set<string>();

  if (nodes[ROOT_ID]) {
    renderNode(ROOT_ID, 0, nodes, new Set(), visited, lines);
  } else {
    const rootCandidates = sortIds(
      ids.filter(id => nodes[id].parentId === null),
      nodes,
    );
    for (const id of rootCandidates) {
      renderNode(id, 0, nodes, new Set(), visited, lines);
    }
  }

  const unvisited = sortIds(ids.filter(id => !visited.has(id)), nodes);
  if (unvisited.length) {
    lines.push('', '## Unlinked Nodes');
    for (const id of unvisited) {
      renderNode(id, 0, nodes, new Set(), visited, lines);
    }
  }

  return lines.join('\n') + '\n';
}

export function exportMarkdownData(nodes: Record<string, Node>) {
  const markdown = toMarkdown(nodes);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mindmapp.md';
  a.click();
  URL.revokeObjectURL(url);
}
