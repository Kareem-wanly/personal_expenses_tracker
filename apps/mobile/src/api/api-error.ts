/** The API refused: `message` can be shown as it is, `fields` belong to form fields. Status 0: no connection. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

export const isConnectionError = (error: unknown) => error instanceof ApiError && error.status === 0;
