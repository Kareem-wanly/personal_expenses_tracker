import type { UpdateRecurring } from "@masrufi/contracts/api/ledger";
import { addDays, todayISO } from "@masrufi/core/dates";
import { dueOccurrences, nextOccurrence } from "@masrufi/core/recurrence";

import { notFound, ruleBroken } from "../lib/errors";
import type { Models, Store } from "../models";
import type { RecurringRule } from "../models/recurring.model";
import type { User } from "../models/user.model";
import { assertCategoriesOwned } from "./ownership";

const MISSING = "التكرار غير موجود";

type NewRule = Pick<RecurringRule, "userId" | "kind" | "frequency" | "startDate" | "amount"> &
  Partial<Pick<RecurringRule, "categoryId" | "note" | "paymentMethod" | "source">>;

export class RecurringService {
  constructor(private readonly store: Store) {}

  list(user: User) {
    return this.store.recurring.list(user.id);
  }

  /** A rule whose first occurrence (on `startDate`) already exists. */
  start(models: Models, rule: NewRule): Promise<RecurringRule> {
    const nextDate = nextOccurrence(rule.startDate, rule.frequency, rule.startDate);
    return models.recurring.insert({ ...rule, nextDate });
  }

  /**
   * Creates everything that fell due up to the user's today. Cheap when nothing
   * is due, and safe to run twice: an occurrence exists once per rule and day.
   */
  async createDue(user: User): Promise<void> {
    const today = todayISO(user.timezone);
    const rules = await this.store.recurring.due(user.id, today);
    for (const { id } of rules) {
      await this.store.transaction(async (models) => {
        const rule = await models.recurring.lock(user.id, id);
        // It may have been edited, paused or processed since it was listed.
        if (rule?.active && rule.nextDate <= today) await this.createOccurrences(models, rule, today);
      });
    }
  }

  /** Re-anchors the schedule on the chosen next date. */
  async update(user: User, id: string, input: UpdateRecurring): Promise<RecurringRule> {
    await assertCategoriesOwned(this.store, user.id, [input.categoryId]);
    if (input.nextDate < todayISO(user.timezone)) {
      throw ruleBroken("اختر موعداً اليوم أو بعده", "nextDate");
    }
    const updated = await this.store.recurring.update(user.id, id, {
      ...input,
      startDate: input.nextDate,
    });
    if (!updated) throw notFound(MISSING);
    await this.createDue(user);
    return updated;
  }

  async pause(user: User, id: string): Promise<RecurringRule> {
    const updated = await this.store.recurring.update(user.id, id, { active: false });
    if (!updated) throw notFound(MISSING);
    return updated;
  }

  /** Doesn't fill in the paused period: continues from today on. */
  async resume(user: User, id: string): Promise<RecurringRule> {
    const rule = await this.store.recurring.find(user.id, id);
    if (!rule) throw notFound(MISSING);
    if (rule.active) return rule;
    const yesterday = addDays(todayISO(user.timezone), -1);
    const { next } = dueOccurrences(rule, yesterday);
    return (await this.store.recurring.update(user.id, id, { active: true, nextDate: next }))!;
  }

  /** Past entries stay; they just no longer point at the rule. */
  async delete(user: User, id: string): Promise<void> {
    await this.store.transaction(async (models) => {
      if (!(await models.recurring.delete(user.id, id))) throw notFound(MISSING);
      await models.expenses.unlinkRule(user.id, id);
      await models.incomes.unlinkRule(user.id, id);
    });
  }

  private async createOccurrences(models: Models, rule: RecurringRule, today: string) {
    const { dates, next } = dueOccurrences(rule, today);
    const { userId, amount, note, categoryId, paymentMethod } = rule;
    const shared = { userId, amount, note, recurringId: rule.id };
    if (rule.kind === "income") {
      const source = rule.source ?? "salary";
      await models.incomes.insertOccurrences(dates.map((date) => ({ ...shared, source, date })));
    } else {
      await models.expenses.insertOccurrences(
        dates.map((date) => ({ ...shared, categoryId, paymentMethod, date })),
      );
    }
    await models.recurring.update(userId, rule.id, { nextDate: next });
  }
}
