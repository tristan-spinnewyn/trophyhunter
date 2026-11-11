// lib/backup/backup-restore.services.ts
import {
  getDb,
  linkGames,
  restorePlaySessions,
  saveUserSettings,
  setGameWishlist,
  setUserGoal,
  setWishlistTargetPrice,
  syncFromLocalStorage,
  withTransaction,
} from "@/lib/db";
import { SyncPayloadValidationError, validateSyncPayload } from "@/lib/security";
import { gameRefKey } from "@/lib/library/linked-games";
import type { GameRef, OwnedGame } from "@/lib/types";
import { isBackupFile } from "./backup-format";
import { validateBackupExtras } from "./backup-extras-validator";

export interface RestoreSummary {
  readonly games: number;
  readonly sessions: number;
  readonly goals: number;
  readonly wishlist: number;
  readonly links: number;
}

/** Copies grouped by the primary game they are merged into. */
function linksByPrimary(games: readonly OwnedGame[]): Map<string, { primary: GameRef; copies: GameRef[] }> {
  const groups = new Map<string, { primary: GameRef; copies: GameRef[] }>();
  for (const { platform, appId, mergedInto } of games) {
    if (!mergedInto) continue;
    const key = gameRefKey(mergedInto);
    const group = groups.get(key) ?? { primary: mergedInto, copies: [] };
    group.copies.push({ platform, appId });
    groups.set(key, group);
  }
  return groups;
}

/**
 * Restores a full backup into the user's account, all or nothing. What is already there is kept and
 * completed: games and wishes are updated, sessions already recorded are not doubled.
 */
export function restoreBackup(userId: string, raw: unknown): RestoreSummary {
  if (!isBackupFile(raw)) throw new SyncPayloadValidationError("Fichier de sauvegarde invalide.");
  const record = raw as Record<string, unknown>;
  // Accounts and keys are never part of a backup, whatever the file says.
  const core = validateSyncPayload({ ...record, wishlist: [], profile: undefined, steamApiKey: undefined });
  const extras = validateBackupExtras(record);

  return withTransaction(getDb(), () => {
    syncFromLocalStorage(userId, {
      games: [...core.games],
      favorites: [...core.favorites],
      collections: core.collections.map((c) => ({ ...c, gameIds: c.gameIds ? [...c.gameIds] : undefined })),
      progress: { ...core.progress },
    });
    const sessions = restorePlaySessions(userId, extras.sessions);
    saveUserSettings(userId, extras.settings);
    for (const goal of extras.goals) setUserGoal(userId, goal);
    for (const wish of extras.wishlist) {
      setGameWishlist(userId, wish.appId, wish.platform, true, { name: wish.name, headerImg: wish.headerImg });
      if (wish.targetPriceCents !== undefined) setWishlistTargetPrice(userId, wish.appId, wish.targetPriceCents);
    }
    let links = 0;
    for (const { primary, copies } of linksByPrimary(core.games).values()) {
      if (linkGames(userId, primary, copies)) links += copies.length;
    }
    return { games: core.games.length, sessions, goals: extras.goals.length, wishlist: extras.wishlist.length, links };
  });
}
