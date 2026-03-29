/**
 * XMind (version 8/9) XML format parser.
 * 
 * XMind XML structure:
 * <workbook>
 *   <sheet>
 *     <title>Sheet Name</title>
 *     <root-topic>
 *       <title>Root Node</title>
 *       <children>
 *         <topics>  <!-- or <topics type="attached"> -->
 *           <topic>
 *             <title>Child</title>
 *             <children>...</children>
 *           </topic>
 *         </topics>
 *       </children>
 *     </root-topic>
 *   </sheet>
 * </workbook>
 * 
 * Also handles XMind 8's topics-first format:
 * <workbook>
 *   <sheet>
 *     <title>Sheet Name</title>
 *     <root-topic>
 *       <title>Root</title>
 *     </root-topic>
 *     <topics>...</topics>
 *   </sheet>
 * </workbook>
 */

import type { Node } from '../store/useMindMapStore';
import { uid as generateId } from './id';

type RawNode = {
  isCollapsed?: boolean;
  text: string;
  children: RawNode[];
};

function getTextContent(element: Element | Document, tagName: string): string {
  const el = element.getElementsByTagName(tagName)[0];
  return el?.textContent?.trim() ?? '';
}

function parseTopics(topicsElement: Element): RawNode[] {
  const result: RawNode[] = [];
  const topicElements = topicsElement.getElementsByTagName('topic');
  
  for (let i = 0; i < topicElements.length; i++) {
    const topicEl = topicElements[i];
    result.push(parseTopic(topicEl));
  }
  
  return result;
}

function parseTopic(topicEl: Element): RawNode {
  // Handle both XMind <title> and FreeMind TEXT="" attribute
  const titleEl = topicEl.getElementsByTagName('title')[0];
  const text = titleEl?.textContent?.trim()
    ?? topicEl.getAttribute('TEXT')?.trim()
    ?? 'Untitled';

  // FreeMind FOLDED="true" attribute → collapsed state
  const isCollapsed = topicEl.getAttribute('FOLDED') === 'true';

  const children: RawNode[] = [];

  // FreeMind uses <node> children directly; XMind uses <children><topics><topic>
  // Try FreeMind <node> children first
  const freeMindChildren = topicEl.getElementsByTagName('node');
  for (let i = 0; i < freeMindChildren.length; i++) {
    children.push(parseTopic(freeMindChildren[i]));
  }

  // XMind-style children (skipped if we already found FreeMind nodes)
  if (children.length === 0) {
    const childrenElements = topicEl.getElementsByTagName('children');
    for (let i = 0; i < childrenElements.length; i++) {
      const childEl = childrenElements[i];
      const topicsElements = childEl.getElementsByTagName('topics');
      for (let j = 0; j < topicsElements.length; j++) {
        children.push(...parseTopics(topicsElements[j]));
      }
    }
  }

  return { text, children, ...(isCollapsed ? { isCollapsed } : {}) };
}

function parseSheet(sheetEl: Element): RawNode[] {
  // FreeMind: <map><node TEXT="..." FOLDED="..."><node>...
  const freeMindRoot = sheetEl.getElementsByTagName('node');
  if (freeMindRoot.length > 0) {
    return [parseTopic(freeMindRoot[0])];
  }

  const rootTopics = sheetEl.getElementsByTagName('root-topic');
  if (rootTopics.length === 0) return [];

  const result: RawNode[] = [];

  for (let i = 0; i < rootTopics.length; i++) {
    const rootTopic = rootTopics[i];
    const titleEl = rootTopic.getElementsByTagName('title')[0];
    const text = titleEl?.textContent?.trim() ?? 'Root';

    const children: RawNode[] = [];
    const childrenElements = rootTopic.getElementsByTagName('children');

    for (let j = 0; j < childrenElements.length; j++) {
      const childEl = childrenElements[j];
      const topicsElements = childEl.getElementsByTagName('topics');
      for (let k = 0; k < topicsElements.length; k++) {
        children.push(...parseTopics(topicsElements[k]));
      }
    }

    result.push({ text, children });
  }

  // XMind 8 format: root-topic + sibling topics at sheet level
  const topicsElements = sheetEl.getElementsByTagName('topics');
  for (let i = 0; i < topicsElements.length; i++) {
    // Skip if already processed as children of root-topic
    if (result.length > 0) break;
    result.push(...parseTopics(topicsElements[i]));
  }

  return result;
}

function rawToNodes(rawRoot: RawNode, parentId: string | null): Record<string, Node> {
  const nodes: Record<string, Node> = {};
  
  function convert(raw: RawNode, pid: string | null): string {
    const id = generateId();
    const node: Node = {
      id,
      text: raw.text,
      x: 0,
      y: 0,
      children: [],
      parentId: pid,
      ...(raw.isCollapsed ? { isCollapsed: true } : {}),
    };
    nodes[id] = node;
    
    for (const child of raw.children) {
      const childId = convert(child, id);
      node.children.push(childId);
    }
    
    return id;
  }
  
  convert(rawRoot, parentId);
  return nodes;
}

function positionNodes(nodes: Record<string, Node>): Record<string, Node> {
  // Tree layout: root at (400, 300), children spread horizontally below
  const ROOT_X = 400;
  const ROOT_Y = 300;
  const LEVEL_HEIGHT = 80;
  const MIN_NODE_SPACING = 40;
  const NODE_WIDTH = 120;
  
  // Find root
  const root = Object.values(nodes).find(n => n.parentId === null);
  if (!root) return nodes;
  
  // BFS to assign positions
  const queue: { id: string; depth: number }[] = [{ id: root.id, depth: 0 }];
  const visited = new Set<string>();
  
  // Count children at each level first
  const levelCounts: Record<number, number> = {};
  const nodeAtLevel: Record<string, number> = {};
  
  for (const id of queue.map(q => q.id)) {
    if (visited.has(id)) continue;
    visited.add(id);
    
    const node = nodes[id];
    const depth = queue.find(q => q.id === id)?.depth ?? 0;
    nodeAtLevel[id] = levelCounts[depth] ?? 0;
    levelCounts[depth] = (levelCounts[depth] ?? 0) + 1;
    
    for (const childId of node.children) {
      queue.push({ id: childId, depth: depth + 1 });
    }
  }
  
  // Calculate positions
  visited.clear();
  const rootNode = nodes[root.id];
  rootNode.x = ROOT_X;
  rootNode.y = ROOT_Y;
  visited.add(root.id);
  
  for (const node of Object.values(nodes)) {
    if (visited.has(node.id)) continue;
    
    const parent = node.parentId ? nodes[node.parentId] : null;
    if (!parent) continue;
    
    const depth = countDepth(node.id, nodes);
    const siblingsAtDepth = Object.values(nodes).filter(
      n => n.parentId === parent.id
    ).length;
    const indexAmongSiblings = parent.children.indexOf(node.id);
    
    const totalWidth = siblingsAtDepth * (NODE_WIDTH + MIN_NODE_SPACING);
    const startX = parent.x - totalWidth / 2 + NODE_WIDTH / 2;
    
    node.x = startX + indexAmongSiblings * (NODE_WIDTH + MIN_NODE_SPACING);
    node.y = ROOT_Y + depth * LEVEL_HEIGHT;
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

export function parseXMind(xmlString: string): Record<string, Node> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  
  // Check for parse errors
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    throw new Error('Invalid XMind XML: parse error');
  }
  
  // Handle both <workbook> (XMind 8) and <map> (FreeMind-compatible) root elements
  const workbook = doc.getElementsByTagName('workbook')[0];
  const mapRoot = doc.getElementsByTagName('map')[0];
  
  let sheets: Element[] = [];
  
  if (workbook) {
    sheets = Array.from(workbook.getElementsByTagName('sheet'));
  } else if (mapRoot) {
    // FreeMind: <map version="..."><node TEXT="..." FOLDED="..."><node>...
    const freeMindRoot = mapRoot.getElementsByTagName('node')[0];
    if (freeMindRoot) {
      const rootNode = parseTopic(freeMindRoot);
      const nodes = rawToNodes(rootNode, null);
      return positionNodes(nodes);
    }
    // Fallback: root-topic (rarely used in FreeMind context)
    const rootTopic = mapRoot.getElementsByTagName('root-topic')[0];
    if (rootTopic) {
      return parseXMind(`<?xml version="1.0"?><workbook><sheet><root-topic>${rootTopic.innerHTML}</root-topic></sheet></workbook>`);
    }
  }
  
  if (sheets.length === 0) {
    throw new Error('Invalid XMind: no sheets found');
  }
  
  // Use first sheet
  const firstSheet = sheets[0];
  const sheetTitle = getTextContent(firstSheet, 'title') || 'Imported XMind';
  const rootTopics = parseSheet(firstSheet);
  
  // If we have root topics, use the first as our tree root
  // Otherwise create a synthetic root with the sheet title
  let treeRoot: RawNode;
  
  if (rootTopics.length === 0) {
    treeRoot = { text: sheetTitle, children: [] };
  } else if (rootTopics.length === 1) {
    treeRoot = rootTopics[0];
    // If the single root is just "Main Topic" or empty, use sheet title
    if (treeRoot.text === 'Main Topic' || treeRoot.text === '') {
      treeRoot.text = sheetTitle;
    }
  } else {
    // Multiple root topics: create a synthetic parent
    treeRoot = { text: sheetTitle, children: rootTopics };
  }
  
  const nodes = rawToNodes(treeRoot, null);
  return positionNodes(nodes);
}

export function isXMindContent(content: string): boolean {
  const trimmed = content.trim();
  return (
    trimmed.includes('<workbook') ||
    (trimmed.includes('<sheet') && trimmed.includes('<root-topic'))
  );
}
