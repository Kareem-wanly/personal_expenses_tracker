import { monthRange } from "@masrufi/core/dates";

import type { Store } from "../models";
import type { User } from "../models/user.model";
import type { RecurringService } from "./recurring.service";

export class ExportService {
  constructor(
    private readonly store: Store,
    private readonly recurring: RecurringService,
  ) {}

  async month(user: User, month: string) {
    await this.recurring.createDue(user);
    const period = monthRange(month);
    const [expenses, incomes] = await Promise.all([
      this.store.expenses.list(user.id, period),
      this.store.incomes.list(user.id, period),
    ]);
    return { currency: user.currency, expenses, incomes };
  }
}
