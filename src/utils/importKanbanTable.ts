/**
 * Markdown table-based Kanban parser.
 * 
 * Converts markdown tables with | Project | Status | Owner | Notes | format
 * into MindMapp trees, grouped by Status column.
 */

import type { Node } from '../store/useMindMapStore';
import {
  type KanbanBoard,
  type KanbanCard,
  type KanbanTransformTemplate,
  transformKanbanToMindMap,
} from './kanbanTransforms.js';

interface TableRow {
  project: string;
  status: string;
  owner: string;
  notes: string;
}

function parseTableRows(content: string): TableRow[] {
  const lines = content.split('\n');
  const rows: TableRow[] = [];
  
  let inTable = false;
  let headerFound = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect table start
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      
      // Skip header row
      if (!headerFound) {
        headerFound = true;
        continue;
      }
      
      // Skip separator row (|---|---|...)
      if (/^\|[\s-:|]+\|$/.test(trimmed)) {
        continue;
      }
      
      // Parse data row
      const cells = trimmed
        .split('|')
        .map(c => c.trim())
        .filter(c => c.length > 0);
      
      if (cells.length >= 3) {
        rows.push({
          project: cells[0] || 'Untitled',
          status: cells[1] || 'Unknown',
          owner: cells[2] || '',
          notes: cells.slice(3).join(' | ') || '',
        });
      }
    } else if (inTable && !trimmed.startsWith('|')) {
      // End of table
      inTable = false;
      headerFound = false;
    }
  }
  
  return rows;
}

function rowsToBoard(rows: TableRow[], boardName: string): KanbanBoard {
  // Group by status
  const statusGroups = new Map<string, KanbanCard[]>();
  
  for (const row of rows) {
    const status = row.status.toLowerCase().trim();
    if (!statusGroups.has(status)) {
      statusGroups.set(status, []);
    }
    
    const labels: string[] = [];
    if (row.owner) {
      labels.push(`owner:${row.owner.replace(/\s+/g, '-').toLowerCase()}`);
    }
    
    statusGroups.get(status)!.push({
      title: row.project,
      status,
      labels,
      description: row.notes || undefined,
    });
  }
  
  const columns = Array.from(statusGroups.entries()).map(([name, cards], idx) => ({
    id: `col_${idx}`,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    cards,
  }));
  
  return {
    name: boardName,
    columns,
  };
}

export function parseKanbanTable(
  content: string,
  boardName: string = 'Kanban Board',
  template: KanbanTransformTemplate = 'by-status',
): Record<string, Node> {
  const rows = parseTableRows(content);
  const board = rowsToBoard(rows, boardName);
  return transformKanbanToMindMap(board, template);
}

export function isKanbanTableContent(content: string): boolean {
  // Must have at least one table with 3+ columns
  const lines = content.split('\n');
  let foundTable = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').filter(c => c.trim().length > 0);
      if (cells.length >= 3) {
        foundTable = true;
        break;
      }
    }
  }
  
  return foundTable;
}
