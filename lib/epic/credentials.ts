import { getUserPlatformAccounts, getUserPlatformApiKey, saveUserPlatformAccount } from "@/lib/db";
import { EPIC_BASIC_AUTH } from "./helpers";

const EPIC_ACCOUNT_API = "https://account-public-service-prod03.ol.epicgames.com/account/api/oauth";

export interface EpicCredentials {
  accessToken: string;
  refreshToken: string | null;
  accountId: string;
  displayName?: string;
}

/** Raised when Epic rejects the access token (expired / revoked). */
export class EpicAuthError extends Error {
  constructor(message = "Jeton Epic Games expiré ou invalide.") {
    super(message);
    this.name = "EpicAuthError";
  }
}

export { parseEpicAuthInput } from "./auth-parser";
import { parseEpicAuthInput } from "./auth-parser";

/** Verifies a direct `eg1~` access token, or exchanges an authorization code. */
export async function exchangeEpicAuthInput(
  raw: string
): Promise<EpicCredentials | null> {
  const code = parseEpicAuthInput(raw);
  if (!code) return null;

  if (code.startsWith("eg1~")) {
    try {
      const verifyRes = await fetch(`${EPIC_ACCOUNT_API}/verify`, {
        headers: { Authorization: `Bearer ${code}` },
      });
      if (verifyRes.ok) {
        const data = await verifyRes.json();
        if (data?.account_id) {
          return {
            accessToken: code,
            refreshToken: null,
            accountId: data.account_id,
            displayName: data.display_name || data.displayName,
          };
        }
      }
    } catch {
      // Fall through to code exchange
    }
  }

  try {
    const tokenRes = await fetch(`${EPIC_ACCOUNT_API}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${EPIC_BASIC_AUTH}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        token_type: "eg1",
      }).toString(),
    });
    if (!tokenRes.ok) return null;
    const data = await tokenRes.json();
    if (!data?.access_token || !data?.account_id) return null;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      accountId: data.account_id,
      displayName: data.displayName,
    };
  } catch {
    return null;
  }
}

export async function refreshEpicAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken?: string; accountId?: string } | null> {
  try {
    const res = await fetch(`${EPIC_ACCOUNT_API}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${EPIC_BASIC_AUTH}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accountId: data.account_id,
    };
  } catch {
    return null;
  }
}

export function loadStoredEpicCredentials(userId: string): EpicCredentials | null {
  const raw = getUserPlatformApiKey(userId, "epic");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken || !parsed?.accountId) return null;
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken || null,
      accountId: parsed.accountId,
    };
  } catch {
    return null;
  }
}

export function storeEpicCredentials(userId: string, creds: EpicCredentials): void {
  try {
    const accounts = getUserPlatformAccounts(userId);
    const account = accounts.epic || {
      platform: "epic" as const,
      username: creds.accountId,
      displayName: creds.displayName || "Joueur Epic",
      connectedAt: new Date().toISOString(),
      stats: { gamesOwned: 0, totalAchievements: 0, completedGames: 0 },
    };
    saveUserPlatformAccount(
      userId,
      account,
      JSON.stringify({
        accessToken: creds.accessToken,
        refreshToken: creds.refreshToken,
        accountId: creds.accountId,
      })
    );
  } catch {
    // Non-blocking persistence
  }
}

/**
 * Runs `fn` with the given credentials; if Epic rejects the token and a
 * refresh token is available, refreshes it once (persisting it) and retries.
 */
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
