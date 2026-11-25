import type { ApiFailure } from "@masrufi/contracts/api/responses";

import { sessionCookie } from "./auth";
import { API_URL } from "./config";

import { ApiError } from "./api-error";

export { ApiError };

async function send(method: string, path: string, body?: unknown): Promise<Response> {
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
  if (response.ok) return response;
  const failure = (await response.json().catch(() => null)) as ApiFailure | null;
  const { message = "حدث خطأ غير متوقع", fields } = failure?.error ?? {};
  throw new ApiError(response.status, message, fields);
}

/** One request, as it is (writes usually go through `write`, which also works offline). */
export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await send(method, path, body);
  if (response.status === 204) return undefined as T;
  return ((await response.json()) as { data: T }).data;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  /** A file, as it is. */
  text: async (path: string) => (await send("GET", path)).text(),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  delete: (path: string) => request<void>("DELETE", path),
};
