/**
 * Export Mind Map to Trello-compatible JSON format.
 * 
 * Reverse transform: converts mind map nodes back into Trello board structure.
 */

import type { Node } from '../store/useMindMapStore';

export interface TrelloExportBoard {
  name: string;
  lists: TrelloExportList[];
  cards: TrelloExportCard[];
}

export interface TrelloExportList {
  id: string;
  name: string;
  closed: boolean;
}

export interface TrelloExportCard {
  id: string;
  name: string;
  idList: string;
  labels: TrelloExportLabel[];
  desc?: string;
  due?: string | null;
  url?: string;
  closed: boolean;
}

export interface TrelloExportLabel {
  name: string;
  color?: string;
}

const LIST_COLORS: Record<string, string> = {
  'to do': 'blue',
  'todo': 'blue',
  'doing': 'yellow',
  'in progress': 'yellow',
  'in-progress': 'yellow',
  'done': 'green',
  'complete': 'green',
  'completed': 'green',
  'blocked': 'red',
  'backlog': 'purple',
  'icebox': 'purple',
};

function generateId(): string {
  return `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

function extractStatusFromTags(tags: string[] | undefined): string | null {
  if (!tags) return null;
  for (const tag of tags) {
    const match = tag.match(/^status[:/-](.+)$/i);
    if (match) return match[1].replace(/-/g, ' ');
  }
  return null;
}

function extractProjectFromTags(tags: string[] | undefined): string | null {
  if (!tags) return null;
  for (const tag of tags) {
    const match = tag.match(/^project[:/-](.+)$/i);
    if (match) return match[1].replace(/-/g, ' ');
  }
  return null;
}

function extractPriorityFromTags(tags: string[] | undefined): string | null {
  if (!tags) return null;
  const priorityTags = ['urgent', 'high', 'medium', 'low', 'p0', 'p1', 'p2', 'p3'];
  for (const tag of tags) {
    const normalized = tag.toLowerCase();
    if (priorityTags.includes(normalized)) {
      if (normalized === 'p0') return 'urgent';
      if (normalized === 'p1') return 'high';
      if (normalized === 'p2') return 'medium';
      if (normalized === 'p3') return 'low';
      return normalized;
    }
    const match = tag.match(/^priority[:/-](.+)$/i);
    if (match) return match[1].toLowerCase();
  }
  return null;
}

function extractLabelsFromTags(tags: string[] | undefined): TrelloExportLabel[] {
  if (!tags) return [];
  const labels: TrelloExportLabel[] = [];
  const skipPrefixes = ['status:', 'project:', 'priority:'];
  
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (skipPrefixes.some(p => lower.startsWith(p))) continue;
    if (lower === 'completed') continue;
    
    labels.push({ name: tag.replace(/-/g, ' ') });
  }
  
  return labels;
}

function parseComment(comment: string | undefined): { description: string; due: string | null; url: string | undefined } {
  if (!comment) return { description: '', due: null, url: undefined };
  
  const parts = comment.split('\n\n');
  let description = '';
  let due: string | null = null;
  let url: string | undefined;
  
  for (const part of parts) {
    const dueMatch = part.match(/^Due:\s*(.+)$/im);
    if (dueMatch) {
      due = dueMatch[1].trim();
    } else if (part.match(/^https?:\/\//)) {
      url = part.trim();
    } else if (!description) {
      description = part.trim();
    }
  }
  
  return { description, due, url };
}

/**
 * Export mind map nodes to Trello-compatible JSON.
 * 
 * Strategy:
 * - Root node becomes the board
 * - First-level children become lists (columns)
 * - Their children become cards
 * - Tags are parsed for status, project, priority, and labels
 */
export function exportToTrello(nodes: Record<string, Node>): TrelloExportBoard {
  const root = Object.values(nodes).find(n => n.parentId === null);
  if (!root) {
    return { name: 'Exported Board', lists: [], cards: [] };
  }

  const lists: TrelloExportList[] = [];
  const cards: TrelloExportCard[] = [];
  const listIdMap = new Map<string, string>();

  // Create lists from first-level children
  for (const childId of root.children) {
    const child = nodes[childId];
    if (!child) continue;

    const listId = generateId();
    listIdMap.set(childId, listId);
    lists.push({
      id: listId,
      name: child.text,
      closed: false,
    });
  }

  // Create cards from second-level children
  for (const listNodeId of root.children) {
    const listNode = nodes[listNodeId];
    if (!listNode) continue;

    const listId = listIdMap.get(listNodeId)!;

    for (const cardNodeId of listNode.children) {
      const cardNode = nodes[cardNodeId];
      if (!cardNode) continue;

      const { description, due, url } = parseComment(cardNode.comment);
      const labels = extractLabelsFromTags(cardNode.tags);
      const priority = extractPriorityFromTags(cardNode.tags);
      
      if (priority) {
        labels.unshift({ name: priority, color: priority === 'urgent' ? 'red' : priority === 'high' ? 'orange' : 'yellow' });
      }

      const project = extractProjectFromTags(cardNode.tags);
      if (project) {
        labels.push({ name: project });
      }

      const isCompleted = cardNode.tags?.some(t => t.toLowerCase() === 'completed') ?? false;

      cards.push({
        id: generateId(),
        name: cardNode.text,
        idList: listId,
        labels,
        desc: description || undefined,
        due: due || undefined,
        url: url || undefined,
        closed: isCompleted,
      });

      // Handle nested children as checklist items (stored in description)
      if (cardNode.children.length > 0) {
        const checklistItems: string[] = [];
        for (const subChildId of cardNode.children) {
          const subChild = nodes[subChildId];
          if (subChild) {
            checklistItems.push(`- [${subChild.tags?.includes('completed') ? 'x' : ' '}] ${subChild.text}`);
          }
        }
        if (checklistItems.length > 0) {
          const lastCard = cards[cards.length - 1];
          lastCard.desc = (lastCard.desc || '') + '\n\nChecklist:\n' + checklistItems.join('\n');
        }
      }
    }
  }

  return {
    name: root.text,
    lists,
    cards,
  };
}

/**
 * Download mind map as Trello JSON file.
 */
export function downloadTrelloJson(nodes: Record<string, Node>, filename?: string): void {
  const board = exportToTrello(nodes);
  const json = JSON.stringify(board, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${board.name.toLowerCase().replace(/\s+/g, '-')}-trello.json`;
  a.click();
  URL.revokeObjectURL(url);
}
