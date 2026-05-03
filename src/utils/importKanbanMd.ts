/**
 * Obsidian Kanban.md parser.
 * 
 * Converts Obsidian Kanban markdown boards into MindMapp trees.
 * Supports two formats:
 * 1. Checkbox lists: ## Column followed by - [ ] task items
 * 2. Markdown tables: ## Column followed by | tables where first col is project/item
 */

import type { Node } from '../store/useMindMapStore';
import {
  type KanbanBoard,
  type KanbanCard,
  type KanbanTransformTemplate,
  transformKanbanToMindMap,
} from './kanbanTransforms.js';

interface RawColumn {
  name: string;
  cards: RawCard[];
}

interface RawCard {
  text: string;
  completed: boolean;
  children: RawCard[];
}

function parseKanbanMarkdown(content: string): RawColumn[] {
  const lines = content.replace(/^\uFEFF/, '').split('\n');
  const columns: RawColumn[] = [];
  let currentColumn: RawColumn | null = null;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Column header: ## Name or ### Name
    const columnMatch = line.match(/^#{2,6}\s+(.+)$/);
    if (columnMatch) {
      // Save previous column
      if (currentColumn) {
        columns.push(currentColumn);
      }
      currentColumn = { name: columnMatch[1].trim(), cards: [] };
      inTable = false;
      continue;
    }

    if (!currentColumn) continue;

    // Skip frontmatter
    if (line.trim() === '---' && i < 5) continue;

    // Table detection: starts with | and has |
    if (line.includes('|') && line.trim().startsWith('|')) {
      // Skip header separator row (|---|---|)
      if (line.match(/^\|[\s\-:|]+\|$/)) continue;
      
      inTable = true;
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length === 0) continue;
      
      // First cell is the item name, rest become tags/notes
      const [name, ...rest] = cells;
      if (!name || name === 'Project' || name === 'Status' || name === 'Owner') continue;
      
      const card: RawCard = {
        text: name,
        completed: false,
        children: [],
      };
      
      // Remaining columns become child notes
      for (const extra of rest) {
        if (extra && !extra.match(/^-+$/)) {
          card.children.push({
            text: extra,
            completed: false,
            children: [],
          });
        }
      }
      
      currentColumn.cards.push(card);
      continue;
    }

    // End table mode on blank or non-table line
    if (inTable && !line.includes('|')) {
      inTable = false;
    }

    if (inTable) continue;

    // Task item: - [ ] or - [x] with optional indentation
    const taskMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s+(.+)$/);
    if (taskMatch) {
      const [, , status, text] = taskMatch;
      const completed = status.toLowerCase() === 'x';
      const card: RawCard = {
        text: text.trim(),
        completed,
        children: [],
      };
      currentColumn.cards.push(card);
      continue;
    }

    // Bullet item (non-task): - text
    const bulletMatch = line.match(/^(\s*)-\s+(.+)$/);
    if (bulletMatch) {
      const [, , text] = bulletMatch;
      const card: RawCard = {
        text: text.trim(),
        completed: false,
        children: [],
      };
      currentColumn.cards.push(card);
    }
  }

  // Save last column
  if (currentColumn) {
    columns.push(currentColumn);
  }

  return columns;
}

function convertCard(card: RawCard, status: string): KanbanCard {
  return {
    title: card.text,
    status,
    labels: [],
    completed: card.completed,
    children: card.children.map(c => convertCard(c, status)),
  };
}

export function parseKanbanMdBoard(content: string): KanbanBoard {
  const columns = parseKanbanMarkdown(content);
  
  return {
    name: 'Kanban Board',
    columns: columns.map((col, idx) => ({
      id: `col_${idx}`,
      name: col.name,
      cards: col.cards.map(c => convertCard(c, col.name)),
    })),
  };
}

export function parseKanbanMd(
  content: string,
  template: KanbanTransformTemplate = 'by-status',
): Record<string, Node> {
  return transformKanbanToMindMap(parseKanbanMdBoard(content), template);
}

export function isKanbanMdContent(content: string): boolean {
  const trimmed = content.trim();
  
  // Checkbox format: column headers with task lists
  const hasColumnTasks = /^#{2,6}\s+.+$/m.test(trimmed) && /^(\s*)-\s*\[[ xX]\]\s+.+$/m.test(trimmed);
  
  // Table format: column headers with tables
  const hasColumnTable = /^#{2,6}\s+.+$/m.test(trimmed) && /\|.+\|/.test(trimmed);
  
  return hasColumnTasks || hasColumnTable;
}
