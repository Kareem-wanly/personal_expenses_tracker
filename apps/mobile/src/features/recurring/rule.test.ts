import assert from "node:assert/strict";
import { test } from "node:test";

import { monthlyExpenses } from "./rule";

const rule = { kind: "expense" as const, active: true, amount: 1200 };

test("the monthly cost counts active expenses only", () => {
  const rules = [
    { ...rule, frequency: "monthly" as const },
    { ...rule, frequency: "yearly" as const },
    { ...rule, frequency: "weekly" as const },
    { ...rule, frequency: "monthly" as const, active: false },
    { ...rule, frequency: "monthly" as const, kind: "income" as const },
  ];
  assert.equal(monthlyExpenses(rules), 1200 + 100 + 5200);
});
