import assert from "node:assert/strict";
import { test } from "node:test";

import { moneyOf, moneyRequest, parseAmount } from "./money";

const plain = { originalAmount: null, originalCurrency: null };

test("amounts are read in Arabic and Latin digits", () => {
  assert.equal(parseAmount("12.5"), 1250);
  assert.equal(parseAmount("١٢٫٥"), 1250);
  assert.equal(parseAmount("12,5"), 1250);
  for (const bad of ["", "0", "abc", ".", "1.2.3"]) assert.equal(parseAmount(bad), null, bad);
});

test("editing shows what was typed, and saves the same thing", () => {
  const dollars = moneyOf({ amount: 825, ...plain }, "USD");
  assert.deepEqual(dollars, { amount: "8.25", currency: "USD", rate: "" });
  assert.deepEqual(moneyRequest(dollars, "USD"), { amount: 825 });

  const euros = moneyOf({ amount: 1100, originalAmount: 1000, originalCurrency: "EUR" }, "USD");
  assert.deepEqual(euros, { amount: "10", currency: "EUR", rate: "1.1" });
  assert.deepEqual(moneyRequest(euros, "USD"), { amount: 1000, currency: "EUR", rate: 1.1 });
});

test("another currency without a rate is sent without one, for the API to refuse", () => {
  const request = moneyRequest({ amount: "5", currency: "EUR", rate: "" }, "USD");
  assert.equal(request?.rate, undefined);
});
