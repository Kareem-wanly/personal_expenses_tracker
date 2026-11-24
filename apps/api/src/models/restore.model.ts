import { and, eq, getTableColumns, inArray, isNotNull, sql } from "drizzle-orm";

import {
  category,
  debt,
  debtPayment,
  expense,
  goalContribution,
  income,
  recurringRule,
  savingGoal,
} from "@masrufi/db/pg/schema";

import type { Db } from "../database/client";

export const restorable = {
  categories: category,
  recurring: recurringRule,
  expenses: expense,
  incomes: income,
  debts: debt,
  debtPayments: debtPayment,
  goals: savingGoal,
  contributions: goalContribution,
};

export type RestorableTable = keyof typeof restorable;
export type RestoredRow = { id: string; userId: string } & Record<string, unknown>;

const CHUNK = 400;

/** Never overwritten when a deleted row comes back. */
const KEPT = ["id", "userId", "recurringId"];

export class RestoreModel {
  constructor(private readonly db: Db) {}

  /** Who owns each of these ids (deleted rows included). */
  async owners(name: RestorableTable, ids: string[]): Promise<Map<string, string>> {
    const table = restorable[name];
    const owners = new Map<string, string>();
    for (let i = 0; i < ids.length; i += CHUNK) {
      const rows = await this.db
        .select({ id: table.id, userId: table.userId })
        .from(table)
        .where(inArray(table.id, ids.slice(i, i + CHUNK)));
      for (const row of rows) owners.set(row.id, row.userId);
    }
    return owners;
  }

  /** Adds missing rows, brings back deleted ones, and leaves the rest alone. Returns how many changed. */
  async restore(name: RestorableTable, userId: string, rows: RestoredRow[]): Promise<number> {
    const table = restorable[name];
    let changed = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const result = await this.db
        .insert(table)
        // Rows are built by RestoreService from the validated file; the union of tables hides their type.
        .values(chunk as never)
        .onConflictDoUpdate({
          target: table.id,
          set: { ...this.fromFile(name, chunk[0]), deletedAt: null, updatedAt: new Date() },
          setWhere: and(eq(table.userId, userId), isNotNull(table.deletedAt)),
        })
        .returning({ id: table.id });
      changed += result.length;
    }
    return changed;
  }

  /** "Use the value from the file" for each restored column. */
  private fromFile(name: RestorableTable, row: RestoredRow) {
    const columns = getTableColumns(restorable[name]) as Record<string, { name: string }>;
    return Object.fromEntries(
      Object.keys(row)
        .filter((key) => !KEPT.includes(key) && key in columns)
        .map((key) => [key, sql.raw(`excluded."${columns[key].name}"`)]),
    );
  }
}
