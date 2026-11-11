// lib/gog/persist-sync.ts
import { saveUserGameProgress, saveUserOwnedGames, saveUserPlatformAccount } from "@/lib/db";
import type { GogSyncResult } from "./gog.types";

/**
 * Stores a GOG sync for a user: the account (with the token only when the caller gave one),
 * the games and their unlocked achievements.
 */
export function persistGogSync(userId: string, result: GogSyncResult, tokenToStore?: string): void {
  const { account, discoveredGames, gameProgress } = result;
  saveUserPlatformAccount(userId, account, tokenToStore || undefined);
  if (discoveredGames.length > 0) {
    saveUserOwnedGames(userId, discoveredGames);
  }
  for (const [appIdStr, unlockedIds] of Object.entries(gameProgress ?? {})) {
    const appId = parseInt(appIdStr, 10);
    if (appId && unlockedIds.length > 0) {
      saveUserGameProgress(userId, appId, "gog", { unlockedIds: [...unlockedIds], notes: {} });
    }
  }
}
