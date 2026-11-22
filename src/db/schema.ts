import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/* -------------------------------------------------------------------------- */
/*                         Better Auth core tables                            */
/* -------------------------------------------------------------------------- */

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdate(() => new Date()),
};

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  /** ISO 4217 currency code used to display amounts. */
  currency: text("currency").notNull().default("USD"),
  /** Monthly budget in minor units (e.g. cents). Null = no budget. */
  monthlyBudget: integer("monthly_budget"),
  /** IANA time zone of the user's device (for "today" in cron jobs). */
  timezone: text("timezone").notNull().default("UTC"),
  notifyBudget: integer("notify_budget", { mode: "boolean" }).notNull().default(true),
  notifyDailyReminder: integer("notify_daily_reminder", { mode: "boolean" })
    .notNull()
    .default(true),
  notifyMonthlySummary: integer("notify_monthly_summary", { mode: "boolean" })
    .notNull()
    .default(true),
  notifyRecurring: integer("notify_recurring", { mode: "boolean" }).notNull().default(true),
  notifyDebts: integer("notify_debts", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    ...timestamps,
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/** WebAuthn passkeys (Face ID / fingerprint sign-in) — Better Auth plugin. */
export const passkey = sqliteTable(
  "passkey",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    credentialID: text("credential_id").notNull(),
    counter: integer("counter").notNull(),
    deviceType: text("device_type").notNull(),
    backedUp: integer("backed_up", { mode: "boolean" }).notNull(),
    transports: text("transports"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }),
    aaguid: text("aaguid"),
  },
  (t) => [index("passkey_user_idx").on(t.userId), index("passkey_credential_idx").on(t.credentialID)],
);

/* -------------------------------------------------------------------------- */
/*                               Domain tables                                */
/* -------------------------------------------------------------------------- */

export const category = sqliteTable(
  "category",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon").notNull().default("📦"),
    color: text("color").notNull().default("#64748b"),
    sortOrder: integer("sort_order").notNull().default(0),
    /** Optional monthly budget for this category, in minor units. */
    budget: integer("budget"),
    ...timestamps,
  },
  (t) => [uniqueIndex("category_user_name_uq").on(t.userId, t.name)],
);

export const PAYMENT_METHODS = ["cash", "card", "transfer"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const FREQUENCIES = ["weekly", "monthly", "yearly"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const INCOME_SOURCES = ["salary", "freelance", "business", "gift", "investment", "other"] as const;
export type IncomeSource = (typeof INCOME_SOURCES)[number];

/** What a recurring rule creates: an expense (rent, Netflix) or income (salary). */
export const RECURRING_KINDS = ["expense", "income"] as const;
export type RecurringKind = (typeof RECURRING_KINDS)[number];

/**
 * A rule that creates an expense on a schedule (rent, subscriptions, bills).
 * `startDate` anchors the day (e.g. the 31st → last day of shorter months);
 * `nextDate` is the next occurrence still to be created.
 */
export const recurringExpense = sqliteTable(
  "recurring_expense",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    categoryId: text("category_id").references(() => category.id, {
      onDelete: "set null",
    }),
    amount: integer("amount").notNull(),
    note: text("note"),
    paymentMethod: text("payment_method", { enum: PAYMENT_METHODS })
      .notNull()
      .default("cash"),
    frequency: text("frequency", { enum: FREQUENCIES }).notNull(),
    startDate: text("start_date").notNull(),
    nextDate: text("next_date").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    kind: text("kind", { enum: RECURRING_KINDS }).notNull().default("expense"),
    /** Income rules only: where the money comes from. */
    source: text("source", { enum: INCOME_SOURCES }),
    ...timestamps,
  },
  (t) => [
    index("recurring_user_idx").on(t.userId),
    index("recurring_due_idx").on(t.active, t.nextDate),
  ],
);

/**
 * Entered in another currency (e.g. 50 EUR while the app is in SYP):
 * `amount` holds the converted value in the user's currency, so every total
 * and report keeps working; these keep what was actually typed.
 */
const originalMoney = {
  originalAmount: integer("original_amount"),
  originalCurrency: text("original_currency"),
};

export const expense = sqliteTable(
  "expense",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    categoryId: text("category_id").references(() => category.id, {
      onDelete: "set null",
    }),
    /** Amount in minor units (cents) — never store money as float. */
    amount: integer("amount").notNull(),
    note: text("note"),
    /** Local calendar date, `YYYY-MM-DD` (no timezone drift). */
    date: text("date").notNull(),
    paymentMethod: text("payment_method", { enum: PAYMENT_METHODS })
      .notNull()
      .default("cash"),
    /** Set when the expense was created by a recurring rule. */
    recurringId: text("recurring_id").references(() => recurringExpense.id, {
      onDelete: "set null",
    }),
    ...originalMoney,
    ...timestamps,
  },
  (t) => [
    index("expense_user_date_idx").on(t.userId, t.date),
    index("expense_user_category_idx").on(t.userId, t.categoryId),
    // One occurrence per rule per day, even if two requests race.
    uniqueIndex("expense_recurring_date_uq").on(t.recurringId, t.date),
  ],
);


/** Money coming in (salary, freelance…), so the app can show net balance. */
export const income = sqliteTable(
  "income",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Minor units, like expenses. */
    amount: integer("amount").notNull(),
    source: text("source", { enum: INCOME_SOURCES }).notNull().default("salary"),
    note: text("note"),
    /** Local calendar date, `YYYY-MM-DD`. */
    date: text("date").notNull(),
    /** Set when created by a recurring income rule (e.g. monthly salary). */
    recurringId: text("recurring_id").references(() => recurringExpense.id, {
      onDelete: "set null",
    }),
    ...originalMoney,
    ...timestamps,
  },
  (t) => [
    index("income_user_date_idx").on(t.userId, t.date),
    // One occurrence per rule per day, even if two requests race.
    uniqueIndex("income_recurring_date_uq").on(t.recurringId, t.date),
  ],
);

/* -------------------------------------------------------------------------- */
/*                              Debts & savings                               */
/* -------------------------------------------------------------------------- */

/** `lent`: someone owes me ("لي عند فلان"); `borrowed`: I owe someone. */
export const DEBT_DIRECTIONS = ["lent", "borrowed"] as const;
export type DebtDirection = (typeof DEBT_DIRECTIONS)[number];

/**
 * Money lent or borrowed. Kept apart from expenses/income: lending isn't
 * spending. Amounts are in the debt's own currency (minor units).
 */
export const debt = sqliteTable(
  "debt",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    direction: text("direction", { enum: DEBT_DIRECTIONS }).notNull(),
    person: text("person").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    note: text("note"),
    /** When the money changed hands, `YYYY-MM-DD`. */
    date: text("date").notNull(),
    /** Optional repayment date, `YYYY-MM-DD`. */
    dueDate: text("due_date"),
    /** Set once fully repaid. */
    settledAt: integer("settled_at", { mode: "timestamp_ms" }),
    ...timestamps,
  },
  (t) => [index("debt_user_idx").on(t.userId, t.settledAt)],
);

/** A (partial) repayment of a debt, in the debt's currency. */
export const debtPayment = sqliteTable(
  "debt_payment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    debtId: text("debt_id")
      .notNull()
      .references(() => debt.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    date: text("date").notNull(),
    note: text("note"),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("debt_payment_debt_idx").on(t.debtId)],
);

/** Something to save up for ("سيارة", "سفر"), in its own currency. */
export const savingGoal = sqliteTable(
  "saving_goal",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon").notNull().default("🎯"),
    target: integer("target").notNull(),
    currency: text("currency").notNull(),
    /** Optional target date, `YYYY-MM-DD`. */
    deadline: text("deadline"),
    /** Set when the saved amount first reaches the target. */
    achievedAt: integer("achieved_at", { mode: "timestamp_ms" }),
    ...timestamps,
  },
  (t) => [index("saving_goal_user_idx").on(t.userId)],
);

/** Money put aside for a goal (negative = taken back out). */
export const goalContribution = sqliteTable(
  "goal_contribution",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    goalId: text("goal_id")
      .notNull()
      .references(() => savingGoal.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    date: text("date").notNull(),
    note: text("note"),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("goal_contribution_goal_idx").on(t.goalId)],
);

/** One row per device/browser that allowed notifications. */
export const pushSubscription = sqliteTable(
  "push_subscription",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (t) => [index("push_subscription_user_idx").on(t.userId)],
);

export const userRelations = relations(user, ({ many }) => ({
  categories: many(category),
  expenses: many(expense),
}));

export const categoryRelations = relations(category, ({ one, many }) => ({
  user: one(user, { fields: [category.userId], references: [user.id] }),
  expenses: many(expense),
}));

export const expenseRelations = relations(expense, ({ one }) => ({
  user: one(user, { fields: [expense.userId], references: [user.id] }),
  category: one(category, {
    fields: [expense.categoryId],
    references: [category.id],
  }),
}));

export type Category = typeof category.$inferSelect;
export type Expense = typeof expense.$inferSelect;
