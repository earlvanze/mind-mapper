/**
 * Math rendering utilities — KaTeX auto-detection and rendering for node text.
 * Supports inline math ($...$) and display/block math ($$...$$).
 */

import katex from 'katex';

/**
 * Detects whether a string contains math notation.
 * Returns 'block' for display math ($$...$$), 'inline' for inline math ($...$),
 * or null if no math detected.
 */
export function detectMathMode(text: string): 'block' | 'inline' | null {
  // Block math: $$...$$ (non-greedy, handles newlines)
  if (/\$\$[\s\S]+?\$\$/.test(text)) return 'block';
  // Inline math: $...$ (not followed by another $, handles escaped \$)
  if (/\$[^$\n]+?\$/.test(text)) return 'inline';
  return null;
}

/**
 * Renders a math expression string to HTML using KaTeX.
 * mode 'block' → display mode (centered, larger)
 * mode 'inline' → inline mode
 * Returns the KaTeX-rendered HTML string.
 */
export function renderMath(latex: string, mode: 'block' | 'inline'): string {
  try {
    const html = katex.renderToString(latex, {
      displayMode: mode === 'block',
      throwOnError: false,
      errorColor: '#dc2626',
      trust: false,
      strict: false,
    });
    // Wrap display math for proper block layout
    if (mode === 'block') {
      return `<span class="katex-wrapper katex-display">${html}</span>`;
    }
    return html;
  } catch {
    return `<span style="color:#dc2626">${escapeHtml(latex)}</span>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Fully processes node text: splits by math delimiters, renders math sections,
 * and returns an array of { type: 'text'|'math', content } segments.
 */
export interface TextSegment {
  type: 'text' | 'math';
  content: string; // rendered HTML for math, raw escaped text for text
}

export function parseMathSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  
  // Regex matches block math first ($$...$$), then inline math ($...$)
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      if (before) segments.push({ type: 'text', content: escapeHtml(before) });
    }

    const raw = match[0];
    if (raw.startsWith('$$')) {
      // Block math
      const latex = raw.slice(2, -2).trim();
      segments.push({ type: 'math', content: renderMath(latex, 'block') });
    } else {
      // Inline math
      const latex = raw.slice(1, -1).trim();
      segments.push({ type: 'math', content: renderMath(latex, 'inline') });
    }

    lastIndex = match.index + raw.length;
  }

  // Remaining text after last match
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: escapeHtml(text.slice(lastIndex)) });
  }

  return segments;
}

/**
 * Checks if raw HTML string contains math notation.
 */
export function htmlContainsMath(html: string): boolean {
  return /\$[^*$]/.test(html);
}

/**
 * Renders node text for display (view mode).
 * This takes the raw HTML from contentEditable (which may contain b/i/ul/ol)
 * and applies KaTeX rendering to any $...$ / $$...$$ math expressions found
 * within text nodes, preserving the surrounding HTML structure.
 *
 * Uses DOMParser to traverse the HTML tree and process each text node.
 * Returns the processed HTML string, or undefined if no math was found
 * (caller should use the original HTML unchanged).
 */
export function renderNodeTextForDisplay(html: string): string | undefined {
  if (!html || !html.includes('$')) return undefined;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');

    function processNode(node: Node): string {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (!text.includes('$')) return text;
        
        const segs = parseMathSegments(text);
        if (segs.length === 1 && segs[0].type === 'text') return segs[0].content;
        
        return segs.map(seg => {
          if (seg.type === 'text') return seg.content;
          return seg.content;
        }).join('');
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tagName = el.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea') return el.textContent || '';
        
        const children = Array.from(el.childNodes).map(processNode).join('');
        if (['br', 'hr', 'img', 'input', 'textarea'].includes(tagName)) return children;
        
        return `<${tagName}>${children}</${tagName}>`;
      }
      
      return '';
    }
    
    const result = processNode(doc.body);
    // Only return if we actually processed math
    return result !== html ? result : undefined;
  } catch {
    return undefined;
  }
}
