import assert from "node:assert/strict";
import { test } from "node:test";

import { placeMenu } from "./menu-layout";

test("under the row, above it, or the row moves up", () => {
  assert.deepEqual(placeMenu({ y: 100, height: 60 }, 150, 800), { rowTop: 100, menuTop: 170, below: true });
  assert.deepEqual(placeMenu({ y: 700, height: 60 }, 150, 800), { rowTop: 700, menuTop: 540, below: false });
  const tight = placeMenu({ y: 120, height: 60 }, 150, 300);
  assert.ok(tight.menuTop + 150 <= 300 - 16);
  assert.ok(tight.rowTop < 120);
});
