// lib/epic/service-auth.ts
import { EPIC_BASIC_AUTH } from "./helpers";
import { parseEpicAuthInput, loadStoredEpicCredentials, storeEpicCredentials, refreshEpicAccessToken } from "./credentials";

export interface ResolvedEpicAuth {
  accessToken: string;
  accountId: string;
  refreshToken: string;
  displayName: string;
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
