type Point = { x: number; y: number };

type Viewport = { width: number; height: number };

export function centerPointInView(point: Point, viewport: Viewport, scale: number) {
  return {
    originX: viewport.width / 2 - point.x * scale,
    originY: viewport.height / 2 - point.y * scale,
  };
}
