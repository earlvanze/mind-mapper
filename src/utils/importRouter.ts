/**
 * Unified import router — detects file format and routes to the correct parser.
 * Supports: MindMapp JSON, XMind (8/9), FreeMind (.mm), Obsidian markdown, OPML, Kanban tables
 */

import type { Node } from '../store/useMindMapStore';
import { parseImportPayload } from './importValidation';
import { parseXMind, isXMindContent } from './importXMind';
import { parseObsidian, isObsidianContent } from './importObsidian';
import { parseOpml, isOpmlContent } from './importOpml';
import { parseKanbanTable, isKanbanTableContent } from './importKanbanTable';

export type ImportFormat = 'mindmapp-json' | 'xmind' | 'freemind' | 'obsidian' | 'opml' | 'kanban-table' | 'unknown';

export interface ImportResult {
  nodes: Record<string, Node>;
  format: ImportFormat;
}

function isFreemindContent(content: string): boolean {
  const trimmed = content.trim();
  return (
    trimmed.includes('<map version=') &&
    trimmed.includes('<node') &&
    !trimmed.includes('<workbook')
  );
}

function isMindMappJson(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') {
      if (parsed.nodes && typeof parsed.nodes === 'object') return true;
      if (parsed.n_root) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function detectImportFormat(content: string, filename?: string): ImportFormat {
  const trimmed = content.trim();

  // Check for kanban table format first (tables with | Project | Status | columns)
  if (isKanbanTableContent(trimmed)) return 'kanban-table';

  // Extension-based quick path
  if (filename) {
    const ext = filename.toLowerCase();
    if (ext.endsWith('.json')) return 'mindmapp-json';
    if (ext.endsWith('.xmind')) return 'xmind';
    if (ext.endsWith('.mm')) return 'freemind';
    if (ext.endsWith('.md')) return 'obsidian';
    if (ext.endsWith('.opml')) return 'opml';
    if (ext.endsWith('.xml')) {
      // .xml could be XMind, FreeMind, or OPML — detect based on content
    }
  }

  if (isMindMappJson(trimmed)) return 'mindmapp-json';
  if (isObsidianContent(trimmed)) return 'obsidian';
  if (isOpmlContent(trimmed)) return 'opml';
  if (isXMindContent(trimmed)) return 'xmind';
  if (isFreemindContent(trimmed)) return 'freemind';

  // Try JSON last
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'mindmapp-json';

  return 'unknown';
}

export function parseImportContent(
  content: string,
  format?: ImportFormat,
  filename?: string,
): ImportResult {
  const detected = format ?? detectImportFormat(content, filename);

  if (detected === 'mindmapp-json') {
    const parsed = JSON.parse(content);
    const nodes = parseImportPayload(parsed);
    return { nodes, format: 'mindmapp-json' };
  }

  if (detected === 'xmind') {
    const nodes = parseXMind(content);
    return { nodes, format: 'xmind' };
  }

  if (detected === 'freemind') {
    const nodes = parseXMind(content);
    return { nodes, format: 'freemind' };
  }

  if (detected === 'obsidian') {
    const nodes = parseObsidian(content, filename);
    return { nodes, format: 'obsidian' };
  }

  if (detected === 'opml') {
    const nodes = parseOpml(content);
    return { nodes, format: 'opml' };
  }

  if (detected === 'kanban-table') {
    const boardName = filename?.replace(/\.md$/i, '') || 'Kanban Board';
    const nodes = parseKanbanTable(content, boardName);
    return { nodes, format: 'kanban-table' };
  }

  throw new Error(
    `Unsupported file format. Supported formats: MindMapp JSON (.json), OPML (.opml), XMind (.xmind), FreeMind (.mm), Obsidian (.md), Kanban tables`
  );
}
