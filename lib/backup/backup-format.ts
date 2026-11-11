// lib/backup/backup-format.ts
// The full backup file: everything the owner tracked, without accounts or keys.

import type { CollectionWithGames, OwnedGame, PlatformType, UserGameProgress, UserSettings } from "@/lib/types";
import type { YearGoal } from "@/lib/goals/year-goals";

export const BACKUP_FORMAT = "trophyhunter-backup";
export const BACKUP_VERSION = 2;

export interface BackupPlaySession {
  readonly appId: number;
  readonly platform: PlatformType;
  readonly minutes: number;
  readonly detectedAt: string;
  readonly lastPlayed?: string;
}

export interface BackupWishlistGame {
  readonly appId: number;
  readonly platform: PlatformType;
  readonly name: string;
  readonly headerImg?: string;
  readonly targetPriceCents?: number;
}

export interface BackupFile {
  readonly format: typeof BACKUP_FORMAT;
  readonly version: typeof BACKUP_VERSION;
  readonly exportedAt: string;
  /** Statuses, reviews, resume notes and merges (`mergedInto`) included. */
  readonly games: readonly OwnedGame[];
  readonly progress: Readonly<Record<string, UserGameProgress>>;
  readonly favorites: readonly number[];
  readonly wishlist: readonly BackupWishlistGame[];
  readonly collections: readonly Omit<CollectionWithGames, "id">[];
  readonly sessions: readonly BackupPlaySession[];
  readonly settings: UserSettings;
  readonly goals: readonly YearGoal[];
}

/** Whether a parsed file is a full backup, as opposed to an older export. */
export function isBackupFile(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const { format, version } = value as { format?: unknown; version?: unknown };
  return format === BACKUP_FORMAT && version === BACKUP_VERSION;
}
