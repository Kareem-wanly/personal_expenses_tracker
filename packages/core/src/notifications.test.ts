import assert from "node:assert/strict";
import { test } from "node:test";

import { budgetAlert, debtReminder, monthSummary } from "./notifications";

const base = { budget: 1000, currency: "USD", month: "2026-03" };

test("a budget alert only when a threshold is crossed", () => {
  assert.equal(budgetAlert({ ...base, before: 100, after: 700 }), null);
  assert.match(budgetAlert({ ...base, before: 700, after: 800 })!.title, /اقتربت/);
  assert.equal(budgetAlert({ ...base, before: 800, after: 900 }), null);
  assert.match(budgetAlert({ ...base, before: 100, after: 1000 })!.title, /تجاوزت/);
  assert.equal(budgetAlert({ ...base, before: 900, after: 100 }), null);
});

test("debt reminder says when", () => {
  const debt = { direction: "lent" as const, person: "سامر", remaining: 100, currency: "USD" };
  assert.match(debtReminder([{ ...debt, dueIn: 0 }]).title, /اليوم/);
  assert.match(debtReminder([{ ...debt, dueIn: 1 }]).title, /غداً/);
});

test("month summary compares with the month before", () => {
  const summary = { month: "2026-03", total: 1500, currency: "USD" };
  assert.match(monthSummary({ ...summary, prevTotal: 1000 }).body, /أكثر/);
  assert.match(monthSummary({ ...summary, prevTotal: 3000 }).body, /أقل/);
  assert.doesNotMatch(monthSummary({ ...summary, prevTotal: 0 }).body, /الشهر السابق/);
});
