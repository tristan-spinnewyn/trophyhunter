import { getAuthenticatedUser } from "./auth";
import {
  getUserPlatformAccounts,
  getUserPlatformApiKey,
  saveUserPlatformAccount,
  getUserOwnedGames,
  getUserGameProgress,
  saveUserGameProgress,
} from "./db";
import { normalizeGameTitle } from "./db/collections";

const EPIC_CLIENT_ID = "34a02cf8f4414e29b15921876da36f9a";
const EPIC_CLIENT_SECRET = "daafbccc737745039dffe53d94fc76cf";
const EPIC_BASIC_AUTH = Buffer.from(
  `${EPIC_CLIENT_ID}:${EPIC_CLIENT_SECRET}`
).toString("base64");

export async function refreshEpicAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken?: string; accountId?: string } | null> {
  try {
    const res = await fetch(
      "https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${EPIC_BASIC_AUTH}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }).toString(),
      }
    );
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

export async function fetchEpicPlayerAchievements(
  accountId: string,
  accessToken: string
): Promise<any[]> {
  const gqlQuery = `query PlayerProfileAchievements($epicAccountId: String!) {
    PlayerAchievement {
      playerAchievementGameRecords(epicAccountId: $epicAccountId) {
        records {
          sandboxId
          totalUnlocked
          totalXP
          achievementSets {
            achievementSetId
            totalAchievements
            totalUnlocked
          }
          playerAchievements {
            achievementName
            unlocked
            XP
          }
        }
      }
    }
  }`;

  try {
    const res = await fetch("https://graphql.epicgames.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "EpicGamesLauncher/14.0.8-22004686+++Portal+Release-Live",
      },
      body: JSON.stringify({
        query: gqlQuery,
        variables: { epicAccountId: accountId },
      }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (
      json?.data?.PlayerAchievement?.playerAchievementGameRecords?.records || []
    );
  } catch {
    return [];
  }
}

export interface EpicSyncResult {
  success: boolean;
  platform: "epic";
  gameName: string;
  totalAchievements: number;
  count: number;
  unlockedTitles: string[];
  unlockedIds: string[];
  error?: string;
  requiresToken?: boolean;
}

export async function syncEpicGame(
  request: Request,
  appId: string | number,
  gameName?: string
): Promise<EpicSyncResult> {
  const authUser = await getAuthenticatedUser();
  const numAppId = typeof appId === "string" ? parseInt(appId, 10) : appId;
  const normTitle = normalizeGameTitle(gameName || "");

  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  const rawAuthToken = (
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

  let cleanToken = rawAuthToken;
  if (cleanToken.startsWith("{")) {
    try {
      const parsed = JSON.parse(cleanToken);
      cleanToken = (
        parsed.authorizationCode ||
        parsed.authorizationToken ||
        parsed.code ||
        parsed.token ||
        parsed.access_token ||
        cleanToken
      ).trim();
    } catch {}
  } else if (cleanToken.includes("code=")) {
    const m = cleanToken.match(/[?&]code=([a-f0-9]+)/i);
    if (m) cleanToken = m[1];
  }

  let totalUnlocked = 0;
  let totalAchievements = 0;
  let unlockedTitles: string[] = [];
  let unlockedIds: string[] = [];

  let matchedRecord: any = null;
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  let accountId: string | null = null;

  // 1. If authorizationToken is provided in the request, exchange or verify it
  if (cleanToken) {
    if (cleanToken.startsWith("eg1~")) {
      // Direct access token
      try {
        const verifyRes = await fetch(
          "https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/verify",
          { headers: { Authorization: `Bearer ${cleanToken}` } }
        );
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          accessToken = cleanToken;
          accountId = verifyData.account_id;
        }
      } catch {}
    }

    if (!accessToken) {
      // Try authorization code exchange
      try {
        const tokenRes = await fetch(
          "https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${EPIC_BASIC_AUTH}`,
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code: cleanToken,
              token_type: "eg1",
            }).toString(),
          }
        );
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          accessToken = tokenData.access_token;
          refreshToken = tokenData.refresh_token;
          accountId = tokenData.account_id;
        }
      } catch {}
    }

    // Persist new token in SQLite if user is logged in
    if (authUser && accessToken && accountId) {
      try {
        const accounts = getUserPlatformAccounts(authUser.id);
        const existingEpic = accounts.epic || {
          platform: "epic",
          username: accountId,
          displayName: "Joueur Epic",
          connectedAt: new Date().toISOString(),
          stats: { gamesOwned: 1, totalAchievements: 0, completedGames: 0 },
        };
        saveUserPlatformAccount(
          authUser.id,
          existingEpic,
          JSON.stringify({ accessToken, refreshToken, accountId })
        );
      } catch {}
    }
  }

  // 2. Fall back to SQLite stored token if not in request
  if (!accessToken && authUser) {
    const rawApiKey = getUserPlatformApiKey(authUser.id, "epic");
    if (rawApiKey) {
      try {
        const parsed = JSON.parse(rawApiKey);
        accessToken = parsed.accessToken || null;
        refreshToken = parsed.refreshToken || null;
        accountId = parsed.accountId || null;
      } catch {
        accessToken = rawApiKey;
      }
    }
  }

  // 3. Query Epic GraphQL achievements if token and accountId are available
  if (accountId && accessToken) {
    let records = await fetchEpicPlayerAchievements(accountId, accessToken);
    if (records.length === 0 && refreshToken) {
      const refreshed = await refreshEpicAccessToken(refreshToken);
      if (refreshed?.accessToken) {
        accessToken = refreshed.accessToken;
        refreshToken = refreshed.refreshToken || refreshToken;
        records = await fetchEpicPlayerAchievements(accountId, accessToken);

        if (authUser) {
          const accounts = getUserPlatformAccounts(authUser.id);
          if (accounts.epic) {
            saveUserPlatformAccount(
              authUser.id,
              accounts.epic,
              JSON.stringify({ accessToken, refreshToken, accountId })
            );
          }
        }
      }
    }

    for (const rec of records) {
      const sId = (rec.sandboxId || "").toLowerCase();
      const cleanSid = sId
        .replace(/^ns_?/, "")
        .replace(/_?sandbox$/, "")
        .replace(/[^a-z0-9]/g, "");

      if (
        cleanSid === normTitle ||
        (normTitle.length >= 4 && cleanSid.startsWith(normTitle)) ||
        (cleanSid.length >= 4 && normTitle.startsWith(cleanSid))
      ) {
        matchedRecord = rec;
        break;
      }
    }
  }

  // Extract achievements from matched record if found
  if (matchedRecord) {
    totalUnlocked = matchedRecord.totalUnlocked || 0;
    const playerAchs = Array.isArray(matchedRecord.playerAchievements)
      ? matchedRecord.playerAchievements
      : [];
    unlockedTitles = playerAchs
      .filter((p: any) => p.unlocked)
      .map((p: any) => p.achievementName);

    const sets = Array.isArray(matchedRecord.achievementSets)
      ? matchedRecord.achievementSets
      : [];
    const setTotal = sets.reduce(
      (acc: number, s: any) => acc + (s.totalAchievements || 0),
      0
    );
    totalAchievements = Math.max(
      setTotal,
      playerAchs.length,
      totalUnlocked
    );
  } else if (authUser) {
    // Fallback: check SQLite owned games & progress
    const owned = getUserOwnedGames(authUser.id).find(
      (g) => g.appId === numAppId && g.platform === "epic"
    );
    const existingProgress = getUserGameProgress(
      authUser.id,
      numAppId,
      "epic"
    );

    if (owned) {
      totalUnlocked = owned.unlockedCount || 0;
      totalAchievements = owned.totalAchievements || 0;
    }
    if (existingProgress?.unlockedIds) {
      unlockedIds = existingProgress.unlockedIds;
    }
  }

  // If unlockedTitles exists, generate slugs
  if (unlockedTitles.length > 0) {
    unlockedIds = unlockedTitles.map(
      (t, idx) =>
        `ach_${idx + 1}_${t.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)}`
    );
  } else if (unlockedIds.length === 0 && totalUnlocked > 0) {
    for (let i = 1; i <= totalUnlocked; i++) {
      unlockedIds.push(`ach_${i}`);
    }
  }

  // Persist progress to SQLite if authenticated
  if (authUser && unlockedIds.length > 0) {
    saveUserGameProgress(authUser.id, numAppId, "epic", {
      unlockedIds,
      lastPlayed: new Date().toISOString(),
      notes: {},
    });
  }

  const hasCredentials = Boolean(accessToken && accountId);

  return {
    success: true,
    platform: "epic",
    gameName: gameName || "Jeu Epic",
    totalAchievements,
    count: totalUnlocked || unlockedIds.length,
    unlockedTitles,
    unlockedIds,
    ...(!hasCredentials && !matchedRecord
      ? {
          requiresToken: true,
          error:
            "Un code ou token d'autorisation Epic Games (authorizationToken) est requis pour synchroniser ce jeu.",
        }
      : {}),
  };
}
