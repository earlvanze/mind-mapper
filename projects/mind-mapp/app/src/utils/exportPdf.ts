import { jsPDF } from 'jspdf';
import { Node } from '../store/useMindMapStore';

export type PdfLayout = 'a4-portrait' | 'a4-landscape' | 'letter-portrait' | 'letter-landscape' | 'fit';

const LAYOUT_DIMS: Record<Exclude<PdfLayout, 'fit'>, { w: number; h: number }> = {
  'a4-portrait': { w: 210, h: 297 },
  'a4-landscape': { w: 297, h: 210 },
  'letter-portrait': { w: 216, h: 279 },
  'letter-landscape': { w: 279, h: 216 },
};

const MARGIN = 15;

function cleanText(text: string) {
  return text.trim().replace(/\n+/g, ' ');
}

function sortIds(ids: string[], nodes: Record<string, Node>) {
  return [...ids].sort((a, b) => {
    const na = nodes[a];
    const nb = nodes[b];
    if (!na && !nb) return a.localeCompare(b);
    if (!na) return 1;
    if (!nb) return -1;
    if (na.y !== nb.y) return na.y - nb.y;
    if (na.x !== nb.x) return na.x - nb.x;
    return na.text.localeCompare(nb.text);
  });
}

function estimateNodeHeight(text: string, fontSize: number): number {
  const charsPerLine = 40;
  const lines = Math.ceil(text.length / charsPerLine);
  return lines * (fontSize * 0.45) + 10;
}

function renderNodePdf(
  node: Node,
  x: number,
  y: number,
  nodes: Record<string, Node>,
  pageW: number,
  pdf: jsPDF,
  visiting: Set<string>,
  visited: Set<string>,
  level: number,
  fontSize: number
): { height: number; width: number } {
  if (visiting.has(node.id)) return { height: 0, width: 0 };
  visiting.add(node.id);

  const indent = level * 12;
  const maxTextW = pageW - MARGIN * 2 - indent;
  const text = cleanText(node.text);
  const nodeH = estimateNodeHeight(text, fontSize);
  const nodeW = Math.min(maxTextW, Math.max(80, text.length * fontSize * 0.28 + 16));

  // Background
  const bgColor = node.style?.backgroundColor;
  if (bgColor && bgColor !== 'transparent') {
    const hex = bgColor.replace('#', '');
    if (hex.length === 6) {
      pdf.setFillColor(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16));
      const shape = node.style?.shape || 'rounded';
      if (shape === 'ellipse') {
        pdf.ellipse(x + nodeW / 2, y + nodeH / 2, nodeW / 2, nodeH / 2, 'F');
      } else if (shape === 'diamond') {
        const cx = x + nodeW / 2;
        const cy = y + nodeH / 2;
        pdf.setFillColor(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16));
        pdf.line(cx - nodeW / 2, cy, cx, cy - nodeH / 2, 'F');
        // fallback rectangle
        pdf.roundedRect(x, y, nodeW, nodeH, 2, 2, 'F');
      } else {
        const r = shape === 'rounded' ? 4 : 0;
        pdf.roundedRect(x, y, nodeW, nodeH, r, r, 'F');
      }
    }
  }

  // Border
  const borderColor = node.style?.borderColor;
  const borderW = node.style?.borderWidth || 1;
  if (borderColor) {
    const hex = borderColor.replace('#', '');
    if (hex.length === 6) {
      pdf.setDrawColor(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16));
      pdf.setLineWidth(borderW * 0.3);
      const shape = node.style?.shape || 'rounded';
      const r = shape === 'rounded' ? 4 : 0;
      if (shape === 'ellipse') {
        pdf.ellipse(x + nodeW / 2, y + nodeH / 2, nodeW / 2, nodeH / 2, 'S');
      } else if (shape === 'diamond') {
        const cx = x + nodeW / 2;
        const cy = y + nodeH / 2;
        pdf.line(cx - nodeW / 2, cy, cx, cy - nodeH / 2);
        pdf.line(cx, cy - nodeH / 2, cx + nodeW / 2, cy);
        pdf.line(cx + nodeW / 2, cy, cx, cy + nodeH / 2);
        pdf.line(cx, cy + nodeH / 2, cx - nodeW / 2, cy);
      } else {
        pdf.roundedRect(x, y, nodeW, nodeH, r, r, 'S');
      }
    }
  }

  // Text
  const textColor = node.style?.textColor;
  if (textColor) {
    const hex = textColor.replace('#', '');
    if (hex.length === 6) {
      pdf.setTextColor(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16));
    }
  } else {
    pdf.setTextColor(30, 30, 30);
  }

  const fs = node.style?.fontSize;
  const actualFontSize = fs === 'small' ? fontSize - 2 : fs === 'large' ? fontSize + 2 : fontSize;
  pdf.setFontSize(actualFontSize);
  pdf.text(text, x + 5, y + nodeH / 2 + actualFontSize * 0.35, { maxWidth: nodeW - 10, align: 'left' });

  // Icon
  const icon = node.style?.icon;
  if (icon) {
    pdf.setFontSize(actualFontSize);
    pdf.text(icon, x + nodeW - 10, y + nodeH / 2 + actualFontSize * 0.35);
  }

  // Children
  let curY = y + nodeH + 8;
  const children = sortIds(node.children.filter(cid => !!nodes[cid]), nodes);
  for (const cid of children) {
    if (visited.has(cid)) continue;
    const childNode = nodes[cid];
    const child = renderNodePdf(childNode, x + indent + 20, curY, nodes, pageW, pdf, visiting, visited, level + 1, fontSize);
    curY += child.height + 6;
  }

  visited.add(node.id);
  return { height: curY - y, width: nodeW };
}

export async function exportPdf(
  element: HTMLElement,
  nodes: Record<string, Node>,
  layout: PdfLayout = 'a4-portrait',
  filename = 'mindmapp.pdf'
) {
  let pageW: number, pageH: number;

  if (layout === 'fit') {
    // Compute bounds of content
    const ids = Object.keys(nodes);
    if (ids.length === 0) {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.setFontSize(12);
      pdf.text('Empty Mind Map', MARGIN, MARGIN + 10);
      pdf.save(filename);
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const id of ids) {
      const n = nodes[id];
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + 160);
      maxY = Math.max(maxY, n.y + 60);
    }
    pageW = Math.max(maxX - minX + MARGIN * 2, 50);
    pageH = Math.max(maxY - minY + MARGIN * 2, 50);
    // Constrain to reasonable size
    const scale = Math.min(297 / pageW, 420 / pageH, 1);
    pageW *= scale;
    pageH *= scale;
  } else {
    const dims = LAYOUT_DIMS[layout];
    pageW = dims.w;
    pageH = dims.h;
  }

  const pdf = new jsPDF({ orientation: pageW > pageH ? 'landscape' : 'portrait', unit: 'mm', format: [pageW, pageH] });
  pdf.setFontSize(11);
  pdf.setTextColor(30, 30, 30);

  const ids = Object.keys(nodes);
  if (!ids.length) {
    pdf.text('Empty Mind Map', MARGIN, MARGIN + 10);
    pdf.save(filename);
    return;
  }

  const ROOT_ID = 'n_root';
  const rootId = nodes[ROOT_ID] ? ROOT_ID : sortIds(ids.filter(id => nodes[id].parentId === null), nodes)[0];

  if (rootId) {
    const root = nodes[rootId];
    if (layout === 'fit') {
      let minX = Infinity, minY = Infinity;
      for (const id of ids) { minX = Math.min(minX, nodes[id].x); minY = Math.min(minY, nodes[id].y); }
      renderNodePdf(root, MARGIN - minX, MARGIN - minY, nodes, pageW - MARGIN, pdf, new Set(), new Set(), 0, 11);
    } else {
      renderNodePdf(root, MARGIN, MARGIN, nodes, pageW, pdf, new Set(), new Set(), 0, 11);
    }
  }

  // Unlinked nodes
  const visited = new Set<string>();
  const visiting = new Set<string>();
  if (rootId) {
    // re-visit to mark visited
    function markVisited(id: string) {
      visited.add(id);
      const node = nodes[id];
      if (node) node.children.forEach(cid => markVisited(cid));
    }
    markVisited(rootId);
  }
  const unvisited = ids.filter(id => !visited.has(id));
  let curY = pageH - MARGIN - 20;
  for (const id of unvisited) {
    const node = nodes[id];
    if (!node || node.parentId !== null) continue;
    const text = cleanText(node.text);
    pdf.setFontSize(11);
    pdf.text(`• ${text}`, MARGIN, curY);
    curY -= 7;
    if (curY < MARGIN) break;
  }

  pdf.save(filename);
}
