"use server";

import { and, eq, max } from "drizzle-orm";
import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { category, expense, user as userTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { requireUser } from "@/lib/dal";
import { TZ_COOKIE } from "@/lib/dates";
import { toMinor } from "@/lib/money";
import {
  type ActionState,
  categorySchema,
  expenseSchema,
  fromZodError,
  settingsSchema,
} from "@/lib/validations";

/* -------------------------------------------------------------------------- */
/*  Server Actions are public endpoints: each one re-authenticates and        */
/*  re-validates its input. Ownership is checked in every WHERE clause.       */
/* -------------------------------------------------------------------------- */

async function assertCategoryOwned(userId: string, categoryId: string | null) {
  if (!categoryId) return true;
  const row = await db.query.category.findFirst({
    where: and(eq(category.id, categoryId), eq(category.userId, userId)),
    columns: { id: true },
  });
  return !!row;
}

export async function saveExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const { id, amount, categoryId, date, note, paymentMethod } = parsed.data;

  if (!(await assertCategoryOwned(user.id, categoryId))) {
    return { ok: false, message: "التصنيف غير موجود" };
  }

  const values = {
    amount: toMinor(amount),
    categoryId,
    date,
    note,
    paymentMethod,
  };

  if (id) {
    const res = await db
      .update(expense)
      .set(values)
      .where(and(eq(expense.id, id), eq(expense.userId, user.id)));
    if (res.rowsAffected === 0) return { ok: false, message: "المصروف غير موجود" };
  } else {
    await db.insert(expense).values({ ...values, userId: user.id });
  }

  refresh();
  return { ok: true, message: id ? "تم تحديث المصروف" : "تمت إضافة المصروف" };
}

export async function deleteExpense(id: string): Promise<ActionState> {
  const user = await requireUser();
  await db
    .delete(expense)
    .where(and(eq(expense.id, id), eq(expense.userId, user.id)));
  refresh();
  return { ok: true, message: "تم حذف المصروف" };
}

export async function saveCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const { id, ...values } = parsed.data;

  try {
    if (id) {
      await db
        .update(category)
        .set(values)
        .where(and(eq(category.id, id), eq(category.userId, user.id)));
    } else {
      const [{ maxOrder }] = await db
        .select({ maxOrder: max(category.sortOrder) })
        .from(category)
        .where(eq(category.userId, user.id));
      await db
        .insert(category)
        .values({ ...values, userId: user.id, sortOrder: (maxOrder ?? 0) + 1 });
    }
  } catch (err) {
    if (String(err).includes("UNIQUE")) {
      return {
        ok: false,
        message: "يوجد تصنيف بنفس الاسم",
        fieldErrors: { name: ["يوجد تصنيف بنفس الاسم"] },
      };
    }
    throw err;
  }

  refresh();
  return { ok: true, message: id ? "تم تحديث التصنيف" : "تمت إضافة التصنيف" };
}

export async function deleteCategory(id: string): Promise<ActionState> {
  const user = await requireUser();
  // Expenses keep existing and become "uncategorized" (ON DELETE SET NULL).
  await db
    .delete(category)
    .where(and(eq(category.id, id), eq(category.userId, user.id)));
  refresh();
  return { ok: true, message: "تم حذف التصنيف" };
}

export async function saveSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const { name, currency, monthlyBudget } = parsed.data;

  await db
    .update(userTable)
    .set({
      name,
      currency,
      monthlyBudget: monthlyBudget === null ? null : toMinor(monthlyBudget),
    })
    .where(eq(userTable.id, user.id));

  refresh();
  return { ok: true, message: "تم حفظ الإعدادات" };
}

/** Persist the device time zone so the server knows the user's "today". */
export async function syncTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone }); // throws on invalid zone
  } catch {
    return;
  }
  const jar = await cookies();
  if (jar.get(TZ_COOKIE)?.value === timeZone) return;
  jar.set(TZ_COOKIE, timeZone, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  refresh();
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
