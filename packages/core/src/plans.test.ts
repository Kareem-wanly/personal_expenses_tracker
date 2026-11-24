import assert from "node:assert/strict";
import { test } from "node:test";

import { daysBetween, debtState, dueLabel, goalState, totalsByCurrency } from "./plans";

test("daysBetween counts calendar days across months and DST", () => {
  assert.equal(daysBetween("2026-11-22", "2026-11-22"), 0);
  assert.equal(daysBetween("2026-11-22", "2026-12-01"), 9);
  assert.equal(daysBetween("2026-03-01", "2026-02-27"), -2);
  assert.equal(daysBetween("2026-03-28", "2026-03-30"), 2);
});

test("debtState: partial payments, settled, overdue", () => {
  const open = debtState({ amount: 100_00, paid: 40_00, dueDate: "2026-11-20", settledAt: null }, "2026-11-22");
  assert.deepEqual(open, { remaining: 60_00, ratio: 0.4, settled: false, dueIn: -2, overdue: true });

  const paidUp = debtState({ amount: 100_00, paid: 100_00, dueDate: "2026-11-20" }, "2026-11-22");
  assert.equal(paidUp.settled, true);
  assert.equal(paidUp.overdue, false, "a settled debt is never overdue");

  const forgiven = debtState({ amount: 100_00, paid: 0, dueDate: null, settledAt: Date.now() }, "2026-11-22");
  assert.equal(forgiven.settled, true);
  assert.equal(forgiven.remaining, 0, "marked settled → nothing left");
  assert.equal(forgiven.dueIn, null);

  const overpaid = debtState({ amount: 50_00, paid: 70_00, dueDate: null }, "2026-11-22");
  assert.equal(overpaid.remaining, 0);
  assert.equal(overpaid.ratio, 1);
});

test("dueLabel reads naturally in Arabic", () => {
  assert.equal(dueLabel(0), "يستحق اليوم");
  assert.equal(dueLabel(1), "يستحق غداً");
  assert.equal(dueLabel(2), "بعد يومين");
  assert.equal(dueLabel(5), "بعد 5 أيام");
  assert.equal(dueLabel(14), "بعد 14 يوماً");
  assert.equal(dueLabel(-1), "متأخر يوماً");
  assert.equal(dueLabel(-3), "متأخر 3 أيام");
});

test("goalState: per-month amount and pace", () => {
  const g = goalState({ target: 6000_00, saved: 1200_00, deadline: "2027-11-22", start: "2026-11-22" }, "2027-05-22");
  assert.equal(g.remaining, 4800_00);
  assert.equal(g.ratio, 0.2);
  assert.equal(g.monthsLeft, 7, "184 days ≈ 6.04 months → 7 (round up)");
  assert.equal(g.perMonth, Math.ceil(4800_00 / 7));
  assert.ok(g.pace! > 0.49 && g.pace! < 0.51, "half the time has passed");
  assert.equal(g.late, false);
});

test("goalState: achieved, late, no deadline", () => {
  const done = goalState({ target: 100_00, saved: 120_00, deadline: "2026-12-01", start: "2026-11-01" }, "2026-11-22");
  assert.equal(done.achieved, true);
  assert.equal(done.perMonth, null);
  assert.equal(done.ratio, 1);

  const late = goalState({ target: 100_00, saved: 30_00, deadline: "2026-11-01", start: "2026-10-01" }, "2026-11-22");
  assert.equal(late.late, true);
  assert.equal(late.monthsLeft, 0);
  assert.equal(late.perMonth, 70_00, "everything left is due now");
  assert.equal(late.pace, 1);

  const open = goalState({ target: 100_00, saved: 0, deadline: null, start: "2026-11-01" }, "2026-11-22");
  assert.deepEqual([open.monthsLeft, open.perMonth, open.pace, open.late], [null, null, null, false]);

  const soon = goalState({ target: 100_00, saved: 0, deadline: "2026-11-25", start: "2026-11-01" }, "2026-11-22");
  assert.equal(soon.monthsLeft, 1, "a few days left still counts as one month");
});

test("totalsByCurrency groups and sorts", () => {
  const rows = [
    { c: "USD", a: 100 },
    { c: "SYP", a: 5000 },
    { c: "USD", a: 50 },
    { c: "EUR", a: 0 },
  ];
  assert.deepEqual(
    totalsByCurrency(rows, (r) => ({ currency: r.c, amount: r.a })),
    [
      { currency: "SYP", total: 5000 },
      { currency: "USD", total: 150 },
    ],
  );
});
