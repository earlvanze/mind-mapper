import type { Node, NodeStyle } from '../store/useMindMapStore';
import { uid as generateId } from './id';

export type KanbanTransformTemplate = 'by-project' | 'by-status' | 'by-priority';

export interface KanbanCard {
  id?: string;
  title: string;
  status: string;
  labels: string[];
  description?: string;
  due?: string;
  url?: string;
  completed?: boolean;
  children?: KanbanCard[];
}

export interface KanbanColumn {
  id: string;
  name: string;
  cards: KanbanCard[];
}

export interface KanbanBoard {
  id?: string;
  name: string;
  columns: KanbanColumn[];
}

const ROOT_X = 400;
const ROOT_Y = 300;
const LEVEL_HEIGHT = 110;
const NODE_WIDTH = 160;
const MIN_SPACING = 50;

const PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low', 'no priority'];
const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgent',
  high: 'High Priority',
  medium: 'Medium Priority',
  low: 'Low Priority',
  'no priority': 'No Priority',
};

const STATUS_STYLE: NodeStyle = {
  backgroundColor: '#e0f2fe',
  textColor: '#0f172a',
  borderColor: '#0284c7',
  borderWidth: 2,
  shape: 'rounded',
  bold: true,
};

const PROJECT_STYLE: NodeStyle = {
  backgroundColor: '#f0fdf4',
  textColor: '#14532d',
  borderColor: '#16a34a',
  borderWidth: 2,
  shape: 'rounded',
  bold: true,
};

const PRIORITY_STYLES: Record<string, NodeStyle> = {
  urgent: { backgroundColor: '#fee2e2', textColor: '#7f1d1d', borderColor: '#dc2626', borderWidth: 2, shape: 'rounded', bold: true },
  high: { backgroundColor: '#ffedd5', textColor: '#7c2d12', borderColor: '#ea580c', borderWidth: 2, shape: 'rounded', bold: true },
  medium: { backgroundColor: '#fef9c3', textColor: '#713f12', borderColor: '#ca8a04', borderWidth: 2, shape: 'rounded', bold: true },
  low: { backgroundColor: '#dcfce7', textColor: '#14532d', borderColor: '#16a34a', borderWidth: 2, shape: 'rounded', bold: true },
  'no priority': { backgroundColor: '#f8fafc', textColor: '#334155', borderColor: '#94a3b8', borderWidth: 1, shape: 'rounded', bold: true },
};

function normalizeTag(label: string): string {
  return label.trim().replace(/^#/, '').replace(/\s+/g, '-').toLowerCase();
}

function cardTags(card: KanbanCard, extras: string[] = []): string[] {
  const tags = new Set<string>();
  tags.add(`status:${normalizeTag(card.status)}`);
  for (const label of card.labels) {
    const tag = normalizeTag(label);
    if (tag) tags.add(tag);
  }
  for (const extra of extras) {
    const tag = normalizeTag(extra);
    if (tag) tags.add(tag);
  }
  if (card.completed) tags.add('completed');
  return [...tags];
}

function cardComment(card: KanbanCard): string | undefined {
  const parts: string[] = [];
  if (card.description) parts.push(card.description);
  if (card.due) parts.push(`Due: ${card.due}`);
  if (card.url) parts.push(card.url);
  return parts.length ? parts.join('\n\n') : undefined;
}

function addNode(
  nodes: Record<string, Node>,
  text: string,
  parentId: string | null,
  fields: Partial<Node> = {},
): Node {
  const id = fields.id ?? generateId();
  const node: Node = {
    id,
    text,
    x: 0,
    y: 0,
    parentId,
    children: [],
    ...fields,
  };
  nodes[id] = node;
  if (parentId && nodes[parentId]) {
    nodes[parentId].children.push(id);
  }
  return node;
}

function addCardNode(
  nodes: Record<string, Node>,
  card: KanbanCard,
  parentId: string,
  extraTags: string[] = [],
): Node {
  const node = addNode(nodes, card.title, parentId, {
    tags: cardTags(card, extraTags),
    ...(cardComment(card) ? { comment: cardComment(card) } : {}),
    style: card.completed
      ? { backgroundColor: '#f1f5f9', textColor: '#64748b', borderColor: '#cbd5e1', shape: 'rounded' }
      : { backgroundColor: '#ffffff', textColor: '#111827', borderColor: '#cbd5e1', shape: 'rounded' },
  });

  for (const child of card.children ?? []) {
    addCardNode(nodes, child, node.id, extraTags);
  }

  return node;
}

function getProject(card: KanbanCard): string {
  for (const label of card.labels) {
    const explicit = label.match(/^#?project[:/-](.+)$/i);
    if (explicit) return explicit[1].trim();
  }
  return card.status || 'Unsorted';
}

function getPriority(card: KanbanCard): string {
  const labels = card.labels.map(normalizeTag);
  if (labels.some(label => label === 'urgent' || label === 'p0' || label === 'priority:urgent')) return 'urgent';
  if (labels.some(label => label === 'high' || label === 'p1' || label === 'priority:high')) return 'high';
  if (labels.some(label => label === 'medium' || label === 'p2' || label === 'priority:medium')) return 'medium';
  if (labels.some(label => label === 'low' || label === 'p3' || label === 'priority:low')) return 'low';
  return 'no priority';
}

function allCards(board: KanbanBoard): KanbanCard[] {
  return board.columns.flatMap(column => column.cards);
}

function addRoot(nodes: Record<string, Node>, board: KanbanBoard): Node {
  return addNode(nodes, board.name || 'Kanban Board', null, {
    id: 'n_root',
    style: {
      backgroundColor: '#111827',
      textColor: '#ffffff',
      borderColor: '#111827',
      borderWidth: 2,
      shape: 'rounded',
      bold: true,
    },
  });
}

function positionNodes(nodes: Record<string, Node>): Record<string, Node> {
  const roots = Object.values(nodes).filter(node => node.parentId === null);
  const root = nodes.n_root ?? roots[0];
  if (!root) return nodes;

  root.x = ROOT_X;
  root.y = ROOT_Y;

  const queue = [...root.children];
  const visited = new Set<string>([root.id]);

  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = nodes[id];
    const parent = node.parentId ? nodes[node.parentId] : undefined;
    if (!node || !parent) continue;

    const siblings = parent.children.filter(childId => nodes[childId]);
    const index = siblings.indexOf(id);
    const totalWidth = Math.max(1, siblings.length) * (NODE_WIDTH + MIN_SPACING);
    const startX = parent.x - totalWidth / 2 + NODE_WIDTH / 2;

    node.x = startX + index * (NODE_WIDTH + MIN_SPACING);
    node.y = ROOT_Y + getDepth(node, nodes) * LEVEL_HEIGHT;

    queue.push(...node.children);
  }

  return nodes;
}

function getDepth(node: Node, nodes: Record<string, Node>): number {
  let depth = 0;
  let current: Node | undefined = node;
  while (current?.parentId) {
    depth++;
    current = nodes[current.parentId];
  }
  return depth;
}

export function transformKanbanByStatus(board: KanbanBoard): Record<string, Node> {
  const nodes: Record<string, Node> = {};
  const root = addRoot(nodes, board);

  for (const column of board.columns) {
    const statusNode = addNode(nodes, column.name, root.id, {
      tags: [`status:${normalizeTag(column.name)}`],
      style: STATUS_STYLE,
    });
    for (const card of column.cards) {
      addCardNode(nodes, card, statusNode.id);
    }
  }

  return positionNodes(nodes);
}

export function transformKanbanByProject(board: KanbanBoard): Record<string, Node> {
  const nodes: Record<string, Node> = {};
  const root = addRoot(nodes, board);
  const groups = new Map<string, KanbanCard[]>();

  for (const card of allCards(board)) {
    const project = getProject(card);
    groups.set(project, [...(groups.get(project) ?? []), card]);
  }

  for (const [project, cards] of groups) {
    const projectNode = addNode(nodes, project, root.id, {
      tags: [`project:${normalizeTag(project)}`],
      style: PROJECT_STYLE,
    });
    for (const card of cards) {
      addCardNode(nodes, card, projectNode.id, [`project:${project}`]);
    }
  }

  return positionNodes(nodes);
}

export function transformKanbanByPriority(board: KanbanBoard): Record<string, Node> {
  const nodes: Record<string, Node> = {};
  const root = addRoot(nodes, board);
  const groups = new Map<string, KanbanCard[]>();

  for (const card of allCards(board)) {
    const priority = getPriority(card);
    groups.set(priority, [...(groups.get(priority) ?? []), card]);
  }

  for (const priority of PRIORITY_ORDER) {
    const cards = groups.get(priority) ?? [];
    if (!cards.length && priority !== 'no priority') continue;

    const priorityNode = addNode(nodes, PRIORITY_LABELS[priority], root.id, {
      tags: [`priority:${priority}`],
      style: PRIORITY_STYLES[priority],
    });
    for (const card of cards) {
      addCardNode(nodes, card, priorityNode.id, [`priority:${priority}`]);
    }
  }

  return positionNodes(nodes);
}

export function transformKanbanToMindMap(
  board: KanbanBoard,
  template: KanbanTransformTemplate = 'by-status',
): Record<string, Node> {
  if (template === 'by-project') return transformKanbanByProject(board);
  if (template === 'by-priority') return transformKanbanByPriority(board);
  return transformKanbanByStatus(board);
}

export function isPriorityLabel(label: string): boolean {
  return getPriority({ title: '', status: '', labels: [label] }) !== 'no priority';
}
