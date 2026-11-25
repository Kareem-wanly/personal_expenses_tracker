import { isConnectionError } from "./api-error";

/** A write waiting on the phone until the server takes it. */
export type Write = { method: "POST" | "PUT" | "PATCH" | "DELETE"; path: string; body?: unknown };

/** Returned instead of the server's answer when a write was kept for later. */
export const QUEUED = { queued: true } as const;
export type Queued = typeof QUEUED;

export const isQueued = (value: unknown): value is Queued => value === QUEUED;

/** Lost connections are tried again forever; a refusal from the server is final. */
export const retryWrite = (_failures: number, error: unknown) => isConnectionError(error);

/** 2 s, 4 s, 8 s … up to a minute. */
export const retryDelay = (failures: number) => Math.min(2000 * 2 ** failures, 60_000);

/** Deleting twice (the first answer was lost) is still a success. */
export const isAlreadyDone = ({ method }: Write, error: unknown) =>
  method === "DELETE" && (error as { status?: number }).status === 404;
