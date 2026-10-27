// lib/epic/auth-headers.ts
import { parseEpicAuthInput } from "./auth-parser";
import { EPIC_AUTH_HEADER } from "./auth-request";

/**
 * Builds the request headers carrying an Epic authorization code, for client-side fetches.
 */
export function buildEpicAuthHeaders(rawToken: string | null | undefined): Record<string, string> {
  const token = parseEpicAuthInput(rawToken);
  return token ? { [EPIC_AUTH_HEADER]: token } : {};
}
