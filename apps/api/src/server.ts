import { serve } from "@hono/node-server";

import { createApp } from "./app";
import { loadEnv } from "./config/env";
import { connect } from "./database/client";
import { BackgroundTasks } from "./lib/background";
import { createMailer } from "./lib/mailer";
import { createPushSender } from "./lib/push-sender";

const env = loadEnv();
const connection = await connect(env.DATABASE_URL);
// The embedded database has one user: this process. Servers are migrated on deploy.
if (env.DATABASE_URL.startsWith("pglite:")) await connection.migrate();

const background = new BackgroundTasks();
const app = createApp({
  db: connection.db,
  env,
  mailer: createMailer(env),
  pushSender: createPushSender(env),
  background,
});

const server = serve({ fetch: app.fetch, port: env.PORT }, ({ port }) =>
  console.log(`API on http://localhost:${port}`),
);

function shutdown() {
  server.close(async () => {
    await background.idle();
    await connection.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
