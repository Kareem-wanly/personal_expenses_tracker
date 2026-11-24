import { createMiddleware } from "hono/factory";

import { AppError } from "../lib/errors";

const READ_ONLY = new Set(["GET", "HEAD", "OPTIONS"]);

/** Browsers always send Origin on writes: refuse writes coming from other sites (CSRF). */
export function trustedOrigins(allowed: string[]) {
  return createMiddleware(async (c, next) => {
    const origin = c.req.header("origin");
    if (origin && !READ_ONLY.has(c.req.method) && !allowed.includes(origin)) {
      throw new AppError(403, "forbidden_origin", "مصدر الطلب غير مسموح");
    }
    await next();
  });
}
