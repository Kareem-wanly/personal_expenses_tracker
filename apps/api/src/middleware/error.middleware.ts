import type { ErrorHandler, NotFoundHandler } from "hono";

import { AppError } from "../lib/errors";

/** Expected errors become readable JSON; anything else is logged and hidden. */
export const onError: ErrorHandler = (error, c) => {
  if (error instanceof AppError) {
    const { code, message, fields } = error;
    return c.json({ error: { code, message, fields } }, error.status);
  }
  console.error("[api]", c.req.method, c.req.path, error);
  return c.json({ error: { code: "internal", message: "حدث خطأ غير متوقع" } }, 500);
};

export const onNotFound: NotFoundHandler = (c) =>
  c.json({ error: { code: "not_found", message: "المسار غير موجود" } }, 404);
