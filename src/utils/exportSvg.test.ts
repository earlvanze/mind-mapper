import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as htmlToImageModule from 'html-to-image';

describe('exportSvg', () => {
  let toSvgSpy: ReturnType<typeof vi.spyOn>;
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let clickedLinks: HTMLAnchorElement[];

  beforeEach(() => {
    clickedLinks = [];
    vi.restoreAllMocks();

    toSvgSpy = vi.spyOn(htmlToImageModule, 'toSvg').mockResolvedValue('data:image/svg+xml;base64,PHN2Zz4=');

    const origCreateElement = document.createElement.bind(document);
    createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const a = origCreateElement(tag) as HTMLAnchorElement;
        a.click = vi.fn();
        clickedLinks.push(a);
        return a;
      }
      return origCreateElement(tag);
    });
  });

  it('calls toSvg with correct options', async () => {
    const { exportSvg } = await import('./exportSvg');
    const element = document.createElement('div');
    element.style.transform = 'translate(10px, 20px) scale(1.5)';

    await exportSvg(element);

    expect(toSvgSpy).toHaveBeenCalledWith(element, expect.objectContaining({
      cacheBust: true,
      backgroundColor: '#f8f9fb',
    }));
  });

  it('uses default filename mindmapp.svg', async () => {
    const { exportSvg } = await import('./exportSvg');
    const element = document.createElement('div');
    await exportSvg(element);
    expect(clickedLinks[0]?.download).toBe('mindmapp.svg');
  });

  it('uses custom filename when provided', async () => {
    const { exportSvg } = await import('./exportSvg');
    const element = document.createElement('div');
    await exportSvg(element, 'my-custom-map.svg');
    expect(clickedLinks[0]?.download).toBe('my-custom-map.svg');
  });

  it('restores element transform after export', async () => {
    const { exportSvg } = await import('./exportSvg');
    const element = document.createElement('div');
    element.style.transform = 'translate(10px, 20px) scale(1.5)';
    await exportSvg(element);
    expect(element.style.transform).toBe('translate(10px, 20px) scale(1.5)');
  });
});
