import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

import { startApp } from "./helpers";

const { signUp } = await startApp();

const loan = { direction: "lent", person: "سامر", amount: 10_000, currency: "USD", date: "2026-03-01" };
const car = { name: "سيارة", icon: "🚗", target: 10_000, currency: "USD" };
const day = { date: "2026-03-05" };

test("payments settle a debt, and deleting one reopens it", async () => {
  const user = await signUp();
  const debt = (await user.post("/v1/debts", loan)).data;
  const payments = `/v1/debts/${debt.id}/payments`;

  assert.equal((await user.post(payments, { amount: 4000, ...day })).data.settledAt, null);
  const tooMuch = await user.post(payments, { amount: 6001, ...day });
  assert.equal(tooMuch.status, 422);
  assert.ok(tooMuch.error.fields.amount);

  assert.ok((await user.post(`/v1/debts/${debt.id}/settle`)).data.settledAt);
  const [settled] = (await user.get("/v1/debts")).data;
  assert.equal(settled.paid, 10_000);
  assert.equal(settled.payments.length, 2);

  const reopened = await user.delete(`${payments}/${settled.payments[0].id}`);
  assert.equal(reopened.data.settledAt, null);
});

test("a payment sent twice counts once", async () => {
  const user = await signUp();
  const debt = (await user.post("/v1/debts", loan)).data;
  const payment = { id: randomUUID(), amount: 6000, ...day };
  await user.post(`/v1/debts/${debt.id}/payments`, payment);
  assert.equal((await user.post(`/v1/debts/${debt.id}/payments`, payment)).status, 201);
  assert.equal((await user.get("/v1/debts")).data[0].paid, 6000);
});

/** Sends the same request many times at once; how many were accepted. */
async function acceptedAtOnce(send: () => Promise<{ status: number }>) {
  const replies = await Promise.all(Array.from({ length: 10 }, send));
  return replies.filter((reply) => reply.status === 201).length;
}

// Only proves the locking on a real server (TEST_DATABASE_URL): PGlite has one connection.
test("simultaneous payments can't exceed the debt", async () => {
  const user = await signUp();
  for (let round = 0; round < 5; round++) {
    const debt = (await user.post("/v1/debts", loan)).data;
    const pay = () => user.post(`/v1/debts/${debt.id}/payments`, { amount: 7000, ...day });
    assert.equal(await acceptedAtOnce(pay), 1);
  }
});

test("simultaneous withdrawals can't exceed the savings", async () => {
  const user = await signUp();
  for (let round = 0; round < 5; round++) {
    const goal = (await user.post("/v1/goals", { ...car, initial: 4000 })).data;
    const body = { kind: "withdraw", amount: 3000, ...day };
    const withdraw = () => user.post(`/v1/goals/${goal.id}/contributions`, body);
    assert.equal(await acceptedAtOnce(withdraw), 1);
  }
});

test("raising the amount reopens a settled debt", async () => {
  const user = await signUp();
  const debt = (await user.post("/v1/debts", loan)).data;
  await user.post(`/v1/debts/${debt.id}/settle`);
  const raised = await user.put(`/v1/debts/${debt.id}`, { ...loan, amount: 20_000 });
  assert.equal(raised.data.settledAt, null);
});

test("goals: initial amount, deposits, withdrawals, reaching the target", async () => {
  const user = await signUp();
  const goal = (await user.post("/v1/goals", { ...car, initial: 4000 })).data;
  const path = `/v1/goals/${goal.id}/contributions`;

  assert.equal((await user.post(path, { kind: "withdraw", amount: 4001, ...day })).status, 422);
  assert.equal((await user.post(path, { kind: "withdraw", amount: 1000, ...day })).status, 201);
  assert.ok((await user.post(path, { kind: "deposit", amount: 7000, ...day })).data.achievedAt);

  const [details] = (await user.get("/v1/goals")).data;
  assert.equal(details.saved, 10_000);
  assert.equal(details.state.achieved, true);
});

test("removing a deposit can't leave a goal below zero", async () => {
  const user = await signUp();
  const goal = (await user.post("/v1/goals", { ...car, initial: 4000 })).data;
  const path = `/v1/goals/${goal.id}/contributions`;
  await user.post(path, { kind: "withdraw", amount: 3000, ...day });
  const [details] = (await user.get("/v1/goals")).data;
  const deposit = details.contributions.find((c: { amount: number }) => c.amount === 4000);
  assert.equal((await user.delete(`${path}/${deposit.id}`)).status, 422);
  assert.equal((await user.get("/v1/goals")).data[0].saved, 1000);
});

test("nobody can touch another user's plans", async () => {
  const [owner, stranger] = [await signUp(), await signUp()];
  const debt = (await owner.post("/v1/debts", loan)).data;
  const goal = (await owner.post("/v1/goals", car)).data;
  const payment = { amount: 1, ...day };
  assert.equal((await stranger.put(`/v1/debts/${debt.id}`, loan)).status, 404);
  assert.equal((await stranger.post(`/v1/debts/${debt.id}/payments`, payment)).status, 404);
  assert.equal((await stranger.post(`/v1/debts/${debt.id}/settle`)).status, 404);
  assert.equal((await stranger.delete(`/v1/debts/${debt.id}`)).status, 404);
  assert.equal((await stranger.put(`/v1/goals/${goal.id}`, car)).status, 404);
  assert.equal((await stranger.delete(`/v1/goals/${goal.id}`)).status, 404);
  const deposit = { kind: "deposit", ...payment };
  assert.equal((await stranger.post(`/v1/goals/${goal.id}/contributions`, deposit)).status, 404);
  assert.equal((await stranger.get("/v1/debts")).data.length, 0);
});

test("deleting hides debts and goals", async () => {
  const user = await signUp();
  const debt = (await user.post("/v1/debts", loan)).data;
  const goal = (await user.post("/v1/goals", car)).data;
  assert.equal((await user.delete(`/v1/debts/${debt.id}`)).status, 204);
  assert.equal((await user.delete(`/v1/goals/${goal.id}`)).status, 204);
  assert.equal((await user.get("/v1/debts")).data.length, 0);
  assert.equal((await user.get("/v1/goals")).data.length, 0);
});
