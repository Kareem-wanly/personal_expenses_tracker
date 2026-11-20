import assert from "node:assert/strict";
import { it } from "node:test";

import { countExpenses, countTimes, timesBigger } from "./plural";

it("times and multiples", () => {
  assert.equal(countTimes(2), "مرتين");
  assert.equal(countTimes(5), "5 مرات");
  assert.equal(countTimes(12), "12 مرة");
  assert.equal(timesBigger(2.1), "ضعف");
  assert.equal(timesBigger(3.4), "3 أضعاف");
  assert.equal(timesBigger(13.3), "13 ضعف");
});

it("Arabic count agreement", () => {
  assert.equal(countExpenses(1), "مصروف واحد");
  assert.equal(countExpenses(2), "مصروفين");
  assert.equal(countExpenses(3), "3 مصاريف");
  assert.equal(countExpenses(10), "10 مصاريف");
  assert.equal(countExpenses(11), "11 مصروفاً");
  assert.equal(countExpenses(103), "103 مصاريف");
});
