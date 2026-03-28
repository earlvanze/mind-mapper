/**
 * Obsidian vault markdown file parser.
 * 
 * Converts Obsidian markdown into a MindMapp tree structure:
 * - YAML frontmatter tags → node tags
 * - # headings → child nodes (nested)
 * - [[wiki-links]] → link style on target nodes
 * - Folder path → hierarchical structure
 */

import type { Node } from '../store/useMindMapStore';
import { uid as generateId } from './id';

type RawNode = {
  text: string;
  children: RawNode[];
  tags?: string[];
  wikiLinks?: string[];
  listItems?: string[];
};

function parseFrontmatter(content: string): { tags: string[]; body: string } {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!fmMatch) {
    return { tags: [], body: content };
  }

  const [, fmBlock, body] = fmMatch;
  const tags: string[] = [];

  const tagsMatch = fmBlock.match(/(?:^|,\s*)tags\s*:\s*\[([^\]]*)\]/m);
  if (tagsMatch) {
    const tagStr = tagsMatch[1];
    tags.push(
      ...tagStr
        .split(',')
        .map((t: string) => t.trim().replace(/^#/, ''))
        .filter((t: string) => t.length > 0)
    );
  }

  return { tags, body };
}

function extractWikiLinks(text: string): string[] {
  const links: string[] = [];
  const regex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    links.push(match[1].trim());
  }
  return links;
}

function parseMarkdownBody(body: string): { root: RawNode; listItems: string[] } {
  const lines = body.split('\n');
  const root: RawNode = { text: 'Root', children: [] };
  const stack: RawNode[] = [root];
  const allListItems: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Task item: - [ ] or - [x]
    const taskMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s+(.+)$/);
    if (taskMatch) {
      const [, indent, status, text] = taskMatch;
      const level = Math.floor(indent.length / 2);
      const rawNode: RawNode = {
        text: text.trim(),
        children: [],
        listItems: [`${status === ' ' ? '☐' : '☑'} ${text.trim()}`],
      };
      allListItems.push(rawNode.text);
      rawNode.wikiLinks = extractWikiLinks(text);
      while (stack.length > level + 1) stack.pop();
      stack[stack.length - 1].children.push(rawNode);
      i++;
      continue;
    }

    // Bullet list item: - text
    const bulletMatch = line.match(/^(\s*)-\s+(.+)$/);
    if (bulletMatch) {
      const [, indent, text] = bulletMatch;
      const level = Math.floor(indent.length / 2);
      const rawNode: RawNode = {
        text: text.trim(),
        children: [],
        listItems: [text.trim()],
      };
      allListItems.push(rawNode.text);
      rawNode.wikiLinks = extractWikiLinks(text);
      while (stack.length > level + 1) stack.pop();
      stack[stack.length - 1].children.push(rawNode);
      i++;
      continue;
    }

    // Heading: # to ######
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const [, hashes, text] = headingMatch;
      const level = hashes.length;
      const rawNode: RawNode = {
        text: text.trim(),
        children: [],
      };
      rawNode.wikiLinks = extractWikiLinks(text);
      while (stack.length > level) stack.pop();
      stack[stack.length - 1].children.push(rawNode);
      stack.push(rawNode);
      i++;
      continue;
    }

    // Paragraph or other text
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('```')) {
      const rawNode: RawNode = {
        text: trimmed,
        children: [],
      };
      rawNode.wikiLinks = extractWikiLinks(trimmed);
      stack[stack.length - 1].children.push(rawNode);
    }
    i++;
  }

  return { root, listItems: allListItems };
}

function rawToNodesInternal(
  raw: RawNode,
  parentId: string | null,
  nodeTags: string[]
): Record<string, Node> {
  const nodes: Record<string, Node> = {};

  function convert(r: RawNode, pid: string | null, tags: string[]): string {
    const id = generateId();
    const node: Node = {
      id,
      text: r.text,
      x: 0,
      y: 0,
      children: [],
      parentId: pid,
      tags: r.tags?.length ? r.tags : tags.length ? [...tags] : undefined,
    };
    nodes[id] = node;

    for (const child of r.children) {
      const childId = convert(child, id, node.tags || tags);
      node.children.push(childId);
    }

    return id;
  }

  convert(raw, parentId, nodeTags);
  return nodes;
}

function positionNodes(nodes: Record<string, Node>): Record<string, Node> {
  const ROOT_X = 400;
  const ROOT_Y = 300;
  const LEVEL_HEIGHT = 80;
  const MIN_NODE_SPACING = 40;
  const NODE_WIDTH = 120;

  const root = Object.values(nodes).find((n) => n.parentId === null);
  if (!root) return nodes;

  const visited = new Set<string>();
  root.x = ROOT_X;
  root.y = ROOT_Y;
  visited.add(root.id);

  for (const node of Object.values(nodes)) {
    if (visited.has(node.id)) continue;
    const parent = node.parentId ? nodes[node.parentId] : null;
    if (!parent) continue;

    const siblings = parent.children;
    const index = siblings.indexOf(node.id);
    const totalWidth = siblings.length * (NODE_WIDTH + MIN_NODE_SPACING);
    const startX = parent.x - totalWidth / 2 + NODE_WIDTH / 2;

    node.x = startX + index * (NODE_WIDTH + MIN_NODE_SPACING);
    node.y = ROOT_Y + countDepth(node.id, nodes) * LEVEL_HEIGHT;
    visited.add(node.id);
  }

  return nodes;
}

function countDepth(nodeId: string, nodes: Record<string, Node>): number {
  let depth = 0;
  let current = nodes[nodeId];
  while (current?.parentId) {
    depth++;
    current = nodes[current.parentId];
  }
  return depth;
}

export function parseObsidian(
  content: string,
  filename?: string
): Record<string, Node> {
  const clean = content.replace(/^\uFEFF/, '');
  const { tags, body } = parseFrontmatter(clean);
  const { root } = parseMarkdownBody(body);

  // For single-file import, wrap if needed to create a proper tree
  if (root.children.length === 1 && root.children[0].text !== 'Root') {
    // Single first-level heading becomes root, rest as its children
    const docRoot = root.children[0];
    docRoot.tags = tags;
    const nodes = rawToNodesInternal(docRoot, null, tags);
    return positionNodes(nodes);
  } else {
    const wrapper: RawNode = { text: 'Imported Obsidian Note', children: root.children };
    wrapper.tags = tags;
    const nodes = rawToNodesInternal(wrapper, null, tags);
    return positionNodes(nodes);
  }
}

export function isObsidianContent(content: string): boolean {
  const trimmed = content.trim();

  // Has YAML frontmatter
  if (trimmed.startsWith('---') && trimmed.includes('---', 3)) {
    return true;
  }

  // Has wiki-links [[...]]
  if (/\[\[[^\]]+\]\]/.test(trimmed)) {
    return true;
  }

  // Has markdown headings
  if (/^#{1,6}\s+\S+/m.test(trimmed)) {
    return true;
  }

  return false;
}

export interface ObsidianImportResult {
  nodes: Record<string, Node>;
  filename: string;
  detectedTags: string[];
}

export function parseObsidianVault(
  files: { name: string; content: string }[]
): ObsidianImportResult {
  const root: RawNode = { text: 'Vault Root', children: [] };
  const allTags: Set<string> = new Set();

  for (const file of files) {
    const clean = file.content.replace(/^\uFEFF/, '');
    const { tags, body } = parseFrontmatter(clean);
    const { root: fileRoot } = parseMarkdownBody(body);

    tags.forEach((t) => allTags.add(t));

    const pathParts = file.name.replace(/\.md$/, '').split('/');
    let parent = root;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const existing = parent.children.find((c) => c.text === part);

      if (existing) {
        parent = existing;
      } else {
        const newNode: RawNode = { text: part, children: [] };
        if (i === pathParts.length - 1) {
          newNode.children = fileRoot.children;
          newNode.tags = tags;
        }
        parent.children.push(newNode);
        parent = newNode;
      }
    }
  }

  // For vault: use the actual root structure directly, no wrapper
  const nodes = rawToNodesInternal(root, null, []);
  return {
    nodes: positionNodes(nodes),
    filename: 'Obsidian Vault',
    detectedTags: Array.from(allTags),
  };
}
