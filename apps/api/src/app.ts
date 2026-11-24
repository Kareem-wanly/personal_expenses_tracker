import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

import { createAuth } from "./auth/auth";
import type { Env } from "./config/env";
import type { Db } from "./database/client";
import { withClientIp } from "./lib/client-ip";
import type { AppEnv } from "./lib/context";
import type { Mailer } from "./lib/mailer";
import { limitBody } from "./middleware/body-limit.middleware";
import { onError, onNotFound } from "./middleware/error.middleware";
import { trustedOrigins } from "./middleware/origin.middleware";
import { rateLimit } from "./middleware/rate-limit.middleware";
import { requireSession } from "./middleware/session.middleware";
import { createStore } from "./models";
import { createRoutes } from "./routes";
import { jobRoutes } from "./routes/job.routes";
import { type ServiceOptions, createServices } from "./services";

type Dependencies = ServiceOptions & { db: Db; env: Env; mailer: Mailer };

/** Wires everything together; tests pass their own database, mailer and push sender. */
export function createApp({ db, env, mailer, ...options }: Dependencies) {
  const auth = createAuth(db, env, mailer);
  const store = createStore(db);
  const services = createServices(store, options);
  const origins = [new URL(env.API_URL).origin, ...env.TRUSTED_ORIGINS];

  const app = new Hono<AppEnv>();
  app.onError(onError);
  app.notFound(onNotFound);
  app.use(secureHeaders());
  app.use(cors({ origin: origins, credentials: true }));
  app.use(limitBody);

  app.get("/health", (c) => c.json({ data: { ok: true } }));
  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(withClientIp(c, env.TRUST_PROXY)));
  app.route("/jobs", jobRoutes(services.dailyJob, env.CRON_SECRET));

  app.use("/v1/*", trustedOrigins(origins));
  app.use("/v1/*", requireSession(auth, store.users));
  app.use("/v1/*", rateLimit({ max: 240, windowMs: 60_000 }));
  app.route("/v1", createRoutes(services));
  return app;
}
