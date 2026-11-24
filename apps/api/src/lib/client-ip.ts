import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";

/** Header Better Auth reads for rate limiting; always overwritten by us. */
export const CLIENT_IP_HEADER = "x-client-ip";

function clientIp(c: Context, trustProxy: boolean): string {
  // The proxy appends the real address last; earlier entries can be forged.
  const forwarded = trustProxy && c.req.header("x-forwarded-for")?.split(",").at(-1)?.trim();
  if (forwarded) return forwarded;
  // No socket when the app is called directly (tests).
  if (!c.env?.incoming) return "127.0.0.1";
  return getConnInfo(c).remote.address ?? "127.0.0.1";
}

/** The request with a client address nobody outside can fake. */
export function withClientIp(c: Context, trustProxy: boolean): Request {
  const headers = new Headers(c.req.raw.headers);
  headers.set(CLIENT_IP_HEADER, clientIp(c, trustProxy));
  return new Request(c.req.raw, { headers });
}
