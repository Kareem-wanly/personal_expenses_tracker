import { z } from "zod";

import { FREQUENCIES, INCOME_SOURCES, PAYMENT_METHODS } from "@masrufi/core/enums";

import { clientId, foreignMoney, isoDate, isoMonth, note, positiveAmount, repeat } from "./common";

const categoryId = z
  .string()
  .max(64)
  .nullish()
  .transform((v) => v || null);

const expenseFields = {
  amount: positiveAmount,
  categoryId,
  date: isoDate,
  note,
  paymentMethod: z.enum(PAYMENT_METHODS).default("cash"),
};

export const updateExpense = z.object({ ...expenseFields, ...foreignMoney });
export const createExpense = updateExpense.extend({ id: clientId, repeat });

/** Several expenses from one sentence ("قهوة 5 وسندويشة 7"). */
export const createExpenseBatch = z.object({
  items: z.array(z.object({ ...expenseFields, id: clientId })).min(1).max(20),
});

export const expenseFilters = z.object({
  month: isoMonth,
  q: z.string().trim().max(120).optional(),
  /** A category id, or "none" for uncategorized. */
  categoryId: z.string().max(64).optional(),
});

export const updateIncome = z.object({
  amount: positiveAmount,
  source: z.enum(INCOME_SOURCES).default("salary"),
  date: isoDate,
  note,
  ...foreignMoney,
});
export const createIncome = updateIncome.extend({ id: clientId, repeat });

export const updateRecurring = z.object({
  amount: positiveAmount,
  categoryId,
  note,
  paymentMethod: z.enum(PAYMENT_METHODS).default("cash"),
  frequency: z.enum(FREQUENCIES),
  nextDate: isoDate,
  /** Income rules only. */
  source: z.enum(INCOME_SOURCES).optional(),
});

export type UpdateExpense = z.infer<typeof updateExpense>;
export type CreateExpense = z.infer<typeof createExpense>;
export type CreateExpenseBatch = z.infer<typeof createExpenseBatch>;
export type ExpenseFilters = z.infer<typeof expenseFilters>;
export type UpdateIncome = z.infer<typeof updateIncome>;
export type CreateIncome = z.infer<typeof createIncome>;
export type UpdateRecurring = z.infer<typeof updateRecurring>;
