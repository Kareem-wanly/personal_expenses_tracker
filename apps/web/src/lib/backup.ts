import "server-only";

import { createHash } from "node:crypto";

import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { DEBT_DIRECTIONS, FREQUENCIES, INCOME_SOURCES, PAYMENT_METHODS, RECURRING_KINDS } from "@masrufi/core/enums";
import {
  category,
  debt,
  debtPayment,
  expense,
  goalContribution,
  income,
  recurringExpense,
  savingGoal,
  user as userTable,
} from "@masrufi/db/schema";
import { CURRENCIES } from "@masrufi/core/constants";
import { DATE_RE } from "@masrufi/core/dates";

/**
 * Full-account backup as one JSON document, and an idempotent restore.
 *
 * Restore merges into the current account:
 * - rows keep their original ids, so importing the same file twice is a no-op;
 * - an id already used by *another* account gets a fresh one;
 * - categories are matched by name, so a backup restores cleanly into a new
 *   account (whose default categories already exist).
 */

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

export async function buildBackup(userId: string): Promise<Backup> {
  const [u, cats, exps, incs, recs, debts, payments, goals, contributions] = await Promise.all([
    db.query.user.findFirst({
      where: eq(userTable.id, userId),
      columns: { currency: true, monthlyBudget: true },
    }),
    db
      .select({
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        sortOrder: category.sortOrder,
        budget: category.budget,
      })
      .from(category)
      .where(eq(category.userId, userId)),
    db
      .select({
        id: expense.id,
        categoryId: expense.categoryId,
        amount: expense.amount,
        note: expense.note,
        date: expense.date,
        paymentMethod: expense.paymentMethod,
        recurringId: expense.recurringId,
        originalAmount: expense.originalAmount,
        originalCurrency: expense.originalCurrency,
      })
      .from(expense)
      .where(eq(expense.userId, userId))
      .orderBy(expense.date),
    db
      .select({
        id: income.id,
        amount: income.amount,
        source: income.source,
        note: income.note,
        date: income.date,
        recurringId: income.recurringId,
        originalAmount: income.originalAmount,
        originalCurrency: income.originalCurrency,
      })
      .from(income)
      .where(eq(income.userId, userId))
      .orderBy(income.date),
    db
      .select({
        id: recurringExpense.id,
        categoryId: recurringExpense.categoryId,
        amount: recurringExpense.amount,
        note: recurringExpense.note,
        paymentMethod: recurringExpense.paymentMethod,
        frequency: recurringExpense.frequency,
        startDate: recurringExpense.startDate,
        nextDate: recurringExpense.nextDate,
        active: recurringExpense.active,
        kind: recurringExpense.kind,
        source: recurringExpense.source,
      })
      .from(recurringExpense)
      .where(eq(recurringExpense.userId, userId)),
    db.select().from(debt).where(eq(debt.userId, userId)),
    db.select().from(debtPayment).where(eq(debtPayment.userId, userId)).orderBy(debtPayment.date),
    db.select().from(savingGoal).where(eq(savingGoal.userId, userId)),
    db.select().from(goalContribution).where(eq(goalContribution.userId, userId)).orderBy(goalContribution.date),
  ]);
  const move = (m: { id: string; amount: number; date: string; note: string | null }) => ({
    id: m.id,
    amount: m.amount,
    date: m.date,
    note: m.note,
  });
  const paymentsOf = Map.groupBy(payments, (p) => p.debtId);
  const contributionsOf = Map.groupBy(contributions, (c) => c.goalId);

  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings: { currency: u?.currency ?? "USD", monthlyBudget: u?.monthlyBudget ?? null },
    categories: cats,
    expenses: exps,
    incomes: incs,
    recurring: recs,
    debts: debts.map((d) => ({
      id: d.id,
      direction: d.direction,
      person: d.person,
      amount: d.amount,
      currency: d.currency,
      note: d.note,
      date: d.date,
      dueDate: d.dueDate,
      settledAt: d.settledAt?.getTime() ?? null,
      payments: (paymentsOf.get(d.id) ?? []).map(move),
    })),
    goals: goals.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      target: g.target,
      currency: g.currency,
      deadline: g.deadline,
      achievedAt: g.achievedAt?.getTime() ?? null,
      createdAt: g.createdAt.getTime(),
      contributions: (contributionsOf.get(g.id) ?? []).map(move),
    })),
  };
}

type Owned = { id: string; userId: string };

/** Which of `ids` exist in a table, and who owns them. */
type OwnedTable =
  | typeof expense
  | typeof income
  | typeof recurringExpense
  | typeof category
  | typeof debt
  | typeof debtPayment
  | typeof savingGoal
  | typeof goalContribution;

async function owners(table: OwnedTable, ids: string[]) {
  const found = new Map<string, string>();
  for (let i = 0; i < ids.length; i += 500) {
    const chunk = ids.slice(i, i + 500);
    if (!chunk.length) continue;
    const rows = (await db
      .select({ id: table.id, userId: table.userId })
      .from(table)
      .where(inArray(table.id, chunk))) as Owned[];
    for (const r of rows) found.set(r.id, r.userId);
  }
  return found;
}

/**
 * Multiset of row "fingerprints" already in the account. When a backup row
 * can't keep its id (another account owns it), it's only inserted if the
 * account doesn't already hold an identical row — counted, so two identical
 * coffees on the same day both survive, but a second import adds nothing.
 */
function fingerprintCounter(rows: string[]) {
  const counts = new Map<string, number>();
  for (const fp of rows) counts.set(fp, (counts.get(fp) ?? 0) + 1);
  return {
    /** True if an identical row is already there (and consumes it). */
    seen(fp: string) {
      const n = counts.get(fp) ?? 0;
      if (n > 0) counts.set(fp, n - 1);
      return n > 0;
    },
  };
}

const expenseFp = (e: { date: string; amount: number; note: string | null; categoryId: string | null; paymentMethod: string }) =>
  [e.date, e.amount, e.note ?? "", e.categoryId ?? "", e.paymentMethod].join("|");
const incomeFp = (i: { date: string; amount: number; note: string | null; source: string }) =>
  [i.date, i.amount, i.note ?? "", i.source].join("|");

/** Stable stand-in id for a backup id that another account already uses. */
function derivedId(userId: string, backupId: string) {
  const h = createHash("sha256").update(`${userId}:${backupId}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

/**
 * Final ids for restored rows: the backup's own id, or a derived one if
 * another account owns it. Deterministic, so a second import of the same
 * file hits the same ids and inserts nothing (ON CONFLICT DO NOTHING).
 */
async function finalIds(table: OwnedTable, userId: string, ids: string[]) {
  const taken = await owners(table, ids);
  return new Map(ids.map((i) => [i, taken.has(i) && taken.get(i) !== userId ? derivedId(userId, i) : i]));
}

async function insertCounted<T>(rows: T[], insert: (chunk: T[]) => Promise<{ rowsAffected: number }>) {
  let n = 0;
  for (let i = 0; i < rows.length; i += 400) n += (await insert(rows.slice(i, i + 400))).rowsAffected;
  return n;
}

async function insertChunked<T>(rows: T[], insert: (chunk: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += 400) await insert(rows.slice(i, i + 400));
}

export type RestoreResult = {
  categories: number;
  expenses: number;
  incomes: number;
  recurring: number;
  debts: number;
  goals: number;
  skipped: number;
};

export async function restoreBackup(userId: string, data: Backup): Promise<RestoreResult> {
  const result: RestoreResult = { categories: 0, expenses: 0, incomes: 0, recurring: 0, debts: 0, goals: 0, skipped: 0 };

  /** Keep the backup id unless another account already uses it. */
  const assign = (existing: Map<string, string>, backupId: string): string | null => {
    const owner = existing.get(backupId);
    if (owner === userId) return null; // already restored → skip
    return owner ? crypto.randomUUID() : backupId;
  };

  // 1) Categories: by id, then by name; otherwise create.
  const catMap = new Map<string, string>();
  const mine = await db
    .select({ id: category.id, name: category.name })
    .from(category)
    .where(eq(category.userId, userId));
  const byName = new Map(mine.map((c) => [c.name, c.id]));
  const catOwners = await owners(category, data.categories.map((c) => c.id));
  const newCats = [];
  for (const c of data.categories) {
    if (catOwners.get(c.id) === userId) {
      catMap.set(c.id, c.id);
      continue;
    }
    const sameName = byName.get(c.name);
    if (sameName) {
      catMap.set(c.id, sameName);
      // Bring the budget over if the existing category has none.
      if (c.budget !== null) {
        await db
          .update(category)
          .set({ budget: c.budget })
          .where(and(eq(category.id, sameName), eq(category.userId, userId)));
      }
      continue;
    }
    const newId = catOwners.has(c.id) ? crypto.randomUUID() : c.id;
    catMap.set(c.id, newId);
    byName.set(c.name, newId);
    newCats.push({ ...c, id: newId, userId });
  }
  await insertChunked(newCats, (chunk) => db.insert(category).values(chunk).onConflictDoNothing());
  result.categories = newCats.length;

  const cat = (cid: string | null) => (cid ? (catMap.get(cid) ?? null) : null);

  // 2) Recurring rules.
  const recMap = new Map<string, string>();
  const recOwners = await owners(recurringExpense, data.recurring.map((r) => r.id));
  const newRecs = [];
  const existingRecs = await db
    .select({
      id: recurringExpense.id,
      amount: recurringExpense.amount,
      note: recurringExpense.note,
      frequency: recurringExpense.frequency,
      startDate: recurringExpense.startDate,
    })
    .from(recurringExpense)
    .where(eq(recurringExpense.userId, userId));
  const recKey = (r: { amount: number; note: string | null; frequency: string; startDate: string }) =>
    [r.amount, r.note ?? "", r.frequency, r.startDate].join("|");
  const recByKey = new Map(existingRecs.map((r) => [recKey(r), r.id]));
  for (const r of data.recurring) {
    const rid = assign(recOwners, r.id);
    if (!rid) {
      recMap.set(r.id, r.id);
      result.skipped++;
      continue;
    }
    const twin = rid !== r.id ? recByKey.get(recKey(r)) : undefined;
    if (twin) {
      recMap.set(r.id, twin);
      result.skipped++;
      continue;
    }
    recMap.set(r.id, rid);
    newRecs.push({ ...r, id: rid, userId, categoryId: cat(r.categoryId) });
  }
  await insertChunked(newRecs, (chunk) => db.insert(recurringExpense).values(chunk).onConflictDoNothing());
  result.recurring = newRecs.length;

  // 3) Expenses.
  const expOwners = await owners(expense, data.expenses.map((e) => e.id));
  const existingExps = fingerprintCounter(
    (
      await db
        .select({
          date: expense.date,
          amount: expense.amount,
          note: expense.note,
          categoryId: expense.categoryId,
          paymentMethod: expense.paymentMethod,
        })
        .from(expense)
        .where(eq(expense.userId, userId))
    ).map(expenseFp),
  );
  const newExps = [];
  for (const e of data.expenses) {
    const eid = assign(expOwners, e.id);
    const reassigned = eid !== null && eid !== e.id;
    if (!eid || (reassigned && existingExps.seen(expenseFp({ ...e, categoryId: cat(e.categoryId) })))) {
      result.skipped++;
      continue;
    }
    newExps.push({
      ...e,
      id: eid,
      userId,
      categoryId: cat(e.categoryId),
      recurringId: e.recurringId ? (recMap.get(e.recurringId) ?? null) : null,
    });
  }
  // (recurring_id, date) is unique: conflicts are already-restored rows.
  await insertChunked(newExps, (chunk) => db.insert(expense).values(chunk).onConflictDoNothing());
  result.expenses = newExps.length;

  // 4) Income.
  const incOwners = await owners(income, data.incomes.map((i) => i.id));
  const existingIncs = fingerprintCounter(
    (
      await db
        .select({ date: income.date, amount: income.amount, note: income.note, source: income.source })
        .from(income)
        .where(eq(income.userId, userId))
    ).map(incomeFp),
  );
  const newIncs = [];
  for (const i of data.incomes) {
    const iid = assign(incOwners, i.id);
    const reassigned = iid !== null && iid !== i.id;
    if (!iid || (reassigned && existingIncs.seen(incomeFp(i)))) {
      result.skipped++;
      continue;
    }
    newIncs.push({
      ...i,
      id: iid,
      userId,
      recurringId: i.recurringId ? (recMap.get(i.recurringId) ?? null) : null,
    });
  }
  await insertChunked(newIncs, (chunk) => db.insert(income).values(chunk).onConflictDoNothing());
  result.incomes = newIncs.length;

  // 5) Debts and goals, with their payments / contributions.
  const debtIds = await finalIds(debt, userId, data.debts.map((d) => d.id));
  result.debts = await insertCounted(
    data.debts.map((d) => ({
      id: debtIds.get(d.id)!,
      userId,
      direction: d.direction,
      person: d.person,
      amount: d.amount,
      currency: d.currency,
      note: d.note,
      date: d.date,
      dueDate: d.dueDate,
      settledAt: d.settledAt === null ? null : new Date(d.settledAt),
    })),
    (chunk) => db.insert(debt).values(chunk).onConflictDoNothing(),
  );
  const payments = data.debts.flatMap((d) => d.payments.map((p) => ({ ...p, debtId: debtIds.get(d.id)! })));
  const paymentIds = await finalIds(debtPayment, userId, payments.map((p) => p.id));
  await insertCounted(
    payments.map((p) => ({ ...p, id: paymentIds.get(p.id)!, userId })),
    (chunk) => db.insert(debtPayment).values(chunk).onConflictDoNothing(),
  );

  const goalIds = await finalIds(savingGoal, userId, data.goals.map((g) => g.id));
  result.goals = await insertCounted(
    data.goals.map((g) => ({
      id: goalIds.get(g.id)!,
      userId,
      name: g.name,
      icon: g.icon,
      target: g.target,
      currency: g.currency,
      deadline: g.deadline,
      achievedAt: g.achievedAt === null ? null : new Date(g.achievedAt),
      createdAt: new Date(g.createdAt),
    })),
    (chunk) => db.insert(savingGoal).values(chunk).onConflictDoNothing(),
  );
  const contributions = data.goals.flatMap((g) =>
    g.contributions.map((c) => ({ ...c, goalId: goalIds.get(g.id)! })),
  );
  const contributionIds = await finalIds(goalContribution, userId, contributions.map((c) => c.id));
  await insertCounted(
    contributions.map((c) => ({ ...c, id: contributionIds.get(c.id)!, userId })),
    (chunk) => db.insert(goalContribution).values(chunk).onConflictDoNothing(),
  );

  // 6) Settings: currency and budget give the amounts their meaning.
  await db
    .update(userTable)
    .set({ currency: data.settings.currency, monthlyBudget: data.settings.monthlyBudget })
    .where(eq(userTable.id, userId));

  return result;
}
