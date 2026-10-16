import type { Achievement } from "./types";
import { getAuthenticatedUser } from "./auth";
import {
  getUserOwnedGames,
  getUserGameProgress,
  saveUserGameProgress,
  saveUserOwnedGames,
  getEpicGameSandbox,
  saveEpicGameSandboxes,
} from "./db";
import { normalizeGameTitle } from "./db/collections";
import {
  exchangeEpicAuthInput,
  loadStoredEpicCredentials,
  storeEpicCredentials,
  refreshEpicAccessToken,
  type EpicCredentials,
} from "./epic/credentials";
import {
  unwrapPlayerAchievement,
  fetchEpicProductAchievements,
} from "./epic/game-achievements";

export { refreshEpicAccessToken } from "./epic/credentials";

const EPIC_GRAPHQL_ENDPOINT = "https://graphql.epicgames.com/graphql";
const EPIC_USER_AGENT = "EpicGamesLauncher/14.0.8-22004686+++Portal+Release-Live";

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
            playerAchievement {
              achievementName
              unlocked
              XP
            }
            achievementName
            unlocked
            XP
          }
        }
      }
    }
    PlayerProfile {
      playerProfile(epicAccountId: $epicAccountId) {
        achievementsSummaries {
          data {
            sandboxId
            totalUnlocked
            totalXP
            product {
              name
            }
          }
        }
      }
    }
  }`;

  try {
    const res = await fetch(EPIC_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": EPIC_USER_AGENT,
      },
      body: JSON.stringify({
        query: gqlQuery,
        variables: { epicAccountId: accountId },
      }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const records: any[] =
      json?.data?.PlayerAchievement?.playerAchievementGameRecords?.records || [];

    const summaries: any[] =
      json?.data?.PlayerProfile?.playerProfile?.achievementsSummaries?.data ||
      json?.data?.PlayerProfile?.playerProfile?.achievementsSummaries ||
      [];

    const nameBySandbox = new Map<string, string>();
    for (const s of summaries) {
      const sId = (s.sandboxId || "").toLowerCase();
      const pName = s.product?.name || "";
      if (sId && pName) {
        nameBySandbox.set(sId, pName);
      }
    }

    for (const r of records) {
      const sId = (r.sandboxId || "").toLowerCase();
      if (sId && nameBySandbox.has(sId)) {
        r.productName = nameBySandbox.get(sId);
      }
    }

    return records;
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
  achievements?: Achievement[];
  error?: string;
  requiresToken?: boolean;
}

function readAuthInput(request: Request): string {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

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

const TOKEN_REQUIRED_MESSAGE =
  "Un code ou token d'autorisation Epic Games (authorizationToken) est requis pour synchroniser ce jeu.";
const TOKEN_INVALID_MESSAGE =
  "Code d'autorisation Epic Games invalide ou expiré. Rendez-vous sur https://www.epicgames.com/id/api/redirect?clientId=34a02cf8f4414e29b15921876da36f9a&responseType=code pour obtenir un nouveau code.";

export async function syncEpicGame(
  request: Request,
  appId: string | number,
  gameName?: string
): Promise<EpicSyncResult> {
  const authUser = await getAuthenticatedUser();
  const numAppId = typeof appId === "string" ? parseInt(appId, 10) : appId;
  const name = gameName || "Jeu Epic";
  const normTitle = normalizeGameTitle(name);

  const rawInput = readAuthInput(request);
  let creds: EpicCredentials | null = null;
  let providedInvalidCode = false;

  // 1. Check explicit authorization input
  if (rawInput) {
    creds = await exchangeEpicAuthInput(rawInput);
    if (creds && authUser) {
      storeEpicCredentials(authUser.id, creds);
    }
    if (!creds) {
      providedInvalidCode = true;
    }
  }

  // 2. Fall back to stored credentials in SQLite
  if (!creds && authUser) {
    creds = loadStoredEpicCredentials(authUser.id);
  }

  let totalUnlocked = 0;
  let totalAchievements = 0;
  let unlockedTitles: string[] = [];
  let unlockedIds: string[] = [];
  let matchedRecord: any = null;
  let productAchievements: Achievement[] | undefined;

  // 3. Query Epic GraphQL if credentials exist
  if (creds) {
    let records = await fetchEpicPlayerAchievements(creds.accountId, creds.accessToken);

    // If records is empty, try refreshing the token
    if (records.length === 0 && creds.refreshToken) {
      const refreshed = await refreshEpicAccessToken(creds.refreshToken);
      if (refreshed?.accessToken) {
        creds = {
          ...creds,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken || creds.refreshToken,
          accountId: refreshed.accountId || creds.accountId,
        };
        if (authUser) {
          storeEpicCredentials(authUser.id, creds);
        }
        records = await fetchEpicPlayerAchievements(creds.accountId, creds.accessToken);
      }
    }

    const knownSandbox = authUser ? getEpicGameSandbox(authUser.id, numAppId) : null;

    for (const rec of records) {
      const sId = (rec.sandboxId || "").toLowerCase();
      const cleanSid = sId
        .replace(/^ns_?/, "")
        .replace(/_?sandbox$/, "")
        .replace(/[^a-z0-9]/g, "");

      const recProductName = (rec.productName || "").trim();
      const normRecProduct = normalizeGameTitle(recProductName);

      if (
        (knownSandbox && sId === knownSandbox.toLowerCase()) ||
        cleanSid === normTitle ||
        (normTitle.length >= 4 && cleanSid.startsWith(normTitle)) ||
        (cleanSid.length >= 4 && normTitle.startsWith(cleanSid)) ||
        (normRecProduct && normRecProduct === normTitle) ||
        (normRecProduct.length >= 4 && normTitle.includes(normRecProduct)) ||
        (normTitle.length >= 4 && normRecProduct.includes(normTitle))
      ) {
        matchedRecord = rec;
        if (authUser && sId && sId !== knownSandbox?.toLowerCase()) {
          saveEpicGameSandboxes(authUser.id, [{ appId: numAppId, sandboxId: sId }]);
        }
        break;
      }
    }

    // Try fetching product achievements definitions if sandbox is known
    const resolvedSandbox = matchedRecord?.sandboxId || knownSandbox;
    if (resolvedSandbox && creds.accessToken) {
      try {
        const prod = await fetchEpicProductAchievements(resolvedSandbox, creds.accessToken);
        if (prod.length > 0) {
          productAchievements = prod;
        }
      } catch {}
    }
  }

  // 4. Extract achievements from matched record if found
  if (matchedRecord) {
    totalUnlocked = matchedRecord.totalUnlocked || 0;
    const playerAchs = Array.isArray(matchedRecord.playerAchievements)
      ? matchedRecord.playerAchievements
      : [];

    unlockedTitles = playerAchs
      .map(unwrapPlayerAchievement)
      .filter((p: { achievementName: string; unlocked: boolean }) => p.unlocked && p.achievementName)
      .map((p: { achievementName: string }) => p.achievementName);

    const sets = Array.isArray(matchedRecord.achievementSets)
      ? matchedRecord.achievementSets
      : [];
    const setTotal = sets.reduce(
      (acc: number, s: any) => acc + (s.totalAchievements || 0),
      0
    );

    totalAchievements = Math.max(
      setTotal,
      productAchievements?.length || 0,
      playerAchs.length,
      totalUnlocked
    );
  } else if (authUser) {
    // Fallback: check SQLite owned games & progress
    const owned = getUserOwnedGames(authUser.id).find(
      (g) => g.appId === numAppId && g.platform === "epic"
    );
    const existingProgress = getUserGameProgress(authUser.id, numAppId, "epic");

    if (owned) {
      totalUnlocked = owned.unlockedCount || 0;
      totalAchievements = owned.totalAchievements || 0;
    }
    if (existingProgress?.unlockedIds?.length) {
      unlockedIds = existingProgress.unlockedIds;
    }
  }

  // 5. Generate formatted slugs
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

  // 6. Persist progress to SQLite if authenticated
  if (authUser && unlockedIds.length > 0) {
    saveUserGameProgress(authUser.id, numAppId, "epic", {
      unlockedIds,
      lastPlayed: new Date().toISOString(),
      notes: {},
    });

    const owned = getUserOwnedGames(authUser.id).find(
      (g) => g.appId === numAppId && g.platform === "epic"
    );
    if (owned) {
      saveUserOwnedGames(authUser.id, [
        {
          ...owned,
          totalAchievements: totalAchievements || owned.totalAchievements,
          unlockedCount: totalUnlocked || unlockedIds.length,
        },
      ]);
    }
  }

  const hasCredentials = Boolean(creds?.accessToken && creds?.accountId);
  const shouldRequireToken =
    providedInvalidCode ||
    (!hasCredentials && !matchedRecord) ||
    (Boolean(rawInput) && !hasCredentials);

  return {
    success: true,
    platform: "epic",
    gameName: name,
    totalAchievements,
    count: totalUnlocked || unlockedIds.length,
    unlockedTitles,
    unlockedIds,
    ...(productAchievements ? { achievements: productAchievements } : {}),
    ...(shouldRequireToken
      ? {
          requiresToken: true,
          error: providedInvalidCode ? TOKEN_INVALID_MESSAGE : TOKEN_REQUIRED_MESSAGE,
        }
      : {}),
  };
}
