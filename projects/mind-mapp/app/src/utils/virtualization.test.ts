import { describe, it, expect } from 'vitest';
import { getVisibleNodes, getNodeBounds } from './virtualization';
import { Node } from '../store/useMindMapStore';

describe('virtualization', () => {
  describe('getVisibleNodes', () => {
    it('returns nodes within viewport', () => {
      const nodes: Record<string, Node> = {
        n1: { id: 'n1', text: 'A', x: 0, y: 0, parentId: null, children: ['n2'] },
        n2: { id: 'n2', text: 'B', x: 200, y: 0, parentId: 'n1', children: [] },
        n3: { id: 'n3', text: 'C', x: 1000, y: 0, parentId: null, children: [] },
      };

      const viewport = { x: 0, y: 0, scale: 1, width: 800, height: 600 };
      const result = getVisibleNodes(nodes, viewport, 1.0);

      expect(result.visibleNodes).toContain('n1');
      expect(result.visibleNodes).toContain('n2');
      expect(result.visibleNodes).not.toContain('n3');
    });

    it('includes buffer zone', () => {
      const nodes: Record<string, Node> = {
        n1: { id: 'n1', text: 'A', x: 0, y: 0, parentId: null, children: [] },
        n2: { id: 'n2', text: 'B', x: 850, y: 0, parentId: null, children: [] },
      };

      const viewport = { x: 0, y: 0, scale: 1, width: 800, height: 600 };
      
      // Without buffer, n2 should be outside
      const result1 = getVisibleNodes(nodes, viewport, 1.0);
      expect(result1.visibleNodes).not.toContain('n2');

      // With buffer, n2 should be included
      const result2 = getVisibleNodes(nodes, viewport, 1.2);
      expect(result2.visibleNodes).toContain('n2');
    });

    it('handles zoom', () => {
      const nodes: Record<string, Node> = {
        n1: { id: 'n1', text: 'A', x: 0, y: 0, parentId: null, children: [] },
        n2: { id: 'n2', text: 'B', x: 500, y: 0, parentId: null, children: [] },
      };

      // Zoomed out: both visible
      const viewport1 = { x: 0, y: 0, scale: 0.5, width: 800, height: 600 };
      const result1 = getVisibleNodes(nodes, viewport1, 1.0);
      expect(result1.visibleNodes).toContain('n1');
      expect(result1.visibleNodes).toContain('n2');

      // Zoomed in: only n1 visible
      const viewport2 = { x: 0, y: 0, scale: 2, width: 800, height: 600 };
      const result2 = getVisibleNodes(nodes, viewport2, 1.0);
      expect(result2.visibleNodes).toContain('n1');
      expect(result2.visibleNodes).not.toContain('n2');
    });

    it('includes edges between visible nodes', () => {
      const nodes: Record<string, Node> = {
        n1: { id: 'n1', text: 'A', x: 0, y: 0, parentId: null, children: ['n2'] },
        n2: { id: 'n2', text: 'B', x: 200, y: 0, parentId: 'n1', children: [] },
      };

      const viewport = { x: 0, y: 0, scale: 1, width: 800, height: 600 };
      const result = getVisibleNodes(nodes, viewport, 1.0);

      expect(result.visibleEdges).toEqual([
        { parentId: 'n1', childId: 'n2' },
      ]);
    });

    it('includes edges if either endpoint is visible', () => {
      const nodes: Record<string, Node> = {
        n1: { id: 'n1', text: 'A', x: 0, y: 0, parentId: null, children: ['n2'] },
        n2: { id: 'n2', text: 'B', x: 2000, y: 0, parentId: 'n1', children: [] },
      };

      const viewport = { x: 0, y: 0, scale: 1, width: 800, height: 600 };
      const result = getVisibleNodes(nodes, viewport, 1.0);

      // n1 is visible, n2 is not, but edge should still be included
      expect(result.visibleNodes).toContain('n1');
      expect(result.visibleNodes).not.toContain('n2');
      expect(result.visibleEdges).toEqual([
        { parentId: 'n1', childId: 'n2' },
      ]);
    });
  });

  describe('getNodeBounds', () => {
    it('calculates bounds of all nodes', () => {
      const nodes: Record<string, Node> = {
        n1: { id: 'n1', text: 'A', x: 0, y: 0, parentId: null, children: [] },
        n2: { id: 'n2', text: 'B', x: 200, y: 100, parentId: null, children: [] },
        n3: { id: 'n3', text: 'C', x: -50, y: -50, parentId: null, children: [] },
      };

      const bounds = getNodeBounds(nodes);

      expect(bounds.minX).toBe(-50);
      expect(bounds.minY).toBe(-50);
      expect(bounds.maxX).toBe(320); // 200 + 120 (node width)
      expect(bounds.maxY).toBe(140); // 100 + 40 (node height)
    });

    it('returns zero bounds for empty map', () => {
      const bounds = getNodeBounds({});

      expect(bounds).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
    });
  });
});
