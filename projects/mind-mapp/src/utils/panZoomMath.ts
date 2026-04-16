export type Point = { x: number; y: number };

export function clampScale(next: number) {
  return Math.min(2, Math.max(0.4, next));
}

export function distance(a: Point, b: Point) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

export function midpoint(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}
