import { daysInMonth, lastMonths, monthOf, monthRange, shiftMonth, todayISO } from "@masrufi/core/dates";

import type { Store } from "../models";
import type { User } from "../models/user.model";
import { categoryTotals } from "./category-totals";
import type { RecurringService } from "./recurring.service";

const TREND_MONTHS = 6;
const TOP_EXPENSES = 5;

type DayTotal = { date: string; total: number };
type MonthTotal = { month: string; total: number };

/** One entry per day of the month, including days without spending. */
function fillDays(month: string, rows: DayTotal[]) {
  const totals = new Map(rows.map((row) => [row.date, row.total]));
  return Array.from({ length: daysInMonth(month) }, (_, index) => {
    const day = index + 1;
    const date = `${month}-${String(day).padStart(2, "0")}`;
    return { day, date, total: totals.get(date) ?? 0 };
  });
}

function buildTrend(months: string[], spent: MonthTotal[], earned: MonthTotal[]) {
  const spentIn = new Map(spent.map((row) => [row.month, row.total]));
  const earnedIn = new Map(earned.map((row) => [row.month, row.total]));
  return months.map((month) => ({
    month,
    total: spentIn.get(month) ?? 0,
    income: earnedIn.get(month) ?? 0,
  }));
}

function elapsedDays(month: string, today: string): number {
  if (month > monthOf(today)) return 0;
  return month === monthOf(today) ? Number(today.slice(8, 10)) : daysInMonth(month);
}

export class ReportService {
  constructor(
    private readonly store: Store,
    private readonly recurring: RecurringService,
  ) {}

  async monthly(user: User, month: string) {
    await this.recurring.createDue(user);
    const { expenseStats, incomes: incomeModel } = this.store;
    const period = monthRange(month);
    const trendMonths = lastMonths(month, TREND_MONTHS);
    const trendPeriod = { start: `${trendMonths[0]}-01`, end: period.end };

    const [total, previous, byCategory, days, top, spentByMonth, byMethod, incomes, earnedByMonth] =
      await Promise.all([
        expenseStats.total(user.id, period),
        expenseStats.total(user.id, monthRange(shiftMonth(month, -1))),
        categoryTotals(this.store, user.id, period),
        expenseStats.byDay(user.id, period),
        expenseStats.largest(user.id, period, TOP_EXPENSES),
        expenseStats.byMonth(user.id, trendPeriod),
        expenseStats.byPaymentMethod(user.id, period),
        incomeModel.list(user.id, period),
        incomeModel.byMonth(user.id, trendPeriod),
      ]);

    const today = todayISO(user.timezone);
    const isCurrent = month === monthOf(today);
    const elapsed = elapsedDays(month, today);
    const daily = fillDays(month, days);
    const maxDay = daily.reduce((best, day) => (day.total > best.total ? day : best));
    const earned = incomes.reduce((sum, income) => sum + income.amount, 0);

    return {
      month,
      isCurrent,
      total,
      previousTotal: previous,
      change: previous > 0 ? (total - previous) / previous : null,
      count: byCategory.reduce((sum, category) => sum + category.count, 0),
      byCategory,
      byMethod,
      daily,
      trend: buildTrend(trendMonths, spentByMonth, earnedByMonth),
      top,
      dailyAverage: elapsed > 0 ? Math.round(total / elapsed) : 0,
      projected: isCurrent ? Math.round((total / elapsed) * daily.length) : null,
      spendingDays: daily.filter((day) => day.total > 0).length,
      maxDay: maxDay.total > 0 ? maxDay : null,
      incomes,
      earned,
      net: earned - total,
    };
  }
}
