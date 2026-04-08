/**
 * OPML (Outline Processor Markup Language) import parser.
 * Supports OPML 1.0 and 2.0, standard outline interchange format.
 * Used by RSS readers (Feedly), note-taking apps (Evernote, Notion),
 * and outliners (WorkFlowy, Dynalist, etc.).
 */

import type { Node } from '../store/useMindMapStore';
import { uid as generateId } from './id';

type RawOutline = {
  text: string;
  children: RawOutline[];
  _note?: string;
  _tags?: string;
  _backgroundColor?: string;
  _textColor?: string;
  _borderColor?: string;
  _shape?: string;
  _icon?: string;
  _fontSize?: string;
  _bold?: boolean;
  _italic?: boolean;
  _collapsed?: boolean;
};

function getAttr(el: Element, name: string): string | undefined {
  return el.getAttribute(name) ?? undefined;
}

function parseOutlineElement(el: Element): RawOutline {
  const text = el.getAttribute('text') ?? el.getAttribute('title') ?? 'Untitled';
  const raw: RawOutline = { text, children: [] };

  const note = el.getAttribute('_note');
  if (note) raw._note = note;

  const tags = el.getAttribute('_tags');
  if (tags) raw._tags = tags;

  const bg = el.getAttribute('_backgroundColor');
  if (bg) raw._backgroundColor = bg;

  const tc = el.getAttribute('_textColor');
  if (tc) raw._textColor = tc;

  const bc = el.getAttribute('_borderColor');
  if (bc) raw._borderColor = bc;

  const shape = el.getAttribute('_shape');
  if (shape && shape !== 'rounded') raw._shape = shape;

  const icon = el.getAttribute('_icon');
  if (icon) raw._icon = icon;

  const fs = el.getAttribute('_fontSize');
  if (fs && fs !== 'medium') raw._fontSize = fs;

  const bold = el.getAttribute('_bold');
  if (bold === 'true') raw._bold = true;

  const italic = el.getAttribute('_italic');
  if (italic === 'true') raw._italic = true;

  const collapsed = el.getAttribute('_collapsed');
  if (collapsed === 'true') raw._collapsed = true;

  // Recurse into child <outline> elements
  const children = Array.from(el.children).filter(
    (child) => child.tagName.toLowerCase() === 'outline',
  );
  for (const child of children) {
    raw.children.push(parseOutlineElement(child));
  }

  return raw;
}

function rawToNodes(rawRoot: RawOutline): Record<string, Node> {
  const nodes: Record<string, Node> = {};

  function convert(raw: RawOutline, pid: string | null): string {
    const id = generateId();
    const style: Node['style'] = {};

    if (raw._backgroundColor) style.backgroundColor = raw._backgroundColor;
    if (raw._textColor) style.textColor = raw._textColor;
    if (raw._borderColor) style.borderColor = raw._borderColor;
    if (raw._shape && raw._shape !== 'rounded') style.shape = raw._shape;
    if (raw._icon) style.icon = raw._icon;
    if (raw._fontSize) style.fontSize = raw._fontSize;
    if (raw._bold) style.bold = true;
    if (raw._italic) style.italic = true;

    const node: Node = {
      id,
      text: raw.text,
      x: 0,
      y: 0,
      children: [],
      parentId: pid,
      style: Object.keys(style).length > 0 ? style : {},
      ...(raw._note ? { comment: raw._note } : {}),
      ...(raw._tags ? { tags: raw._tags.split(',').map((t) => t.trim()).filter(Boolean) } : {}),
      ...(raw._collapsed ? { isCollapsed: true } : {}),
    };

    nodes[id] = node;

    for (const child of raw.children) {
      const childId = convert(child, id);
      node.children.push(childId);
    }

    return id;
  }

  convert(rawRoot, null);
  return nodes;
}

function positionNodes(nodes: Record<string, Node>): Record<string, Node> {
  const ROOT_X = 400;
  const ROOT_Y = 300;
  const LEVEL_HEIGHT = 80;
  const NODE_WIDTH = 120;
  const MIN_SPACING = 40;

  const root = Object.values(nodes).find((n) => n.parentId === null);
  if (!root) return nodes;

  root.x = ROOT_X;
  root.y = ROOT_Y;

  // BFS to count siblings at each level
  const queue: string[] = [...root.children];
  const visited = new Set<string>([root.id]);

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = nodes[id];
    const parent = node.parentId ? nodes[node.parentId] : null;
    if (!parent) continue;

    const siblings = parent.children;
    const index = siblings.indexOf(id);
    const totalWidth = siblings.length * (NODE_WIDTH + MIN_SPACING);
    const startX = parent.x - totalWidth / 2 + NODE_WIDTH / 2;

    // Compute depth
    let depth = 0;
    let current = parent;
    while (current.parentId) {
      depth++;
      current = nodes[current.parentId];
    }

    node.x = startX + index * (NODE_WIDTH + MIN_SPACING);
    node.y = ROOT_Y + (depth + 1) * LEVEL_HEIGHT;

    queue.push(...node.children);
  }

  return nodes;
}

/**
 * Parse an OPML XML string into Mind Mapp nodes.
 */
export function parseOpml(xmlString: string): Record<string, Node> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  // Check for xmldom parser errors (inserted as direct children of the document)
  const errorNodes = doc.getElementsByTagName('parsererror');
  if (errorNodes.length > 0) {
    const errorText = errorNodes[0]?.textContent ?? '';
    // Check if it looks like a real parse error vs a missing root element
    if (errorText.includes('missing root element')) {
      throw new Error('Invalid OPML XML: missing root element');
    }
    throw new Error('Invalid OPML XML: parse error');
  }

  // Also check for severe errors in the DOM — xmldom may put them in documentElement
  if (!doc.documentElement || doc.documentElement.tagName === 'parsererror') {
    throw new Error('Invalid OPML XML');
  }

  // Find <body> element — OPML 1.0 and 2.0 both have <body>
  const bodyEls = doc.getElementsByTagName('body');
  if (bodyEls.length === 0) {
    throw new Error('Invalid OPML: missing <body> element');
  }
  const body = bodyEls[0];

  // Top-level <outline> children of <body>
  const outlineEls = Array.from(body.children).filter(
    (el) => el.tagName.toLowerCase() === 'outline',
  );

  if (outlineEls.length === 0) {
    throw new Error('Invalid OPML: no <outline> elements found in <body>');
  }

  // If only one top-level outline, treat it as the root
  // If multiple, create a synthetic parent
  let treeRoot: RawOutline;

  if (outlineEls.length === 1) {
    treeRoot = parseOutlineElement(outlineEls[0]);
  } else {
    treeRoot = {
      text: 'Root',
      children: outlineEls.map((el) => parseOutlineElement(el)),
    };
  }

  const nodes = rawToNodes(treeRoot);
  return positionNodes(nodes);
}

/**
 * Detect whether the given string is OPML content.
 */
export function isOpmlContent(content: string): boolean {
  const trimmed = content.trim();
  return (
    trimmed.startsWith('<?xml') && (
      trimmed.includes('<opml') ||
      (trimmed.includes('<outline') && trimmed.includes('</outline'))
    )
  ) || (
    trimmed.includes('<opml') ||
    (trimmed.includes('<outline') && trimmed.includes('text='))
  );
}
