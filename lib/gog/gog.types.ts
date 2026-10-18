// lib/gog/gog.types.ts
import type { Achievement, OwnedGame, PlatformAccount } from "@/lib/types";

export class GogSyncError extends Error {
  public readonly status: number;

  public constructor(message: string, status = 500) {
    super(message);
    this.name = "GogSyncError";
    this.status = status;
  }
}

export interface GogProfileStatsPayload {
  readonly games_owned?: string | number;
  readonly achievements?: string | number;
  readonly hours_played?: string | number;
}

export interface GogProfileAvatarsPayload {
  readonly large_2x?: string;
  readonly large?: string;
  readonly medium_2x?: string;
  readonly medium?: string;
}

export interface GogProfileUserPayload {
  readonly userId?: string;
  readonly username?: string;
  readonly created_date?: string;
  readonly avatar?: string;
  readonly avatars?: GogProfileAvatarsPayload;
  readonly stats?: GogProfileStatsPayload;
}

export interface GogUserGameStatEntry {
  readonly achievementsPercentage?: number;
  readonly playtime?: number;
  readonly lastSession?: string;
}

export interface GogPublicGameItem {
  readonly game: {
    readonly id: string;
    readonly title: string;
    readonly url?: string;
    readonly achievementSupport?: boolean;
    readonly image?: string;
  };
  readonly stats?: Readonly<Record<string, GogUserGameStatEntry>> | readonly never[];
}

export interface GogPublicGamesPageResponse {
  readonly page?: number;
  readonly pages?: number;
  readonly total?: number;
  readonly _embedded?: {
    readonly items?: readonly GogPublicGameItem[];
  };
}

export interface GogRawAchievementEntry {
  readonly achievement?: {
    readonly id?: string;
    readonly name?: string;
    readonly description?: string;
    readonly imageUrlUnlocked?: string;
    readonly imageUrlLocked?: string;
    readonly rarity?: number;
    readonly visible?: boolean;
  };
  readonly stats?: Readonly<
    Record<string, { readonly isUnlocked?: boolean; readonly unlockDate?: number }>
  > | readonly never[];
}

export interface GogParsedProfile {
  readonly userId: string;
  readonly username: string;
  readonly avatarUrl: string;
  readonly gamesOwned: number;
  readonly totalAchievements: number;
  readonly hoursPlayed: number;
  readonly memberSince?: string;
  readonly recentGames: readonly GogPublicGameItem[];
}

export interface GogParsedGameAchievements {
  readonly achievements: Achievement[];
  readonly unlockedIds: string[];
  readonly totalAchievements: number;
  readonly unlockedCount: number;
}

export interface GogSyncResult {
  readonly account: PlatformAccount;
  readonly discoveredGames: OwnedGame[];
  readonly gameProgress?: Readonly<Record<number, readonly string[]>>;
}
