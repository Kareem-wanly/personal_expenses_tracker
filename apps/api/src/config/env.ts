import { z } from "zod";

/** Empty values in .env mean "not set". */
const optional = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || undefined);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().regex(/^(postgres(ql)?:\/\/|pglite:)/, "must start with postgres:// or pglite:"),
  BETTER_AUTH_SECRET: z.string().min(32, "must be at least 32 characters"),
  API_URL: z.url(),
  TRUSTED_ORIGINS: z
    .string()
    .default("")
    .transform((v) => v.split(",").map((o) => o.trim()).filter(Boolean)),
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  APPLE_CLIENT_ID: optional,
  APPLE_CLIENT_SECRET: optional,
  APPLE_BUNDLE_ID: optional,
});

export type Env = z.infer<typeof schema>;

/** Fails at startup with a readable message instead of later with a cryptic one. */
export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
  }
  if (parsed.data.NODE_ENV === "production" && parsed.data.DATABASE_URL.startsWith("pglite:")) {
    throw new Error("pglite: is for development only; set a postgres:// DATABASE_URL.");
  }
  return parsed.data;
}
