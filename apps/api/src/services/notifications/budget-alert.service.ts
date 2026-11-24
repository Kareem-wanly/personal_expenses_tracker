import { monthOf, monthRange, todayISO } from "@masrufi/core/dates";
import { type PushPayload, budgetAlert, categoryBudgetAlert } from "@masrufi/core/notifications";

import type { BackgroundTasks } from "../../lib/background";
import type { Store } from "../../models";
import type { User } from "../../models/user.model";
import { categoryTotals } from "../category-totals";
import type { NotifierService } from "./notifier.service";

type Change = { date: string; categoryId: string | null };

/** Tells the user once when a change pushes a budget past 80% or 100%. */
export class BudgetAlertService {
  constructor(
    private readonly store: Store,
    private readonly notifier: NotifierService,
    private readonly background: BackgroundTasks,
  ) {}

  /** Runs `save`, comparing the month's totals before and after it. */
  async watch<T>(user: User, changes: Change[], save: () => Promise<T>): Promise<T> {
    const month = monthOf(todayISO(user.timezone));
    const matters = changes.some((change) => monthOf(change.date) === month);
    if (!this.notifier.enabled || !user.notifyBudget || !matters) return save();

    const before = await this.spending(user, month);
    const saved = await save();
    // The user doesn't wait for push services.
    this.background.run(async () => {
      const after = await this.spending(user, month);
      const categoryIds = new Set(changes.map((change) => change.categoryId));
      for (const alert of this.alerts(user, month, before, after, categoryIds)) {
        await this.notifier.send(user.id, alert);
      }
    });
    return saved;
  }

  private async spending(user: User, month: string) {
    const categories = await categoryTotals(this.store, user.id, monthRange(month));
    return {
      total: categories.reduce((sum, category) => sum + category.total, 0),
      categories: new Map(categories.map((category) => [category.categoryId, category])),
    };
  }

  private alerts(
    user: User,
    month: string,
    before: Spending,
    after: Spending,
    changed: Set<string | null>,
  ): PushPayload[] {
    const { currency } = user;
    const alerts: (PushPayload | null)[] = [];
    if (user.monthlyBudget) {
      const budget = user.monthlyBudget;
      alerts.push(budgetAlert({ before: before.total, after: after.total, budget, currency, month }));
    }
    for (const [id, category] of after.categories) {
      if (!id || !changed.has(id) || !category.budget) continue;
      alerts.push(
        categoryBudgetAlert({
          before: before.categories.get(id)?.total ?? 0,
          after: category.total,
          budget: category.budget,
          currency,
          month,
          category: { id, name: category.name, icon: category.icon },
        }),
      );
    }
    return alerts.filter((alert) => alert !== null);
  }
}

type Spending = {
  total: number;
  categories: Map<string | null, { total: number; budget: number | null; name: string; icon: string }>;
};
