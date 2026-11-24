import type {
  CreateExpense,
  CreateExpenseBatch,
  ExpenseFilters,
  UpdateExpense,
} from "@masrufi/contracts/api/ledger";
import { monthRange } from "@masrufi/core/dates";

import { conflict, notFound } from "../lib/errors";
import type { Models, Store } from "../models";
import type { Expense } from "../models/expense.model";
import type { User } from "../models/user.model";
import { toUserCurrency } from "./money";
import { assertCategoriesOwned } from "./ownership";
import type { RecurringService } from "./recurring.service";

const MISSING = "المصروف غير موجود";

export class ExpenseService {
  constructor(
    private readonly store: Store,
    private readonly recurring: RecurringService,
  ) {}

  async list(user: User, { month, ...filters }: ExpenseFilters) {
    await this.recurring.createDue(user);
    return this.store.expenses.list(user.id, { ...monthRange(month), ...filters });
  }

  async create(user: User, input: CreateExpense): Promise<Expense> {
    const { repeat, ...fields } = input;
    const expense = await this.store.transaction(async (models) => {
      await assertCategoriesOwned(models, user.id, [fields.categoryId]);
      const created = await models.expenses.insert(this.toRow(user, fields));
      if (!created) return this.alreadyCreated(models, user, input.id);
      if (repeat === "none") return created;

      // This expense becomes the first occurrence of a new rule.
      const rule = await this.recurring.start(models, {
        userId: user.id,
        kind: "expense",
        frequency: repeat,
        startDate: created.date,
        amount: created.amount,
        categoryId: created.categoryId,
        note: created.note,
        paymentMethod: created.paymentMethod,
      });
      return (await models.expenses.update(user.id, created.id, { recurringId: rule.id }))!;
    });
    // Started in the past? Fill in the occurrences since then.
    if (repeat !== "none") await this.recurring.createDue(user);
    return expense;
  }

  createBatch(user: User, { items }: CreateExpenseBatch): Promise<Expense[]> {
    return this.store.transaction(async (models) => {
      await assertCategoriesOwned(models, user.id, items.map((item) => item.categoryId));
      const saved: Expense[] = [];
      for (const item of items) {
        const created = await models.expenses.insert({ ...item, userId: user.id });
        saved.push(created ?? (await this.alreadyCreated(models, user, item.id)));
      }
      return saved;
    });
  }

  async update(user: User, id: string, input: UpdateExpense): Promise<Expense> {
    await assertCategoriesOwned(this.store, user.id, [input.categoryId]);
    const { id: _, ...values } = this.toRow(user, input);
    const updated = await this.store.expenses.update(user.id, id, values);
    if (!updated) throw notFound(MISSING);
    return updated;
  }

  async delete(user: User, id: string): Promise<void> {
    if (!(await this.store.expenses.delete(user.id, id))) throw notFound(MISSING);
  }

  private toRow(user: User, input: UpdateExpense & { id?: string }) {
    const { currency, rate, amount, ...fields } = input;
    return { ...fields, ...toUserCurrency(user, { amount, currency, rate }), userId: user.id };
  }

  /** The device sent the same entry again (it missed our first answer). */
  private async alreadyCreated(models: Models, user: User, id = ""): Promise<Expense> {
    const existing = await models.expenses.find(user.id, id);
    if (!existing) throw conflict("المعرّف مستخدم من قبل");
    return existing;
  }
}
