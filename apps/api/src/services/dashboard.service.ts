import { addDays, daysInMonth, monthOf, monthRange, parseISODate, todayISO } from "@masrufi/core/dates";

import type { Store } from "../models";
import type { User } from "../models/user.model";
import { categoryTotals } from "./category-totals";
import type { RecurringService } from "./recurring.service";

const RECENT = 6;

/** Weeks start on Saturday. */
function weekStart(today: string): string {
  const daysSinceSaturday = (parseISODate(today).getDay() + 1) % 7;
  return addDays(today, -daysSinceSaturday);
}

export class DashboardService {
  constructor(
    private readonly store: Store,
    private readonly recurring: RecurringService,
  ) {}

  async get(user: User) {
    await this.recurring.createDue(user);
    const { expenses, expenseStats, incomes } = this.store;
    const today = todayISO(user.timezone);
    const month = monthOf(today);
    const period = monthRange(month);

    const [spent, todayTotal, weekTotal, byCategory, recent, earned, lifetimeIncome, lifetimeSpent] =
      await Promise.all([
        expenseStats.total(user.id, period),
        expenseStats.total(user.id, { start: today, end: today }),
        expenseStats.total(user.id, { start: weekStart(today), end: today }),
        categoryTotals(this.store, user.id, period),
        expenses.latest(user.id, RECENT),
        incomes.total(user.id, period),
        incomes.lifetime(user.id, today),
        expenseStats.totalUntil(user.id, today),
      ]);

    const dayOfMonth = Number(today.slice(8, 10));
    const totalDays = daysInMonth(month);
    return {
      today,
      month,
      spent,
      todayTotal,
      weekTotal,
      byCategory,
      recent,
      earned,
      hasIncome: lifetimeIncome.hasIncome,
      balance: lifetimeIncome.total - lifetimeSpent,
      dailyAverage: Math.round(spent / dayOfMonth),
      projected: Math.round((spent / dayOfMonth) * totalDays),
      daysLeft: totalDays - dayOfMonth,
      /** Share of the month that has passed. */
      pace: dayOfMonth / totalDays,
    };
  }
}
