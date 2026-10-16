// lib/epic/credentials-tokens.ts
import { EPIC_BASIC_AUTH } from "./helpers";
import { parseEpicAuthInput } from "./auth-parser";
import type { EpicCredentials } from "./credentials-store";

export const EPIC_ACCOUNT_API = "https://account-public-service-prod03.ol.epicgames.com/account/api/oauth";

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
