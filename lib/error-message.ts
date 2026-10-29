// lib/error-message.ts

/** The message of a caught Error, or the fallback for anything else (or an empty message). */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** The positive numeric `status` attached to a caught error (e.g. 404), or the fallback. */
export function errorStatus(err: unknown, fallback: number): number {
  const status = typeof err === "object" && err !== null ? (err as { status?: unknown }).status : undefined;
  return typeof status === "number" && status > 0 ? status : fallback;
}

/**
 * The message to send back to the client: the error's own message only when it was raised on
 * purpose for the client (a status below 500), otherwise the fallback. Unexpected errors can carry
 * internal details (paths, hosts, SQL, upstream responses) that belong in the server logs only.
 */
export function publicErrorMessage(err: unknown, fallback: string): string {
  return errorStatus(err, 500) < 500 ? errorMessage(err, fallback) : fallback;
}
