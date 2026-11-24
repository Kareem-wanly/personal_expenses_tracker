/** An expected failure: the message is shown to the user as it is. */
export class AppError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 413 | 415 | 422 | 429,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

export const notFound = (message: string) => new AppError(404, "not_found", message);

export const conflict = (message: string, field?: string) =>
  new AppError(409, "conflict", message, field ? { [field]: [message] } : undefined);

/** A rule of the app was broken (as opposed to a badly formed request). */
export const ruleBroken = (message: string, field: string) =>
  new AppError(422, "rule_broken", message, { [field]: [message] });

/** PostgreSQL "unique_violation", wherever the driver put it in the error chain. */
export function isUniqueViolation(error: unknown): boolean {
  for (let e = error; e instanceof Error; e = e.cause) {
    if ((e as { code?: string }).code === "23505") return true;
  }
  return false;
}
