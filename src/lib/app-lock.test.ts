import assert from "node:assert/strict";
import { test } from "node:test";

import { fromB64Url, hashPin, isValidPin, shouldLock, verifyPin } from "./app-lock";

test("shouldLock: locks once the timeout has passed", () => {
  const now = 1_000_000;
  assert.equal(shouldLock(now, now - 59_000, 60), false);
  assert.equal(shouldLock(now, now - 60_000, 60), true);
  assert.equal(shouldLock(now, now - 1, 0), true, "timeout 0 locks every time");
  assert.equal(shouldLock(now, null, 300), true, "never seen active → lock");
  assert.equal(shouldLock(now, Number.NaN, 300), true);
});

test("isValidPin: exactly 4 digits", () => {
  assert.equal(isValidPin("0420"), true);
  assert.equal(isValidPin("123"), false);
  assert.equal(isValidPin("12345"), false);
  assert.equal(isValidPin("12a4"), false);
  assert.equal(isValidPin("١٢٣٤"), false, "Arabic-Indic digits are normalised before this");
});

test("hashPin / verifyPin round-trip with a random salt", async () => {
  const a = await hashPin("2468");
  const b = await hashPin("2468");
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.hash, b.hash);
  assert.equal(await verifyPin("2468", a), true);
  assert.equal(await verifyPin("2469", a), false);
  assert.equal(await verifyPin("2468", b), true);
});

test("fromB64Url decodes unpadded base64url", () => {
  assert.deepEqual([...fromB64Url("_-8")], [0xff, 0xef]);
  assert.deepEqual([...fromB64Url("AQID")], [1, 2, 3]);
});
