import assert from "node:assert/strict";
import { test } from "node:test";

import { addDays, monthOf, shiftMonth, todayISO } from "@masrufi/core/dates";

import { startApp } from "./helpers";

const { signUp } = await startApp();

const today = todayISO("UTC");
const month = monthOf(today);
const previous = shiftMonth(month, -1);

test("an empty account has an empty dashboard", async () => {
  const { data } = await (await signUp()).get("/v1/dashboard");
  assert.equal(data.spent, 0);
  assert.equal(data.balance, 0);
  assert.equal(data.hasIncome, false);
  assert.deepEqual(data.recent, []);
});

test("dashboard totals", async () => {
  const user = await signUp();
  const [category] = (await user.get("/v1/categories")).data;
  await user.post("/v1/expenses", { amount: 1500, date: today, categoryId: category.id });
  await user.post("/v1/expenses", { amount: 500, date: `${previous}-05` });
  await user.post("/v1/expenses", { amount: 900, date: addDays(today, 40) });
  await user.post("/v1/incomes", { amount: 10_000, date: today });
  const { data } = await user.get("/v1/dashboard");
  assert.equal(data.spent, 1500);
  assert.equal(data.todayTotal, 1500);
  assert.equal(data.earned, 10_000);
  assert.equal(data.balance, 8000); // future entries don't count yet
  assert.equal(data.byCategory[0].name, category.name);
  assert.equal(data.recent.length, 3);
});

test("\"today\" follows the user's time zone", async () => {
  const user = await signUp();
  for (const timezone of ["Pacific/Kiritimati", "Pacific/Pago_Pago"]) {
    await user.patch("/v1/me", { timezone });
    assert.equal((await user.get("/v1/dashboard")).data.today, todayISO(timezone));
  }
});

test("monthly report", async () => {
  const user = await signUp();
  await user.post("/v1/expenses", { amount: 4000, date: `${previous}-03`, paymentMethod: "card" });
  await user.post("/v1/expenses", { amount: 1000, date: `${previous}-20` });
  await user.post("/v1/expenses", { amount: 2500, date: `${shiftMonth(previous, -1)}-20` });
  await user.post("/v1/incomes", { amount: 9000, date: `${previous}-01` });
  const { data } = await user.get(`/v1/reports/monthly?month=${previous}`);
  assert.equal(data.total, 5000);
  assert.equal(data.previousTotal, 2500);
  assert.equal(data.change, 1);
  assert.equal(data.net, 4000);
  assert.equal(data.spendingDays, 2);
  assert.equal(data.maxDay.date, `${previous}-03`);
  assert.equal(data.top[0].amount, 4000);
  assert.equal(data.byMethod.length, 2);
  assert.deepEqual(data.trend.at(-1), { month: previous, total: 5000, income: 9000 });
  assert.equal(data.projected, null);
});

test("a deleted expense leaves every total", async () => {
  const user = await signUp();
  const { data } = await user.post("/v1/expenses", { amount: 4000, date: `${previous}-03` });
  await user.delete(`/v1/expenses/${data.id}`);
  const report = (await user.get(`/v1/reports/monthly?month=${previous}`)).data;
  assert.equal(report.total, 0);
  assert.deepEqual(report.byCategory, []);
  assert.deepEqual(report.top, []);
  assert.equal((await user.get("/v1/dashboard")).data.balance, 0);
});

test("insights answer for past, current and future months", async () => {
  const user = await signUp();
  await user.patch("/v1/me", { monthlyBudget: 1000 });
  await user.post("/v1/expenses", { amount: 5000, date: `${previous}-03`, note: "قهوة" });
  assert.ok((await user.get(`/v1/insights?month=${previous}`)).data.length > 0);
  assert.ok(Array.isArray((await user.get(`/v1/insights?month=${month}`)).data));
  assert.deepEqual((await user.get(`/v1/insights?month=${shiftMonth(month, 1)}`)).data, []);
  assert.equal((await user.get("/v1/insights?month=nope")).status, 422);
});
