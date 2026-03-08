import type { Node } from '../store/useMindMapStore';

type ImportEnvelope = {
  version?: number;
  nodes?: Record<string, Node>;
};

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
    node.children.every(c => typeof c === 'string')
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
