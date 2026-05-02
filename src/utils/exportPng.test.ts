import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as htmlToImageModule from 'html-to-image';

describe('exportPng', () => {
  let toPngSpy: ReturnType<typeof vi.spyOn>;
  let clickedLinks: HTMLAnchorElement[];

  beforeEach(() => {
    clickedLinks = [];
    vi.restoreAllMocks();

    toPngSpy = vi.spyOn(htmlToImageModule, 'toPng').mockResolvedValue('data:image/png;base64,iVBORw0KGgo=');

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const a = origCreateElement(tag) as HTMLAnchorElement;
        a.click = vi.fn();
        clickedLinks.push(a);
        return a;
      }
      return origCreateElement(tag);
    });
  });

  it('calls toPng with correct options', async () => {
    const { exportPng } = await import('./exportPng');
    const element = document.createElement('div');
    element.style.transform = 'translate(10px, 20px) scale(1.5)';

    await exportPng(element);

    expect(toPngSpy).toHaveBeenCalledWith(element, expect.objectContaining({
      cacheBust: true,
      backgroundColor: '#f8f9fb',
      pixelRatio: 2,
    }));
  });

  it('triggers download with correct filename', async () => {
    const { exportPng } = await import('./exportPng');
    const element = document.createElement('div');
    await exportPng(element);
    expect(clickedLinks[0]?.download).toBe('mindmapp.png');
  });

  it('restores element transform after export', async () => {
    const { exportPng } = await import('./exportPng');
    const element = document.createElement('div');
    element.style.transform = 'translate(5px, 10px) scale(2)';
    await exportPng(element);
    expect(element.style.transform).toBe('translate(5px, 10px) scale(2)');
  });
});
