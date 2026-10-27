// lib/epic/sync-resolver.ts
import type { Achievement, User } from "../types";
import { getEpicGameSandbox, saveEpicGameSandboxes } from "../db";
import { storeEpicCredentials, refreshEpicAccessToken, type EpicCredentials } from "./credentials";
import {
  fetchEpicProductAchievements,
  fetchEpicPlayerUnlockedNames,
  resolveEpicSandboxId,
} from "./game-achievements";
import { fetchEpicPlayerAchievements, type EpicPlayerAchievementRecord } from "./graphql";
import { matchSandboxRecord } from "./sandbox";

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
  let matchedRecord = matchSandboxRecord(records, normTitle, knownSandbox) as EpicPlayerAchievementRecord | null;

  if (!matchedRecord && !knownSandbox && records.length > 0 && creds.accessToken) {
    try {
      const libSandbox = await resolveEpicSandboxId(numAppId, gameName, creds.accessToken);
      if (libSandbox) {
        knownSandbox = libSandbox;
        matchedRecord = matchSandboxRecord(records, normTitle, knownSandbox) as EpicPlayerAchievementRecord | null;
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

