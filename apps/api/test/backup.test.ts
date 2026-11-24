import assert from "node:assert/strict";
import { test } from "node:test";

import type { Backup } from "@masrufi/contracts/backup";

import { type TestUser, startApp } from "./helpers";

const { signUp } = await startApp();

const day = { date: "2026-03-05" };

async function backupOf(user: TestUser): Promise<Backup> {
  const response = await user.download("/v1/backup");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-disposition")!, /masroofi-backup-/);
  return (await response.json()) as Backup;
}

const restore = (user: TestUser, backup: unknown) => user.post("/v1/backup/restore", backup);

/** An account with at least one of everything. */
async function filledAccount() {
  const user = await signUp();
  const category = (await user.post("/v1/categories", { name: "كتب", icon: "📚", color: "#112233" })).data;
  const expense = { amount: 500, ...day, note: "قهوة", categoryId: category.id };
  await user.post("/v1/expenses", expense);
  await user.post("/v1/expenses", expense); // two identical coffees are both real
  await user.post("/v1/expenses", { ...expense, amount: 900, repeat: "yearly" });
  await user.post("/v1/incomes", { amount: 9000, ...day });
  const debt = { direction: "lent", person: "سامر", amount: 1000, currency: "USD", ...day };
  const { id } = (await user.post("/v1/debts", debt)).data;
  await user.post(`/v1/debts/${id}/payments`, { amount: 400, ...day });
  await user.post("/v1/goals", { name: "سفر", icon: "✈️", target: 5000, currency: "USD", initial: 700 });
  await user.patch("/v1/me", { currency: "EUR", monthlyBudget: 12_345 });
  return user;
}

/** What matters of a backup, without ids. */
const summary = (b: Backup) => ({
  settings: b.settings,
  categories: b.categories.map((c) => c.name).sort(),
  expenses: b.expenses.map((e) => [e.amount, e.date, e.note, !!e.categoryId, !!e.recurringId]).sort(),
  incomes: b.incomes.map((i) => [i.amount, i.date]),
  recurring: b.recurring.map((r) => [r.amount, r.frequency]),
  debts: b.debts.map((d) => [d.person, d.amount, d.payments.map((p) => p.amount)]),
  goals: b.goals.map((g) => [g.name, g.contributions.map((c) => c.amount)]),
});

test("restoring into a new account copies everything, once", async () => {
  const backup = await backupOf(await filledAccount());
  const other = await signUp();

  const first = await restore(other, backup);
  assert.equal(first.status, 200);
  assert.deepEqual(first.data, { categories: 1, recurring: 1, expenses: 3, incomes: 1, debts: 1, goals: 1 });
  assert.deepEqual(summary(await backupOf(other)), summary(backup));

  const second = await restore(other, backup);
  assert.ok(Object.values(second.data).every((count) => count === 0));
  assert.deepEqual(summary(await backupOf(other)), summary(backup));
});

test("restoring into the same account changes nothing", async () => {
  const user = await filledAccount();
  const backup = await backupOf(user);
  const result = await restore(user, backup);
  assert.ok(Object.values(result.data).every((count) => count === 0));
  assert.deepEqual(summary(await backupOf(user)), summary(backup));
});

test("deleted entries come back", async () => {
  const user = await filledAccount();
  const backup = await backupOf(user);
  for (const { id } of backup.expenses) await user.delete(`/v1/expenses/${id}`);
  await user.delete(`/v1/debts/${backup.debts[0].id}`);
  await user.delete(`/v1/goals/${backup.goals[0].id}`);
  await user.delete(`/v1/recurring/${backup.recurring[0].id}`);
  const books = backup.categories.find((c) => c.name === "كتب")!;
  await user.delete(`/v1/categories/${books.id}`);

  assert.equal((await restore(user, backup)).data.expenses, 3);
  const after = await backupOf(user);
  assert.equal(after.expenses.length, 3);
  assert.equal(after.debts[0].payments[0].amount, 400);
  assert.equal(after.goals[0].contributions[0].amount, 700);
  assert.equal(after.recurring.length, 1);
  assert.ok(after.categories.some((c) => c.id === books.id));
});

test("one account's file never changes another account", async () => {
  const owner = await filledAccount();
  const backup = await backupOf(owner);
  const stranger = await signUp();
  for (const expense of backup.expenses) expense.amount = 1;
  await restore(stranger, backup);
  const untouched = await backupOf(owner);
  assert.ok(untouched.expenses.every((expense) => expense.amount > 1));
});

test("a file with repeated rows restores each once", async () => {
  const backup = await backupOf(await filledAccount());
  backup.expenses.push(...backup.expenses);
  assert.equal((await restore(await signUp(), backup)).data.expenses, 3);
});

test("files from version 1 of the site still restore", async () => {
  const { debts: _, goals: __, ...old } = await backupOf(await filledAccount());
  assert.equal((await restore(await signUp(), { ...old, version: 1 })).data.expenses, 3);
});

test("a broken file changes nothing", async () => {
  const user = await signUp();
  const backup = await backupOf(await filledAccount());
  assert.equal((await restore(user, { ...backup, app: "other" })).status, 422);
  assert.equal((await restore(user, {})).status, 422);
  assert.equal((await backupOf(user)).expenses.length, 0);
});

test("CSV lists expenses and incomes, safe for spreadsheets", async () => {
  const user = await signUp();
  await user.post("/v1/expenses", { amount: 1250, ...day, note: '=HYPERLINK("x")' });
  await user.post("/v1/incomes", { amount: 9000, date: "2026-03-09" });
  const response = await user.download("/v1/export?month=2026-03");
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf]); // BOM for Excel
  const lines = new TextDecoder().decode(bytes).split("\r\n");
  assert.equal(lines.length, 3);
  assert.match(lines[1], /^"2026-03-09","دخل","راتب","90"/);
  assert.match(lines[2], /"12.5","USD","نقداً","'=HYPERLINK\(""x""\)"/);
  assert.equal((await user.get("/v1/export?month=2026")).status, 422);
});
