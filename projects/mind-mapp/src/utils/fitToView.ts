import { useMindMapStore } from '../store/useMindMapStore';
import { computeFitView } from './fitViewMath';

export function fitToView() {
  const el = document.querySelector('.canvas') as HTMLElement | null;
  if (!el) return;

  const nodes = Object.values(useMindMapStore.getState().nodes);
  const rect = el.getBoundingClientRect();
  const view = computeFitView(nodes, { width: rect.width, height: rect.height });

  const panZoom = (window as any).__mindmappPanZoom;
  if (panZoom?.setView) {
    panZoom.setView(view);
    return;
  }

  el.style.transform = `translate(${view.originX}px, ${view.originY}px) scale(${view.scale})`;
}
