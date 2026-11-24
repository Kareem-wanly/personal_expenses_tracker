/** Domain vocabulary shared by the apps, the API and the database schema. */

export const PAYMENT_METHODS = ["cash", "card", "transfer"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const FREQUENCIES = ["weekly", "monthly", "yearly"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const INCOME_SOURCES = ["salary", "freelance", "business", "gift", "investment", "other"] as const;
export type IncomeSource = (typeof INCOME_SOURCES)[number];

/** What a recurring rule creates: an expense (rent, Netflix) or income (salary). */
export const RECURRING_KINDS = ["expense", "income"] as const;
export type RecurringKind = (typeof RECURRING_KINDS)[number];

/** `lent`: someone owes me ("لي عند فلان"); `borrowed`: I owe someone. */
export const DEBT_DIRECTIONS = ["lent", "borrowed"] as const;
export type DebtDirection = (typeof DEBT_DIRECTIONS)[number];
