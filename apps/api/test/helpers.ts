import { randomUUID } from "node:crypto";
import { after } from "node:test";

import { createApp } from "../src/app";
import { loadEnv } from "../src/config/env";
import { connect } from "../src/database/client";
import type { Mail } from "../src/lib/mailer";

export const ORIGIN = "http://localhost:3000";

const env = loadEnv({
  NODE_ENV: "test",
  DATABASE_URL: "pglite:",
  BETTER_AUTH_SECRET: "test-secret-that-is-long-enough-123456",
  API_URL: "http://localhost:4000",
  TRUSTED_ORIGINS: `${ORIGIN},masrufi://`,
});

/** A fresh in-memory PostgreSQL with the real migrations, and the app on top of it. */
export async function startApp() {
  const connection = await connect(env.DATABASE_URL);
  await connection.migrate();
  after(() => connection.close());

  const mails: Mail[] = [];
  const mailer = { send: async (mail: Mail) => void mails.push(mail) };
  const rateSource = async () => ({ USD: 1, EUR: 0.9 });
  const app = createApp({ db: connection.db, env, mailer, rateSource });
  return { app, db: connection.db, mails, signUp: () => signUp(app) };
}

type App = ReturnType<typeof createApp>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Reply = { status: number; data: any; error: any };

export async function call(app: App, method: string, path: string, body?: unknown, cookie = ""): Promise<Reply> {
  const response = await app.request(path, {
    method,
    headers: {
      origin: ORIGIN,
      cookie,
      ...(body !== undefined && { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = response.status === 204 ? {} : ((await response.json()) as Partial<Reply>);
  return { status: response.status, data: json.data, error: json.error };
}

export const PASSWORD = "Secret-pass-1";

export function readCookies(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

/** A new account, as a client that calls the API on its behalf. */
async function signUp(app: App) {
  const email = `${randomUUID()}@example.com`;
  const response = await app.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: { origin: ORIGIN, "content-type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD, name: "اختبار" }),
  });
  if (!response.ok) throw new Error(await response.text());
  const cookie = readCookies(response);
  return {
    email,
    cookie,
    get: (path: string) => call(app, "GET", path, undefined, cookie),
    post: (path: string, body?: unknown) => call(app, "POST", path, body, cookie),
    put: (path: string, body: unknown) => call(app, "PUT", path, body, cookie),
    patch: (path: string, body: unknown) => call(app, "PATCH", path, body, cookie),
    delete: (path: string) => call(app, "DELETE", path, undefined, cookie),
  };
}

export type TestUser = Awaited<ReturnType<typeof signUp>>;
