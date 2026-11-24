import type { Frame } from "./menu-store";

const MARGIN = 16;
const GAP = 10;

type Layout = { rowTop: number; menuTop: number; below: boolean };

/** Menu under the row; above it when it doesn't fit; else the row slides up so both do. */
export function placeMenu(row: Pick<Frame, "y" | "height">, menuHeight: number, screenHeight: number): Layout {
  const under = row.y + row.height + GAP;
  if (under + menuHeight <= screenHeight - MARGIN) return { rowTop: row.y, menuTop: under, below: true };

  const above = row.y - GAP - menuHeight;
  if (above >= MARGIN) return { rowTop: row.y, menuTop: above, below: false };

  const rowTop = Math.max(MARGIN, screenHeight - MARGIN - menuHeight - GAP - row.height);
  return { rowTop, menuTop: rowTop + row.height + GAP, below: true };
}
