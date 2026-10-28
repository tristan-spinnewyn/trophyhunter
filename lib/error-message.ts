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
