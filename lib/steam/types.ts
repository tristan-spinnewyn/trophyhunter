// lib/steam/types.ts
import type { RareAchievementShowcaseItem } from "@/lib/types";

export interface DiscoveredGameData {
  appId: number;
  name?: string;
  totalAchievements: number;
  unlockedCount: number;
  playtimeHours?: number;
}

export interface SteamParsedProfile {
  steamId64: string;
  userIdentifier: string;
  personaName: string;
  avatarFull: string;
  onlineState: string;
  memberSince: string;
  location: string;
  hoursPlayed2Wk: number;
  level: number;
  gamesOwned: number;
  totalAchievements: number;
  completedGames: number;
  dlcCount: number;
  wishlistCount: number;
  badgesCount: number;
  rareShowcase: RareAchievementShowcaseItem[];
  baseUrl: string;
}

/** A sync failure carrying the HTTP status the API route should answer with. */
export class SteamSyncError extends Error {
  public readonly status: number;
  /** The profile or its game details are private: the client suggests making them public. */
  public readonly isPrivate: boolean;

  public constructor(message: string, status = 500, { isPrivate = false }: { isPrivate?: boolean } = {}) {
    super(message);
    this.name = "SteamSyncError";
    this.status = status;
    this.isPrivate = isPrivate;
  }
}

/** One achievement from the Steam schema endpoint; every field may be missing in practice. */
export interface SteamSchemaAchievement {
  readonly internal_name?: string;
  readonly localized_name?: string;
  readonly localized_desc?: string;
  readonly hidden?: boolean | number;
  readonly player_percent_unlocked?: string | number;
  readonly icon?: string;
}

/** The store `appdetails` fields the app reads. */
export interface SteamStoreGameInfo {
  readonly name?: string;
  readonly header_image?: string;
  readonly short_description?: string;
  readonly developers?: string[];
  readonly publishers?: string[];
}
