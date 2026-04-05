import { describe, it, expect } from 'vitest';
import CanvasRenderer from './CanvasRenderer';

describe('CanvasRenderer', () => {
  it('exports a component', () => {
    expect(CanvasRenderer).toBeDefined();
    expect(typeof CanvasRenderer).toBe('object'); // memo returns an object
  });
});
