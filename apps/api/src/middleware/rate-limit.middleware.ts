import { createMiddleware } from "hono/factory";

import type { AppEnv } from "../lib/context";
import { AppError } from "../lib/errors";

type Options = { max: number; windowMs: number; now?: () => number };

/**
 * Limits requests per signed-in user in fixed windows.
 * Counts live in this process: with several servers, move them to a shared store.
 */
export function rateLimit({ max, windowMs, now = Date.now }: Options) {
  let windowStart = now();
  let counts = new Map<string, number>();

  return createMiddleware<AppEnv>(async (c, next) => {
    if (now() - windowStart >= windowMs) {
      windowStart = now();
      counts = new Map();
    }
    const userId = c.get("user").id;
    const count = (counts.get(userId) ?? 0) + 1;
    counts.set(userId, count);
    if (count > max) throw new AppError(429, "too_many_requests", "طلبات كثيرة، حاول بعد قليل");
    await next();
  });
}
