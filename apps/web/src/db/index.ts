import "server-only";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { env } from "@/lib/env";
import * as schema from "@masrufi/db/schema";

/**
 * Reuse a single client across hot reloads in dev to avoid exhausting
 * connections / file handles.
 */
const globalForDb = globalThis as unknown as {
  libsql?: ReturnType<typeof createClient>;
};

const client =
  globalForDb.libsql ??
  createClient({
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  });

if (process.env.NODE_ENV !== "production") globalForDb.libsql = client;

export const db = drizzle(client, { schema });
export { schema };
