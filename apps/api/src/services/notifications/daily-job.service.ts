import { addDays, monthOf, monthRange, shiftMonth, todayISO } from "@masrufi/core/dates";
import { dailyReminder, debtReminder, monthSummary, recurringReminder } from "@masrufi/core/notifications";

import { inBatches } from "../../lib/background";
import type { Store } from "../../models";
import type { User } from "../../models/user.model";
import { categoryTotals } from "../category-totals";
import type { DebtService } from "../debt.service";
import type { RecurringService } from "../recurring.service";
import type { NotifierService } from "./notifier.service";

const AT_ONCE = 10;

const emptyStats = () => ({
  users: 0,
  summaries: 0,
  reminders: 0,
  recurringReminders: 0,
  debtReminders: 0,
  failed: 0,
});

type Stats = ReturnType<typeof emptyStats>;

/** Once a day: creates due recurring entries, then sends each user's reminders. */
export class DailyJobService {
  constructor(
    private readonly store: Store,
    private readonly recurring: RecurringService,
    private readonly debts: DebtService,
    private readonly notifier: NotifierService,
  ) {}

  async run(): Promise<Stats> {
    const stats = emptyStats();
    const guarded = (work: (user: User) => Promise<void>) => async (user: User) => {
      try {
        await work(user);
      } catch (error) {
        stats.failed++;
        console.error("[daily]", user.id, error);
      }
    };

    // Some zones are already in tomorrow; each user's own "today" decides.
    const latestToday = addDays(todayISO("UTC"), 1);
    const withDueRules = await this.store.users.withDueRules(latestToday);
    await inBatches(withDueRules, AT_ONCE, guarded((user) => this.recurring.createDue(user)));

    if (!this.notifier.enabled) return stats;
    const withDevices = await this.store.users.withDevices();
    stats.users = withDevices.length;
    await inBatches(withDevices, AT_ONCE, guarded((user) => this.notify(user, stats)));
    return stats;
  }

  private async notify(user: User, stats: Stats): Promise<void> {
    const today = todayISO(user.timezone);
    if (today.endsWith("-01")) {
      if (user.notifyMonthlySummary && (await this.sendSummary(user, today))) stats.summaries++;
    } else if (user.notifyDailyReminder && (await this.sendReminder(user, today))) {
      stats.reminders++;
    }
    if (user.notifyRecurring && (await this.sendRecurring(user, today))) stats.recurringReminders++;
    if (user.notifyDebts && (await this.sendDebts(user))) stats.debtReminders++;
  }

  private async sendSummary(user: User, today: string): Promise<boolean> {
    const month = shiftMonth(monthOf(today), -1);
    const [categories, prevTotal] = await Promise.all([
      categoryTotals(this.store, user.id, monthRange(month)),
      this.store.expenseStats.total(user.id, monthRange(shiftMonth(month, -1))),
    ]);
    const total = categories.reduce((sum, category) => sum + category.total, 0);
    if (total === 0) return false;
    const top = categories[0].categoryId ? categories[0] : undefined;
    return this.send(user, monthSummary({ month, total, prevTotal, top, currency: user.currency }));
  }

  private async sendReminder(user: User, today: string): Promise<boolean> {
    const [entry] = await this.store.expenses.list(user.id, { start: today, end: today });
    return entry ? false : this.send(user, dailyReminder());
  }

  private async sendRecurring(user: User, today: string): Promise<boolean> {
    const tomorrow = addDays(today, 1);
    const rules = await this.store.recurring.list(user.id);
    const items = rules
      .filter(({ rule }) => rule.active && rule.kind === "expense" && rule.nextDate === tomorrow)
      .map(({ rule, category }) => ({
        note: rule.note,
        amount: rule.amount,
        categoryName: category?.name ?? null,
      }));
    return items.length > 0 && this.send(user, recurringReminder(items, user.currency));
  }

  /** Debts due today or tomorrow. */
  private async sendDebts(user: User): Promise<boolean> {
    const items = (await this.debts.list(user)).flatMap(({ debt, state }) => {
      const due = !state.settled && (state.dueIn === 0 || state.dueIn === 1);
      if (!due || state.dueIn === null) return [];
      const { direction, person, currency } = debt;
      return [{ direction, person, currency, remaining: state.remaining, dueIn: state.dueIn }];
    });
    return items.length > 0 && this.send(user, debtReminder(items));
  }

  private async send(user: User, payload: Parameters<NotifierService["send"]>[1]): Promise<boolean> {
    return (await this.notifier.send(user.id, payload)).sent > 0;
  }
}
