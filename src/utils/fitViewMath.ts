import { clampScale } from './panZoomMath';

type PointNode = { x: number; y: number };

type Viewport = {
  width: number;
  height: number;
};

export type FitView = {
  originX: number;
  originY: number;
  scale: number;
};

export function computeFitView(
  nodes: PointNode[],
  viewport: Viewport,
  options?: { padding?: number; minScale?: number; maxScale?: number },
): FitView {
  const padding = options?.padding ?? 100;
  const minScale = options?.minScale ?? 0.4;
  const maxScale = options?.maxScale ?? 1.6;

  if (!nodes.length || viewport.width <= 0 || viewport.height <= 0) {
    return { originX: 0, originY: 0, scale: 1 };
  }

  const minX = Math.min(...nodes.map(n => n.x));
  const maxX = Math.max(...nodes.map(n => n.x));
  const minY = Math.min(...nodes.map(n => n.y));
  const maxY = Math.max(...nodes.map(n => n.y));

  const width = Math.max(1, maxX - minX + padding);
  const height = Math.max(1, maxY - minY + padding);

  const scaleX = viewport.width / width;
  const scaleY = viewport.height / height;
  const scale = Math.min(maxScale, Math.max(minScale, Math.min(scaleX, scaleY)));

  const originX = -minX + padding / 2;
  const originY = -minY + padding / 2;

  return {
    originX,
    originY,
    scale: clampScale(scale),
  };
}
