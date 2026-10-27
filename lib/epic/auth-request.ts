// lib/epic/auth-request.ts
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
