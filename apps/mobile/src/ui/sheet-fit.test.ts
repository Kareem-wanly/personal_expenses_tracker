import assert from "node:assert/strict";
import { test } from "node:test";

import { fitAboveKeyboard } from "./sheet-fit";

const TOP = 60;

test("without the keyboard the sheet may use the whole screen", () => {
  assert.deepEqual(fitAboveKeyboard({ now: 2400, closed: 2400, sheet: 2000 }, 0, TOP), {
    height: "auto",
    maxHeight: 2340,
    marginBottom: 0,
  });
});

test("iOS: nothing shrinks, so the sheet is lifted and keeps its top", () => {
  const fit = fitAboveKeyboard({ now: 2400, closed: 2400, sheet: 2000 }, 900, TOP);
  assert.deepEqual(fit, { height: 1100, maxHeight: 1440, marginBottom: 900 });
});

test("Android already shrank the screen: no lift twice", () => {
  const fit = fitAboveKeyboard({ now: 1500, closed: 2400, sheet: 2000 }, 900, TOP);
  assert.deepEqual(fit, { height: 1100, maxHeight: 1440, marginBottom: 0 });
});

test("a short sheet rises above the keyboard, never past the top", () => {
  assert.deepEqual(fitAboveKeyboard({ now: 2400, closed: 2400, sheet: 600 }, 900, TOP), {
    height: 600,
    maxHeight: 1440,
    marginBottom: 900,
  });
  const tiny = fitAboveKeyboard({ now: 2400, closed: 2400, sheet: 2300 }, 2200, TOP);
  assert.ok(Number(tiny.height) <= 2400 - 2200 - TOP);
});
