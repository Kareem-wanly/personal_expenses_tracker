import { randomUUID } from "node:crypto";
import { after } from "node:test";

import type { PushPayload } from "@masrufi/core/notifications";

import { createApp } from "../src/app";
import { loadEnv } from "../src/config/env";
import { BackgroundTasks } from "../src/lib/background";
import type { Mail } from "../src/lib/mailer";
import type { Delivery } from "../src/lib/push-sender";
import type { Device } from "../src/models/device.model";
import { freshDatabase } from "./database";

export const ORIGIN = "http://localhost:3000";
export const CRON_SECRET = "cron-secret-for-tests";

const env = loadEnv({
  NODE_ENV: "test",
  DATABASE_URL: "pglite:",
  BETTER_AUTH_SECRET: "test-secret-that-is-long-enough-123456",
  API_URL: "http://localhost:4000",
  TRUSTED_ORIGINS: `${ORIGIN},masrufi://`,
  CRON_SECRET,
});

/** Remembers what was sent; `answer` decides what the push service replies. */
class FakePushSender {
  sent: { endpoint: string; payload: PushPayload }[] = [];
  answer: Delivery = { result: "sent" };

  async send(device: Device, payload: PushPayload): Promise<Delivery> {
    this.sent.push({ endpoint: device.endpoint, payload });
    return this.answer;
  }
}

/** The whole app on a fresh database with the real migrations. */
export async function startApp() {
  const { db, close } = await freshDatabase();
  after(close);

  const mails: Mail[] = [];
  const mailer = { send: async (mail: Mail) => void mails.push(mail) };
  const rateSource = async () => ({ USD: 1, EUR: 0.9 });
  const push = new FakePushSender();
  const background = new BackgroundTasks();
  const app = createApp({ db, env, mailer, rateSource, pushSender: push, background });
  return { app, mails, push, background, signUp: () => signUp(app) };
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
    /** The raw answer, for downloads. */
    download: (path: string) => app.request(path, { headers: { cookie } }),
    get: (path: string) => call(app, "GET", path, undefined, cookie),
    post: (path: string, body?: unknown) => call(app, "POST", path, body, cookie),
    put: (path: string, body: unknown) => call(app, "PUT", path, body, cookie),
    patch: (path: string, body: unknown) => call(app, "PATCH", path, body, cookie),
    delete: (path: string, body?: unknown) => call(app, "DELETE", path, body, cookie),
  };
}

export type TestUser = Awaited<ReturnType<typeof signUp>>;
