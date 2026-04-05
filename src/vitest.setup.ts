// Extend Vitest's expect with @testing-library/jest-dom matchers
import '@testing-library/jest-dom';

// Polyfill canvas for jsdom environment
const { createCanvas, DOMMatrix } = require('canvas');
(globalThis as any).createCanvas = createCanvas;
(globalThis as any).DOMMatrix = DOMMatrix;

// Make HTMLCanvasElement.getContext work in jsdom
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(contextType: string, args?: any) {
  if (contextType === '2d') {
    const canvas = createCanvas(this.width || 300, this.height || 150);
    return canvas.getContext(contextType, args);
  }
  return originalGetContext.call(this, contextType, args);
};

// Make XML DOMParser available globally in jsdom environment
// jsdom only has HTML DOMParser, not XML
import { DOMParser } from '@xmldom/xmldom';
(globalThis as any).DOMParser = DOMParser;

// Polyfill matchMedia for jsdom environment so vi.spyOn() works in tests.
// The mock is overwritten per-test via vi.spyOn(window, 'matchMedia').mockReturnValue(...)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});
