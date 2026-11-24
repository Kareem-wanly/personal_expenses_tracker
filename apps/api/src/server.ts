import { serve } from "@hono/node-server";

import { createApp } from "./app";
import { loadEnv } from "./config/env";
import { connect } from "./database/client";
import { ConsoleMailer, UnconfiguredMailer } from "./lib/mailer";

const env = loadEnv();
const connection = await connect(env.DATABASE_URL);
// The embedded database has one user: this process. Servers are migrated on deploy.
if (env.DATABASE_URL.startsWith("pglite:")) await connection.migrate();

const mailer = env.NODE_ENV === "production" ? new UnconfiguredMailer() : new ConsoleMailer();
const app = createApp({ db: connection.db, env, mailer });

const server = serve({ fetch: app.fetch, port: env.PORT }, ({ port }) =>
  console.log(`API on http://localhost:${port}`),
);

function shutdown() {
  server.close(async () => {
    await connection.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
