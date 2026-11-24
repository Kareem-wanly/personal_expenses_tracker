import { z } from "zod";

/** The server posts to this address, so only real push services are accepted. */
const PUSH_HOSTS = [
  "fcm.googleapis.com",
  "push.services.mozilla.com",
  "notify.windows.com",
  "push.apple.com",
];

function isPushService(value: string): boolean {
  if (!URL.canParse(value)) return false;
  const { protocol, hostname, port } = new URL(value);
  const known = PUSH_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  return protocol === "https:" && port === "" && known;
}

const endpoint = z.string().max(1000).refine(isPushService, "اشتراك غير صالح");

export const registerDevice = z.object({
  endpoint,
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(100),
  }),
});

export const deviceEndpoint = z.object({ endpoint });

export type RegisterDevice = z.infer<typeof registerDevice>;
