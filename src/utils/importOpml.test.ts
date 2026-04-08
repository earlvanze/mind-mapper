import { describe, it, expect } from 'vitest';
import { parseOpml, isOpmlContent } from './importOpml';

describe('parseOpml', () => {
  it('parses a single root outline', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>Test</title></head>
  <body>
    <outline text="Root" />
  </body>
</opml>`;
    const nodes = parseOpml(xml);
    expect(Object.keys(nodes)).toHaveLength(1);
    const root = Object.values(nodes)[0];
    expect(root.text).toBe('Root');
    expect(root.parentId).toBeNull();
  });

  it('parses nested outlines as children', () => {
    const xml = `<?xml version="1.0"?>
<opml version="2.0">
  <body>
    <outline text="Root">
      <outline text="Child A" />
      <outline text="Child B" />
    </outline>
  </body>
</opml>`;
    const nodes = parseOpml(xml);
    expect(Object.keys(nodes).length).toBe(3);
    const root = Object.values(nodes).find((n) => n.parentId === null)!;
    expect(root.text).toBe('Root');
    expect(root.children).toHaveLength(2);
  });

  it('creates synthetic parent for multiple top-level outlines', () => {
    const xml = `<?xml version="1.0"?>
<opml version="2.0">
  <body>
    <outline text="Topic A" />
    <outline text="Topic B" />
  </body>
</opml>`;
    const nodes = parseOpml(xml);
    expect(Object.keys(nodes).length).toBe(3); // synthetic root + 2 children
    const root = Object.values(nodes).find((n) => n.parentId === null)!;
    expect(root.text).toBe('Root');
    expect(root.children).toHaveLength(2);
  });

  it('preserves tags from _tags attribute', () => {
    const xml = `<?xml version="1.0"?>
<opml version="2.0">
  <body>
    <outline text="Node with tags" _tags="important, work" />
  </body>
</opml>`;
    const nodes = parseOpml(xml);
    const node = Object.values(nodes)[0];
    expect(node.tags).toEqual(['important', 'work']);
  });

  it('preserves notes from _note attribute', () => {
    const xml = `<?xml version="1.0"?>
<opml version="2.0">
  <body>
    <outline text="Has note" _note="This is a note" />
  </body>
</opml>`;
    const nodes = parseOpml(xml);
    const node = Object.values(nodes)[0];
    expect(node.comment).toBe('This is a note');
  });

  it('preserves style attributes', () => {
    const xml = `<?xml version="1.0"?>
<opml version="2.0">
  <body>
    <outline text="Styled" _backgroundColor="#ff0000" _textColor="#0000ff" _bold="true" _italic="true" />
  </body>
</opml>`;
    const nodes = parseOpml(xml);
    const node = Object.values(nodes)[0];
    expect(node.style?.backgroundColor).toBe('#ff0000');
    expect(node.style?.textColor).toBe('#0000ff');
    expect(node.style?.bold).toBe(true);
    expect(node.style?.italic).toBe(true);
  });

  it('preserves collapsed state from _collapsed', () => {
    const xml = `<?xml version="1.0"?>
<opml version="2.0">
  <body>
    <outline text="Collapsed" _collapsed="true" />
  </body>
</opml>`;
    const nodes = parseOpml(xml);
    const node = Object.values(nodes)[0];
    expect(node.isCollapsed).toBe(true);
  });

  it('escapes XML entities in text', () => {
    const xml = `<?xml version="1.0"?>
<opml version="2.0">
  <body>
    <outline text="A &amp; B &lt;C&gt;" />
  </body>
</opml>`;
    const nodes = parseOpml(xml);
    const node = Object.values(nodes)[0];
    expect(node.text).toBe('A & B <C>');
  });

  it('throws on invalid XML', () => {
    expect(() => parseOpml('not xml at all')).toThrow('missing root element');
  });

  it('throws when body is missing', () => {
    expect(() => parseOpml('<?xml version="1.0"?><opml></opml>')).toThrow('missing <body>');
  });

  it('throws when no outline elements exist', () => {
    expect(() => parseOpml('<?xml version="1.0"?><opml><body></body></opml>')).toThrow('no <outline> elements');
  });

  it('handles deep nesting', () => {
    const xml = `<?xml version="1.0"?>
<opml version="2.0">
  <body>
    <outline text="L1">
      <outline text="L2">
        <outline text="L3">
          <outline text="L4" />
        </outline>
      </outline>
    </outline>
  </body>
</opml>`;
    const nodes = parseOpml(xml);
    expect(Object.keys(nodes)).toHaveLength(4);
    const leaf = Object.values(nodes).find((n) => n.text === 'L4')!;
    expect(leaf.parentId).not.toBeNull();
  });

  it('falls back to title attribute for text', () => {
    const xml = `<?xml version="1.0"?>
<opml version="2.0">
  <body>
    <outline title="Fallback Title" />
  </body>
</opml>`;
    const nodes = parseOpml(xml);
    const node = Object.values(nodes)[0];
    expect(node.text).toBe('Fallback Title');
  });
});

describe('isOpmlContent', () => {
  it('returns true for XML with opml tag', () => {
    expect(isOpmlContent('<?xml version="1.0"?><opml></opml>')).toBe(true);
  });

  it('returns true for XML with outline elements', () => {
    expect(isOpmlContent('<outline text="hello" />')).toBe(true);
  });

  it('returns false for plain text', () => {
    expect(isOpmlContent('just some text')).toBe(false);
  });

  it('returns false for JSON', () => {
    expect(isOpmlContent('{"nodes": {}}')).toBe(false);
  });

  it('requires <?xml prefix or outline+text for detection', () => {
    expect(isOpmlContent('<outline text="test" />')).toBe(true);
    expect(isOpmlContent('<body><outline text="test" /></body>')).toBe(true);
  });
});
