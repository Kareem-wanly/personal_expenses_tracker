/**
 * Pure maths for debts and savings goals (no DB, no clock): easy to test,
 * shared by queries, notifications and the UI.
 */
import { formatNumber } from "./money";

const DAY_MS = 86_400_000;
/** Average month length, for "how much per month until the deadline". */
const MONTH_DAYS = 30.44;

/** Whole days from `from` to `to` (both `YYYY-MM-DD`); negative if `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  const ms = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((ms(to) - ms(from)) / DAY_MS);
}

/* --------------------------------- Debts --------------------------------- */

export type DebtState = {
  remaining: number;
  /** Share repaid so far, 0–1. */
  ratio: number;
  settled: boolean;
  /** Days until the due date (negative = overdue); null without a due date. */
  dueIn: number | null;
  overdue: boolean;
};

export function debtState(
  d: { amount: number; paid: number; dueDate: string | null; settledAt?: Date | number | null },
  today: string,
): DebtState {
  const remaining = Math.max(0, d.amount - d.paid);
  const settled = remaining === 0 || !!d.settledAt;
  const dueIn = d.dueDate ? daysBetween(today, d.dueDate) : null;
  return {
    remaining: settled ? 0 : remaining,
    ratio: d.amount > 0 ? Math.min(1, d.paid / d.amount) : 0,
    settled,
    dueIn,
    overdue: !settled && dueIn !== null && dueIn < 0,
  };
}

/** "يستحق اليوم" · "يستحق غداً" · "بعد ٥ أيام" · "متأخر يومين" … */
export function dueLabel(dueIn: number): string {
  if (dueIn === 0) return "يستحق اليوم";
  if (dueIn === 1) return "يستحق غداً";
  if (dueIn === -1) return "متأخر يوماً";
  const n = Math.abs(dueIn);
  const days = n === 2 ? "يومين" : n % 100 >= 3 && n % 100 <= 10 ? `${formatNumber(n)} أيام` : `${formatNumber(n)} يوماً`;
  return dueIn > 0 ? `بعد ${days}` : `متأخر ${days}`;
}

/* --------------------------------- Goals --------------------------------- */

export type GoalState = {
  remaining: number;
  /** Share saved, 0–1 (capped). */
  ratio: number;
  achieved: boolean;
  /** Months left until the deadline (≥ 1 while it's in the future); null without one. */
  monthsLeft: number | null;
  /** Needed per month to make the deadline; null without one or once achieved. */
  perMonth: number | null;
  /** Share of the time between start and deadline already gone (for the pace notch). */
  pace: number | null;
  /** Deadline passed and target not reached. */
  late: boolean;
};

export function goalState(
  g: { target: number; saved: number; deadline: string | null; start: string },
  today: string,
): GoalState {
  const remaining = Math.max(0, g.target - g.saved);
  const achieved = g.saved >= g.target;
  let monthsLeft: number | null = null;
  let perMonth: number | null = null;
  let pace: number | null = null;
  let late = false;
  if (g.deadline) {
    const daysLeft = daysBetween(today, g.deadline);
    late = !achieved && daysLeft < 0;
    monthsLeft = daysLeft < 0 ? 0 : Math.max(1, Math.ceil(daysLeft / MONTH_DAYS));
    if (!achieved) perMonth = late ? remaining : Math.ceil(remaining / monthsLeft);
    const total = daysBetween(g.start, g.deadline);
    if (total > 0) pace = Math.min(1, Math.max(0, daysBetween(g.start, today) / total));
  }
  return {
    remaining,
    ratio: g.target > 0 ? Math.min(1, Math.max(0, g.saved / g.target)) : 0,
    achieved,
    monthsLeft,
    perMonth,
    pace,
    late,
  };
}

/* -------------------------------- Shared --------------------------------- */

/** Sum amounts per currency, largest first: [{ currency, total }]. */
export function totalsByCurrency<T>(
  items: T[],
  pick: (item: T) => { currency: string; amount: number },
): { currency: string; total: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const { currency, amount } = pick(item);
    if (amount) map.set(currency, (map.get(currency) ?? 0) + amount);
  }
  return [...map].map(([currency, total]) => ({ currency, total })).sort((a, b) => b.total - a.total);
}
