import assert from "node:assert/strict";
import { test } from "node:test";

import { addDays, monthOf, shiftMonth, todayISO } from "@masrufi/core/dates";

import { startApp } from "./helpers";

const { signUp } = await startApp();

const today = todayISO("UTC");
const rent = { amount: 30_000, date: addDays(today, -21), note: "إيجار", repeat: "weekly" };

async function countEntries(user: Awaited<ReturnType<typeof signUp>>, kind: string) {
  const months = [monthOf(today), shiftMonth(monthOf(today), -1)];
  let total = 0;
  for (const month of months) {
    const { data } = await user.get(`/v1/${kind}?month=${month}`);
    total += data.count ?? data.items.length;
  }
  return total;
}

test("a rule started in the past fills in what was due, once", async () => {
  const user = await signUp();
  await user.post("/v1/expenses", rent);
  assert.equal(await countEntries(user, "expenses"), 4);
  await Promise.all([user.get("/v1/dashboard"), user.get("/v1/dashboard")]);
  assert.equal(await countEntries(user, "expenses"), 4);
  const [rule] = (await user.get("/v1/recurring")).data;
  assert.equal(rule.nextDate, addDays(today, 7));
});

test("recurring income creates incomes", async () => {
  const user = await signUp();
  await user.post("/v1/incomes", { ...rent, source: "salary" });
  assert.equal(await countEntries(user, "incomes"), 4);
  assert.equal(await countEntries(user, "expenses"), 0);
});

test("a deleted occurrence doesn't come back", async () => {
  const user = await signUp();
  const { data } = await user.post("/v1/expenses", rent);
  await user.delete(`/v1/expenses/${data.id}`);
  await user.get("/v1/dashboard");
  assert.equal(await countEntries(user, "expenses"), 3);
});

test("pause, resume, edit and delete", async () => {
  const user = await signUp();
  await user.post("/v1/expenses", rent);
  const [rule] = (await user.get("/v1/recurring")).data;
  const path = `/v1/recurring/${rule.id}`;

  assert.equal((await user.post(`${path}/pause`)).data.active, false);
  assert.equal((await user.post(`${path}/resume`)).data.active, true);
  const edit = { amount: 1000, frequency: "monthly", nextDate: addDays(today, 3) };
  assert.equal((await user.put(path, { ...edit, nextDate: addDays(today, -1) })).status, 422);
  assert.equal((await user.put(path, edit)).data.amount, 1000);

  assert.equal((await (await signUp()).post(`${path}/pause`)).status, 404);
  assert.equal((await user.delete(path)).status, 204);
  assert.equal((await user.get("/v1/recurring")).data.length, 0);
  assert.equal(await countEntries(user, "expenses"), 4);
});
