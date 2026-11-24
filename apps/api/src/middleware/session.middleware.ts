import { createMiddleware } from "hono/factory";

import type { Auth } from "../auth/auth";
import type { AppEnv } from "../lib/context";
import { AppError } from "../lib/errors";
import type { UserModel } from "../models/user.model";

/** Only signed-in users pass; controllers read them from `c.get("user")`. */
export function requireSession(auth: Auth, users: UserModel) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const user = session && (await users.find(session.user.id));
    if (!user) throw new AppError(401, "unauthorized", "سجّل دخولك أولاً");
    c.set("user", user);
    await next();
  });
}
