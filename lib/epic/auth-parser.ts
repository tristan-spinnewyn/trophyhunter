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
