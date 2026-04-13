import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Node } from '../store/useMindMapStore';

const makeNode = (overrides: Partial<Node>): Node => ({
  id: 'n_test',
  text: 'Test',
  x: 0,
  y: 0,
  parentId: null,
  children: [],
  ...overrides,
});

describe('exportPdf helpers', () => {
  // We test the pure-logic helpers that don't require jsPDF DOM
  // The actual exportPdf function requires a real DOM element (html2canvas dependency)
  // which is integration-level, not unit-testable without heavy mocking.

  describe('cleanText (via exportPdf logic)', () => {
    it('trims leading/trailing whitespace and normalizes newlines', async () => {
      const { cleanText } = await import('./exportPdf');
      expect(cleanText('  hello \n\n world  ')).toBe('hello   world');
    });

    it('collapses multiple newlines to single space', async () => {
      const { cleanText } = await import('./exportPdf');
      expect(cleanText('a\n\n\nb')).toBe('a b');
    });
  });

  describe('sortIds', () => {
    it('sorts by y then x then text', async () => {
      const { sortIds } = await import('./exportPdf');
      const nodes: Record<string, Node> = {
        a: makeNode({ id: 'a', y: 100, x: 50, text: 'Z' }),
        b: makeNode({ id: 'b', y: 50, x: 10, text: 'A' }),
        c: makeNode({ id: 'c', y: 50, x: 20, text: 'M' }),
      };
      const result = sortIds(['a', 'b', 'c'], nodes);
      expect(result).toEqual(['b', 'c', 'a']);
    });

    it('puts missing nodes after existing ones (localeCompare)', async () => {
      const { sortIds } = await import('./exportPdf');
      const nodes: Record<string, Node> = {
        a: makeNode({ id: 'a', y: 10 }),
      };
      const result = sortIds(['a', 'missing', 'b'], nodes as any);
      // 'b' < 'missing' alphabetically, so order is: a, b, missing
      expect(result).toEqual(['a', 'b', 'missing']);
    });
  });

  describe('estimateNodeHeight', () => {
    it('estimates taller height for longer text', async () => {
      const { estimateNodeHeight } = await import('./exportPdf');
      const short = estimateNodeHeight('Hi', 11);
      const long = estimateNodeHeight('This is a very long text that should require more lines', 11);
      expect(long).toBeGreaterThan(short);
    });
  });
});
