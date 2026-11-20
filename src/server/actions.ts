"use server";

import { and, between, count, eq, max, sum } from "drizzle-orm";
import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import {
  category,
  expense,
  pushSubscription,
  user as userTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { getCurrentUser, requireUser } from "@/lib/dal";
import { DATE_RE, TZ_COOKIE, monthOf, todayISO } from "@/lib/dates";
import { toMinor } from "@/lib/money";
import { budgetAlert, monthTotal } from "@/lib/notifications";
import { pushEnabled, sendPushToUser } from "@/lib/push";
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

  // Budget alerts only concern the current month (in the user's time zone).
  const currentMonth = monthOf(todayISO(user.timezone));
  const watchBudget =
    pushEnabled && user.notifyBudget && !!user.monthlyBudget && monthOf(date) === currentMonth;
  const before = watchBudget ? await monthTotal(user.id, currentMonth) : 0;

  if (id) {
    const res = await db
      .update(expense)
      .set(values)
      .where(and(eq(expense.id, id), eq(expense.userId, user.id)));
    if (res.rowsAffected === 0) return { ok: false, message: "المصروف غير موجود" };
  } else {
    await db.insert(expense).values({ ...values, userId: user.id });
  }

  if (watchBudget) {
    // Runs after the response is sent: saving never waits on the push service.
    after(async () => {
      const alert = budgetAlert({
        before,
        after: await monthTotal(user.id, currentMonth),
        budget: user.monthlyBudget!,
        currency: user.currency,
        month: currentMonth,
      });
      if (alert) await sendPushToUser(user.id, alert);
    });
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

function isValidTimeZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== "string" || timeZone.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone }); // throws on invalid zone
    return true;
  } catch {
    return false;
  }
}

/** Persist the device time zone so the server knows the user's "today". */
export async function syncTimeZone(timeZone: string) {
  if (!isValidTimeZone(timeZone)) return;
  const user = await getCurrentUser();
  if (user && user.timezone !== timeZone) {
    // Stored on the user too, so scheduled jobs know each user's local day.
    await db.update(userTable).set({ timezone: timeZone }).where(eq(userTable.id, user.id));
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

/* ----------------------------- Notifications ---------------------------- */

const subscriptionSchema = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
});

export async function subscribePush(
  subscription: unknown,
  timeZone: string,
): Promise<ActionState> {
  const user = await requireUser();
  if (!pushEnabled) return { ok: false, message: "الإشعارات غير مفعّلة على الخادم" };

  const parsed = subscriptionSchema.safeParse(subscription);
  if (!parsed.success) return { ok: false, message: "اشتراك غير صالح" };
  const { endpoint, keys } = parsed.data;
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;

  // Upsert by endpoint: the same device re-subscribing (or a different
  // account on the same device) takes ownership of the subscription.
  await db
    .insert(pushSubscription)
    .values({ userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent })
    .onConflictDoUpdate({
      target: pushSubscription.endpoint,
      set: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth, userAgent },
    });

  if (isValidTimeZone(timeZone) && timeZone !== user.timezone) {
    await db.update(userTable).set({ timezone: timeZone }).where(eq(userTable.id, user.id));
  }
  return { ok: true, message: "تم تفعيل الإشعارات على هذا الجهاز" };
}

export async function unsubscribePush(endpoint: string): Promise<ActionState> {
  const user = await requireUser();
  await db
    .delete(pushSubscription)
    .where(and(eq(pushSubscription.endpoint, endpoint), eq(pushSubscription.userId, user.id)));
  return { ok: true, message: "تم إيقاف الإشعارات على هذا الجهاز" };
}

const prefsSchema = z.object({
  notifyBudget: z.boolean(),
  notifyDailyReminder: z.boolean(),
  notifyMonthlySummary: z.boolean(),
});

export async function updateNotificationPrefs(
  prefs: z.input<typeof prefsSchema>,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = prefsSchema.safeParse(prefs);
  if (!parsed.success) return { ok: false, message: "قيم غير صالحة" };
  await db.update(userTable).set(parsed.data).where(eq(userTable.id, user.id));
  refresh();
  return { ok: true, message: "تم حفظ تفضيلات الإشعارات" };
}

export async function sendTestNotification(): Promise<ActionState> {
  const user = await requireUser();
  const sent = await sendPushToUser(user.id, {
    title: "🔔 الإشعارات تعمل",
    body: "هكذا ستصلك تنبيهات الميزانية والتذكير اليومي والملخص الشهري.",
    url: "/settings",
    tag: "test",
  });
  return sent > 0
    ? { ok: true, message: "تم إرسال إشعار تجريبي" }
    : { ok: false, message: "لا يوجد جهاز مشترك لاستقبال الإشعارات" };
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}

/* ------------------------------ Assistant ------------------------------- */

const summarySchema = z.object({
  from: z.string().regex(DATE_RE),
  to: z.string().regex(DATE_RE),
  categoryId: z.string().max(64).nullable(),
});

/** Answers "how much did I spend …" for the assistant. Read-only. */
export async function getSpendingSummary(input: z.input<typeof summarySchema>) {
  const user = await requireUser();
  const parsed = summarySchema.safeParse(input);
  if (!parsed.success || parsed.data.from > parsed.data.to) {
    return { ok: false as const, message: "فترة غير صالحة" };
  }
  const { from, to, categoryId } = parsed.data;
  const [row] = await db
    .select({ total: sum(expense.amount).mapWith(Number), count: count(expense.id) })
    .from(expense)
    .where(
      and(
        eq(expense.userId, user.id),
        between(expense.date, from, to),
        categoryId ? eq(expense.categoryId, categoryId) : undefined,
      ),
    );
  return { ok: true as const, total: row?.total ?? 0, count: row?.count ?? 0, currency: user.currency };
}
