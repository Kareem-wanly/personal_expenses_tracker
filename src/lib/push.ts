import "server-only";

import { eq, inArray } from "drizzle-orm";
import { sendNotification, setVapidDetails } from "web-push";

import { db } from "@/db";
import { pushSubscription } from "@/db/schema";
import { env } from "@/lib/env";

export type PushPayload = {
  title: string;
  body: string;
  /** Page to open when the notification is tapped. */
  url?: string;
  /** Same tag replaces an older notification instead of stacking. */
  tag?: string;
};

export const pushEnabled = !!(
  env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY
);

if (pushEnabled) {
  setVapidDetails(
    env.VAPID_SUBJECT,
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    env.VAPID_PRIVATE_KEY!,
  );
}

/**
 * Send a notification to every device of a user. Expired subscriptions
 * (404/410 from the push service) are deleted automatically.
 * Returns how many devices accepted the message.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!pushEnabled) return 0;

  const subs = await db
    .select()
    .from(pushSubscription)
    .where(eq(pushSubscription.userId, userId));

  const expired: string[] = [];
  const results = await Promise.allSettled(
    subs.map((s) =>
      sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24, urgency: "normal" },
        )
        .catch((err: { statusCode?: number }) => {
          if (err.statusCode === 404 || err.statusCode === 410) expired.push(s.id);
          throw err;
        }),
    ),
  );

  if (expired.length) {
    await db.delete(pushSubscription).where(inArray(pushSubscription.id, expired));
  }
  for (const r of results) {
    if (r.status === "rejected" && !expired.length) {
      console.error("[push] send failed:", r.reason);
    }
  }
  return results.filter((r) => r.status === "fulfilled").length;
}
