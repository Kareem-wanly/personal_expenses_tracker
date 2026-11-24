import assert from "node:assert/strict";
import { test } from "node:test";

import { approximate, moneyList } from "./summary";

const totals = [
  { currency: "USD", total: 10_000 },
  { currency: "EUR", total: 5_000 },
];

test("several currencies become one figure, or none at all", () => {
  assert.equal(approximate(totals, "USD", [1, 1.1]), 15_500);
  assert.equal(approximate(totals, "USD", [1, null]), null);
  assert.equal(approximate(totals, "USD", [1]), null);
  assert.equal(approximate([totals[0]], "USD", [1]), null);
  assert.equal(approximate([], "USD", []), null);
});

test("amounts are listed per currency", () => {
  assert.match(moneyList(totals), /100.* · .*50/);
});
