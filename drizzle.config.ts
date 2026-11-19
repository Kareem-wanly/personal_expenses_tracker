import { defineConfig } from "drizzle-kit";

if (process.env.VERCEL && !process.env.DATABASE_URL?.startsWith("libsql://")) {
  throw new Error(
    "DATABASE_URL must be your Turso URL (libsql://...) — add it in Vercel → Settings → Environment Variables.",
  );
}

const url = process.env.DATABASE_URL ?? "file:local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: { url, authToken },
  casing: "snake_case",
  strict: true,
  verbose: true,
});
