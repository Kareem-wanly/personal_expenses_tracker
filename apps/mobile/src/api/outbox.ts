import { type QueryClient, onlineManager } from "@tanstack/react-query";

import { showToast } from "@/ui/toast-store";

import { request } from "./client";
import { QUEUED, type Queued, type Write, isAlreadyDone, retryDelay, retryWrite } from "./write-policy";

/** Every write shares one queue and leaves it in order: an edit never overtakes its creation. */
export const WRITE_KEY = ["write"];
const SCOPE = { id: "outbox" };

async function perform(write: Write) {
  try {
    return await request(write.method, write.path, write.body);
  } catch (error) {
    if (isAlreadyDone(write, error)) return undefined;
    throw error;
  }
}

export function setupOutbox(client: QueryClient) {
  client.setMutationDefaults(WRITE_KEY, {
    mutationFn: (write: Write) => perform(write),
    scope: SCOPE,
    networkMode: "online",
    retry: retryWrite,
    retryDelay,
    onSuccess: () => client.invalidateQueries(),
    onError: (error: Error) => showToast(`تعذّر رفع عملية محفوظة: ${error.message}`, { tone: "error" }),
  });
}

const pendingWrites = (client: QueryClient) =>
  client.getMutationCache().findAll({ mutationKey: WRITE_KEY, status: "pending" }).length;

function enqueue(client: QueryClient, write: Write) {
  const mutation = client.getMutationCache().build(client, { mutationKey: WRITE_KEY, scope: SCOPE });
  // Nobody waits for it: the queue reports its own failures.
  mutation.execute(write).catch(() => undefined);
}

/**
 * Sends now when possible. Without a connection, or when earlier writes are
 * still waiting, it is kept on the phone and sent later, in order.
 */
export async function sendWrite<T>(client: QueryClient, write: Write): Promise<T | Queued> {
  if (onlineManager.isOnline() && pendingWrites(client) === 0) {
    try {
      return (await perform(write)) as T;
    } catch (error) {
      if (!retryWrite(0, error)) throw error;
    }
  }
  enqueue(client, write);
  return QUEUED;
}

/** After a restart: carry on with what was waiting, and check the saved screens against the server. */
export async function resumeWrites(client: QueryClient) {
  // Saved data comes back looking fresh, though writes may have reached the server since.
  void client.invalidateQueries();
  await client.resumePausedMutations();
  const left = client.getMutationCache().findAll({ mutationKey: WRITE_KEY, status: "pending" });
  for (const mutation of left) if (!mutation.state.isPaused) void mutation.continue().catch(() => undefined);
}
