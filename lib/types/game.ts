// lib/types/game.ts

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

export type FilterStatus = "all" | "locked" | "unlocked" | "missable" | "hidden";

export type SortOrder = "default" | "rarity-asc" | "rarity-desc" | "name-asc";

export interface UserGameProgress {
  unlockedIds: string[];
  notes: Record<string, string>;
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
}

export interface DuplicateGameGroup {
  normalizedTitle: string;
  games: OwnedGame[];
}
