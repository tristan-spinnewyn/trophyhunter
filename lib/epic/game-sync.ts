// lib/epic/game-sync.ts
import type { Achievement, User } from "@/lib/types";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  getEpicGameSandbox,
  getUserGameProgress,
  getUserOwnedGames,
  saveEpicGameSandboxes,
  saveUserGameProgress,
  saveUserOwnedGames,
} from "@/lib/db";
import { normalizeGameTitle } from "@/lib/game-title";
import { readAuthInput, TOKEN_REQUIRED_MESSAGE, TOKEN_INVALID_MESSAGE } from "./auth-input";
import {
  exchangeEpicAuthInput,
  loadStoredEpicCredentials,
  refreshEpicAccessToken,
  storeEpicCredentials,
  withEpicCredentials,
  type EpicCredentials,
} from "./credentials";
import {
  fetchEpicPlayerUnlockedNames,
  fetchEpicProductAchievements,
  getEpicGameAchievements,
  unwrapPlayerAchievement,
} from "./game-achievements";
import { fetchEpicPlayerAchievements, type EpicPlayerAchievementRecord } from "./graphql";
import { matchSandboxRecord, resolveEpicSandboxId } from "./sandbox";

export function buildUnlockedSlugs(
  unlockedTitles: readonly string[],
  totalUnlocked: number,
  existingIds: readonly string[]
): string[] {
  if (unlockedTitles.length > 0) {
    return unlockedTitles.map((t, idx) => `ach_${idx + 1}_${t.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30)}`);
  }
  if (existingIds.length > 0) return [...existingIds];
  const slugs: string[] = [];
  for (let i = 1; i <= totalUnlocked; i++) slugs.push(`ach_${i}`);
  return slugs;
}

export function persistEpicGameSync(
  authUser: User | null,
  numAppId: number,
  unlockedIds: string[],
  totalAchievements: number,
  totalUnlocked: number
): void {
  if (!authUser) return;
  if (unlockedIds.length > 0) {
    saveUserGameProgress(authUser.id, numAppId, "epic", {
      unlockedIds,
      notes: {},
    });
  }
  if (unlockedIds.length === 0 && totalAchievements === 0 && totalUnlocked === 0) return;

  const owned = getUserOwnedGames(authUser.id).find((g) => g.appId === numAppId && g.platform === "epic");
  if (owned) {
    saveUserOwnedGames(authUser.id, [
      {
        ...owned,
        totalAchievements: totalAchievements || owned.totalAchievements,
        unlockedCount: Math.max(totalUnlocked, unlockedIds.length, owned.unlockedCount || 0),
      },
    ]);
  }
}


export async function resolveEpicGameData(
  creds: EpicCredentials,
  authUser: User | null,
  numAppId: number,
  normTitle: string,
  gameName = ""
): Promise<{
  matchedRecord: EpicPlayerAchievementRecord | null;
  productAchievements?: Array<Achievement & { epicName?: string }>;
  tokenExpired?: boolean;
}> {
  let records = await fetchEpicPlayerAchievements(creds.accountId, creds.accessToken);
  let tokenExpired = false;

  if (records.length === 0 && creds.refreshToken) {
    const refreshed = await refreshEpicAccessToken(creds.refreshToken);
    if (refreshed?.accessToken) {
      creds.accessToken = refreshed.accessToken;
      if (refreshed.refreshToken) creds.refreshToken = refreshed.refreshToken;
      if (refreshed.accountId) creds.accountId = refreshed.accountId;
      if (authUser) storeEpicCredentials(authUser.id, creds);
      records = await fetchEpicPlayerAchievements(creds.accountId, creds.accessToken);
    } else {
      tokenExpired = true;
    }
  }

  let knownSandbox = authUser ? getEpicGameSandbox(authUser.id, numAppId) : null;
  let matchedRecord = matchSandboxRecord(records, normTitle, knownSandbox);

  if (!matchedRecord && !knownSandbox && records.length > 0 && creds.accessToken) {
    try {
      const libSandbox = await resolveEpicSandboxId(numAppId, gameName, creds.accessToken);
      if (libSandbox) {
        knownSandbox = libSandbox;
        matchedRecord = matchSandboxRecord(records, normTitle, knownSandbox);
      }
    } catch {}
  }

  const resolvedSandbox = matchedRecord?.sandboxId || knownSandbox;
  if (resolvedSandbox && authUser && resolvedSandbox.toLowerCase() !== knownSandbox?.toLowerCase()) {
    saveEpicGameSandboxes(authUser.id, [{ appId: numAppId, sandboxId: resolvedSandbox.toLowerCase() }]);
  }

  let productAchievements: Array<Achievement & { epicName?: string }> | undefined;
  if (resolvedSandbox && creds.accessToken) {
    try {
      const prod = await fetchEpicProductAchievements(resolvedSandbox, creds.accessToken);
      if (prod.length > 0) productAchievements = prod;
    } catch {}

    if (!matchedRecord) {
      try {
        const bySb = await fetchEpicPlayerUnlockedNames(creds.accountId, resolvedSandbox, creds.accessToken);
        if (bySb.totalUnlocked > 0 || bySb.unlockedNames.size > 0) {
          matchedRecord = {
            sandboxId: resolvedSandbox,
            totalUnlocked: bySb.totalUnlocked,
            playerAchievements: Array.from(bySb.unlockedNames).map((achievementName) => ({
              achievementName,
              unlocked: true,
            })),
          };
        }
      } catch {}
    }
  }

  return { matchedRecord, productAchievements, tokenExpired };
}


export async function getEpicAchievementsForUser(
  userId: string,
  appId: number,
  gameName: string
): Promise<Achievement[] | null> {
  const creds = loadStoredEpicCredentials(userId);
  if (!creds) return null;

  const knownSandbox = getEpicGameSandbox(userId, appId);
  try {
    const { result } = await withEpicCredentials(
      creds,
      (c) =>
        getEpicGameAchievements({
          appId,
          gameName,
          accessToken: c.accessToken,
          accountId: c.accountId,
          sandboxId: knownSandbox,
        }),
      userId
    );
    if (!result || result.achievements.length === 0) return null;

    if (result.sandboxId !== knownSandbox) {
      saveEpicGameSandboxes(userId, [{ appId, sandboxId: result.sandboxId }]);
    }

    if (result.unlockedIds.length > 0 || result.achievements.length > 0) {
      persistEpicGameSync(
        { id: userId, username: "", displayName: "", createdAt: "" },
        appId,
        result.unlockedIds,
        result.achievements.length,
        result.totalUnlocked
      );
    }

    return result.achievements;
  } catch {
    return null;
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

