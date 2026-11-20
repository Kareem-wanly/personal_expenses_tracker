import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type InsightInput, buildInsights } from "./insights";

const base: InsightInput = {
  currency: "USD",
  isCurrent: true,
  elapsedDays: 10,
  totalDays: 30,
  total: 50_000, // 500.00
  prevSamePeriod: 45_000,
  categories: [],
  monthlyBudget: null,
  income: 0,
  weekdayAverages: null,
  repeats: [],
  noSpendDays: 0,
  recurringMonthly: 0,
  largest: null,
  averageExpense: 0,
};
const ids = (i: Partial<InsightInput>) => buildInsights({ ...base, ...i }).map((x) => x.id);

describe("budget pace", () => {
  it("warns when the projection exceeds the budget", () =>
    assert.ok(ids({ monthlyBudget: 120_000 }).includes("budget-pace"))); // 500/10*30 = 1500 > 1200

  it("praises a comfortable pace", () =>
    assert.ok(ids({ monthlyBudget: 200_000 }).includes("budget-good")));

  it("flags an exceeded budget first", () =>
    assert.equal(ids({ monthlyBudget: 40_000 })[0], "budget-over"));

  it("no projection advice for past months", () => {
    const r = ids({ monthlyBudget: 120_000, isCurrent: false });
    assert.ok(!r.includes("budget-pace") && !r.includes("budget-good"));
  });
});

describe("income", () => {
  it("good savings rate", () => {
    const [first] = buildInsights({ ...base, income: 100_000 });
    assert.equal(first.id, "savings-rate");
    assert.equal(first.tone, "good");
  });
  it("spending above income", () =>
    assert.ok(ids({ income: 30_000 }).includes("savings-negative")));
  it("no income → no savings insight", () =>
    assert.ok(!ids({}).some((id) => id.startsWith("savings"))));
});

describe("categories", () => {
  const food = { id: "food", name: "طعام", icon: "🍔", budget: null };
  it("biggest increase", () =>
    assert.ok(ids({ categories: [{ ...food, total: 30_000, prevTotal: 15_000 }] }).includes("category-up-food")));
  it("decrease is praised", () =>
    assert.ok(ids({ categories: [{ ...food, total: 10_000, prevTotal: 20_000 }] }).includes("category-down-food")));
  it("ignores tiny absolute changes", () =>
    assert.ok(!ids({ categories: [{ ...food, total: 800, prevTotal: 200 }] }).includes("category-up-food")));
  it("category on track to exceed its budget", () =>
    assert.ok(
      ids({ categories: [{ ...food, budget: 40_000, total: 20_000, prevTotal: 0 }] }).includes("category-pace-food"),
    ));
});

describe("habits and patterns", () => {
  it("repeated small purchases", () =>
    assert.ok(ids({ repeats: [{ label: "قهوة", count: 9, total: 4_500 }] }).includes("habit-قهوة")));
  it("weekday needs a clear winner", () => {
    assert.ok(ids({ weekdayAverages: [10, 10, 10, 10, 40, 10, 10] }).includes("weekday"));
    assert.ok(!ids({ weekdayAverages: [10, 11, 10, 12, 11, 10, 10] }).includes("weekday"));
  });
  it("sorted by priority", () => {
    const r = buildInsights({ ...base, monthlyBudget: 40_000, noSpendDays: 4, income: 100_000 });
    for (let k = 1; k < r.length; k++) assert.ok(r[k - 1].priority >= r[k].priority);
  });
});
