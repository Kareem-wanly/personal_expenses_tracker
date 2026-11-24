import assert from "node:assert/strict";
import { test } from "node:test";

import { ORIGIN, PASSWORD, call, readCookies, startApp } from "./helpers";

const { app, mails, signUp } = await startApp();

const post = (path: string, body: unknown, origin = ORIGIN) =>
  app.request(path, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const signIn = (email: string, password: string) =>
  post("/api/auth/sign-in/email", { email, password });

test("health is public, everything under /v1 is not", async () => {
  assert.equal((await call(app, "GET", "/health")).status, 200);
  for (const path of ["/v1/me", "/v1/expenses?month=2026-01", "/v1/debts", "/v1/unknown"]) {
    const reply = await call(app, "GET", path);
    assert.equal(reply.status, 401, path);
    assert.equal(reply.error.code, "unauthorized");
  }
});

test("a new account starts with categories and its profile", async () => {
  const user = await signUp();
  const me = await user.get("/v1/me");
  assert.equal(me.data.email, user.email);
  assert.equal(me.data.currency, "USD");
  assert.equal((await user.get("/v1/categories")).data.length, 9);
});

test("wrong password is refused", async () => {
  const user = await signUp();
  assert.equal((await signIn(user.email, "wrong-password")).status, 401);
  assert.equal((await signIn(user.email, PASSWORD)).status, 200);
});

test("password reset by mail ends old sessions", async () => {
  const user = await signUp();
  await post("/api/auth/request-password-reset", { email: user.email, redirectTo: `${ORIGIN}/reset` });
  const mail = mails.find((m) => m.to === user.email);
  const token = mail?.text.match(/reset-password\/([^?]+)/)?.[1];
  assert.ok(token);

  const newPassword = "Another-pass-2";
  const reset = await post("/api/auth/reset-password", { token, newPassword });
  assert.equal(reset.status, 200);
  assert.equal((await user.get("/v1/me")).status, 401);
  assert.equal((await signIn(user.email, PASSWORD)).status, 401);

  const again = await signIn(user.email, newPassword);
  const reply = await call(app, "GET", "/v1/me", undefined, readCookies(again));
  assert.equal(reply.status, 200);
  const reused = await post("/api/auth/reset-password", { token, newPassword: "Third-pass-33" });
  assert.equal(reused.status, 400);
});

test("a reset link never goes to an unknown site", async () => {
  const user = await signUp();
  const reply = await post("/api/auth/request-password-reset", {
    email: user.email,
    redirectTo: "https://evil.example/reset",
  });
  assert.equal(reply.status, 403);
});

test("deleting the account removes it and its data", async () => {
  const user = await signUp();
  const reply = await app.request("/api/auth/delete-user", {
    method: "POST",
    headers: { origin: ORIGIN, cookie: user.cookie, "content-type": "application/json" },
    body: JSON.stringify({ password: PASSWORD }),
  });
  assert.equal(reply.status, 200);
  assert.equal((await user.get("/v1/me")).status, 401);
  assert.equal((await signIn(user.email, PASSWORD)).status, 401);
});

test("the app's URL scheme may sign in, other sites may not", async () => {
  const user = await signUp();
  const body = { email: user.email, password: PASSWORD };
  assert.equal((await post("/api/auth/sign-in/email", body, "masrufi://")).status, 200);
  assert.equal((await post("/api/auth/sign-in/email", body, "https://evil.example")).status, 403);
});
