import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "../../packages/db/src/pg/schema.ts",
  out: "../../packages/db/drizzle-pg",
  dialect: "postgresql",
});
