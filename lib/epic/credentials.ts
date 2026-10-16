// lib/epic/credentials.ts
import { type EpicCredentials, storeEpicCredentials } from "./credentials-store";
import { refreshEpicAccessToken } from "./credentials-tokens";

export { parseEpicAuthInput } from "./auth-parser";
export { type EpicCredentials, loadStoredEpicCredentials, storeEpicCredentials } from "./credentials-store";
export { exchangeEpicAuthInput, refreshEpicAccessToken } from "./credentials-tokens";

export class EpicAuthError extends Error {
  constructor(message = "Jeton Epic Games expiré ou invalide.") {
    super(message);
    this.name = "EpicAuthError";
  }
}

export async function withEpicCredentials<T>(
  creds: EpicCredentials,
  fn: (c: EpicCredentials) => Promise<T>,
  userId?: string | null
): Promise<{ result: T | null; creds: EpicCredentials; expired: boolean }> {
  try {
    return { result: await fn(creds), creds, expired: false };
  } catch (err) {
    if (!(err instanceof EpicAuthError)) throw err;
    if (!creds.refreshToken) return { result: null, creds, expired: true };

    const refreshed = await refreshEpicAccessToken(creds.refreshToken);
    if (!refreshed?.accessToken) return { result: null, creds, expired: true };

    const next: EpicCredentials = {
      ...creds,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken || creds.refreshToken,
      accountId: refreshed.accountId || creds.accountId,
    };
    if (userId) storeEpicCredentials(userId, next);

    try {
      return { result: await fn(next), creds: next, expired: false };
    } catch (retryErr) {
      if (retryErr instanceof EpicAuthError) {
        return { result: null, creds: next, expired: true };
      }
      throw retryErr;
    }
  }
}
