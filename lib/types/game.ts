// lib/types/game.ts

import type { GameStatus } from "../game-status/game-status.types";
import type { GameHuntingOverride } from "../hunting/hunting.types";

export type { GameStatus, GameHuntingOverride };

export interface GameSearchResult {
  id: number;
  name: string;
  img: string;
  price?: string;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  percent: number;
  hidden: boolean;
  missable: boolean;
  notes?: string;
}

export interface GameDetails {
  id: number;
  name: string;
  headerImg: string;
  shortDesc?: string;
  developers?: string[];
  publishers?: string[];
  totalAchievements: number;
  achievements: Achievement[];
  unlockedIds?: string[];
  achievementsSource?: string;
  guideLinks: {
    steamGuidesUrl: string;
    psthcUrl: string;
    youtubeUrl: string;
  };
}

export type FilterStatus =
  | "all"
  | "locked"
  | "unlocked"
  | "missable"
  | "hidden"
  | "pinned";

export type SortOrder = "default" | "rarity-asc" | "rarity-desc" | "name-asc";

export interface UserGameProgress {
  unlockedIds: string[];
  notes: Record<string, string>;
  pinnedIds?: string[];
  huntingMeta?: GameHuntingOverride;
  lastPlayed?: string;
}

export interface OwnedGame {
  appId: number;
  name: string;
  headerImg: string;
  platform: import("./platform").PlatformType;
  totalAchievements: number;
  unlockedCount: number;
  playtimeHours?: number;
  lastPlayed?: string;
  addedAt: string;
  source?: "steam-auto" | "steam-import" | "manual";
  status?: GameStatus;
  /** Place in the backlog queue, lowest first; undefined when the game is not queued. */
  backlogRank?: number;
  /** When the status was last chosen (ISO date); undefined for a status that was never chosen. */
  statusChangedAt?: string;
  /** When the game was last marked finished (ISO date); undefined when unknown, as for games finished before tracking began. */
  completedAt?: string;
}

export interface DuplicateGameGroup {
  normalizedTitle: string;
  games: OwnedGame[];
}
