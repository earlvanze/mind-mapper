import type { Node } from '../store/useMindMapStore';

type ImportEnvelope = {
  version?: number;
  nodes?: Record<string, Node>;
};

const ROOT_ID = 'n_root';

function isNode(value: unknown): value is Node {
  if (!value || typeof value !== 'object') return false;
  const node = value as Node;
  return (
    typeof node.id === 'string' &&
    typeof node.text === 'string' &&
    typeof node.x === 'number' &&
    typeof node.y === 'number' &&
    (typeof node.parentId === 'string' || node.parentId === null) &&
    Array.isArray(node.children) &&
    node.children.every(c => typeof c === 'string') &&
    (node.style?.bold == null || typeof node.style.bold === 'boolean') &&
    (node.style?.italic == null || typeof node.style.italic === 'boolean') &&
    (node.style?.imageUrl == null || typeof node.style.imageUrl === 'string') &&
    (node.style?.linkUrl == null || typeof node.style.linkUrl === 'string')
  );
}

function validateNodes(nodes: Record<string, Node>): Record<string, Node> {
  if (!nodes || typeof nodes !== 'object') {
    throw new Error('Invalid import: nodes payload is missing.');
  }

  const entries = Object.entries(nodes);
  if (!entries.length) {
    throw new Error('Invalid import: nodes payload is empty.');
  }

  for (const [id, node] of entries) {
    if (!isNode(node)) {
      throw new Error(`Invalid import: malformed node "${id}".`);
    }

    if (node.id !== id) {
      throw new Error(`Invalid import: node id mismatch for "${id}".`);
    }

    if (node.parentId === id) {
      throw new Error(`Invalid import: node "${id}" cannot parent itself.`);
    }
  }

  const root = nodes[ROOT_ID];
  if (!root) {
    throw new Error(`Invalid import: missing root node "${ROOT_ID}".`);
  }

  if (root.parentId !== null) {
    throw new Error(`Invalid import: root node "${ROOT_ID}" must have parentId null.`);
  }

  const nullParents = entries.filter(([, node]) => node.parentId === null).map(([id]) => id);
  if (nullParents.length !== 1 || nullParents[0] !== ROOT_ID) {
    throw new Error('Invalid import: only root may have parentId null.');
  }

  for (const [id, node] of entries) {
    if (node.parentId && !nodes[node.parentId]) {
      throw new Error(`Invalid import: node "${id}" has missing parent "${node.parentId}".`);
    }

    const deduped = new Set(node.children);
    if (deduped.size !== node.children.length) {
      throw new Error(`Invalid import: node "${id}" contains duplicate children.`);
    }

    for (const childId of node.children) {
      const child = nodes[childId];
      if (!child) {
        throw new Error(`Invalid import: node "${id}" references missing child "${childId}".`);
      }
      if (child.parentId !== id) {
        throw new Error(`Invalid import: child "${childId}" parent mismatch (expected "${id}").`);
      }
    }
  }

  for (const [id, node] of entries) {
    if (!node.parentId) continue;
    const parent = nodes[node.parentId];
    if (!parent.children.includes(id)) {
      throw new Error(`Invalid import: parent "${node.parentId}" missing child link to "${id}".`);
    }
  }

  const visited = new Set<string>();
  const stack = new Set<string>();

  const visit = (id: string) => {
    if (stack.has(id)) {
      throw new Error(`Invalid import: cycle detected at "${id}".`);
    }
    if (visited.has(id)) return;

    stack.add(id);
    const node = nodes[id];
    for (const childId of node.children) visit(childId);
    stack.delete(id);
    visited.add(id);
  };

  visit(ROOT_ID);

  if (visited.size !== entries.length) {
    const unreachable = entries.map(([id]) => id).filter(id => !visited.has(id));
    const preview = unreachable.slice(0, 5).join(', ');
    throw new Error(
      `Invalid import: orphan/unreachable nodes detected (${preview}${unreachable.length > 5 ? ', ...' : ''}).`
    );
  }

  return nodes;
}

export function parseImportPayload(payload: unknown): Record<string, Node> {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid import: JSON root must be an object.');
  }

  const envelope = payload as ImportEnvelope;
  if (typeof envelope.version === 'number' && envelope.version !== 1) {
    throw new Error(`Unsupported import version: ${envelope.version}.`);
  }

  const candidateNodes = envelope.nodes ?? (payload as Record<string, Node>);
  return validateNodes(candidateNodes);
}
