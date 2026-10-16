// lib/epic-sync.ts
import type { Achievement } from "./types";
import { getAuthenticatedUser } from "./auth";
import { getUserOwnedGames, getUserGameProgress } from "./db";
import { normalizeGameTitle } from "./db/collections";
import { exchangeEpicAuthInput, loadStoredEpicCredentials, storeEpicCredentials, refreshEpicAccessToken, type EpicCredentials } from "./epic/credentials";
import { unwrapPlayerAchievement } from "./epic/game-achievements";
import { fetchEpicPlayerAchievements } from "./epic/graphql";
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
  let matchedRecord: any = null;
  let productAchievements: Achievement[] | undefined;

  if (creds) {
    const resolved = await resolveEpicGameData(creds, authUser, numAppId, normTitle);
    matchedRecord = resolved.matchedRecord;
    productAchievements = resolved.productAchievements;
  }

  if (matchedRecord) {
    totalUnlocked = matchedRecord.totalUnlocked || 0;
    const playerAchs = Array.isArray(matchedRecord.playerAchievements) ? matchedRecord.playerAchievements : [];
    unlockedTitles = playerAchs.map(unwrapPlayerAchievement).filter((p: any) => p.unlocked && p.achievementName).map((p: any) => p.achievementName);
    const sets = Array.isArray(matchedRecord.achievementSets) ? matchedRecord.achievementSets : [];
    const setTotal = sets.reduce((acc: number, s: any) => acc + (s.totalAchievements || 0), 0);
    totalAchievements = Math.max(setTotal, productAchievements?.length || 0, playerAchs.length, totalUnlocked);
  } else if (authUser) {
    const owned = getUserOwnedGames(authUser.id).find((g) => g.appId === numAppId && g.platform === "epic");
    const existingProgress = getUserGameProgress(authUser.id, numAppId, "epic");
    if (owned) {
      totalUnlocked = owned.unlockedCount || 0;
      totalAchievements = owned.totalAchievements || 0;
    }
    if (existingProgress?.unlockedIds?.length) existingProgressIds = existingProgress.unlockedIds;
  }

  const unlockedIds = buildUnlockedSlugs(unlockedTitles, totalUnlocked, existingProgressIds);
  persistEpicGameSync(authUser, numAppId, unlockedIds, totalAchievements, totalUnlocked);

  const hasCredentials = Boolean(creds?.accessToken && creds?.accountId);
  const shouldRequireToken = providedInvalidCode || (!hasCredentials && !matchedRecord) || (Boolean(rawInput) && !hasCredentials);

  return {
    success: true, platform: "epic", gameName: name, totalAchievements, count: totalUnlocked || unlockedIds.length,
    unlockedTitles, unlockedIds, ...(productAchievements ? { achievements: productAchievements } : {}),
    ...(shouldRequireToken ? { requiresToken: true, error: providedInvalidCode ? TOKEN_INVALID_MESSAGE : TOKEN_REQUIRED_MESSAGE } : {}),
  };
}
