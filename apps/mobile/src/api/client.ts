import type { ApiFailure } from "@masrufi/contracts/api/responses";

import { sessionCookie } from "./auth";
import { API_URL } from "./config";

/** The API refused: `message` can be shown as it is, `fields` belong to form fields. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const cookie = await sessionCookie();
  const response = await fetch(`${API_URL}/v1${path}`, {
    method,
    credentials: cookie ? "omit" : "include",
    headers: {
      ...(cookie && { cookie }),
      ...(body !== undefined && { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => {
    throw new ApiError(0, "لا يوجد اتصال بالخادم");
  });

  if (response.status === 204) return undefined as T;
  const json: unknown = await response.json().catch(() => null);
  if (response.ok) return (json as { data: T }).data;
  const error = (json as ApiFailure | null)?.error;
  throw new ApiError(response.status, error?.message ?? "حدث خطأ غير متوقع", error?.fields);
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  delete: (path: string) => request<void>("DELETE", path),
};
