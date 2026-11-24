import { timingSafeEqual } from "node:crypto";

import { and, eq, inArray, isNull, lte, sum } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { db } from "@/db";
import { category, debt, debtPayment, pushSubscription, recurringExpense, user } from "@masrufi/db/schema";
import { addDays, todayISO } from "@masrufi/core/dates";
import { env } from "@/lib/env";
import {
  dailyReminder,
  debtReminder,
  hasExpenseOn,
  monthlySummary,
  recurringReminder,
} from "@/lib/notifications";
import { daysBetween } from "@masrufi/core/plans";
import { pushEnabled, sendPushToUser } from "@/lib/push";
import { materializeRecurring } from "@/lib/recurring";

/** Constant-time check of `Authorization: Bearer <CRON_SECRET>`. */
function isAuthorized(request: NextRequest) {
  if (!env.CRON_SECRET) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Run `fn` over `items` in small batches (gentle on the DB and push services). */
async function inBatches<T>(items: T[], fn: (item: T) => Promise<void>, size = 10) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

/**
 * Runs once a day (see vercel.json):
 * 1. Creates due recurring expenses for every user (no device needed).
 * 2. For users with a subscribed device:
 *    - on the 1st of their month → summary of the previous month
 *    - otherwise → reminder if nothing was logged today
 *    - heads-up for recurring expenses due tomorrow
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = {
    recurringCreated: 0,
    users: 0,
    summaries: 0,
    reminders: 0,
    recurringReminders: 0,
    debtReminders: 0,
    failed: 0,
  };

  // 1) Recurring expenses. "+1 day" covers every time zone ahead of UTC;
  //    each user's own "today" decides what is actually due.
  const owners = await db
    .selectDistinct({ id: user.id, timezone: user.timezone })
    .from(recurringExpense)
    .innerJoin(user, eq(user.id, recurringExpense.userId))
    .where(
      and(
        eq(recurringExpense.active, true),
        lte(recurringExpense.nextDate, addDays(todayISO("UTC"), 1)),
      ),
    );
  await inBatches(owners, async (u) => {
    try {
      stats.recurringCreated += await materializeRecurring(u.id, todayISO(u.timezone));
    } catch (err) {
      stats.failed++;
      console.error("[cron/daily] recurring failed:", u.id, err);
    }
  });

  if (!pushEnabled) return Response.json({ ...stats, push: "not configured" });

  // 2) Notifications.
  const users = await db
    .selectDistinct({
      id: user.id,
      currency: user.currency,
      timezone: user.timezone,
      notifyDailyReminder: user.notifyDailyReminder,
      notifyMonthlySummary: user.notifyMonthlySummary,
      notifyRecurring: user.notifyRecurring,
      notifyDebts: user.notifyDebts,
    })
    .from(user)
    .innerJoin(pushSubscription, eq(pushSubscription.userId, user.id));
  stats.users = users.length;

  await inBatches(users, async (u) => {
    try {
      const today = todayISO(u.timezone);

      if (today.endsWith("-01")) {
        if (u.notifyMonthlySummary) {
          const summary = await monthlySummary(u.id, u.currency, today);
          if (summary && (await sendPushToUser(u.id, summary))) stats.summaries++;
        }
      } else if (u.notifyDailyReminder && !(await hasExpenseOn(u.id, today))) {
        if (await sendPushToUser(u.id, dailyReminder())) stats.reminders++;
      }

      if (u.notifyRecurring) {
        const tomorrow = await db
          .select({
            note: recurringExpense.note,
            amount: recurringExpense.amount,
            categoryName: category.name,
          })
          .from(recurringExpense)
          .leftJoin(category, eq(category.id, recurringExpense.categoryId))
          .where(
            and(
              eq(recurringExpense.userId, u.id),
              eq(recurringExpense.kind, "expense"),
              eq(recurringExpense.active, true),
              eq(recurringExpense.nextDate, addDays(today, 1)),
            ),
          );
        if (tomorrow.length && (await sendPushToUser(u.id, recurringReminder(tomorrow, u.currency)))) {
          stats.recurringReminders++;
        }
      }

      if (u.notifyDebts) {
        // Unsettled debts due today or tomorrow, with what's left on each.
        const due = await db
          .select({
            id: debt.id,
            direction: debt.direction,
            person: debt.person,
            amount: debt.amount,
            currency: debt.currency,
            dueDate: debt.dueDate,
          })
          .from(debt)
          .where(
            and(
              eq(debt.userId, u.id),
              isNull(debt.settledAt),
              inArray(debt.dueDate, [today, addDays(today, 1)]),
            ),
          );
        if (due.length) {
          const paid = await db
            .select({ debtId: debtPayment.debtId, total: sum(debtPayment.amount).mapWith(Number) })
            .from(debtPayment)
            .where(inArray(debtPayment.debtId, due.map((d) => d.id)))
            .groupBy(debtPayment.debtId);
          const paidOf = new Map(paid.map((p) => [p.debtId, p.total ?? 0]));
          const items = due
            .map((d) => ({
              ...d,
              remaining: d.amount - (paidOf.get(d.id) ?? 0),
              dueIn: daysBetween(today, d.dueDate!),
            }))
            .filter((d) => d.remaining > 0);
          if (items.length && (await sendPushToUser(u.id, debtReminder(items)))) stats.debtReminders++;
        }
      }
    } catch (err) {
      stats.failed++;
      console.error("[cron/daily] user failed:", u.id, err);
    }
  });

  return Response.json(stats);
}
