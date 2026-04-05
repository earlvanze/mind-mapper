import { describe, it, expect } from 'vitest';
import { parseXMind } from './importXMind';

describe('parseXMind FreeMind compatibility', () => {
  it('parses FreeMind FOLDED="true" as isCollapsed', () => {
    const freemind = `<?xml version="1.0" encoding="UTF-8"?>
<map version="0.9.0">
  <node TEXT="Root">
    <node TEXT="Child 1"></node>
    <node TEXT="Collapsed Node" FOLDED="true">
      <node TEXT="Hidden Child"></node>
    </node>
    <node TEXT="Child 3"></node>
  </node>
</map>`;

    const nodes = parseXMind(freemind);
    const collapsedNode = Object.values(nodes).find(n => n.text === 'Collapsed Node');
    expect(collapsedNode).toBeDefined();
    expect(collapsedNode!.isCollapsed).toBe(true);
  });

  it('does not set isCollapsed for nodes without FOLDED attribute', () => {
    const freemind = `<?xml version="1.0" encoding="UTF-8"?>
<map version="0.9.0">
  <node TEXT="Root">
    <node TEXT="Normal Child"></node>
  </node>
</map>`;

    const nodes = parseXMind(freemind);
    const child = Object.values(nodes).find(n => n.text === 'Normal Child');
    expect(child).toBeDefined();
    expect(child!.isCollapsed).toBeUndefined();
  });

  it('parses FreeMind TEXT attribute as node text', () => {
    const freemind = `<?xml version="1.0" encoding="UTF-8"?>
<map version="0.9.0">
  <node TEXT="Root">
    <node TEXT="Via Attribute"></node>
  </node>
</map>`;

    const nodes = parseXMind(freemind);
    const texts = Object.values(nodes).map(n => n.text);
    expect(texts).toContain('Root');
    expect(texts).toContain('Via Attribute');
  });

  it('preserves isCollapsed through nested structure', () => {
    const freemind = `<?xml version="1.0" encoding="UTF-8"?>
<map version="0.9.0">
  <node TEXT="Root" FOLDED="true">
    <node TEXT="Level 1" FOLDED="true">
      <node TEXT="Level 2"></node>
    </node>
  </node>
</map>`;

    const nodes = parseXMind(freemind);
    const root = Object.values(nodes).find(n => n.text === 'Root');
    const level1 = Object.values(nodes).find(n => n.text === 'Level 1');
    expect(root!.isCollapsed).toBe(true);
    expect(level1!.isCollapsed).toBe(true);
  });
});
