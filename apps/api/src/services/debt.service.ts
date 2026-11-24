import type { CreateDebt, CreateDebtPayment, SaveDebt } from "@masrufi/contracts/api/plans";
import { todayISO } from "@masrufi/core/dates";
import { formatMoney } from "@masrufi/core/money";
import { debtState } from "@masrufi/core/plans";

import { conflict, notFound, ruleBroken } from "../lib/errors";
import type { Models, Store } from "../models";
import type { Debt } from "../models/debt.model";
import type { DebtPayment } from "../models/debt-payment.model";
import type { User } from "../models/user.model";

const MISSING = "الدين غير موجود";

/** Open debts first, soonest due first, without a due date last. */
function byUrgency(a: DebtDetails, b: DebtDetails) {
  if (a.state.settled !== b.state.settled) return a.state.settled ? 1 : -1;
  const dueA = a.state.dueIn ?? Number.MAX_SAFE_INTEGER;
  const dueB = b.state.dueIn ?? Number.MAX_SAFE_INTEGER;
  return dueA - dueB || b.debt.date.localeCompare(a.debt.date);
}

function describe(debt: Debt, payments: DebtPayment[], today: string) {
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return { debt, payments, paid, state: debtState({ ...debt, paid }, today) };
}

export type DebtDetails = ReturnType<typeof describe>;

export class DebtService {
  constructor(private readonly store: Store) {}

  async list(user: User): Promise<DebtDetails[]> {
    const [debts, payments] = await Promise.all([
      this.store.debts.list(user.id),
      this.store.debtPayments.list(user.id),
    ]);
    const paymentsOf = Map.groupBy(payments, (payment) => payment.debtId);
    const today = todayISO(user.timezone);
    return debts.map((debt) => describe(debt, paymentsOf.get(debt.id) ?? [], today)).sort(byUrgency);
  }

  async create(user: User, input: CreateDebt): Promise<Debt> {
    const created = await this.store.debts.insert({ ...input, userId: user.id });
    const debt = created ?? (await this.store.debts.find(user.id, input.id ?? ""));
    if (!debt) throw conflict("المعرّف مستخدم من قبل");
    return debt;
  }

  update(user: User, id: string, input: SaveDebt): Promise<Debt> {
    return this.store.transaction(async (models) => {
      const debt = await this.locked(models, user, id);
      const updated = await models.debts.update(user.id, debt.id, input);
      return this.syncSettled(models, updated!);
    });
  }

  async delete(user: User, id: string): Promise<void> {
    await this.store.transaction(async (models) => {
      await this.locked(models, user, id);
      await models.debtPayments.deleteAll(user.id, id);
      await models.debts.delete(user.id, id);
    });
  }

  addPayment(user: User, debtId: string, input: CreateDebtPayment): Promise<Debt> {
    return this.store.transaction(async (models) => {
      const debt = await this.locked(models, user, debtId);
      if (input.id && (await this.isRepeated(models, debt, input.id))) return debt;

      const remaining = debt.amount - (await models.debtPayments.totalPaid(user.id, debtId));
      if (input.amount > remaining) {
        const left = formatMoney(remaining, debt.currency);
        throw ruleBroken(`المبلغ أكبر من المتبقّي (${left})`, "amount");
      }
      const payment = await models.debtPayments.insert({ ...input, debtId, userId: user.id });
      if (!payment) throw conflict("المعرّف مستخدم من قبل");
      return this.syncSettled(models, debt);
    });
  }

  /** "Paid in full": records a payment for whatever is left. */
  settle(user: User, id: string): Promise<Debt> {
    return this.store.transaction(async (models) => {
      const debt = await this.locked(models, user, id);
      const amount = debt.amount - (await models.debtPayments.totalPaid(user.id, id));
      if (amount > 0) {
        const date = todayISO(user.timezone);
        const note = "تسوية كاملة";
        await models.debtPayments.insert({ debtId: id, userId: user.id, amount, date, note });
      }
      return this.syncSettled(models, debt);
    });
  }

  deletePayment(user: User, debtId: string, paymentId: string): Promise<Debt> {
    return this.store.transaction(async (models) => {
      const debt = await this.locked(models, user, debtId);
      const deleted = await models.debtPayments.delete(user.id, debtId, paymentId);
      if (!deleted) throw notFound("الدفعة غير موجودة");
      return this.syncSettled(models, debt);
    });
  }

  private async locked(models: Models, user: User, id: string): Promise<Debt> {
    const debt = await models.debts.lock(user.id, id);
    if (!debt) throw notFound(MISSING);
    return debt;
  }

  private async isRepeated(models: Models, debt: Debt, paymentId: string): Promise<boolean> {
    const existing = await models.debtPayments.find(debt.userId, paymentId);
    return existing?.debtId === debt.id;
  }

  /** "Settled" follows the payments: set once they cover the amount, cleared if not. */
  private async syncSettled(models: Models, debt: Debt): Promise<Debt> {
    const settled = (await models.debtPayments.totalPaid(debt.userId, debt.id)) >= debt.amount;
    if (settled === !!debt.settledAt) return debt;
    const settledAt = settled ? new Date() : null;
    return (await models.debts.update(debt.userId, debt.id, { settledAt }))!;
  }
}
