import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { beforeEach, test } from "node:test";

import { addDays, todayISO } from "@masrufi/core/dates";

import { CRON_SECRET, type TestUser, startApp } from "./helpers";

const { app, push, background, signUp } = await startApp();

const today = todayISO("UTC");
const tomorrow = addDays(today, 1);
const keys = { p256dh: "key", auth: "auth" };

beforeEach(() => {
  push.sent = [];
  push.answer = { result: "sent" };
});

async function withDevice() {
  const user = await signUp();
  const endpoint = `https://fcm.googleapis.com/fcm/send/${randomUUID()}`;
  assert.equal((await user.post("/v1/devices", { endpoint, keys })).status, 204);
  return { user, endpoint };
}

const sentTo = (endpoint: string) =>
  push.sent.filter((message) => message.endpoint === endpoint).map((message) => message.payload);

async function spend(user: TestUser, amount: number, categoryId?: string) {
  await user.post("/v1/expenses", { amount, date: today, categoryId });
  await background.idle();
}

async function runDailyJob() {
  const headers = { authorization: `Bearer ${CRON_SECRET}` };
  const response = await app.request("/jobs/daily", { method: "POST", headers });
  assert.equal(response.status, 200);
}

test("only real push services can be registered", async () => {
  const user = await signUp();
  const status = async (endpoint: string) => (await user.post("/v1/devices", { endpoint, keys })).status;
  assert.equal(await status("https://web.push.apple.com/abc"), 204);
  const bad = [
    "http://fcm.googleapis.com/x",
    "https://localhost/x",
    "https://169.254.169.254/latest",
    "https://evilfcm.googleapis.com.attacker.example/x",
    "https://fcm.googleapis.com:8080/x",
    "https://notfcm.googleapis.com@attacker.example/x",
  ];
  for (const endpoint of bad) assert.equal(await status(endpoint), 422, endpoint);
});

test("a test message says why it failed", async () => {
  const { user, endpoint } = await withDevice();
  const result = async () => (await user.post("/v1/devices/test", { endpoint })).data.result;
  assert.equal(await result(), "sent");
  push.answer = { result: "refused", status: 403 };
  assert.equal(await result(), "key-mismatch");
  push.answer = { result: "refused", status: 500 };
  assert.equal(await result(), "push-error");
  push.answer = { result: "expired" };
  assert.equal(await result(), "expired");
  assert.equal(await result(), "not-registered"); // expired devices are forgotten
});

test("a device follows the last account, and only its owner removes it", async () => {
  const { user, endpoint } = await withDevice();
  const other = await signUp();
  await other.delete("/v1/devices", { endpoint });
  assert.equal((await user.post("/v1/devices/test", { endpoint })).data.result, "sent");
  await other.post("/v1/devices", { endpoint, keys });
  assert.equal((await user.post("/v1/devices/test", { endpoint })).data.result, "not-registered");
  await other.delete("/v1/devices", { endpoint });
  assert.equal((await other.post("/v1/devices/test", { endpoint })).data.result, "not-registered");
});

test("budget alerts come once at 80% and once at 100%", async () => {
  const { user, endpoint } = await withDevice();
  await user.patch("/v1/me", { monthlyBudget: 1000 });
  const alerts = () => sentTo(endpoint).length;
  await spend(user, 700);
  assert.equal(alerts(), 0);
  await spend(user, 150);
  assert.equal(alerts(), 1);
  await spend(user, 10);
  assert.equal(alerts(), 1);
  await spend(user, 500);
  assert.equal(alerts(), 2);
  assert.match(sentTo(endpoint)[1].title, /تجاوزت/);
});

test("category budgets, and switching alerts off", async () => {
  const { user, endpoint } = await withDevice();
  const [category] = (await user.get("/v1/categories")).data;
  await user.put(`/v1/categories/${category.id}`, { ...category, budget: 1000 });
  await spend(user, 900, category.id);
  assert.match(sentTo(endpoint)[0].title, new RegExp(category.name));
  await user.patch("/v1/me", { notifyBudget: false });
  await spend(user, 900, category.id);
  assert.equal(sentTo(endpoint).length, 1);
});

test("saving an expense survives a failing push service", async () => {
  const { user } = await withDevice();
  await user.patch("/v1/me", { monthlyBudget: 100 });
  push.answer = { result: "refused", status: 0 };
  await spend(user, 500);
  assert.equal((await user.get("/v1/dashboard")).data.spent, 500);
});

test("the daily job needs its secret", async () => {
  const run = (authorization?: string) =>
    app.request("/jobs/daily", { method: "POST", headers: authorization ? { authorization } : {} });
  assert.equal((await run()).status, 401);
  assert.equal((await run("Bearer wrong")).status, 401);
});

test("the daily job reminds about tomorrow's bills and due debts", async () => {
  const { user, endpoint } = await withDevice();
  await user.post("/v1/expenses", { amount: 500, date: addDays(today, -6), repeat: "weekly", note: "إيجار" });
  const debt = { direction: "lent", person: "سامر", amount: 900, currency: "USD", date: today };
  await user.post("/v1/debts", { ...debt, dueDate: tomorrow });
  await user.post("/v1/debts", { ...debt, person: "بعيد", dueDate: addDays(today, 9) });

  await runDailyJob();
  const messages = sentTo(endpoint);
  assert.match(messages.find((m) => m.tag === "recurring-tomorrow")!.body, /إيجار/);
  const debts = messages.find((m) => m.tag === "debts-due")!;
  assert.match(debts.body, /سامر/);
  assert.doesNotMatch(debts.body, /بعيد/);
});

test("the evening reminder only comes when nothing was logged", async () => {
  if (today.endsWith("-01")) return; // the summary is sent instead
  const [quiet, active] = [await withDevice(), await withDevice()];
  await spend(active.user, 100);
  await runDailyJob();
  assert.equal(sentTo(quiet.endpoint).filter((m) => m.tag === "daily-reminder").length, 1);
  assert.equal(sentTo(active.endpoint).length, 0);
});

test("the daily job creates due entries for users without devices", async () => {
  const user = await signUp();
  await user.post("/v1/expenses", { amount: 500, date: today, repeat: "weekly" });
  await runDailyJob();
  assert.equal((await user.get("/v1/dashboard")).data.spent, 500);
});
