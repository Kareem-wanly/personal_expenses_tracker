import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { dueOccurrences, nextOccurrence } from "./recurrence";

describe("nextOccurrence", () => {
  it("weekly adds 7 days across months", () =>
    assert.equal(nextOccurrence("2026-11-28", "weekly", "2026-11-28"), "2026-12-05"));

  it("monthly keeps the day", () =>
    assert.equal(nextOccurrence("2026-11-05", "monthly", "2026-11-05"), "2026-12-05"));

  it("monthly rolls the year", () =>
    assert.equal(nextOccurrence("2026-12-15", "monthly", "2026-01-15"), "2027-01-15"));

  it("31st clamps to short months and comes back", () => {
    assert.equal(nextOccurrence("2027-01-31", "monthly", "2027-01-31"), "2027-02-28");
    assert.equal(nextOccurrence("2027-02-28", "monthly", "2027-01-31"), "2027-03-31");
    assert.equal(nextOccurrence("2027-03-31", "monthly", "2027-01-31"), "2027-04-30");
  });

  it("leap years", () =>
    assert.equal(nextOccurrence("2028-01-30", "monthly", "2028-01-30"), "2028-02-29"));

  it("yearly on Feb 29 falls back to Feb 28", () =>
    assert.equal(nextOccurrence("2028-02-29", "yearly", "2028-02-29"), "2029-02-28"));

  it("yearly returns to Feb 29 in the next leap year", () =>
    assert.equal(nextOccurrence("2031-02-28", "yearly", "2028-02-29"), "2032-02-29"));
});

describe("dueOccurrences", () => {
  const rule = { nextDate: "2026-09-10", frequency: "monthly" as const, startDate: "2026-08-10" };

  it("catches up on missed months", () =>
    assert.deepEqual(dueOccurrences(rule, "2026-11-20"), {
      dates: ["2026-09-10", "2026-10-10", "2026-11-10"],
      next: "2026-12-10",
    }));

  it("nothing due yet", () =>
    assert.deepEqual(dueOccurrences({ ...rule, nextDate: "2026-12-10" }, "2026-11-20"), {
      dates: [],
      next: "2026-12-10",
    }));

  it("due today is included", () =>
    assert.deepEqual(dueOccurrences({ ...rule, nextDate: "2026-11-20" }, "2026-11-20").dates, [
      "2026-11-20",
    ]));
});
