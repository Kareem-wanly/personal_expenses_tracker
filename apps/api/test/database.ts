import { randomUUID } from "node:crypto";

import { connect } from "../src/database/client";

/**
 * A fresh, migrated database. By default embedded and in memory; with
 * TEST_DATABASE_URL, a temporary database on that PostgreSQL server.
 */
export async function freshDatabase() {
  const server = process.env.TEST_DATABASE_URL;
  if (!server) {
    const connection = await connect("pglite:");
    await connection.migrate();
    return { db: connection.db, close: connection.close };
  }

  const admin = await connect(server);
  const name = `test_${randomUUID().replaceAll("-", "")}`;
  await admin.db.execute(`create database ${name}`);
  const url = new URL(server);
  url.pathname = `/${name}`;
  const connection = await connect(url.href);
  await connection.migrate();

  return {
    db: connection.db,
    close: async () => {
      await connection.close();
      await admin.db.execute(`drop database ${name}`);
      await admin.close();
    },
  };
}
