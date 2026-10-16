// lib/epic/auth-request.ts
export const TOKEN_REQUIRED_MESSAGE =
  "Un code ou token d'autorisation Epic Games (authorizationToken) est requis pour synchroniser ce jeu.";

export const TOKEN_INVALID_MESSAGE =
  "Code d'autorisation Epic Games invalide ou expiré. Rendez-vous sur https://www.epicgames.com/id/api/redirect?clientId=34a02cf8f4414e29b15921876da36f9a&responseType=code pour obtenir un nouveau code.";

export function readAuthInput(request: Request): string {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  return (
    searchParams.get("authorizationToken") ||
    searchParams.get("authorization_token") ||
    searchParams.get("authorizationCode") ||
    searchParams.get("authorization_code") ||
    searchParams.get("code") ||
    searchParams.get("token") ||
    request.headers.get("x-authorization-token") ||
    bearerToken ||
    ""
  ).trim();
}
