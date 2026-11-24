import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

import { createAuth } from "./auth/auth";
import type { Env } from "./config/env";
import type { Db } from "./database/client";
import { withClientIp } from "./lib/client-ip";
import type { AppEnv } from "./lib/context";
import { AppError } from "./lib/errors";
import type { Mailer } from "./lib/mailer";
import { onError, onNotFound } from "./middleware/error.middleware";
import { trustedOrigins } from "./middleware/origin.middleware";
import { rateLimit } from "./middleware/rate-limit.middleware";
import { requireSession } from "./middleware/session.middleware";
import { createStore } from "./models";
import { createRoutes } from "./routes";
import { createServices } from "./services";
import type { RateSource } from "./services/rate.service";

type Dependencies = { db: Db; env: Env; mailer: Mailer; rateSource?: RateSource };

const MAX_BODY = 256 * 1024;

/** Wires everything together; tests pass their own database and mailer. */
export function createApp({ db, env, mailer, rateSource }: Dependencies) {
  const auth = createAuth(db, env, mailer);
  const store = createStore(db);
  const origins = [new URL(env.API_URL).origin, ...env.TRUSTED_ORIGINS];

  const app = new Hono<AppEnv>();
  app.onError(onError);
  app.notFound(onNotFound);
  app.use(secureHeaders());
  app.use(cors({ origin: origins, credentials: true }));
  app.use(
    bodyLimit({
      maxSize: MAX_BODY,
      onError: () => {
        throw new AppError(400, "body_too_large", "الطلب كبير جداً");
      },
    }),
  );

  app.get("/health", (c) => c.json({ data: { ok: true } }));
  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(withClientIp(c, env.TRUST_PROXY)));

  app.use("/v1/*", trustedOrigins(origins));
  app.use("/v1/*", requireSession(auth, store.users));
  app.use("/v1/*", rateLimit({ max: 240, windowMs: 60_000 }));
  app.route("/v1", createRoutes(createServices(store, rateSource)));
  return app;
}
