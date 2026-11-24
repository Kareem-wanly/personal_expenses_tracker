import { index, pgTable, text } from "drizzle-orm/pg-core";

import { DEBT_DIRECTIONS } from "@masrufi/core/enums";

import { day, id, instant, money, syncTimestamps } from "./columns";
import { ownerId } from "./owner";

/** Lending isn't spending, so debts live apart from expenses and income. */
export const debt = pgTable(
  "debt",
  {
    id: id(),
    userId: ownerId(),
    direction: text("direction", { enum: DEBT_DIRECTIONS }).notNull(),
    person: text("person").notNull(),
    amount: money("amount").notNull(),
    currency: text("currency").notNull(),
    note: text("note"),
    date: day("date").notNull(),
    dueDate: day("due_date"),
    /** Follows the payments: set once they cover the amount. */
    settledAt: instant("settled_at"),
    ...syncTimestamps,
  },
  (t) => [index("debt_user_idx").on(t.userId, t.settledAt)],
);

export const debtPayment = pgTable(
  "debt_payment",
  {
    id: id(),
    userId: ownerId(),
    debtId: text("debt_id")
      .notNull()
      .references(() => debt.id, { onDelete: "cascade" }),
    amount: money("amount").notNull(),
    date: day("date").notNull(),
    note: text("note"),
    ...syncTimestamps,
  },
  (t) => [index("debt_payment_debt_idx").on(t.debtId)],
);

export const savingGoal = pgTable(
  "saving_goal",
  {
    id: id(),
    userId: ownerId(),
    name: text("name").notNull(),
    icon: text("icon").notNull().default("🎯"),
    target: money("target").notNull(),
    currency: text("currency").notNull(),
    deadline: day("deadline"),
    /** Set the first time the target is reached. */
    achievedAt: instant("achieved_at"),
    ...syncTimestamps,
  },
  (t) => [index("saving_goal_user_idx").on(t.userId)],
);

/** Money put aside (negative = taken back out). */
export const goalContribution = pgTable(
  "goal_contribution",
  {
    id: id(),
    userId: ownerId(),
    goalId: text("goal_id")
      .notNull()
      .references(() => savingGoal.id, { onDelete: "cascade" }),
    amount: money("amount").notNull(),
    date: day("date").notNull(),
    note: text("note"),
    ...syncTimestamps,
  },
  (t) => [index("goal_contribution_goal_idx").on(t.goalId)],
);
