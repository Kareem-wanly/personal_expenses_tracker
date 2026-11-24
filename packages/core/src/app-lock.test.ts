import assert from "node:assert/strict";
import { test } from "node:test";

import { COOLDOWN_MS, MAX_ATTEMPTS, failedAttempt, isValidPin, shouldLock } from "./app-lock";

test("locks after the chosen time away", () => {
  assert.equal(shouldLock(100_000, null, 60), true);
  assert.equal(shouldLock(100_000, 60_000, 60), false);
  assert.equal(shouldLock(120_000, 60_000, 60), true);
  assert.equal(shouldLock(100_000, 100_000, 0), true);
});

test("a PIN is four digits", () => {
  assert.ok(isValidPin("0123"));
  for (const bad of ["", "123", "12345", "12a4", "١٢٣٤"]) assert.equal(isValidPin(bad), false);
});

test("too many wrong PINs must wait", () => {
  let attempts = { count: 0, until: 0 };
  for (let i = 1; i < MAX_ATTEMPTS; i++) attempts = failedAttempt(attempts, 1000);
  assert.deepEqual(attempts, { count: MAX_ATTEMPTS - 1, until: 0 });
  assert.deepEqual(failedAttempt(attempts, 1000), { count: 0, until: 1000 + COOLDOWN_MS });
});
