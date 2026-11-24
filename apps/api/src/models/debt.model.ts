import { and, asc, desc, eq, isNull } from "drizzle-orm";

import { debt } from "@masrufi/db/pg/schema";

import type { Db } from "../database/client";

export type Debt = typeof debt.$inferSelect;
type NewDebt = typeof debt.$inferInsert;

const active = (userId: string) => and(eq(debt.userId, userId), isNull(debt.deletedAt));
const owned = (userId: string, id: string) => and(active(userId), eq(debt.id, id));

export class DebtModel {
  constructor(private readonly db: Db) {}

  list(userId: string): Promise<Debt[]> {
    return this.db.select().from(debt).where(active(userId)).orderBy(asc(debt.dueDate), desc(debt.date));
  }

  async find(userId: string, id: string): Promise<Debt | undefined> {
    const [row] = await this.db.select().from(debt).where(owned(userId, id));
    return row;
  }

  /** Inside a transaction: makes other payments on this debt wait their turn. */
  async lock(userId: string, id: string): Promise<Debt | undefined> {
    const [row] = await this.db.select().from(debt).where(owned(userId, id)).for("update");
    return row;
  }

  /** Undefined when the id is already taken. */
  async insert(values: NewDebt): Promise<Debt | undefined> {
    const [row] = await this.db
      .insert(debt)
      .values(values)
      .onConflictDoNothing({ target: debt.id })
      .returning();
    return row;
  }

  async update(userId: string, id: string, values: Partial<NewDebt>): Promise<Debt | undefined> {
    const [row] = await this.db.update(debt).set(values).where(owned(userId, id)).returning();
    return row;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    return !!(await this.update(userId, id, { deletedAt: new Date() }));
  }
}
