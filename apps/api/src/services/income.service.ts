import type { CreateIncome, UpdateIncome } from "@masrufi/contracts/api/ledger";
import { monthRange } from "@masrufi/core/dates";

import { conflict, notFound } from "../lib/errors";
import type { Models, Store } from "../models";
import type { Income } from "../models/income.model";
import type { User } from "../models/user.model";
import { toUserCurrency } from "./money";
import type { RecurringService } from "./recurring.service";

const MISSING = "الدخل غير موجود";

export class IncomeService {
  constructor(
    private readonly store: Store,
    private readonly recurring: RecurringService,
  ) {}

  async list(user: User, month: string): Promise<Income[]> {
    await this.recurring.createDue(user);
    return this.store.incomes.list(user.id, monthRange(month));
  }

  async create(user: User, input: CreateIncome): Promise<Income> {
    const { repeat, ...fields } = input;
    const income = await this.store.transaction(async (models) => {
      const created = await models.incomes.insert(this.toRow(user, fields));
      if (!created) return this.alreadyCreated(models, user, input.id);
      if (repeat === "none") return created;

      // This income becomes the first occurrence of a new rule (a monthly salary).
      const rule = await this.recurring.start(models, {
        userId: user.id,
        kind: "income",
        frequency: repeat,
        startDate: created.date,
        amount: created.amount,
        source: created.source,
        note: created.note,
      });
      return (await models.incomes.update(user.id, created.id, { recurringId: rule.id }))!;
    });
    if (repeat !== "none") await this.recurring.createDue(user);
    return income;
  }

  async update(user: User, id: string, input: UpdateIncome): Promise<Income> {
    const { id: _, ...values } = this.toRow(user, input);
    const updated = await this.store.incomes.update(user.id, id, values);
    if (!updated) throw notFound(MISSING);
    return updated;
  }

  async delete(user: User, id: string): Promise<void> {
    if (!(await this.store.incomes.delete(user.id, id))) throw notFound(MISSING);
  }

  private toRow(user: User, input: UpdateIncome & { id?: string }) {
    const { currency, rate, amount, ...fields } = input;
    return { ...fields, ...toUserCurrency(user, { amount, currency, rate }), userId: user.id };
  }

  private async alreadyCreated(models: Models, user: User, id = ""): Promise<Income> {
    const existing = await models.incomes.find(user.id, id);
    if (!existing) throw conflict("المعرّف مستخدم من قبل");
    return existing;
  }
}
