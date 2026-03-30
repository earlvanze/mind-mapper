// Make XML DOMParser available globally in jsdom environment
// jsdom only has HTML DOMParser, not XML
import { DOMParser } from '@xmldom/xmldom';
(globalThis as any).DOMParser = DOMParser;
