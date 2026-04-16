export function edgePath(x1: number, y1: number, x2: number, y2: number) {
  const horizontal = Math.abs(x2 - x1);
  const bend = Math.max(48, Math.min(180, horizontal * 0.5));
  const c1x = x1 + bend;
  const c2x = x2 - bend;
  return `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;
}
