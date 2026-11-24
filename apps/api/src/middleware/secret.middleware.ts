import { createHash, timingSafeEqual } from "node:crypto";

import { createMiddleware } from "hono/factory";

import { AppError } from "../lib/errors";

const digest = (text: string) => createHash("sha256").update(text).digest();

/** `Authorization: Bearer <secret>`, compared in constant time. Closed when no secret is set. */
export function requireSecret(secret: string | undefined) {
  return createMiddleware(async (c, next) => {
    const given = digest(c.req.header("authorization") ?? "");
    if (!secret || !timingSafeEqual(given, digest(`Bearer ${secret}`))) {
      throw new AppError(401, "unauthorized", "غير مصرّح");
    }
    await next();
  });
}
