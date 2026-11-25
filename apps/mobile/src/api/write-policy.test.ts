import assert from "node:assert/strict";
import { test } from "node:test";

import { ApiError } from "./api-error";
import { isAlreadyDone, retryDelay, retryWrite } from "./write-policy";

test("only a lost connection is tried again", () => {
  assert.equal(retryWrite(50, new ApiError(0, "")), true);
  for (const status of [400, 401, 404, 409, 422, 500])
    assert.equal(retryWrite(0, new ApiError(status, "")), false);
  assert.equal(retryWrite(0, new Error("other")), false);
});

test("waits longer each time, never more than a minute", () => {
  assert.deepEqual([0, 1, 2].map(retryDelay), [2000, 4000, 8000]);
  assert.equal(retryDelay(20), 60_000);
});

test("a delete that finds nothing was already done", () => {
  assert.equal(isAlreadyDone({ method: "DELETE", path: "/x" }, new ApiError(404, "")), true);
  assert.equal(isAlreadyDone({ method: "PUT", path: "/x" }, new ApiError(404, "")), false);
});
