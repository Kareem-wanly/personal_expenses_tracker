"use server";

import { and, eq, sum } from "drizzle-orm";
import { refresh } from "next/cache";

import { db } from "@/db";
import { debt, debtPayment, goalContribution, savingGoal } from "@masrufi/db/schema";
import { requireUser } from "@/lib/dal";
import { todayISO } from "@masrufi/core/dates";
import { formatMoney, toMinor } from "@masrufi/core/money";
import {
  type ActionState,
  contributionSchema,
  debtPaymentSchema,
  debtSchema,
  fromZodError,
  goalSchema,
} from "@masrufi/contracts/validations";

/* Every action re-authenticates and scopes each query to the user's rows. */

/* --------------------------------- Debts --------------------------------- */

async function ownedDebt(userId: string, id: string) {
  return db.query.debt.findFirst({ where: and(eq(debt.id, id), eq(debt.userId, userId)) });
}

async function paidOn(debtId: string) {
  const [row] = await db
    .select({ paid: sum(debtPayment.amount).mapWith(Number) })
    .from(debtPayment)
    .where(eq(debtPayment.debtId, debtId));
  return row?.paid ?? 0;
}

/** "Settled" follows the payments: set once they cover the amount, cleared if not. */
async function syncSettled(d: { id: string; amount: number; settledAt: Date | null }) {
  const paid = await paidOn(d.id);
  const settled = paid >= d.amount;
  if (settled !== !!d.settledAt) {
    await db
      .update(debt)
      .set({ settledAt: settled ? new Date() : null })
      .where(eq(debt.id, d.id));
  }
  return { paid, settled };
}

export async function saveDebt(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = debtSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const { id, amount, ...rest } = parsed.data;
  const values = { ...rest, amount: toMinor(amount) };

  if (id) {
    const existing = await ownedDebt(user.id, id);
    if (!existing) return { ok: false, message: "الدين غير موجود" };
    await db.update(debt).set(values).where(and(eq(debt.id, id), eq(debt.userId, user.id)));
    await syncSettled({ id, amount: values.amount, settledAt: existing.settledAt });
  } else {
    await db.insert(debt).values({ ...values, userId: user.id });
  }
  refresh();
  return { ok: true, message: id ? "تم حفظ التعديلات" : "تمت إضافة الدين" };
}

export async function deleteDebt(id: string): Promise<ActionState> {
  const user = await requireUser();
  await db.delete(debtPayment).where(and(eq(debtPayment.debtId, id), eq(debtPayment.userId, user.id)));
  await db.delete(debt).where(and(eq(debt.id, id), eq(debt.userId, user.id)));
  refresh();
  return { ok: true, message: "تم حذف الدين" };
}

export async function addDebtPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = debtPaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const { debtId, amount, date, note } = parsed.data;

  const d = await ownedDebt(user.id, debtId);
  if (!d) return { ok: false, message: "الدين غير موجود" };
  const remaining = d.amount - (await paidOn(d.id));
  const value = toMinor(amount);
  if (value > remaining) {
    const msg = `المبلغ أكبر من المتبقّي (${formatMoney(remaining, d.currency)})`;
    return { ok: false, message: msg, fieldErrors: { amount: [msg] } };
  }
  await db.insert(debtPayment).values({ debtId, userId: user.id, amount: value, date, note });
  const { settled } = await syncSettled(d);
  refresh();
  return { ok: true, message: settled ? "تم السداد بالكامل 🎉" : "تم تسجيل الدفعة" };
}

/** "Paid in full": records a payment for whatever is left. */
export async function settleDebt(id: string): Promise<ActionState> {
  const user = await requireUser();
  const d = await ownedDebt(user.id, id);
  if (!d) return { ok: false, message: "الدين غير موجود" };
  const remaining = d.amount - (await paidOn(d.id));
  if (remaining > 0) {
    await db.insert(debtPayment).values({
      debtId: id,
      userId: user.id,
      amount: remaining,
      date: todayISO(user.timezone),
      note: "تسوية كاملة",
    });
  }
  await syncSettled(d);
  refresh();
  return { ok: true, message: "تم السداد بالكامل 🎉" };
}

export async function deleteDebtPayment(id: string): Promise<ActionState> {
  const user = await requireUser();
  const p = await db.query.debtPayment.findFirst({
    where: and(eq(debtPayment.id, id), eq(debtPayment.userId, user.id)),
  });
  if (!p) return { ok: false, message: "الدفعة غير موجودة" };
  await db.delete(debtPayment).where(eq(debtPayment.id, id));
  const d = await ownedDebt(user.id, p.debtId);
  if (d) await syncSettled(d);
  refresh();
  return { ok: true, message: "تم حذف الدفعة" };
}

/* --------------------------------- Goals --------------------------------- */

async function ownedGoal(userId: string, id: string) {
  return db.query.savingGoal.findFirst({ where: and(eq(savingGoal.id, id), eq(savingGoal.userId, userId)) });
}

async function savedIn(goalId: string) {
  const [row] = await db
    .select({ saved: sum(goalContribution.amount).mapWith(Number) })
    .from(goalContribution)
    .where(eq(goalContribution.goalId, goalId));
  return row?.saved ?? 0;
}

/** Stamp the first time a goal is reached; true if it was reached just now. */
async function markAchieved(g: { id: string; target: number; achievedAt: Date | null }) {
  if (g.achievedAt) return false;
  if ((await savedIn(g.id)) < g.target) return false;
  await db.update(savingGoal).set({ achievedAt: new Date() }).where(eq(savingGoal.id, g.id));
  return true;
}

export async function saveGoal(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = goalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const { id, target, initial, ...rest } = parsed.data;
  const values = { ...rest, target: toMinor(target) };

  let reached = false;
  if (id) {
    const existing = await ownedGoal(user.id, id);
    if (!existing) return { ok: false, message: "الهدف غير موجود" };
    await db.update(savingGoal).set(values).where(and(eq(savingGoal.id, id), eq(savingGoal.userId, user.id)));
    reached = await markAchieved({ id, target: values.target, achievedAt: existing.achievedAt });
  } else {
    const [g] = await db
      .insert(savingGoal)
      .values({ ...values, userId: user.id })
      .returning({ id: savingGoal.id });
    if (initial) {
      await db.insert(goalContribution).values({
        goalId: g.id,
        userId: user.id,
        amount: toMinor(initial),
        date: todayISO(user.timezone),
        note: "رصيد البداية",
      });
      reached = await markAchieved({ id: g.id, target: values.target, achievedAt: null });
    }
  }
  refresh();
  return { ok: true, message: reached ? "🎉 حققت هدفك!" : id ? "تم حفظ التعديلات" : "تمت إضافة الهدف" };
}

export async function deleteGoal(id: string): Promise<ActionState> {
  const user = await requireUser();
  await db
    .delete(goalContribution)
    .where(and(eq(goalContribution.goalId, id), eq(goalContribution.userId, user.id)));
  await db.delete(savingGoal).where(and(eq(savingGoal.id, id), eq(savingGoal.userId, user.id)));
  refresh();
  return { ok: true, message: "تم حذف الهدف" };
}

export async function addContribution(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = contributionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const { goalId, kind, amount, date, note } = parsed.data;

  const g = await ownedGoal(user.id, goalId);
  if (!g) return { ok: false, message: "الهدف غير موجود" };
  const value = toMinor(amount);
  if (kind === "withdraw") {
    const saved = await savedIn(goalId);
    if (value > saved) {
      const msg = `لا يمكن سحب أكثر من المدّخر (${formatMoney(saved, g.currency)})`;
      return { ok: false, message: msg, fieldErrors: { amount: [msg] } };
    }
  }
  await db.insert(goalContribution).values({
    goalId,
    userId: user.id,
    amount: kind === "withdraw" ? -value : value,
    date,
    note,
  });
  const reached = kind === "deposit" && (await markAchieved(g));
  refresh();
  return {
    ok: true,
    message: reached ? "🎉 حققت هدفك!" : kind === "withdraw" ? "تم تسجيل السحب" : "تمت إضافة المبلغ",
  };
}

export async function deleteContribution(id: string): Promise<ActionState> {
  const user = await requireUser();
  await db
    .delete(goalContribution)
    .where(and(eq(goalContribution.id, id), eq(goalContribution.userId, user.id)));
  refresh();
  return { ok: true, message: "تم الحذف" };
}
