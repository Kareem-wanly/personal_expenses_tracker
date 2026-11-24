import { bodyLimit } from "hono/body-limit";
import { createMiddleware } from "hono/factory";

import { AppError } from "../lib/errors";

const refuse = () => {
  throw new AppError(413, "body_too_large", "الطلب كبير جداً");
};

const limits = {
  normal: bodyLimit({ maxSize: 256 * 1024, onError: refuse }),
  /** Years of data fit in a backup file of this size. */
  backup: bodyLimit({ maxSize: 4 * 1024 * 1024, onError: refuse }),
};

export const limitBody = createMiddleware((c, next) =>
  c.req.path === "/v1/backup/restore" ? limits.backup(c, next) : limits.normal(c, next),
);
