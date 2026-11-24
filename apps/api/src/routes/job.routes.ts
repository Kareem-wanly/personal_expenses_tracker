import { Hono } from "hono";

import { requireSecret } from "../middleware/secret.middleware";
import type { DailyJobService } from "../services/notifications/daily-job.service";

/** Called by a scheduler, not by users. */
export function jobRoutes(daily: DailyJobService, secret: string | undefined) {
  return new Hono()
    .use(requireSecret(secret))
    .post("/daily", async (c) => c.json({ data: await daily.run() }));
}
