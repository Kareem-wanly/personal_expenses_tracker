import type { Backup } from "@masrufi/contracts/backup";

import type { Models } from "../../models";
import type { RestorableTable, RestoredRow } from "../../models/restore.model";
import { derivedId } from "./derived-id";

export type RestoreResult = Record<
  "categories" | "expenses" | "incomes" | "recurring" | "debts" | "goals",
  number
>;

type Ids = Map<string, string>;
type Entry = { id: string; recurringId: string | null; date: string };

const instant = (time: number | null) => (time === null ? null : new Date(time));

/** Merges one backup file into an account; parents go before what points at them. */
export class RestoreRun {
  constructor(
    private readonly models: Models,
    private readonly userId: string,
    private readonly backup: Backup,
  ) {}

  async run(): Promise<RestoreResult> {
    const categories = await this.categories();
    const recurring = await this.recurring(categories.ids);
    const result = {
      categories: categories.added,
      recurring: recurring.added,
      expenses: await this.expenses(categories.ids, recurring.ids),
      incomes: await this.incomes(recurring.ids),
      debts: await this.debts(),
      goals: await this.goals(),
    };
    // Currency and budget give the amounts their meaning.
    await this.models.users.update(this.userId, this.backup.settings);
    return result;
  }

  /** Categories with the same name are treated as the same category. */
  private async categories() {
    const { categories } = this.backup;
    const existing = await this.models.categories.list(this.userId);
    const idOfName = new Map(existing.map(({ category }) => [category.name, category.id]));
    const existingIds = new Set(idOfName.values());
    const ids = await this.finalIds("categories", categories);

    const missing: RestoredRow[] = [];
    for (const category of categories) {
      const id = ids.get(category.id)!;
      const sameName = idOfName.get(category.name);
      if (existingIds.has(id)) continue;
      if (sameName) {
        ids.set(category.id, sameName);
        if (category.budget !== null) {
          await this.models.categories.update(this.userId, sameName, { budget: category.budget });
        }
        continue;
      }
      idOfName.set(category.name, id);
      missing.push({ ...category, id, userId: this.userId });
    }
    return { ids, added: await this.save("categories", missing) };
  }

  private async recurring(categoryIds: Ids) {
    const ids = await this.finalIds("recurring", this.backup.recurring);
    const rows = this.backup.recurring.map((rule) => ({
      ...rule,
      id: ids.get(rule.id)!,
      userId: this.userId,
      categoryId: lookUp(categoryIds, rule.categoryId),
    }));
    return { ids, added: await this.save("recurring", rows) };
  }

  private async expenses(categoryIds: Ids, recurringIds: Ids): Promise<number> {
    const ids = await this.finalIds("expenses", this.backup.expenses);
    const rows = this.backup.expenses.map((expense) => ({
      ...expense,
      id: ids.get(expense.id)!,
      userId: this.userId,
      categoryId: lookUp(categoryIds, expense.categoryId),
      recurringId: lookUp(recurringIds, expense.recurringId),
    }));
    const taken = await this.models.occurrences.ofExpenses(this.userId);
    return this.save("expenses", withoutTaken(rows, taken));
  }

  private async incomes(recurringIds: Ids): Promise<number> {
    const ids = await this.finalIds("incomes", this.backup.incomes);
    const rows = this.backup.incomes.map((income) => ({
      ...income,
      id: ids.get(income.id)!,
      userId: this.userId,
      recurringId: lookUp(recurringIds, income.recurringId),
    }));
    const taken = await this.models.occurrences.ofIncomes(this.userId);
    return this.save("incomes", withoutTaken(rows, taken));
  }

  private async debts(): Promise<number> {
    const { userId } = this;
    const ids = await this.finalIds("debts", this.backup.debts);
    const debts = this.backup.debts.map(({ payments: _, ...debt }) => ({
      ...debt,
      id: ids.get(debt.id)!,
      userId,
      settledAt: instant(debt.settledAt),
    }));
    const added = await this.save("debts", debts);

    const payments = this.backup.debts.flatMap((debt) =>
      debt.payments.map((payment) => ({ ...payment, debtId: ids.get(debt.id)!, userId })),
    );
    const paymentIds = await this.finalIds("debtPayments", payments);
    await this.save("debtPayments", payments.map((p) => ({ ...p, id: paymentIds.get(p.id)! })));
    return added;
  }

  private async goals(): Promise<number> {
    const { userId } = this;
    const ids = await this.finalIds("goals", this.backup.goals);
    const goals = this.backup.goals.map(({ contributions: _, ...goal }) => ({
      ...goal,
      id: ids.get(goal.id)!,
      userId,
      achievedAt: instant(goal.achievedAt),
      createdAt: new Date(goal.createdAt),
    }));
    const added = await this.save("goals", goals);

    const contributions = this.backup.goals.flatMap((goal) =>
      goal.contributions.map((item) => ({ ...item, goalId: ids.get(goal.id)!, userId })),
    );
    const itemIds = await this.finalIds("contributions", contributions);
    await this.save("contributions", contributions.map((c) => ({ ...c, id: itemIds.get(c.id)! })));
    return added;
  }

  /** A row keeps its id unless another account already uses it. */
  private async finalIds(table: RestorableTable, rows: { id: string }[]): Promise<Ids> {
    const owners = await this.models.restore.owners(table, rows.map((row) => row.id));
    return new Map(
      rows.map(({ id }) => {
        const owner = owners.get(id);
        return [id, owner && owner !== this.userId ? derivedId(this.userId, id) : id];
      }),
    );
  }

  /** A file edited by hand may repeat an id: the first one counts. */
  private save(table: RestorableTable, rows: RestoredRow[]): Promise<number> {
    const unique = new Map(rows.toReversed().map((row) => [row.id, row]));
    return this.models.restore.restore(table, this.userId, [...unique.values()]);
  }
}

const lookUp = (ids: Ids, id: string | null) => (id ? (ids.get(id) ?? null) : null);

/** Drops entries whose rule already produced that day under another id. */
function withoutTaken<T extends Entry>(rows: T[], taken: Entry[]): T[] {
  const key = (entry: Entry) => `${entry.recurringId} ${entry.date}`;
  const idOf = new Map(taken.map((entry) => [key(entry), entry.id]));
  return rows.filter((row) => {
    if (!row.recurringId) return true;
    const owner = idOf.get(key(row)) ?? row.id;
    idOf.set(key(row), owner);
    return owner === row.id;
  });
}
