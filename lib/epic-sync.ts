// lib/epic-sync.ts
import type { Achievement } from "./types";
import { getAuthenticatedUser } from "./auth";
import { getUserOwnedGames, getUserGameProgress } from "./db";
import { normalizeGameTitle } from "./db/collections";
import { exchangeEpicAuthInput, loadStoredEpicCredentials, storeEpicCredentials, refreshEpicAccessToken, type EpicCredentials } from "./epic/credentials";
import { unwrapPlayerAchievement } from "./epic/game-achievements";
import { fetchEpicPlayerAchievements, type EpicPlayerAchievementRecord } from "./epic/graphql";
import { readAuthInput, TOKEN_REQUIRED_MESSAGE, TOKEN_INVALID_MESSAGE } from "./epic/auth-request";
import { buildUnlockedSlugs, persistEpicGameSync } from "./epic/sync-progress";
import { resolveEpicGameData } from "./epic/sync-resolver";

export { refreshEpicAccessToken, fetchEpicPlayerAchievements };

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

export async function syncEpicGame(request: Request, appId: string | number, gameName?: string): Promise<EpicSyncResult> {
  const authUser = await getAuthenticatedUser();
  const numAppId = typeof appId === "string" ? parseInt(appId, 10) : appId;
  const name = gameName || "Jeu Epic";
  const normTitle = normalizeGameTitle(name);

  const rawInput = readAuthInput(request);
  let creds: EpicCredentials | null = null;
  let providedInvalidCode = false;

  if (rawInput) {
    creds = await exchangeEpicAuthInput(rawInput);
    if (creds && authUser) storeEpicCredentials(authUser.id, creds);
    if (!creds) providedInvalidCode = true;
  }
  if (!creds && authUser) creds = loadStoredEpicCredentials(authUser.id);

  let totalUnlocked = 0;
  let totalAchievements = 0;
  let unlockedTitles: string[] = [];
  let existingProgressIds: string[] = [];
  let matchedRecord: EpicPlayerAchievementRecord | null = null;
  let productAchievements: Array<Achievement & { epicName?: string }> | undefined;
  let tokenExpired = false;

  if (creds) {
    const resolved = await resolveEpicGameData(creds, authUser, numAppId, normTitle, name);
    matchedRecord = resolved.matchedRecord;
    productAchievements = resolved.productAchievements;
    tokenExpired = Boolean(resolved.tokenExpired);
  }

  if (matchedRecord) {
    totalUnlocked = matchedRecord.totalUnlocked || 0;
    const playerAchs = Array.isArray(matchedRecord.playerAchievements) ? matchedRecord.playerAchievements : [];
    const rawNames = playerAchs.map(unwrapPlayerAchievement).filter((p) => p.unlocked && p.achievementName).map((p) => p.achievementName);
    const matchedProd = productAchievements?.filter((a) =>
      rawNames.some((n) => n.toLowerCase() === (a.epicName || a.name).toLowerCase() || n.toLowerCase() === a.name.toLowerCase())
    ) || [];

    unlockedTitles = matchedProd.length > 0 ? matchedProd.map((a) => a.name) : rawNames;
    if (matchedProd.length > 0) existingProgressIds = matchedProd.map((a) => a.id);

    const sets = Array.isArray(matchedRecord.achievementSets) ? matchedRecord.achievementSets : [];
    const setTotal = sets.reduce((acc, s) => acc + (s.totalAchievements || 0), 0);
    totalAchievements = Math.max(setTotal, matchedRecord.totalProductAchievements || 0, productAchievements?.length || 0, totalUnlocked);
  } else if (authUser) {
    const owned = getUserOwnedGames(authUser.id).find((g) => g.appId === numAppId && g.platform === "epic");
    const existingProgress = getUserGameProgress(authUser.id, numAppId, "epic");
    if (owned) {
      totalUnlocked = owned.unlockedCount || 0;
      totalAchievements = Math.max(productAchievements?.length || 0, owned.totalAchievements || 0);
    }
    if (existingProgress?.unlockedIds?.length) existingProgressIds = existingProgress.unlockedIds;
  }

  const unlockedIds = existingProgressIds.some((id) => id.startsWith("epic_"))
    ? existingProgressIds
    : buildUnlockedSlugs(unlockedTitles, totalUnlocked, existingProgressIds);
  persistEpicGameSync(authUser, numAppId, unlockedIds, totalAchievements, totalUnlocked);

  const hasCredentials = Boolean(creds?.accessToken && creds?.accountId) && !tokenExpired;
  const shouldRequireToken = providedInvalidCode || tokenExpired || (!hasCredentials && !matchedRecord) || (Boolean(rawInput) && !hasCredentials);

  return {
    success: true, platform: "epic", gameName: name, totalAchievements, count: totalUnlocked || unlockedIds.length,
    unlockedTitles, unlockedIds, ...(productAchievements ? { achievements: productAchievements } : {}),
    ...(shouldRequireToken ? { requiresToken: true, error: providedInvalidCode || tokenExpired ? TOKEN_INVALID_MESSAGE : TOKEN_REQUIRED_MESSAGE } : {}),
  };
}

