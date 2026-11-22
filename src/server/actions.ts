"use server";

import { and, eq, inArray, isNotNull, max } from "drizzle-orm";
import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import {
  category,
  expense,
  income,
  pushSubscription,
  recurringExpense,
  user as userTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { type CurrentUser, getCurrentUser, requireUser } from "@/lib/dal";
import { TZ_COOKIE, addDays as addDaysISO, monthOf, todayISO } from "@/lib/dates";
import { toMinor } from "@/lib/money";
import {
  budgetAlert,
  categoryBudgetAlert,
  categoryMonthTotal,
  monthTotal,
} from "@/lib/notifications";
import { pushEnabled, sendPushToUser } from "@/lib/push";
import { exchangeRate } from "@/lib/rates";
import { FREQUENCY_LABELS, dueOccurrences, nextOccurrence } from "@/lib/recurrence";
import { countExpenses } from "@/lib/plural";
import { materializeRecurring } from "@/lib/recurring";
import {
  type ActionState,
  categorySchema,
  expenseSchema,
  fromZodError,
  incomeSchema,
  quickAddSchema,
  recurringSchema,
  settingsSchema,
} from "@/lib/validations";

/**
 * Money typed in another currency becomes the user's currency at the given
 * rate; the original amount and currency are kept alongside.
 */
function convertMoney(
  user: CurrentUser,
  amount: number,
  currency: string | undefined,
  rate: number | null,
): { amount: number; originalAmount: number | null; originalCurrency: string | null } | ActionState {
  if (!currency || currency === user.currency) {
    return { amount: toMinor(amount), originalAmount: null, originalCurrency: null };
  }
  if (!rate) {
    return { ok: false, message: "أدخل سعر الصرف", fieldErrors: { rate: ["أدخل سعر الصرف"] } };
  }
  return { amount: toMinor(amount * rate), originalAmount: toMinor(amount), originalCurrency: currency };
}

const isActionState = (v: object): v is ActionState => "ok" in v;

/** Today's rate for the currency picker (the user can still edit it). */
export async function getExchangeRate(from: string, to: string): Promise<number | null> {
  await requireUser();
  return exchangeRate(from, to);
}

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

async function allCategoriesOwned(userId: string, ids: (string | null)[]) {
  const wanted = [...new Set(ids.filter((v): v is string => !!v))];
  if (!wanted.length) return true;
  const rows = await db
    .select({ id: category.id })
    .from(category)
    .where(and(eq(category.userId, userId), inArray(category.id, wanted)));
  return rows.length === wanted.length;
}

/**
 * Snapshot budget totals *before* a change, and return a function that,
 * once the change is saved, sends an alert for every budget the change
 * pushed past 80% / 100% (overall monthly budget and per-category budgets).
 * The sending runs in `after()`, so saving never waits on push services.
 */
async function watchBudgets(
  user: CurrentUser,
  dates: string[],
  categoryIds: (string | null)[],
): Promise<(() => void) | null> {
  if (!pushEnabled || !user.notifyBudget) return null;
  const month = monthOf(todayISO(user.timezone));
  if (!dates.some((d) => monthOf(d) === month)) return null;

  const ids = [...new Set(categoryIds.filter((v): v is string => !!v))];
  const cats = ids.length
    ? await db
        .select({ id: category.id, name: category.name, icon: category.icon, budget: category.budget })
        .from(category)
        .where(
          and(eq(category.userId, user.id), inArray(category.id, ids), isNotNull(category.budget)),
        )
    : [];
  if (!user.monthlyBudget && !cats.length) return null;

  const [overallBefore, ...catBefore] = await Promise.all([
    user.monthlyBudget ? monthTotal(user.id, month) : Promise.resolve(0),
    ...cats.map((c) => categoryMonthTotal(user.id, c.id, month)),
  ]);

  return () =>
    after(async () => {
      const alerts = [];
      if (user.monthlyBudget) {
        alerts.push(
          budgetAlert({
            before: overallBefore,
            after: await monthTotal(user.id, month),
            budget: user.monthlyBudget,
            currency: user.currency,
            month,
          }),
        );
      }
      for (const [i, c] of cats.entries()) {
        alerts.push(
          categoryBudgetAlert({
            before: catBefore[i],
            after: await categoryMonthTotal(user.id, c.id, month),
            budget: c.budget!,
            currency: user.currency,
            month,
            category: c,
          }),
        );
      }
      for (const alert of alerts) if (alert) await sendPushToUser(user.id, alert);
    });
}

export async function saveExpense(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const { id, amount, categoryId, date, note, paymentMethod, repeat, currency, rate } = parsed.data;

  if (!(await assertCategoryOwned(user.id, categoryId))) {
    return { ok: false, message: "التصنيف غير موجود" };
  }
  const money = convertMoney(user, amount, currency, rate);
  if (isActionState(money)) return money;

  const values = {
    ...money,
    categoryId,
    date,
    note,
    paymentMethod,
  };

  const notifyBudgets = await watchBudgets(user, [date], [categoryId]);

  let message = id ? "تم تحديث المصروف" : "تمت إضافة المصروف";
  if (id) {
    const res = await db
      .update(expense)
      .set(values)
      .where(and(eq(expense.id, id), eq(expense.userId, user.id)));
    if (res.rowsAffected === 0) return { ok: false, message: "المصروف غير موجود" };
  } else if (repeat !== "none") {
    // This expense is the first occurrence of a new recurring rule.
    const [rule] = await db
      .insert(recurringExpense)
      .values({
        amount: values.amount,
        categoryId,
        note,
        paymentMethod,
        userId: user.id,
        frequency: repeat,
        startDate: date,
        nextDate: nextOccurrence(date, repeat, date),
      })
      .returning({ id: recurringExpense.id });
    await db.insert(expense).values({ ...values, userId: user.id, recurringId: rule.id });
    // Started in the past? Fill in the occurrences since then.
    await materializeRecurring(user.id, todayISO(user.timezone));
    message = `تمت الإضافة، وسيتكرر ${FREQUENCY_LABELS[repeat]}`;
  } else {
    await db.insert(expense).values({ ...values, userId: user.id });
  }

  notifyBudgets?.();
  refresh();
  return { ok: true, message };
}

/* --------------------------------- Income -------------------------------- */

export async function saveIncome(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = incomeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const { id, amount, source, date, note, repeat, currency, rate } = parsed.data;
  const money = convertMoney(user, amount, currency, rate);
  if (isActionState(money)) return money;
  const values = { ...money, source, date, note };

  let message = id ? "تم تحديث الدخل" : "تمت إضافة الدخل";
  if (id) {
    const res = await db
      .update(income)
      .set(values)
      .where(and(eq(income.id, id), eq(income.userId, user.id)));
    if (res.rowsAffected === 0) return { ok: false, message: "الدخل غير موجود" };
  } else if (repeat !== "none") {
    // First occurrence of a new recurring income (e.g. monthly salary).
    const [rule] = await db
      .insert(recurringExpense)
      .values({
        userId: user.id,
        kind: "income",
        source,
        amount: values.amount,
        note,
        frequency: repeat,
        startDate: date,
        nextDate: nextOccurrence(date, repeat, date),
      })
      .returning({ id: recurringExpense.id });
    await db.insert(income).values({ ...values, userId: user.id, recurringId: rule.id });
    await materializeRecurring(user.id, todayISO(user.timezone));
    message = `تمت الإضافة، وسيتكرر ${FREQUENCY_LABELS[repeat]}`;
  } else {
    await db.insert(income).values({ ...values, userId: user.id });
  }
  refresh();
  return { ok: true, message };
}

export async function deleteIncome(id: string): Promise<ActionState> {
  const user = await requireUser();
  await db.delete(income).where(and(eq(income.id, id), eq(income.userId, user.id)));
  refresh();
  return { ok: true, message: "تم حذف الدخل" };
}

/** Save several expenses parsed from one sentence ("قهوة 5 وسندويشة 7"). */
export async function addExpensesBatch(items: unknown): Promise<ActionState> {
  const user = await requireUser();
  const parsed = quickAddSchema.safeParse(items);
  if (!parsed.success) return { ok: false, message: "تعذّر قراءة المصاريف" };
  const rows = parsed.data;

  if (!(await allCategoriesOwned(user.id, rows.map((r) => r.categoryId)))) {
    return { ok: false, message: "التصنيف غير موجود" };
  }

  const notifyBudgets = await watchBudgets(
    user,
    rows.map((r) => r.date),
    rows.map((r) => r.categoryId),
  );
  await db.insert(expense).values(
    rows.map((r) => ({
      userId: user.id,
      amount: toMinor(r.amount),
      categoryId: r.categoryId,
      date: r.date,
      note: r.note || null,
      paymentMethod: r.paymentMethod,
    })),
  );
  notifyBudgets?.();
  refresh();
  return { ok: true, message: `تمت إضافة ${countExpenses(rows.length)}` };
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
  const { id, budget, ...rest } = parsed.data;
  const values = { ...rest, budget: budget === null ? null : toMinor(budget) };

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

/* --------------------------- Recurring expenses --------------------------- */

export async function saveRecurring(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = recurringSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const { id, amount, categoryId, note, paymentMethod, frequency, nextDate, source } = parsed.data;

  if (!(await assertCategoryOwned(user.id, categoryId))) {
    return { ok: false, message: "التصنيف غير موجود" };
  }
  if (nextDate < todayISO(user.timezone)) {
    return { ok: false, message: "اختر موعداً اليوم أو بعده", fieldErrors: { nextDate: ["اختر موعداً اليوم أو بعده"] } };
  }

  // Editing re-anchors the schedule on the chosen next date.
  const res = await db
    .update(recurringExpense)
    .set({
      amount: toMinor(amount),
      categoryId,
      note,
      paymentMethod,
      frequency,
      nextDate,
      startDate: nextDate,
      ...(source ? { source } : {}),
    })
    .where(and(eq(recurringExpense.id, id), eq(recurringExpense.userId, user.id)));
  if (res.rowsAffected === 0) return { ok: false, message: "المصروف المتكرر غير موجود" };

  await materializeRecurring(user.id, todayISO(user.timezone));
  refresh();
  return { ok: true, message: "تم حفظ المصروف المتكرر" };
}

export async function setRecurringActive(id: string, active: boolean): Promise<ActionState> {
  const user = await requireUser();
  const rule = await db.query.recurringExpense.findFirst({
    where: and(eq(recurringExpense.id, id), eq(recurringExpense.userId, user.id)),
  });
  if (!rule) return { ok: false, message: "المصروف المتكرر غير موجود" };

  let nextDate = rule.nextDate;
  if (active) {
    // Resuming doesn't back-fill the paused period: skip to the next
    // occurrence from today on.
    const today = todayISO(user.timezone);
    const { next } = dueOccurrences(rule, addDaysISO(today, -1));
    nextDate = next;
  }
  await db
    .update(recurringExpense)
    .set({ active, nextDate })
    .where(eq(recurringExpense.id, rule.id));
  refresh();
  return { ok: true, message: active ? "تم استئناف التكرار" : "تم إيقاف التكرار مؤقتاً" };
}

export async function deleteRecurring(id: string): Promise<ActionState> {
  const user = await requireUser();
  // Past entries stay; they just stop pointing at the deleted rule.
  await db
    .update(expense)
    .set({ recurringId: null })
    .where(and(eq(expense.recurringId, id), eq(expense.userId, user.id)));
  await db
    .update(income)
    .set({ recurringId: null })
    .where(and(eq(income.recurringId, id), eq(income.userId, user.id)));
  await db
    .delete(recurringExpense)
    .where(and(eq(recurringExpense.id, id), eq(recurringExpense.userId, user.id)));
  refresh();
  return { ok: true, message: "تم حذف التكرار" };
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
  notifyRecurring: z.boolean(),
  notifyDebts: z.boolean().optional(),
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
