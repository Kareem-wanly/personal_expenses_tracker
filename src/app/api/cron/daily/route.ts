import { timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { db } from "@/db";
import { pushSubscription, user } from "@/db/schema";
import { todayISO } from "@/lib/dates";
import { env } from "@/lib/env";
import { dailyReminder, hasExpenseOn, monthlySummary } from "@/lib/notifications";
import { pushEnabled, sendPushToUser } from "@/lib/push";

/** Constant-time check of `Authorization: Bearer <CRON_SECRET>`. */
function isAuthorized(request: NextRequest) {
  if (!env.CRON_SECRET) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Runs once a day (see vercel.json). For every user with a subscribed device:
 * - on the 1st of their month → summary of the previous month
 * - otherwise → reminder if nothing was logged today (in their time zone)
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!pushEnabled) {
    return Response.json({ skipped: "push not configured" });
  }

  const users = await db
    .selectDistinct({
      id: user.id,
      currency: user.currency,
      timezone: user.timezone,
      notifyDailyReminder: user.notifyDailyReminder,
      notifyMonthlySummary: user.notifyMonthlySummary,
    })
    .from(user)
    .innerJoin(pushSubscription, eq(pushSubscription.userId, user.id));

  const stats = { users: users.length, summaries: 0, reminders: 0, failed: 0 };

  // Small batches: friendly to the DB and the push services.
  for (let i = 0; i < users.length; i += 10) {
    await Promise.all(
      users.slice(i, i + 10).map(async (u) => {
        try {
          const today = todayISO(u.timezone);
          if (today.endsWith("-01")) {
            if (!u.notifyMonthlySummary) return;
            const summary = await monthlySummary(u.id, u.currency, today);
            if (summary && (await sendPushToUser(u.id, summary))) stats.summaries++;
            return;
          }
          if (u.notifyDailyReminder && !(await hasExpenseOn(u.id, today))) {
            if (await sendPushToUser(u.id, dailyReminder())) stats.reminders++;
          }
        } catch (err) {
          stats.failed++;
          console.error("[cron/daily] user failed:", u.id, err);
        }
      }),
    );
  }

  return Response.json(stats);
}
