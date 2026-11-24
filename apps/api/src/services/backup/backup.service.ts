import { BACKUP_APP, BACKUP_VERSION, type Backup } from "@masrufi/contracts/backup";

import type { Store } from "../../models";
import type { User } from "../../models/user.model";
import { type RestoreResult, RestoreRun } from "./restore-run";

const ALWAYS = { start: "0001-01-01", end: "9999-12-31" };

type Movement = { id: string; amount: number; date: string; note: string | null };

const movement = ({ id, amount, date, note }: Movement) => ({ id, amount, date, note });

/** One JSON document with everything the user owns. */
export class BackupService {
  constructor(private readonly store: Store) {}

  async build(user: User): Promise<Backup> {
    const { store } = this;
    const [categories, expenses, incomes, recurring, debts, payments, goals, contributions] =
      await Promise.all([
        store.categories.list(user.id),
        store.expenses.list(user.id, ALWAYS),
        store.incomes.list(user.id, ALWAYS),
        store.recurring.list(user.id),
        store.debts.list(user.id),
        store.debtPayments.list(user.id),
        store.goals.list(user.id),
        store.contributions.list(user.id),
      ]);
    const paymentsOf = Map.groupBy(payments, (payment) => payment.debtId);
    const contributionsOf = Map.groupBy(contributions, (contribution) => contribution.goalId);

    return {
      app: BACKUP_APP,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      settings: { currency: user.currency, monthlyBudget: user.monthlyBudget },
      categories: categories.map(({ category }) => category).map(
        ({ id, name, icon, color, sortOrder, budget }) => ({ id, name, icon, color, sortOrder, budget }),
      ),
      expenses: expenses.map(({ expense: e }) => ({
        ...movement(e),
        categoryId: e.categoryId,
        paymentMethod: e.paymentMethod,
        recurringId: e.recurringId,
        originalAmount: e.originalAmount,
        originalCurrency: e.originalCurrency,
      })),
      incomes: incomes.map((i) => ({
        ...movement(i),
        source: i.source,
        recurringId: i.recurringId,
        originalAmount: i.originalAmount,
        originalCurrency: i.originalCurrency,
      })),
      recurring: recurring.map(({ rule: r }) => ({
        id: r.id,
        categoryId: r.categoryId,
        amount: r.amount,
        note: r.note,
        paymentMethod: r.paymentMethod,
        frequency: r.frequency,
        startDate: r.startDate,
        nextDate: r.nextDate,
        active: r.active,
        kind: r.kind,
        source: r.source,
      })),
      debts: debts.map((d) => ({
        ...movement(d),
        direction: d.direction,
        person: d.person,
        currency: d.currency,
        dueDate: d.dueDate,
        settledAt: d.settledAt?.getTime() ?? null,
        payments: (paymentsOf.get(d.id) ?? []).map(movement),
      })),
      goals: goals.map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        target: g.target,
        currency: g.currency,
        deadline: g.deadline,
        achievedAt: g.achievedAt?.getTime() ?? null,
        createdAt: g.createdAt.getTime(),
        contributions: (contributionsOf.get(g.id) ?? []).map(movement),
      })),
    };
  }

  /** All or nothing. Restoring the same file again changes nothing. */
  restore(user: User, backup: Backup): Promise<RestoreResult> {
    return this.store.transaction((models) => new RestoreRun(models, user.id, backup).run());
  }
}
