import { and, eq, isNotNull } from "drizzle-orm";

import { expense, income } from "@masrufi/db/pg/schema";

import type { Db } from "../database/client";

/** Which days each recurring rule already produced, deleted entries included. */
export class OccurrenceModel {
  constructor(private readonly db: Db) {}

  list(table: typeof expense | typeof income, userId: string) {
    return this.db
      .select({ id: table.id, recurringId: table.recurringId, date: table.date })
      .from(table)
      .where(and(eq(table.userId, userId), isNotNull(table.recurringId)));
  }

  ofExpenses(userId: string) {
    return this.list(expense, userId);
  }

  ofIncomes(userId: string) {
    return this.list(income, userId);
  }
}
