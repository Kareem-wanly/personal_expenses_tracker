import assert from "node:assert/strict";
import { test } from "node:test";

import { Hono } from "hono";

import { loadEnv } from "../src/config/env";
import type { AppEnv } from "../src/lib/context";
import { onError } from "../src/middleware/error.middleware";
import { rateLimit } from "../src/middleware/rate-limit.middleware";
import type { User } from "../src/models/user.model";
import { startApp } from "./helpers";

const { app, signUp } = await startApp();
const user = await signUp();

const raw = (headers: Record<string, string>, body: string) =>
  app.request("/v1/categories", { method: "POST", headers: { cookie: user.cookie, ...headers }, body });

const valid = JSON.stringify({ name: "س", icon: "📦", color: "#112233" });

test("writes from another site are refused", async () => {
  const reply = await raw({ origin: "https://evil.example", "content-type": "application/json" }, valid);
  assert.equal(reply.status, 403);
});

test("only JSON bodies are read", async () => {
  assert.equal((await raw({ "content-type": "text/plain" }, valid)).status, 415);
  assert.equal((await raw({ "content-type": "application/json" }, "{oops")).status, 400);
});

test("huge bodies are refused", async () => {
  const body = JSON.stringify({ name: "x".repeat(300_000) });
  const reply = await raw({ "content-type": "application/json", "content-length": String(body.length) }, body);
  assert.equal(reply.status, 400);
});

test("invalid fields are named", async () => {
  const reply = await user.post("/v1/categories", { name: "", icon: "📦", color: "red" });
  assert.equal(reply.status, 422);
  assert.deepEqual(Object.keys(reply.error.fields).sort(), ["color", "name"]);
});

test("impossible days are refused", async () => {
  const reply = await user.post("/v1/expenses", { amount: 100, date: "2026-02-31" });
  assert.equal(reply.status, 422);
});

test("unknown paths answer 404", async () => {
  assert.equal((await user.get("/v1/nothing")).status, 404);
});

test("profile changes only what is sent", async () => {
  await user.patch("/v1/me", { name: "كريم", monthlyBudget: 50_000 });
  const reply = await user.patch("/v1/me", { timezone: "Asia/Damascus", notifyDebts: false });
  assert.equal(reply.data.name, "كريم");
  assert.equal(reply.data.monthlyBudget, 50_000);
  assert.equal(reply.data.timezone, "Asia/Damascus");
  assert.equal(reply.data.notifyDebts, false);
  assert.equal((await user.patch("/v1/me", { timezone: "Mars/One" })).status, 422);
  assert.equal((await user.patch("/v1/me", { email: "x@example.com" })).data.email, user.email);
});

test("exchange rates", async () => {
  assert.equal((await user.get("/v1/rates?from=USD&to=EUR")).data.rate, 0.9);
  assert.equal((await user.get("/v1/rates?from=EUR&to=EUR")).data.rate, 1);
  assert.equal((await user.get("/v1/rates?from=USD&to=SYP")).data.rate, null);
  assert.equal((await user.get("/v1/rates?from=USD&to=XXX")).status, 422);
});

test("too many requests in a window are refused, then allowed again", async () => {
  let now = 0;
  const limited = new Hono<AppEnv>();
  limited.onError(onError);
  limited.use(async (c, next) => {
    c.set("user", { id: "u1" } as User);
    await next();
  });
  limited.use(rateLimit({ max: 2, windowMs: 1000, now: () => now }));
  limited.get("/", (c) => c.text("ok"));
  const status = async () => (await limited.request("/")).status;
  assert.deepEqual([await status(), await status(), await status()], [200, 200, 429]);
  now = 1000;
  assert.equal(await status(), 200);
});

test("bad configuration is refused at startup", () => {
  const good = { DATABASE_URL: "postgres://x", BETTER_AUTH_SECRET: "x".repeat(32), API_URL: "https://x.test" };
  assert.ok(loadEnv(good));
  assert.throws(() => loadEnv({ ...good, BETTER_AUTH_SECRET: "short" }), /BETTER_AUTH_SECRET/);
  assert.throws(() => loadEnv({ ...good, NODE_ENV: "production", DATABASE_URL: "pglite:" }), /development only/);
});
