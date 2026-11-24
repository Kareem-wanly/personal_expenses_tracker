export type Arc = { start: number; length: number };

const GAP = 0.006;

/** Shares of a ring (0–1), with a small gap between slices. */
export function arcsOf(values: number[]): Arc[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  const gap = values.length > 1 ? GAP : 0;
  let start = 0;
  return values.map((value) => {
    const share = total > 0 ? value / total : 0;
    const arc = { start, length: Math.max(0, share - gap) };
    start += share;
    return arc;
  });
}

type Ring = { size: number; inner: number };

/** Which slice a touch lands on; the ring starts at the top and turns clockwise. */
export function sliceAt(x: number, y: number, { size, inner }: Ring, arcs: Arc[]): number | null {
  const dx = x - size / 2;
  const dy = y - size / 2;
  const distance = Math.hypot(dx, dy);
  if (distance < inner || distance > size / 2) return null;
  const turn = (Math.atan2(dx, -dy) / (2 * Math.PI) + 1) % 1;
  const index = arcs.findLastIndex((arc) => arc.start <= turn);
  return index === -1 ? null : index;
}
