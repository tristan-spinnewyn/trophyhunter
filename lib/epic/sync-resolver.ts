// lib/epic/sync-resolver.ts
import type { Achievement } from "../types";
import { getEpicGameSandbox, saveEpicGameSandboxes } from "../db";
import { storeEpicCredentials, refreshEpicAccessToken, type EpicCredentials } from "./credentials";
import { fetchEpicProductAchievements } from "./game-achievements";
import { fetchEpicPlayerAchievements } from "./graphql";
import { matchSandboxRecord } from "./sandbox-matcher";

export async function resolveEpicGameData(
  creds: EpicCredentials,
  authUser: any,
  numAppId: number,
  normTitle: string
): Promise<{ matchedRecord: any; productAchievements?: Achievement[] }> {
  let records = await fetchEpicPlayerAchievements(creds.accountId, creds.accessToken);
  if (records.length === 0 && creds.refreshToken) {
    const refreshed = await refreshEpicAccessToken(creds.refreshToken);
    if (refreshed?.accessToken) {
      creds.accessToken = refreshed.accessToken;
      if (refreshed.refreshToken) creds.refreshToken = refreshed.refreshToken;
      if (refreshed.accountId) creds.accountId = refreshed.accountId;
      if (authUser) storeEpicCredentials(authUser.id, creds);
      records = await fetchEpicPlayerAchievements(creds.accountId, creds.accessToken);
    }
  }

  const knownSandbox = authUser ? getEpicGameSandbox(authUser.id, numAppId) : null;
  const matchedRecord = matchSandboxRecord(records, normTitle, knownSandbox);
  if (matchedRecord && authUser && matchedRecord.sandboxId && matchedRecord.sandboxId.toLowerCase() !== knownSandbox?.toLowerCase()) {
    saveEpicGameSandboxes(authUser.id, [{ appId: numAppId, sandboxId: matchedRecord.sandboxId.toLowerCase() }]);
  }

  let productAchievements: Achievement[] | undefined;
  const resolvedSandbox = matchedRecord?.sandboxId || knownSandbox;
  if (resolvedSandbox && creds.accessToken) {
    try {
      const prod = await fetchEpicProductAchievements(resolvedSandbox, creds.accessToken);
      if (prod.length > 0) productAchievements = prod;
    } catch {}
  }

  return { matchedRecord, productAchievements };
}
