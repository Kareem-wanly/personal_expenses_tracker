import { sendWrite } from "./outbox";
import { queryClient } from "./query-client";
import type { Queued, Write } from "./write-policy";

const send = <T>(method: Write["method"], path: string, body?: unknown) =>
  sendWrite<T>(queryClient, { method, path, body });

/** Changes on the server; kept on the phone when there is no connection. */
export const write = {
  post: <T>(path: string, body: unknown): Promise<T | Queued> => send<T>("POST", path, body),
  put: <T>(path: string, body: unknown): Promise<T | Queued> => send<T>("PUT", path, body),
  patch: <T>(path: string, body: unknown): Promise<T | Queued> => send<T>("PATCH", path, body),
  delete: (path: string): Promise<void | Queued> => send<void>("DELETE", path),
};
