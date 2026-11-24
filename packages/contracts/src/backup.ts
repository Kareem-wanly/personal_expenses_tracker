import { z } from "zod";

import { CURRENCIES } from "@masrufi/core/constants";
import { DATE_RE } from "@masrufi/core/dates";
import {
  DEBT_DIRECTIONS,
  FREQUENCIES,
  INCOME_SOURCES,
  PAYMENT_METHODS,
  RECURRING_KINDS,
} from "@masrufi/core/enums";

/** The backup file: one JSON document, the same for the site and the API. */

export const BACKUP_APP = "masroofi";
/** v2 added debts, goals and original currencies (v1 files still restore). */
export const BACKUP_VERSION = 2;

const minor = z.number().int().min(0).max(100_000_000_000);
const date = z.string().regex(DATE_RE);
const id = z.string().min(1).max(64);
const text = (max: number) => z.string().max(max).nullable();
const currencyCodes = CURRENCIES.map((c) => c.code) as [string, ...string[]];
const currencyCode = z.enum(currencyCodes);
const timestamp = z.number().int().min(0).nullable();
const original = {
  originalAmount: minor.nullable().default(null),
  originalCurrency: currencyCode.nullable().default(null),
};
const movement = z.object({ id, amount: z.number().int().min(-100_000_000_000).max(100_000_000_000), date, note: text(120) });

export const backupSchema = z.object({
  app: z.literal(BACKUP_APP),
  version: z.union([z.literal(1), z.literal(BACKUP_VERSION)]),
  exportedAt: z.string(),
  settings: z.object({
    currency: z.enum(currencyCodes),
    monthlyBudget: minor.nullable(),
  }),
  categories: z
    .array(
      z.object({
        id,
        name: z.string().trim().min(1).max(30),
        icon: z.string().min(1).max(8),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        sortOrder: z.number().int(),
        budget: minor.nullable(),
      }),
    )
    .max(500),
  expenses: z
    .array(
      z.object({
        id,
        categoryId: id.nullable(),
        amount: minor,
        note: text(120),
        date,
        paymentMethod: z.enum(PAYMENT_METHODS),
        recurringId: id.nullable(),
        ...original,
      }),
    )
    .max(200_000),
  incomes: z
    .array(
      z.object({
        id,
        amount: minor,
        source: z.enum(INCOME_SOURCES),
        note: text(120),
        date,
        recurringId: id.nullable().default(null),
        ...original,
      }),
    )
    .max(50_000),
  recurring: z
    .array(
      z.object({
        id,
        categoryId: id.nullable(),
        amount: minor,
        note: text(120),
        paymentMethod: z.enum(PAYMENT_METHODS),
        frequency: z.enum(FREQUENCIES),
        startDate: date,
        nextDate: date,
        active: z.boolean(),
        kind: z.enum(RECURRING_KINDS).default("expense"),
        source: z.enum(INCOME_SOURCES).nullable().default(null),
      }),
    )
    .max(1_000),
  debts: z
    .array(
      z.object({
        id,
        direction: z.enum(DEBT_DIRECTIONS),
        person: z.string().trim().min(1).max(60),
        amount: minor,
        currency: currencyCode,
        note: text(120),
        date,
        dueDate: date.nullable(),
        settledAt: timestamp,
        payments: z.array(movement).max(1_000),
      }),
    )
    .max(5_000)
    .default([]),
  goals: z
    .array(
      z.object({
        id,
        name: z.string().trim().min(1).max(40),
        icon: z.string().min(1).max(8),
        target: minor,
        currency: currencyCode,
        deadline: date.nullable(),
        achievedAt: timestamp,
        createdAt: z.number().int().min(0),
        contributions: z.array(movement).max(5_000),
      }),
    )
    .max(500)
    .default([]),
});

export type Backup = z.infer<typeof backupSchema>;
export type BackupInput = z.input<typeof backupSchema>;
