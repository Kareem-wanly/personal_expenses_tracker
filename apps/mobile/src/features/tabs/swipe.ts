/** Committed when dragged past this share of the width… */
export const COMMIT_RATIO = 0.28;
/** …or flicked faster than this (points per second). */
export const COMMIT_VELOCITY = 550;

/** Resistance that grows the further you pull. */
export function rubberBand(offset: number, width: number): number {
  "worklet";
  const pull = (Math.abs(offset) * 0.55) / width;
  return Math.sign(offset) * (1 - 1 / (pull + 1)) * width;
}

/** The tab a drag reveals: pulling the page to the right shows the next one (it waits on the left). */
export function revealedTab(index: number, offset: number, count: number): number | null {
  "worklet";
  if (offset === 0) return null;
  const target = index + (offset > 0 ? 1 : -1);
  return target >= 0 && target < count ? target : null;
}

export function commits(offset: number, velocity: number, width: number): boolean {
  "worklet";
  const far = Math.abs(offset) > width * COMMIT_RATIO;
  const flicked = Math.abs(velocity) > COMMIT_VELOCITY && Math.sign(velocity) === Math.sign(offset);
  return far || flicked;
}
