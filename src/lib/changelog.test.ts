import assert from "node:assert/strict";
import { it } from "node:test";

import { LATEST_RELEASE, RELEASES } from "./changelog";

it("versions are unique, date-based and newest first", () => {
  const versions = RELEASES.map((r) => r.version);
  assert.equal(new Set(versions).size, versions.length, "duplicate version");
  for (const v of versions) assert.match(v, /^\d{4}\.\d{2}\.\d{2}(\.\d+)?$/);
  const sorted = [...versions].sort((a, b) => b.localeCompare(a, "en", { numeric: true }));
  assert.deepEqual(versions, sorted, "RELEASES must be newest first");
  assert.equal(LATEST_RELEASE, RELEASES[0]);
});

it("every release has content", () => {
  for (const r of RELEASES) {
    assert.ok(r.title && r.items.length > 0, `release ${r.version} is empty`);
  }
});
