import assert from "node:assert/strict";
import { test } from "node:test";

import { commits, revealedTab, rubberBand } from "./swipe";

test("pulling right shows the next tab, and stops at the ends", () => {
  assert.equal(revealedTab(0, 50, 4), 1);
  assert.equal(revealedTab(0, -50, 4), null);
  assert.equal(revealedTab(3, 50, 4), null);
  assert.equal(revealedTab(3, -50, 4), 2);
  assert.equal(revealedTab(1, 0, 4), null);
});

test("a long drag or a flick in the same direction commits", () => {
  assert.equal(commits(120, 0, 400), true);
  assert.equal(commits(60, 0, 400), false);
  assert.equal(commits(60, 900, 400), true);
  assert.equal(commits(60, -900, 400), false);
});

test("the edge resists more and more and never passes the width", () => {
  assert.ok(rubberBand(100, 400) < 100);
  assert.ok(rubberBand(-5000, 400) > -400);
  assert.equal(Math.sign(rubberBand(-10, 400)), -1);
});
