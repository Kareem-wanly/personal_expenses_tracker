import { index, pgTable, text } from "drizzle-orm/pg-core";

import { id, timestamps } from "./columns";
import { ownerId } from "./owner";

export const DEVICE_KINDS = ["web"] as const;

/** A browser or phone that accepted notifications. */
export const pushDevice = pgTable(
  "push_device",
  {
    id: id(),
    userId: ownerId(),
    kind: text("kind", { enum: DEVICE_KINDS }).notNull(),
    /** Web push: where to send. Unique per device. */
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh"),
    auth: text("auth"),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (t) => [index("push_device_user_idx").on(t.userId)],
);
