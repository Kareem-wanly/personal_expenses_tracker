import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import * as schema from "@masrufi/db/pg/schema";

/** Either driver (PostgreSQL server or embedded PGlite), or an open transaction. */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export type Connection = {
  db: Db;
  migrate: () => Promise<void>;
  close: () => Promise<void>;
};

const migrationsFolder = new URL("../../../../packages/db/drizzle-pg", import.meta.url);

async function connectPglite(folder: string | undefined): Promise<Connection> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const { fileURLToPath } = await import("node:url");
  const client = new PGlite(folder);
  const db = drizzle(client, { schema });
  return {
    db: db as unknown as Db,
    migrate: () => migrate(db, { migrationsFolder: fileURLToPath(migrationsFolder) }),
    close: () => client.close(),
  };
}

async function connectServer(url: string): Promise<Connection> {
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { migrate } = await import("drizzle-orm/postgres-js/migrator");
  const { fileURLToPath } = await import("node:url");
  const client = postgres(url);
  const db = drizzle(client, { schema });
  return {
    db: db as unknown as Db,
    migrate: () => migrate(db, { migrationsFolder: fileURLToPath(migrationsFolder) }),
    close: () => client.end(),
  };
}

/** `postgres://…` for a server, `pglite:<folder>` for an embedded one, `pglite:` for in-memory. */
export function connect(url: string): Promise<Connection> {
  return url.startsWith("pglite:")
    ? connectPglite(url.slice("pglite:".length) || undefined)
    : connectServer(url);
}
