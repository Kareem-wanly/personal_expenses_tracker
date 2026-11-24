import type { Frequency } from "./enums";
import { daysInMonth, parseISODate, toISODate } from "./dates";

/** Pure date math for recurring expenses (no DB, shared by client & server). */

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: "أسبوعياً",
  monthly: "شهرياً",
  yearly: "سنوياً",
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The occurrence after `date`. Monthly/yearly keep the anchor day from
 * `startDate`, clamped to short months: a rule started on Jan 31 runs on
 * Feb 28 (or 29), then back on Mar 31.
 */
export function nextOccurrence(date: string, frequency: Frequency, startDate: string): string {
  if (frequency === "weekly") {
    const d = parseISODate(date);
    d.setDate(d.getDate() + 7);
    return toISODate(d);
  }
  const anchorDay = Number(startDate.slice(8, 10));
  let year = Number(date.slice(0, 4));
  let month = Number(date.slice(5, 7)); // 1-12
  if (frequency === "monthly") {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  } else {
    year += 1;
    month = Number(startDate.slice(5, 7));
  }
  const ym = `${year}-${pad(month)}`;
  return `${ym}-${pad(Math.min(anchorDay, daysInMonth(ym)))}`;
}

/** Every occurrence from `nextDate` up to and including `until` (capped). */
export function dueOccurrences(
  rule: { nextDate: string; frequency: Frequency; startDate: string },
  until: string,
  max = 120,
): { dates: string[]; next: string } {
  const dates: string[] = [];
  let next = rule.nextDate;
  while (next <= until && dates.length < max) {
    dates.push(next);
    next = nextOccurrence(next, rule.frequency, rule.startDate);
  }
  return { dates, next };
}
