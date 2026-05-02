import { toSvg } from 'html-to-image';
import { Node } from '../store/useMindMapStore';

export async function exportSvg(element: HTMLElement, filename = 'mindmapp.svg') {
  const prev = element.style.transform;
  element.style.transform = 'translate(0px, 0px) scale(1)';
  const dataUrl = await toSvg(element, { cacheBust: true, backgroundColor: '#f8f9fb' });
  element.style.transform = prev;
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
