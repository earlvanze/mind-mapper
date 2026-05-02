import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportJsonData } from './exportJson';
import type { Node } from '../store/useMindMapStore';

describe('exportJsonData', () => {
  const sampleNodes: Record<string, Node> = {
    n_root: { id: 'n_root', text: 'Root', x: 0, y: 0, parentId: null, children: ['n_1'] },
    n_1: { id: 'n_1', text: 'Child', x: 100, y: 0, parentId: 'n_root', children: [] },
  };

  let createdBlobs: Blob[] = [];
  let createdLinks: HTMLAnchorElement[] = [];

  beforeEach(() => {
    createdBlobs = [];
    createdLinks = [];
    vi.restoreAllMocks();

    vi.stubGlobal('Blob', class extends Blob {
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        super(parts, opts);
        createdBlobs.push(this);
      }
    });

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    });

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const a = origCreateElement(tag) as HTMLAnchorElement;
        a.click = vi.fn();
        Object.defineProperty(a, 'href', { value: 'blob:test', writable: true, configurable: true });
        Object.defineProperty(a, 'download', { value: '', writable: true, configurable: true });
        createdLinks.push(a);
        return a;
      }
      return origCreateElement(tag);
    });
  });

  it('creates a blob with correct JSON structure', async () => {
    exportJsonData(sampleNodes);
    expect(createdBlobs.length).toBe(1);
    const text = await createdBlobs[0].text();
    const parsed = JSON.parse(text);
    expect(parsed.version).toBe(1);
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.nodes).toEqual(sampleNodes);
  });

  it('triggers download via anchor click', () => {
    exportJsonData(sampleNodes);
    expect(createdLinks.length).toBe(1);
    expect(createdLinks[0].download).toBe('mindmapp.json');
    expect(createdLinks[0].click).toHaveBeenCalled();
  });

  it('revokes the object URL after download', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    exportJsonData(sampleNodes);
    expect(revokeSpy).toHaveBeenCalledWith('blob:test');
  });
});
