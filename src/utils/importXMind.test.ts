import { describe, it, expect } from 'vitest';
import { parseXMind } from './importXMind';

describe('parseXMind', () => {
  it('parses basic XMind structure', () => {
    const xmind = `<?xml version="1.0" encoding="UTF-8"?>
<workbook>
  <sheet>
    <title>Test Map</title>
    <root-topic>
      <title>Root</title>
      <children>
        <topics>
          <topic>
            <title>Child 1</title>
          </topic>
          <topic>
            <title>Child 2</title>
          </topic>
        </topics>
      </children>
    </root-topic>
  </sheet>
</workbook>`;
    
    const nodes = parseXMind(xmind);
    
    // Should have root + 2 children = 3 nodes
    expect(Object.keys(nodes).length).toBeGreaterThanOrEqual(3);
    const root = Object.values(nodes).find(n => n.text === 'Root');
    expect(root).toBeDefined();
    expect(root!.children.length).toBeGreaterThanOrEqual(2);
  });

  it('handles empty sheet', () => {
    const xmind = `<?xml version="1.0" encoding="UTF-8"?>
<workbook><sheet><title>Empty</title><root-topic/></sheet></workbook>`;
    
    const nodes = parseXMind(xmind);
    expect(Object.keys(nodes).length).toBeGreaterThanOrEqual(1);
  });

  it('preserves node text', () => {
    const xmind = `<?xml version="1.0" encoding="UTF-8"?>
<workbook>
  <sheet>
    <title>Test</title>
    <root-topic>
      <title>My Root</title>
    </root-topic>
  </sheet>
</workbook>`;
    
    const nodes = parseXMind(xmind);
    const texts = Object.values(nodes).map(n => n.text);
    expect(texts).toContain('My Root');
  });
  
  it('parses nested children', () => {
    const xmind = `<?xml version="1.0" encoding="UTF-8"?>
<workbook>
  <sheet>
    <title>Nested</title>
    <root-topic>
      <title>Root</title>
      <children>
        <topics>
          <topic>
            <title>Level 1</title>
            <children>
              <topics>
                <topic><title>Level 2</title></topic>
              </topics>
            </children>
          </topic>
        </topics>
      </children>
    </root-topic>
  </sheet>
</workbook>`;
    
    const nodes = parseXMind(xmind);
    expect(Object.keys(nodes).length).toBeGreaterThanOrEqual(3);
    const level1 = Object.values(nodes).find(n => n.text === 'Level 1');
    expect(level1).toBeDefined();
    expect(level1!.children.length).toBeGreaterThan(0);
  });
});
