// lib/igdb/igdb-client.ts
// Server-only client for the IGDB API (https://api-docs.igdb.com), authenticated with a Twitch app token.

const TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const API_URL = "https://api.igdb.com/v4";
/** A token is renewed this long before Twitch says it expires. */
const TOKEN_MARGIN_MS = 60_000;

interface CachedToken {
  readonly value: string;
  readonly expiresAt: number;
}

let cachedToken: CachedToken | null = null;

function readKeys(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.IGDB_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.IGDB_CLIENT_SECRET?.trim() ?? "";
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

/** Durations come from IGDB only when the owner of the instance set its Twitch keys. */
export function isIgdbConfigured(): boolean {
  return readKeys() !== null;
}

export function resetIgdbTokenForTesting(): void {
  cachedToken = null;
}

async function getToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - TOKEN_MARGIN_MS > Date.now()) return cachedToken.value;

  const params = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" });
  const res = await fetch(`${TOKEN_URL}?${params.toString()}`, { method: "POST" });
  if (!res.ok) throw new Error(`Twitch token request failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

/** Runs one Apicalypse query (`fields …; where …;`) against an IGDB endpoint. */
export async function igdbQuery<T>(endpoint: string, query: string): Promise<T[]> {
  const keys = readKeys();
  if (!keys) throw new Error("IGDB is not configured");

  const token = await getToken(keys.clientId, keys.clientSecret);
  const res = await fetch(`${API_URL}/${endpoint}`, {
    method: "POST",
    headers: { "Client-ID": keys.clientId, Authorization: `Bearer ${token}`, Accept: "application/json" },
    body: query,
  });
  if (!res.ok) throw new Error(`IGDB ${endpoint} query failed: ${res.status}`);
  return (await res.json()) as T[];
}
