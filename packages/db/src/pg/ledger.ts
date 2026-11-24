import { boolean, index, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

import { FREQUENCIES, INCOME_SOURCES, PAYMENT_METHODS, RECURRING_KINDS } from "@masrufi/core/enums";

import { category } from "./category";
import { day, id, money, originalMoney, syncTimestamps } from "./columns";
import { ownerId } from "./owner";
import { wallet } from "./wallets";

const categoryId = () =>
  text("category_id").references(() => category.id, { onDelete: "set null" });
const walletId = () => text("wallet_id").references(() => wallet.id, { onDelete: "set null" });
const recurringId = () =>
  text("recurring_id").references(() => recurringRule.id, { onDelete: "set null" });

/** Creates an expense or income on a schedule (rent, salary…). */
export const recurringRule = pgTable(
  "recurring_rule",
  {
    id: id(),
    userId: ownerId(),
    kind: text("kind", { enum: RECURRING_KINDS }).notNull().default("expense"),
    categoryId: categoryId(),
    /** Income rules only. */
    source: text("source", { enum: INCOME_SOURCES }),
    amount: money("amount").notNull(),
    note: text("note"),
    paymentMethod: text("payment_method", { enum: PAYMENT_METHODS }).notNull().default("cash"),
    frequency: text("frequency", { enum: FREQUENCIES }).notNull(),
    /** Anchors the day: the 31st becomes the last day of shorter months. */
    startDate: day("start_date").notNull(),
    /** Next occurrence still to be created. */
    nextDate: day("next_date").notNull(),
    active: boolean("active").notNull().default(true),
    ...syncTimestamps,
  },
  (t) => [
    index("recurring_user_idx").on(t.userId),
    index("recurring_due_idx").on(t.active, t.nextDate),
  ],
);

export const expense = pgTable(
  "expense",
  {
    id: id(),
    userId: ownerId(),
    categoryId: categoryId(),
    walletId: walletId(),
    /** In the user's currency (converted when typed in another one). */
    amount: money("amount").notNull(),
    note: text("note"),
    date: day("date").notNull(),
    paymentMethod: text("payment_method", { enum: PAYMENT_METHODS }).notNull().default("cash"),
    recurringId: recurringId(),
    ...originalMoney,
    ...syncTimestamps,
  },
  (t) => [
    index("expense_user_date_idx").on(t.userId, t.date),
    index("expense_user_category_idx").on(t.userId, t.categoryId),
    // One occurrence per rule per day, even if two requests race.
    uniqueIndex("expense_recurring_date_uq").on(t.recurringId, t.date),
  ],
);

export const income = pgTable(
  "income",
  {
    id: id(),
    userId: ownerId(),
    walletId: walletId(),
    amount: money("amount").notNull(),
    source: text("source", { enum: INCOME_SOURCES }).notNull().default("salary"),
    note: text("note"),
    date: day("date").notNull(),
    recurringId: recurringId(),
    ...originalMoney,
    ...syncTimestamps,
  },
  (t) => [
    index("income_user_date_idx").on(t.userId, t.date),
    uniqueIndex("income_recurring_date_uq").on(t.recurringId, t.date),
  ],
);
