import assert from "node:assert/strict";
import { test } from "node:test";

import { startApp } from "./helpers";

const { signUp } = await startApp();

const books = { name: "كتب", icon: "📚", color: "#112233", budget: 5000 };

test("names are unique, and reusable after deleting", async () => {
  const user = await signUp();
  const { data } = await user.post("/v1/categories", books);
  const again = await user.post("/v1/categories", books);
  assert.equal(again.status, 409);
  assert.ok(again.error.fields.name);
  await user.delete(`/v1/categories/${data.id}`);
  assert.equal((await user.post("/v1/categories", books)).status, 201);
  assert.equal((await (await signUp()).post("/v1/categories", books)).status, 201);
});

test("editing can't take another category's name", async () => {
  const user = await signUp();
  const [first, second] = (await user.get("/v1/categories")).data;
  const taken = await user.put(`/v1/categories/${first.id}`, { ...books, name: second.name });
  assert.equal(taken.status, 409);
  assert.equal((await user.put(`/v1/categories/${first.id}`, books)).data.budget, 5000);
});

test("deleting keeps its expenses, uncategorized", async () => {
  const user = await signUp();
  const { data } = await user.post("/v1/categories", books);
  await user.post("/v1/expenses", { amount: 100, date: "2026-03-10", categoryId: data.id });
  const listed = (await user.get("/v1/categories")).data;
  assert.equal(listed.find((c: { id: string }) => c.id === data.id).expenseCount, 1);

  await user.delete(`/v1/categories/${data.id}`);
  const { days } = (await user.get("/v1/expenses?month=2026-03")).data;
  assert.equal(days[0].items[0].categoryId, null);
});
