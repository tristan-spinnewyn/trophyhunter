// lib/xbox/persist-sync.ts
import { saveUserOwnedGames, saveUserPlatformAccount } from "@/lib/db";
import type { XboxProfileSyncResult } from "./types";

/**
 * Stores an Xbox sync for a user. Only the caller's own key is stored:
 * the server key must not be copied into a user record.
 */
export function persistXboxSync(userId: string, result: XboxProfileSyncResult, keyToStore?: string): void {
  saveUserPlatformAccount(userId, result.account, keyToStore || undefined);
  if (result.discoveredGames.length > 0) {
    saveUserOwnedGames(userId, result.discoveredGames);
  }
}
