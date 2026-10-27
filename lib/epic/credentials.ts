// lib/epic/credentials.ts
import { getUserPlatformAccounts, getUserPlatformApiKey, saveUserPlatformAccount } from "@/lib/db";
import { parseEpicAuthInput } from "./auth-parser";

export { parseEpicAuthInput } from "./auth-parser";

export const EPIC_CLIENT_ID = "34a02cf8f4414e29b15921876da36f9a";
export const EPIC_CLIENT_SECRET = "daafbccc737745039dffe53d94fc76cf";
export const EPIC_BASIC_AUTH = Buffer.from(
  `${EPIC_CLIENT_ID}:${EPIC_CLIENT_SECRET}`
).toString("base64");

export const EPIC_ACCOUNT_API = "https://account-public-service-prod03.ol.epicgames.com/account/api/oauth";

export interface EpicCredentials {
  accessToken: string;
  refreshToken: string | null;
  accountId: string;
  displayName?: string;
}

export interface ResolvedEpicAuth {
  accessToken: string;
  accountId: string;
  refreshToken: string;
  displayName: string;
}

export class EpicAuthError extends Error {
  constructor(message = "Jeton Epic Games expiré ou invalide.") {
    super(message);
    this.name = "EpicAuthError";
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

export async function exchangeEpicAuthInput(raw: string): Promise<EpicCredentials | null> {
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

export async function resolveEpicTokens(
  code: string,
  rawUser?: string,
  authUser?: any
): Promise<{ resolved?: ResolvedEpicAuth; errorStatus?: number; errorMsg?: string; errorDetails?: any }> {
  const cleanCode = parseEpicAuthInput(code);
  let accessToken = "";
  let accountId = "";
  let refreshToken = "";
  let displayName = rawUser || "Joueur Epic";

  if (cleanCode.startsWith("eg1~")) {
    try {
      const verifyRes = await fetch("https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/verify", {
        headers: { Authorization: `Bearer ${cleanCode}` },
      });
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        accessToken = cleanCode;
        accountId = verifyData.account_id;
        displayName = verifyData.display_name || displayName;
      }
    } catch {}
  }

  if (!accessToken && !cleanCode && authUser) {
    const stored = loadStoredEpicCredentials(authUser.id);
    if (stored?.accessToken) {
      try {
        const verifyRes = await fetch("https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/verify", {
          headers: { Authorization: `Bearer ${stored.accessToken}` },
        });
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          accessToken = stored.accessToken;
          accountId = verifyData.account_id || stored.accountId;
          refreshToken = stored.refreshToken || "";
          displayName = verifyData.display_name || displayName;
        }
      } catch {}
    }
    if (!accessToken && stored?.refreshToken) {
      const refreshed = await refreshEpicAccessToken(stored.refreshToken);
      if (refreshed?.accessToken) {
        accessToken = refreshed.accessToken;
        accountId = refreshed.accountId || stored.accountId;
        refreshToken = refreshed.refreshToken || stored.refreshToken;
        storeEpicCredentials(authUser.id, { accessToken, refreshToken, accountId, displayName });
      }
    }
  }

  if (!accessToken) {
    if (!cleanCode) {
      return {
        errorStatus: 401,
        errorMsg: "Code d'autorisation Epic Games expiré ou invalide (authorizationToken). Rendez-vous sur https://www.epicgames.com/id/api/redirect?clientId=34a02cf8f4414e29b15921876da36f9a&responseType=code pour obtenir un nouveau code.",
      };
    }

    const tokenRes = await fetch("https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${EPIC_BASIC_AUTH}` },
      body: new URLSearchParams({ grant_type: "authorization_code", code: cleanCode, token_type: "eg1" }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return {
        errorStatus: 401,
        errorMsg: "Code d'autorisation Epic Games expiré ou invalide (authorizationToken). Rendez-vous sur https://www.epicgames.com/id/api/redirect?clientId=34a02cf8f4414e29b15921876da36f9a&responseType=code pour obtenir un nouveau code.",
        errorDetails: errText,
      };
    }

    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;
    accountId = tokenData.account_id;
    refreshToken = tokenData.refresh_token;
    displayName = tokenData.displayName || rawUser || "Joueur Epic";
  }

  return { resolved: { accessToken, accountId, refreshToken, displayName } };
}
