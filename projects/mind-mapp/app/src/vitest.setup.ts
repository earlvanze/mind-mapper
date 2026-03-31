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
