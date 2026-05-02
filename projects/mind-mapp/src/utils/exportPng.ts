import { toPng } from 'html-to-image';

export async function exportPng(element: HTMLElement) {
  const prev = element.style.transform;
  element.style.transform = 'translate(0px, 0px) scale(1)';
  const dataUrl = await toPng(element, { cacheBust: true, backgroundColor: '#f8f9fb', pixelRatio: 2 });
  element.style.transform = prev;
  const link = document.createElement('a');
  link.download = 'mindmapp.png';
  link.href = dataUrl;
  link.click();
}
