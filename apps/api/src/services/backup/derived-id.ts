import { createHash } from "node:crypto";

/**
 * A stand-in for an id another account already uses. Always the same for the
 * same user and id, so a second restore finds the rows of the first.
 */
export function derivedId(userId: string, backupId: string): string {
  const hash = createHash("sha256").update(`${userId}:${backupId}`).digest("hex");
  // Shaped as a version 8 (custom) UUID.
  const parts = [hash.slice(0, 8), hash.slice(8, 12), `8${hash.slice(13, 16)}`, `8${hash.slice(17, 20)}`];
  return [...parts, hash.slice(20, 32)].join("-");
}
