import { describe, it, expect } from 'vitest';
import { detectMathMode, parseMathSegments, renderMath } from './mathRender';

describe('detectMathMode', () => {
  it('returns null for plain text', () => {
    expect(detectMathMode('hello world')).toBeNull();
    expect(detectMathMode('no math here')).toBeNull();
    expect(detectMathMode('')).toBeNull();
  });

  it('detects inline math', () => {
    expect(detectMathMode('The area is $A = \\pi r^2$')).toBe('inline');
    expect(detectMathMode('$x + y = z$')).toBe('inline');
    expect(detectMathMode('$a$ and $b$')).toBe('inline');
  });

  it('detects block math', () => {
    expect(detectMathMode('$$\\int_0^1 x^2 dx$$')).toBe('block');
    expect(detectMathMode('Solve:\n$$\nE = mc^2\n$$')).toBe('block');
    expect(detectMathMode('$$a$$')).toBe('block');
  });

  it('prefers block over inline when both present', () => {
    expect(detectMathMode('$$block$$ and $inline$')).toBe('block');
  });

  it('ignores escaped dollars', () => {
    expect(detectMathMode('Price is \\$100')).toBeNull();
  });

  it('ignores lone dollar signs', () => {
    expect(detectMathMode(' USD ')).toBeNull();
    expect(detectMathMode('$')).toBeNull();
  });
});

describe('parseMathSegments', () => {
  it('returns a single text segment for plain text', () => {
    const segs = parseMathSegments('hello world');
    expect(segs).toHaveLength(1);
    expect(segs[0].type).toBe('text');
    expect(segs[0].content).toBe('hello world');
  });

  it('returns a single text segment for empty string', () => {
    expect(parseMathSegments('')).toHaveLength(0);
  });

  it('parses inline math segments', () => {
    const segs = parseMathSegments('Area: $A = \\pi r^2$');
    expect(segs).toHaveLength(2);
    expect(segs[0].type).toBe('text');
    expect(segs[0].content).toBe('Area: ');
    expect(segs[1].type).toBe('math');
    expect(segs[1].content).toContain('katex');
  });

  it('parses block math segments', () => {
    const segs = parseMathSegments('$$\\sum_{i=1}^n i$$');
    expect(segs).toHaveLength(1);
    expect(segs[0].type).toBe('math');
    expect(segs[0].content).toContain('katex');
    expect(segs[0].content).toContain('display');
  });

  it('handles multiple inline math expressions', () => {
    // $a$ and $b$ makes $c$
    // Match 0: $a$, Match 1: $b$, Match 2: $c$
    // Text between: ' and ' (between 0 and 1), ' makes ' (between 1 and 2)
    const segs = parseMathSegments('$a$ and $b$ makes $c$');
    expect(segs).toHaveLength(5);
    // seg[0]: math $a$
    expect(segs[0].type).toBe('math');
    // seg[1]: text ' and '
    expect(segs[1].type).toBe('text');
    expect(segs[1].content).toBe(' and ');
    // seg[2]: math $b$
    expect(segs[2].type).toBe('math');
    // seg[3]: text ' makes '
    expect(segs[3].type).toBe('text');
    expect(segs[3].content).toBe(' makes ');
    // seg[4]: math $c$
    expect(segs[4].type).toBe('math');
  });

  it('escapes HTML in text segments', () => {
    const segs = parseMathSegments('<script>alert(1)</script>');
    expect(segs[0].content).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('handles text with newlines', () => {
    const segs = parseMathSegments('Line 1\nLine 2');
    expect(segs).toHaveLength(1);
    expect(segs[0].content).toContain('\n');
  });

  it('gracefully handles malformed inline math', () => {
    // No closing $ — treated as text
    const segs = parseMathSegments('$unclosed math');
    expect(segs).toHaveLength(1);
    expect(segs[0].type).toBe('text');
  });

  it('handles math at start and end', () => {
    const segs = parseMathSegments('$x$ and $y$');
    expect(segs).toHaveLength(3);
    expect(segs[0].type).toBe('math');
    expect(segs[1].type).toBe('text');
    expect(segs[1].content).toBe(' and ');
    expect(segs[2].type).toBe('math');
  });

  it('handles consecutive math with no text between', () => {
    const segs = parseMathSegments('$a$$b$');
    expect(segs).toHaveLength(2);
    expect(segs[0].type).toBe('math');
    expect(segs[1].type).toBe('math');
  });
});

describe('renderMath', () => {
  it('renders inline math', () => {
    const html = renderMath('x^2', 'inline');
    expect(html).toContain('katex');
    expect(html).not.toContain('katex-display');
  });

  it('renders block math', () => {
    const html = renderMath('\\sum_{i=1}^n i', 'block');
    expect(html).toContain('katex-display');
  });

  it('escapes error content for bad latex', () => {
    const html = renderMath('\\invalid{', 'inline');
    expect(html).toContain('katex');
  });
});
