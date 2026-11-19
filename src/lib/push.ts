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

const decodedLength = (b64url: string) => Buffer.from(b64url, "base64url").length;

/**
 * Configure VAPID once. Misconfigured keys must never take the whole app
 * down (they'd fail the build): log which variable is wrong — never its
 * value — and run with notifications disabled instead.
 */
function configureVapid(): boolean {
  const pub = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;

  const problems: string[] = [];
  if (decodedLength(pub) !== 65) {
    problems.push(
      `NEXT_PUBLIC_VAPID_PUBLIC_KEY decodes to ${decodedLength(pub)} bytes (expected 65)`,
    );
  }
  if (decodedLength(priv) !== 32) {
    problems.push(`VAPID_PRIVATE_KEY decodes to ${decodedLength(priv)} bytes (expected 32)`);
  }
  if (!/^(mailto:|https:\/\/)/.test(env.VAPID_SUBJECT)) {
    problems.push("VAPID_SUBJECT must start with mailto: or https://");
  }

  try {
    if (problems.length) throw new Error(problems.join("; "));
    setVapidDetails(env.VAPID_SUBJECT, pub, priv);
    return true;
  } catch (err) {
    console.error(
      `[push] Notifications disabled — invalid VAPID config: ${(err as Error).message}. ` +
        "Paste only the value (no quotes, no NAME=) and redeploy.",
    );
    return false;
  }
}

export const pushEnabled = configureVapid();

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
