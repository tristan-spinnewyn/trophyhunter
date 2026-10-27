// lib/epic/auth-input.ts
// Client-safe: no server-only imports (db, Buffer). Imported by browser components.

export const TOKEN_REQUIRED_MESSAGE =
  "Un code ou token d'autorisation Epic Games (authorizationToken) est requis pour synchroniser ce jeu.";

export const TOKEN_INVALID_MESSAGE =
  "Code d'autorisation Epic Games invalide ou expiré. Rendez-vous sur https://www.epicgames.com/id/api/redirect?clientId=34a02cf8f4414e29b15921876da36f9a&responseType=code pour obtenir un nouveau code.";

export const EPIC_AUTH_HEADER = "x-authorization-token";

/**
 * Reads the Epic authorization code / token from request headers only.
 * Query parameters are deliberately ignored: URLs end up in logs, history and Referer headers.
 */
export function readAuthInput(request: Request): string {
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  return (request.headers.get(EPIC_AUTH_HEADER) || bearerToken || "").trim();
}

/**
 * Normalizes whatever the user pasted into a usable authorization code / token:
 * - the raw JSON returned by the Epic redirect page ({"authorizationCode": "..."})
 * - a redirect URL containing ?code=...
 * - a bare code or an `eg1~` access token
 *
 * Pure string parsing function safe to import in client-side components.
 */
export function parseEpicAuthInput(raw: string | null | undefined): string {
  let value = (raw || "").trim();
  if (!value) return "";

  if (value.startsWith("{")) {
    try {
      const parsed = JSON.parse(value);
      value = String(
        parsed.authorizationCode ||
          parsed.authorizationToken ||
          parsed.code ||
          parsed.token ||
          parsed.access_token ||
          value
      ).trim();
    } catch {
      // Not valid JSON: keep the raw value
    }
  } else if (value.includes("code=")) {
    const match = value.match(/[?&]code=([a-f0-9]+)/i);
    if (match) value = match[1];
  }

  return value.replace(/^"+|"+$/g, "");
}

/**
 * Builds the request headers carrying an Epic authorization code, for client-side fetches.
 */
export function buildEpicAuthHeaders(rawToken: string | null | undefined): Record<string, string> {
  const token = parseEpicAuthInput(rawToken);
  return token ? { [EPIC_AUTH_HEADER]: token } : {};
}
