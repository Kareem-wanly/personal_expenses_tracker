import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

import { startApp } from "./helpers";

const { signUp } = await startApp();

const coffee = { amount: 500, date: "2026-03-10", note: "قهوة", paymentMethod: "card" };

test("add, list, search, edit and delete an expense", async () => {
  const user = await signUp();
  const [category] = (await user.get("/v1/categories")).data;
  const created = await user.post("/v1/expenses", { ...coffee, categoryId: category.id });
  assert.equal(created.status, 201);
  await user.post("/v1/expenses", { amount: 1200, date: "2026-03-10", note: "خصم 100%" });
  await user.post("/v1/expenses", { amount: 900, date: "2026-04-01" });

  const march = (await user.get("/v1/expenses?month=2026-03")).data;
  assert.equal(march.count, 2);
  assert.equal(march.total, 1700);
  assert.equal(march.days.length, 1);
  const search = (q: string) => user.get(`/v1/expenses?month=2026-03&q=${encodeURIComponent(q)}`);
  assert.equal((await search("قهوة")).data.count, 1);
  assert.equal((await search("%")).data.count, 1); // a literal percent sign
  assert.equal((await user.get(`/v1/expenses?month=2026-03&categoryId=${category.id}`)).data.count, 1);
  assert.equal((await user.get("/v1/expenses?month=2026-03&categoryId=none")).data.count, 1);

  const path = `/v1/expenses/${created.data.id}`;
  assert.equal((await user.put(path, { ...coffee, amount: 700 })).data.amount, 700);
  assert.equal((await user.delete(path)).status, 204);
  assert.equal((await user.delete(path)).status, 404);
  assert.equal((await search("قهوة")).data.count, 0);
});

test("sending the same entry twice keeps one", async () => {
  const user = await signUp();
  const id = randomUUID();
  await user.post("/v1/expenses", { ...coffee, id });
  const again = await user.post("/v1/expenses", { ...coffee, id });
  assert.equal(again.data.id, id);
  assert.equal((await user.get("/v1/expenses?month=2026-03")).data.count, 1);

  const other = await signUp();
  assert.equal((await other.post("/v1/expenses", { ...coffee, id })).status, 409);
});

test("a repeated send never starts a second rule", async () => {
  const user = await signUp();
  const body = { ...coffee, id: randomUUID(), repeat: "monthly" };
  await user.post("/v1/expenses", body);
  await user.post("/v1/expenses", body);
  assert.equal((await user.get("/v1/recurring")).data.length, 1);
});

test("batches are saved together or not at all", async () => {
  const user = await signUp();
  const items = [coffee, { ...coffee, amount: 700, note: "سندويشة" }];
  assert.equal((await user.post("/v1/expenses/batch", { items })).data.length, 2);
  const broken = [coffee, { ...coffee, categoryId: "missing" }];
  assert.equal((await user.post("/v1/expenses/batch", { items: broken })).status, 422);
  assert.equal((await user.get("/v1/expenses?month=2026-03")).data.count, 2);
});

test("another currency is stored converted, with what was typed", async () => {
  const user = await signUp();
  const euros = { ...coffee, amount: 5000, currency: "EUR" };
  assert.deepEqual(Object.keys((await user.post("/v1/expenses", euros)).error.fields), ["rate"]);
  const { data } = await user.post("/v1/expenses", { ...euros, rate: 1.1 });
  assert.equal(data.amount, 5500);
  assert.equal(data.originalAmount, 5000);
  assert.equal(data.originalCurrency, "EUR");
});

test("incomes", async () => {
  const user = await signUp();
  const salary = { amount: 200_000, date: "2026-03-01", source: "salary" };
  const { data } = await user.post("/v1/incomes", salary);
  assert.equal((await user.get("/v1/incomes?month=2026-03")).data.total, 200_000);
  assert.equal((await user.put(`/v1/incomes/${data.id}`, { ...salary, amount: 1 })).data.amount, 1);
  assert.equal((await user.delete(`/v1/incomes/${data.id}`)).status, 204);
  assert.equal((await user.get("/v1/incomes?month=2026-03")).data.items.length, 0);
});

test("nobody can touch another user's entries or categories", async () => {
  const [owner, stranger] = [await signUp(), await signUp()];
  const expense = (await owner.post("/v1/expenses", coffee)).data;
  const income = (await owner.post("/v1/incomes", { amount: 5, date: "2026-03-01" })).data;
  const [category] = (await owner.get("/v1/categories")).data;

  assert.equal((await stranger.put(`/v1/expenses/${expense.id}`, coffee)).status, 404);
  assert.equal((await stranger.delete(`/v1/expenses/${expense.id}`)).status, 404);
  assert.equal((await stranger.delete(`/v1/incomes/${income.id}`)).status, 404);
  assert.equal((await stranger.delete(`/v1/categories/${category.id}`)).status, 404);
  const stolen = await stranger.post("/v1/expenses", { ...coffee, categoryId: category.id });
  assert.equal(stolen.status, 422);
  assert.equal((await owner.get("/v1/expenses?month=2026-03")).data.count, 1);
});
