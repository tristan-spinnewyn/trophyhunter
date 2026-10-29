// lib/accounts/profile-sync-request.ts

/** What the accounts page sends to POST /api/profile/<platform>. */
export interface ProfileSyncInput {
  /** Platform identifier: SteamID, vanity name, profile URL, gamertag... */
  readonly user: string;
  /** Platform API key or token, kept out of the URL so it never lands in logs or history. */
  readonly secret: string;
}

function readTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Reads a profile sync request from its JSON body only.
 * The query string is deliberately ignored: URLs end up in logs, history and Referer headers.
 */
export async function readProfileSyncRequest(request: Request): Promise<ProfileSyncInput> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { user: "", secret: "" };
  }

  const record = body as Record<string, unknown>;
  return { user: readTrimmedString(record.user), secret: readTrimmedString(record.secret) };
}
