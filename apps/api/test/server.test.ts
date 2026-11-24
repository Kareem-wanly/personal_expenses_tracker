import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createECDH } from "node:crypto";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import { loadEnv } from "../src/config/env";
import { createPushSender } from "../src/lib/push-sender";

const PORT = 4555;

function vapidKeys() {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  return {
    VAPID_PUBLIC_KEY: ecdh.getPublicKey("base64url"),
    VAPID_PRIVATE_KEY: ecdh.getPrivateKey("base64url"),
  };
}

const settings = {
  DATABASE_URL: "pglite:",
  BETTER_AUTH_SECRET: "x".repeat(32),
  API_URL: `http://localhost:${PORT}`,
};

async function answers(url: string): Promise<boolean> {
  const response = await fetch(url).catch(() => null);
  return response?.ok ?? false;
}

test("the real server starts and answers", { timeout: 60_000 }, async () => {
  const folder = await mkdtemp(join(tmpdir(), "masrufi-api-"));
  const env = { ...process.env, ...settings, DATABASE_URL: `pglite:${folder}`, PORT: String(PORT), ...vapidKeys() };
  const server = spawn(process.execPath, ["--import", "tsx", "src/server.ts"], { env });
  let output = "";
  server.stdout.on("data", (text) => (output += text));
  server.stderr.on("data", (text) => (output += text));
  after(() => server.kill());

  while (!(await answers(`${settings.API_URL}/health`))) {
    assert.equal(server.exitCode, null, output);
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
});

test("push is on with good keys, and off instead of crashing with bad ones", () => {
  assert.ok(createPushSender(loadEnv({ ...settings, ...vapidKeys() })));
  assert.equal(createPushSender(loadEnv(settings)), null);
  const bad = { VAPID_PUBLIC_KEY: "bad", VAPID_PRIVATE_KEY: "bad" };
  assert.equal(createPushSender(loadEnv({ ...settings, ...bad })), null);
});
