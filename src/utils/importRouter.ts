/**
 * Unified import router — detects file format and routes to the correct parser.
 * Supports: MindMapp JSON, XMind (8/9), FreeMind (.mm), Obsidian markdown
 */

import type { Node } from '../store/useMindMapStore';
import { parseImportPayload } from './importValidation';
import { parseXMind, isXMindContent } from './importXMind';
import { parseObsidian, isObsidianContent } from './importObsidian';

export type ImportFormat = 'mindmapp-json' | 'xmind' | 'freemind' | 'obsidian' | 'unknown';

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
  // Extension-based quick path
  if (filename) {
    const ext = filename.toLowerCase();
    if (ext.endsWith('.json')) return 'mindmapp-json';
    if (ext.endsWith('.xmind')) return 'xmind';
    if (ext.endsWith('.mm')) return 'freemind';
    if (ext.endsWith('.md')) return 'obsidian';
  }

  const trimmed = content.trim();

  if (isMindMappJson(trimmed)) return 'mindmapp-json';
  if (isObsidianContent(trimmed)) return 'obsidian';
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

  throw new Error(
    `Unsupported file format. Supported formats: MindMapp JSON (.json), XMind (.xmind), FreeMind (.mm), Obsidian (.md)`
  );
}
