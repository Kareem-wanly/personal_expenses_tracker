import assert from "node:assert/strict";
import { it } from "node:test";

import { countExpenses } from "./plural";

it("Arabic count agreement", () => {
  assert.equal(countExpenses(1), "مصروف واحد");
  assert.equal(countExpenses(2), "مصروفين");
  assert.equal(countExpenses(3), "3 مصاريف");
  assert.equal(countExpenses(10), "10 مصاريف");
  assert.equal(countExpenses(11), "11 مصروفاً");
  assert.equal(countExpenses(103), "103 مصاريف");
});
