import assert from "node:assert/strict";
import { test } from "node:test";

import { arcsOf, sliceAt } from "./arcs";

test("slices follow each other and fill the ring", () => {
  const [first, second] = arcsOf([75, 25]);
  assert.equal(first.start, 0);
  assert.equal(second.start, 0.75);
  assert.ok(first.length < 0.75 && first.length > 0.74);
  assert.deepEqual(arcsOf([10]), [{ start: 0, length: 1 }]);
  assert.deepEqual(arcsOf([0]), [{ start: 0, length: 0 }]);
});

test("a touch finds its slice", () => {
  const ring = { size: 200, inner: 60 };
  const arcs = arcsOf([75, 25]);
  assert.equal(sliceAt(190, 100, ring, arcs), 0); // right: a quarter turn
  assert.equal(sliceAt(100, 190, ring, arcs), 0); // bottom: half a turn
  assert.equal(sliceAt(20, 70, ring, arcs), 1); // left, past three quarters
  assert.equal(sliceAt(100, 100, ring, arcs), null); // the middle
  assert.equal(sliceAt(0, 0, ring, arcs), null); // outside
});
