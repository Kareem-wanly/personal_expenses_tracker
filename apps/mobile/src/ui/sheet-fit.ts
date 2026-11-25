/** With the keyboard open, a tall sheet keeps at least this share of the free space. */
const MIN_SHARE = 0.4;

/** Heights of the free area (now, and with the keyboard closed) and of the sheet when closed. */
export type Space = { now: number; closed: number; sheet: number };

/**
 * Where the sheet goes when the keyboard opens. Android may already shrink the
 * screen for it, iOS doesn't: only what is still covered is lifted. A tall sheet
 * keeps its top and gets shorter instead of jumping to the top of the screen.
 */
export function fitAboveKeyboard({ now, closed, sheet }: Space, keyboard: number, top: number) {
  "worklet";
  const covered = Math.max(0, keyboard - (closed - now));
  const room = now - covered - top;
  // Every key every time: an animated style keeps a value that is left out.
  if (keyboard === 0 || sheet === 0) return { height: "auto" as const, maxHeight: room, marginBottom: 0 };
  const keptTop = closed - sheet;
  // Fits whole above the keyboard: it simply rises. Too tall: it keeps its top and shrinks.
  const height = sheet <= room ? sheet : Math.min(room, Math.max(now - covered - keptTop, room * MIN_SHARE));
  return { height, maxHeight: room, marginBottom: covered };
}
