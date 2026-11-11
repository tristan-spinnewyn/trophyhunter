// lib/backup/backup-export.services.ts
import {
  getAllUserGameProgress,
  getPlaySessions,
  getUserCollections,
  getUserFavoriteAppIds,
  getUserGoals,
  getUserOwnedGames,
  getUserSettings,
  getUserWishlist,
} from "@/lib/db";
import { BACKUP_FORMAT, BACKUP_VERSION, type BackupFile } from "./backup-format";

/** Everything the user tracked, ready to be saved as a file. Platform accounts and keys are left out. */
export function buildBackup(userId: string, now: Date): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    games: getUserOwnedGames(userId),
    progress: getAllUserGameProgress(userId),
    favorites: getUserFavoriteAppIds(userId),
    wishlist: getUserWishlist(userId).map(({ appId, platform, name, headerImg, targetPriceCents }) => ({
      appId,
      platform,
      name,
      headerImg: headerImg || undefined,
      targetPriceCents,
    })),
    collections: getUserCollections(userId).map(({ name, description, color, icon, gameIds }) => ({ name, description, color, icon, gameIds: gameIds ?? [] })),
    sessions: getPlaySessions(userId).map(({ appId, platform, minutes, detectedAt, lastPlayed }) => ({ appId, platform, minutes, detectedAt, lastPlayed })),
    settings: getUserSettings(userId),
    goals: getUserGoals(userId),
  };
}
