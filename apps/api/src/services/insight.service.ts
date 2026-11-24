import { addDays, daysInMonth, monthOf, monthRange, parseISODate, shiftMonth, todayISO } from "@masrufi/core/dates";
import { type Insight, buildInsights } from "@masrufi/core/insights";

import type { Store } from "../models";
import type { Period } from "../models/expense-stats.model";
import type { RecurringRule } from "../models/recurring.model";
import type { User } from "../models/user.model";
import { categoryTotals } from "./category-totals";
import type { RecurringService } from "./recurring.service";

const PATTERN_WEEKS = 12;
const MIN_PATTERN_DAYS = 14;

/** The same number of days of the previous month, so day 10 isn't compared to a full month. */
function previousPeriod(month: string, isCurrent: boolean, elapsed: number): Period {
  const previous = shiftMonth(month, -1);
  if (!isCurrent) return monthRange(previous);
  const lastDay = Math.min(elapsed, daysInMonth(previous));
  return { start: `${previous}-01`, end: `${previous}-${String(lastDay).padStart(2, "0")}` };
}

/** Average spending per weekday (0 = Sunday); null without enough history. */
function weekdayAverages(days: { date: string; total: number }[]): number[] | null {
  if (days.length < MIN_PATTERN_DAYS) return null;
  const totals = Array<number>(7).fill(0);
  for (const day of days) totals[parseISODate(day.date).getDay()] += day.total;
  return totals.map((total) => total / PATTERN_WEEKS);
}

function monthlyCost({ amount, frequency }: RecurringRule): number {
  if (frequency === "weekly") return (amount * 52) / 12;
  return frequency === "yearly" ? amount / 12 : amount;
}

export class InsightService {
  constructor(
    private readonly store: Store,
    private readonly recurring: RecurringService,
  ) {}

  async monthly(user: User, month: string): Promise<Insight[]> {
    const today = todayISO(user.timezone);
    if (month > monthOf(today)) return [];
    await this.recurring.createDue(user);

    const { expenseStats, incomes, recurring } = this.store;
    const isCurrent = month === monthOf(today);
    const totalDays = daysInMonth(month);
    const elapsed = isCurrent ? Number(today.slice(8, 10)) : totalDays;
    const period = { start: `${month}-01`, end: isCurrent ? today : monthRange(month).end };
    const before = previousPeriod(month, isCurrent, elapsed);
    const pattern = { start: addDays(period.end, 1 - PATTERN_WEEKS * 7), end: period.end };

    const [total, prevTotal, categories, prevCategories, earned, days, repeats, summary, rules, [largest]] =
      await Promise.all([
        expenseStats.total(user.id, period),
        expenseStats.total(user.id, before),
        categoryTotals(this.store, user.id, period),
        categoryTotals(this.store, user.id, before),
        incomes.total(user.id, monthRange(month)),
        expenseStats.byDay(user.id, pattern),
        expenseStats.repeatedNotes(user.id, period, 3),
        expenseStats.summary(user.id, period),
        recurring.activeExpenseRules(user.id),
        expenseStats.largest(user.id, period, 1),
      ]);
    const previousOf = new Map(prevCategories.map((c) => [c.categoryId, c.total]));

    return buildInsights({
      currency: user.currency,
      isCurrent,
      elapsedDays: elapsed,
      totalDays,
      total,
      prevSamePeriod: prevTotal,
      categories: categories.map((c) => ({
        id: c.categoryId,
        name: c.name,
        icon: c.icon,
        total: c.total,
        prevTotal: previousOf.get(c.categoryId) ?? 0,
        budget: c.budget,
      })),
      monthlyBudget: user.monthlyBudget,
      income: earned,
      weekdayAverages: weekdayAverages(days),
      repeats,
      noSpendDays: Math.max(elapsed - summary.spendingDays, 0),
      recurringMonthly: rules.reduce((sum, rule) => sum + monthlyCost(rule), 0),
      largest: largest
        ? { label: largest.expense.note || largest.category?.name || "مصروف", amount: largest.expense.amount }
        : null,
      averageExpense: summary.average ?? 0,
    });
  }
}
