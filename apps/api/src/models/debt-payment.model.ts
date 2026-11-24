import { and, desc, eq, isNull, sum } from "drizzle-orm";

import { debtPayment } from "@masrufi/db/pg/schema";

import type { Db } from "../database/client";

export type DebtPayment = typeof debtPayment.$inferSelect;
type NewPayment = typeof debtPayment.$inferInsert;

const active = (userId: string) =>
  and(eq(debtPayment.userId, userId), isNull(debtPayment.deletedAt));

export class DebtPaymentModel {
  constructor(private readonly db: Db) {}

  list(userId: string): Promise<DebtPayment[]> {
    return this.db
      .select()
      .from(debtPayment)
      .where(active(userId))
      .orderBy(desc(debtPayment.date), desc(debtPayment.createdAt));
  }

  async find(userId: string, id: string): Promise<DebtPayment | undefined> {
    const [row] = await this.db
      .select()
      .from(debtPayment)
      .where(and(active(userId), eq(debtPayment.id, id)));
    return row;
  }

  async totalPaid(userId: string, debtId: string): Promise<number> {
    const [row] = await this.db
      .select({ paid: sum(debtPayment.amount).mapWith(Number) })
      .from(debtPayment)
      .where(and(active(userId), eq(debtPayment.debtId, debtId)));
    return row.paid ?? 0;
  }

  /** Undefined when the id is already taken. */
  async insert(values: NewPayment): Promise<DebtPayment | undefined> {
    const [row] = await this.db
      .insert(debtPayment)
      .values(values)
      .onConflictDoNothing({ target: debtPayment.id })
      .returning();
    return row;
  }

  async delete(userId: string, debtId: string, id: string): Promise<boolean> {
    const rows = await this.db
      .update(debtPayment)
      .set({ deletedAt: new Date() })
      .where(and(active(userId), eq(debtPayment.debtId, debtId), eq(debtPayment.id, id)))
      .returning({ id: debtPayment.id });
    return rows.length > 0;
  }

  async deleteAll(userId: string, debtId: string): Promise<void> {
    await this.db
      .update(debtPayment)
      .set({ deletedAt: new Date() })
      .where(and(active(userId), eq(debtPayment.debtId, debtId)));
  }
}
